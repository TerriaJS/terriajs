'use strict';

/*global require*/
var defined = require('terriajs-cesium/Source/Core/defined');
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var loadText = require('terriajs-cesium/Source/Core/loadText');
var when = require('terriajs-cesium/Source/ThirdParty/when');

var corsProxy = require('../Core/corsProxy');
var ModelError = require('../Models/ModelError');
var xml2json = require('../ThirdParty/xml2json');
var URI = require('URIjs');


/*
Encapsulates one entry in regionMapping.json
Responsibilities:
- communicate with WFS server
- provide region IDs for a given region type
- determine whether a given column matches (just the column name, or the contents too?)
- provide a lookup function for a given column of data
*/

/**
 * Instantiate a region provider by giving it an entry from the region mapping JSON file.
 * @param {String} regionType Unique text identifier.
 * @param {Object} properties Properties as given in configuration file.
 * @param {Object} regionProviderList Initialised RegionProviderList object, used for disambiguation.
 */
var RegionProvider = function(regionType, properties, regionProviderList) {
    /**
     * String uniquely identifying this type of region (eg, 'sa4')
     * @type {String}
     */
    this.regionType = regionType;

    /**
     * Reference to the region provider list, to allow looking up disambiguating regions attributes.
     * @type {Object}
     */
    this.regionProviderList = regionProviderList;
    /** 
    * WMS attribute whose value will correspond to each region's code.
    * @type {String} 
    */
    this.regionProp = properties.regionProp;
    /**
    * A text description of this region type, which may feature in the user interface.
    * @type {String}
    */
    this.description = properties.description;

    /**
    * Name of the WMS layer where these regions are found.
    * @type {String}
    */
    this.layerName = properties.layerName;
    /**
    * URL of the WMS server
    * @type {String}
    */
    this.server = properties.server;
    /**
     * List of aliases which will be matched against if found as column headings.
     * @type {String[]}
     */
    this.aliases = defaultValue(properties.aliases, [this.regiontype]);
    this.serverReplacements = properties.serverReplacements;
    this.dataReplacements = properties.dataReplacements;
    this.disambigColumns = properties.disambigColumns;
    /** 
     * Whether this region type uses text codes, rather than numeric. It matters because numeric codes are treated differently by the
     * CSV handling models.
     * @type {Boolean}
     */
    this.textCode = defaultValue(properties.textCodes, false); // yes, it's singular...

    /**
     * Array of attributes of each region, once retrieved from the server.
     * @type {Object[]}
     */
    this.regions = [];


};

/**
 * Turn a WFS list of attribute values into a straight array
 * @param {String} propertyName: optional, for setting an additional (disambiguating) property on a region
 *  Not sure if this is really necessary - we can surely access the name of that column when needed.
 *
 */
RegionProvider.prototype.loadRegionsFromXML = function(xml, propertyName, replacements) {
    var obj = xml2json(xml);

    if (!defined(obj.member)) {
        console.log(xml);
        throw new ModelError("Couldn't load region boundaries for region " + this.regionProp);
    }
    
    if (!(obj.member instanceof Array)) {
        obj.member = [obj.member];
    }
    if (obj.member.length === 0) {
        throw new ModelError("Zero region boundaries found for region " + this.regionProp);
    }
    for (var i = 0; i < obj.member.length; i++) {
        if (this.regions[i] === undefined) {
            this.regions[i] = {};
        }
        // either { id: 123 } or { id: 'Bunbury', STE_NAME: 'VIC' }
        if (!propertyName) {
            // we apply server-side replacements while loading. If it ever turns out we need
            // to store the un-regexed version, we should add a line here.
            this.regions[i].id = applyReplacements(obj.member[i][this.regionProp], replacements);
        } else {
            this.regions[i][propertyName] = applyReplacements(obj.member[i][propertyName], replacements);
        } 
    }
};

/** 
 * Given an entry from the region mapping config, contact our WFS server to get the list of all IDs of that type 
 * @returns {Object} Promise that returns true if IDs were loaded for the first time, or false if already loaded.
*/

RegionProvider.prototype.loadRegionIDs = function() {
    if (this.regions.length > 0) {
        return when(false); // already loaded, so return insta-promise.
    }
    if (this.server === undefined) {
        throw (new DeveloperError('No server for region mapping defined: ' + this.regionType));
    }            
    var that = this;

    var baseuri = URI(this.server).addQuery({ 
        service: 'wfs',
        version: '2.0',
        request: 'getPropertyValue',
        typenames: this.layerName});

    // get the list of IDs that we will attempt to match against for this column
    var p = [];
    var url = baseuri.setQuery('valueReference', this.regionProp).toString();
    p.push(loadText(corsProxy.getURL(url))
        .then(function(xml) {
            that.loadRegionsFromXML(xml, undefined, that.serverReplacements);
        }).otherwise(function(err) {
            console.log(err);
            throw(err);
        }));
    // if this column might be ambiguous then fetch the disambiguating values for each column as well (usually State)
    var dab = this.disambigColumns;
    if (defined(dab)) {
        //baseuri.removeQuery('valueReference');
        url = baseuri.setQuery('valueReference', dab[0].regionProp).toString();
        p.push(loadText(corsProxy.getURL(url)).then(function(xml) {
            that.loadRegionsFromXML(xml, dab[0].regionProp, dab[0].serverReplacements);
        }));
    }
    return when.all(p).yield(true);
};

/** Apply an array of regular expression replacemenst to a string.
 * @param {Array} replacements: [ [ regex, replacement], ... ], where replacement is a string which can contain '$1' etc.
 */
function applyReplacements(s, replacements) {
    if (!defined(s)) {
        return undefined;
    }
    var r = s.trim().toLowerCase(); // just in case...

    if (replacements === undefined || replacements.length === 0) {
        return r;
    }

    var cachekey = s + '%' + replacements.reduce(function(key, item) { 
        return key + item[0] + '%' + (item[1] ? item[1] : '') + '%'; 
        }, '');
    if (applyReplacements.cache[cachekey] !== undefined) {
        return applyReplacements.cache[cachekey];
    }
    
    replacements.forEach(function(rep) {
        r = r.replace(new RegExp(rep[0].toLowerCase(), 'gi'), rep[1].toLowerCase());
    });
    applyReplacements.cache[s] =r;
    return r;
}
applyReplacements.cache = {};


/* Checks if a given region code matches a given ID after applying regexs and additional disambiguation lookups */
RegionProvider.prototype.codeMatchesRegionID = function(id, code, disambigId, disambigCode) {
    code = String(code).toLowerCase(); //## should be happening upstream somewhere
    id = String(id).toLowerCase(); 
    if (id !== applyReplacements(code, this.dataReplacements)) {
        return false; // failed match, even after best efforts
    }
    if (!defined(this.disambigColumns) || this.disambigColumns.length === 0) {
        return true; // unambiguous successful match
    }

    if (defined(disambigId) && !defined(disambigCode)) {
        // warn? we have a value to disambiguate against, but it's not provided
        return true;
    }

    // Hooray, let's disambiguate. Our args look something like: Campbelltown, Campbelltown, New South Wales, NSW.

    var dabMatched = this._getDisambigProvider().codeMatchesRegionID(disambigId, disambigCode);
    if (!dabMatched) {
        console.log ('"' + id + '" matched "' + code + '", but "' + disambigId + '" didn\'t match "' + disambigCode + '"');
    }
    return dabMatched;
};

/**
 * Given a region code, try to find a region that matches it, using replacements, disambiguation and other wizardry.
 * @param {String} code Code to search for.
 * @returns {Number} Zero-based index in list of regions if successful, or -1.
 */
RegionProvider.prototype.findRegionIndex = function(code, disambigCode) {
    for (var i = 0; i < this.regions.length; i++) {
        var dabId;
        if (defined(this.disambigColumns) && defined(this.disambigColumns[0])) {
            dabId =  this.regions[i][this.disambigColumns[0].regionProp];    
        }
        if (this.codeMatchesRegionID(this.regions[i].id, code, dabId, disambigCode)) {
            return i;
        }
    }
    return -1;
};

/**
 *   Provides a list of values for each region, based on a provided dataset.
 *
 *   @param {DataTable} dataset
 *   @param {String} regionVariable
 *   @param {Array} rowList Optional array of integers: only show these rows from dataset. Used for time-filtering.
 *   @returns {Object} Object containing properties:
 *      regionValues: Sparse array of values corresponding to the provided list.
 *      ambiguousMatches: Object whose keys are IDs of regions that had more than one row match against them.
 *      failedMatches: Object whose keys are unmatched region codes.
 *      successes: Number of successful matches.
 *      totalRows: Number of attempted matches.
 */
RegionProvider.prototype.getRegionValues = function (dataset, regionVariable, disambigVariable, rowList) {
    if (this.regions.length < 1) {
            throw new DeveloperError('Region provider not ready to match regions.');
    }
    var codes = dataset.getVariableEnums(regionVariable);
    var disambigCodes = (defined(disambigVariable) ? dataset.getVariableEnums(disambigVariable) : []);
    var vals = dataset.getVariableValues(dataset.getDataVariable());
    if (!defined(vals)) {
        console.log('Warning: no data variable for region-mapped dataset with region variable "' + regionVariable + '"');
    }

    var numericCodes = false;
    if (!defined(codes)) {
        // not an enum type? the IDs must be digit-based and have been misclassified as numbers
        // ##TODO think about whether this matters for disambigs
        numericCodes = true;
        codes = dataset.getVariableValues(regionVariable);
    }
    var results = {
        regionValues: new Array(this.regions.length),
        ambiguousMatches: {},
        failedMatches: {},
        successes: 0,
        totalRows: 0
    };

    var indices = (rowList ? rowList : Object.keys(codes)); // iterate either over every row, or just these rows
    var regionVar = dataset.variables[dataset.getRegionVariable()];

    for (var i = 0; i < indices.length; i++) {
        var row = indices[i];
        results.totalRows++;
        var index = this.findRegionIndex(codes[row], disambigCodes[row]); // will pass ,undefined if no disambig.

        if (index < 0) {
            results.failedMatches[codes[row]] = true; //##TODO should combine disambig into the key?
            continue;
        }
        // not really "ambiguous" - actually if two data values for one region.
        if (results.regionValues[index] !== undefined && !dataset.hasTimeData()) {
            // if there is a time column, ignore ambiguous matches
            results.ambiguousMatches[codes[row]] = true;
            continue;
        }
        if (defined(vals)) {
            results.regionValues[index] = vals[row];
        } else {
            results.regionValues[index] = 0; // In some cases region mapping without a data variable is meaningful.
        }
        if (defined(regionVar)) {
            // set reverse lookup from variable back to region index.
            regionVar.setRegionCode(i, this.regions[index].id);
        }
        results.successes ++;
    }
    return results;
};

/**
 * Pre-generates a function which quickly turns a value into a colour.
 * @param {Number[]} regionValues Array of values.
 * @param {Function} colorFunc should be function(val) { return [r,g,b,a]; } 
 * @returns {Function} Function of type f(regionIndex) { return [r,g,b,a]; }
 */
RegionProvider.prototype.getColorLookupFunc = function(regionValues, colorFunc) {
    var colors = regionValues.map(colorFunc);
    return function(regionIndex) {
        // actually maybe it's ok to return undefined after all
        return colors[regionIndex] !== undefined ? colors[regionIndex] : [0,0,0,0]; //# is it important to get rid of this if?
    };

};



/*
 * @returns The index of the first column that left-matches any of the given aliases 
 * @param varNAmes Array of variable names.
 */
RegionProvider.prototype.findRegionVariable = function(varNames) {
    for (var j = 0; j < this.aliases.length; j++) {
        for (var i = 0; i < varNames.length; i++) {
            //check that it is the right type of code
            //if (typeof this.regionTextCode === "boolean" && this.regionTextCode !== variables[i].isTextCode) {
            //    continue;
            //}
            // SB: I don't think that's a worthwhile test

            //if (varNames[i].toLowerCase() === this.aliases[j]) {
            if (new RegExp('^' + this.aliases[j] + '$', 'i').test(varNames[i])) {
                return i; 
            }
        }
    }
    return -1;
};

RegionProvider.prototype._getDisambigProvider = function() {
    if (!defined(this.disambigColumns) || this.disambigColumns.length < 1 || !defined(this.regionProviderList)) {
        return undefined;
    }
    var disambig = this.disambigColumns[0];
    return this.regionProviderList.getRegionProvider(disambig.region);
};

/**
 * If a disambiguation column is known for this provider, return a column matching its description.
 */
RegionProvider.prototype.findDisambigVariable = function(variables) {
    var dabp = this._getDisambigProvider();
    if (!defined(dabp)) {
        return undefined;
    }
    var dv = variables[dabp.findRegionVariable(variables)];
    return (defined(dv) ? dv.name : undefined);
};
// this probably doesn't belong here
/** 
 * Display a feedback message given the results of a previous call to getRegionValues()
 * @param {Object} results Object returned from getRegionValues()
 * @param {String} regionVariable Name of variable used in matching.
 * @param {String} itemName Name of the dataset in which matching occurred.
 * @param {Object} terria Terria object.
 */

RegionProvider.prototype.showFeedback = function(results, regionVariable, itemName, terria) {

    var msg = "";
    if (Object.keys(results.failedMatches).length > 0) {
        msg += 'These region names were <span class="warning-text">not recognised</span>: <br><br/>' + 
        '<samp>' + Object.keys(results.failedMatches).join('</samp>, <samp>') + '</samp>' + 
        '<br/><br/>';
    }
    if (Object.keys(results.ambiguousMatches).length > 0) {
        msg += 'These regions had <span class="warning-text">more than one value</span>: <br/><br/>' + 
        '<samp>' + Object.keys(results.ambiguousMatches).join("</samp>, <samp>") + '</samp>' + 
        '<br/><br/>';
    }
    if (!msg) {
        console.log(results.successes  + ' out of ' + results.totalRows + ' "' + regionVariable + '" regions matched successfully in ' + itemName);
        return;
    }
    msg = "" + results.successes + " out of " + results.totalRows + " '<samp>" + regionVariable + "</samp>' regions matched.<br/><br/>" + msg;
    msg += 'Consult the <a href="http://terria.io/DataProviders/CSV-geo-au/">CSV-geo-au specification</a> to see how to format the CSV file.';

    var error = new ModelError({ 
            title: "Issues loading CSV file: " + itemName.slice(0,20), // Long titles mess up the message body
            message: '<div>'+ msg +'</div>'
        });
    if (results.successes === 0) {
        // No rows matched, so abort - don't add it to catalogue at all.
        throw error;
    } else {
        // Just warn the user. Ideally we'd avoid showing the warning when switching between columns.
        terria.error.raiseEvent(error);
    }

};

module.exports = RegionProvider;