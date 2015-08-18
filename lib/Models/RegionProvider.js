'use strict';

/*global require*/
var defined = require('terriajs-cesium/Source/Core/defined');
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var loadText = require('terriajs-cesium/Source/Core/loadText');
var when = require('terriajs-cesium/Source/ThirdParty/when');

var corsProxy = require('../Core/corsProxy');
var ModelError = require('./ModelError');
var xml2json = require('../ThirdParty/xml2json');



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
 */
var RegionProvider = function(regionType, properties, regionProviderList) {
    this.regionType = regionType;

    /**
     * Reference to the region provider list, to allow looking up disambiguating regions attributes.
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
    this.serverRegexReplace = properties.serverRegexReplace;
    this.serverRegexFind = properties.serverRegexFind ;
    this.dataRegexFind = properties.dataRegexFind;
    this.dataRegexReplace = properties.dataRegexReplace;
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
RegionProvider.prototype.loadRegionsFromXML = function(xml, propertyName) {
    var obj = xml2json(xml);

    if (!defined(obj.member)) {
        console.log(xml);
        throw new ModelError("Couldn't load region boundaries for region " + this.regionProp);
    }
    
    if (!(obj.member instanceof Array)) {
        obj.member = [obj.member];
    }
    for (var i = 0; i < obj.member.length; i++) {
        if (this.regions[i] === undefined) {
            this.regions[i] = {};
        }
        // either { id: 123 } or { id: 'Bunbury', STE_NAME: 'VIC' }
        if (!propertyName) {
            this.regions[i].id = obj.member[i][this.regionProp];
        } else {
            this.regions[i][propertyName] = obj.member[i][propertyName];
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
    var that = this;

    var baseurl = this.server + '?service=wfs&version=2.0&request=getPropertyValue' 
        + '&typenames=' + this.layerName + '&valueReference=';
    var url = corsProxy.getURL(baseurl + this.regionProp);
    // get the list of IDs that we will attempt to match against for this column
    var p = [loadText(url).then(function(xml) {
            that.loadRegionsFromXML(xml);
            }, function(err) {
                console.log(err);
            })];
    // if this column might be ambiguous then fetch the disambiguating values for each column as well (usually State)
    var dab = this.disambigColumns;
    if (defined(dab)) {
        
        url = corsProxy.getURL(baseurl + dab[0].regionProp);
        p.push(loadText(url).then(function(xml) {
            that.loadRegionsFromXML(xml, dab[0].regionProp); /// ### this is probably not at all right.
        }));
    }
    return when.all(p).yield(true);
};


function applyReplacements(s, replacements) {
// replacements: [ [ regex, replacement], ... ] 
// replacement can contain '$1' etc.
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
    
    if (defined(replacements)) {
        replacements.forEach(function(rep) {
            r = r.replace(new RegExp(rep[0].toLowerCase(), 'gi'), rep[1].toLowerCase());
        });
    }
    applyReplacements.cache[s] =r;
    return r;
}
applyReplacements.cache = {};


/* Checks if a given region code matches a given ID after applying regexs and additional disambiguation lookups */
RegionProvider.prototype.codeMatchesRegionID = function(code, id) { //, row, idnum, csvItem ) {
    code = String(code).toLowerCase(); //## should be happening upstream somewhere
    id = String(id).toLowerCase(); 
    if (applyReplacements(id, this.serverReplacements) !== applyReplacements(code, this.dataReplacements)) {
        return false; // failed match, even after best efforts
    }
    if (!defined(this.disambigColumns) || this.disambigColumns.length === 0) {
        return true; // unambiguous successful match
    }

    // descriptor of the disambiguation column. Likely "STE_NAME"
    // we can use the aliases etc from that region descriptor, but not the layer name or regionProp - because we'll be accessing a column in
    // the primary region table
    /* ### AUGH 
    Ok here's the difficulty: to disambiguate we need to:
    1  look up another region provider to find what columns are useful,
    2  somehow get access to the list of columns for this row,
    3  see whether any of those disambiguating columns are present
    4  then see if any of those values match the actual values on the attribute

    Solution? Maybe elevate dab columns as something we investigate earlier when checking whether the dataset is region mapped, and pass around those column values too.


    */


    return true; /* ######## Removing disambiguation for now 

    // just support 1 disambiguation column for now
    var dabRegion = this.regionProviderList.getRegionProvider(this.disambigColumns[0].region);

    //var dabrd = csvItem._regionWmsMap[rd.disambigColumns[0].region];

    var dabvar = dataset.getVariableNames()[findRegionVariable(dataset.getVariableNames(), dabrd.aliases)];
    if (dabvar === undefined) {
        // Our region mapping file says the column is ambiguous, but there's no disambiguation column, so we just accept it. Warn?
        return true;
    }
    // this column matches its respective ID. Now the question is, does the dab column match...
    var dabcode = dataset.getVariableEnums(dabvar)[row];
    var dabid = rd.dabIds[rd.disambigColumns[0].regionProp][idnum];
    console.log('Disambiguating for ' + code + ' vs ' + id + '. Let us check ' + dabcode + ' vs ' + dabid);
    var r = codeMatchesRegionID(dabcode, dabid, row, idnum, dabrd, csvItem);
    return r;
    */

};

/**
 * Given a region code, try to find a region that matches it, using replacements, disambiguation and other wizardry.
 * @param {String} code Code to search for.
 * @returns {Number} Zero-based index in list of regions if successful, or -1.
 */
RegionProvider.prototype.findRegionIndex = function(code) { //, ids, rd, row) {
    for (var j = 0; j < this.regions.length; j++) {
        if (this.codeMatchesRegionID(code, this.regions[j].id)) {
            return j;
        }
    }
    return -1;
};

/**
 *   Provides a list of values for each region, based on a provided dataset.
 *
 *   @param {Dataset} dataset
 *   @param {String} regionVariable
 *   @param {Array} rowList Optional array of integers: only show these rows from dataset. Used for time-filtering.
 *   @returns {Object} Object containing properties:
 *      regionValues: Sparse array of values corresponding to the provided list.
 *      ambiguousMatches: Object whose keys are IDs of regions that had more than one row match against them.
 *      failedMatches: Object whose keys are unmatched region codes.
 *      successes: Number of successful matches.
 *      totalRows: Number of attempted matches.
 */
RegionProvider.prototype.getRegionValues = function (dataset, regionVariable, rowList) {
    if (this.regions.length < 1) {
        throw new DeveloperError('Region provider not ready to match regions.');
    }
    var codes = dataset.getVariableEnums(regionVariable);
    var vals = dataset.getVariableValues(dataset.getDataVariable());

    var numericCodes = false;
    if (!defined(codes)) {
        // not an enum type? the IDs must be digit-based and have been misclassified as numbers
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

    for (var i = 0; i < indices.length; i++) {
        var row = indices[i];
        results.totalRows++;
        var index = this.findRegionIndex(codes[row]);

        if (index < 0) {
            results.failedMatches[codes[row]] = true;
            continue;
        }
        if (results.regionValues[index] !== undefined) {
            results.ambiguousMatches[codes[row]] = true;
            continue;
        }
        results.regionValues[index] = vals[row];

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
 */
RegionProvider.prototype.findRegionVariable = function(variables) {
    for (var j = 0; j < this.aliases.length; j++) {
        for (var i = 0; i < variables.length; i++) {
            //check that it is the right type of code
            if (typeof this.regionTextCode === "boolean" && this.regionTextCode !== variables[i].isTextCode) {
                continue;
            }

            // KG: if (varNameLC[i].substring(0,aliases[j].length) === aliases[j]) {

            if (variables[i].name.toLowerCase() === this.aliases[j]) {
                return i; // ## removed left-matching as it's a bit dirty
            }
        }
    }
    return -1;
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