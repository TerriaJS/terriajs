'use strict';

/*global require*/
var defined = require('terriajs-cesium/Source/Core/defined');
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var loadText = require('terriajs-cesium/Source/Core/loadText');
var when = require('terriajs-cesium/Source/ThirdParty/when');

var ModelError = require('../Models/ModelError');
var xml2json = require('../ThirdParty/xml2json');
var URI = require('urijs');


/*
Encapsulates one entry in regionMapping.json
Responsibilities:
- communicate with WFS server
- provide region IDs for a given region type
- determine whether a given column name matches
- identify region and disambiguation columns
- provide a lookup function for a given column of data
*/

/**
 * Instantiate a region provider by giving it an entry from the region mapping JSON file.
 * 
 * @alias RegionProvider
 * @constructor
 * @param {String} regionType Unique text identifier.
 * @param {Object} properties Properties as given in configuration file.
 */
var RegionProvider = function(regionType, properties) {
    /**
     * String uniquely identifying this type of region (eg, 'sa4')
     * @type {String}
     */
    this.regionType = regionType;

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

    /**
     * Array of [regex, replacement] arrays which will be applied to each ID element on the server side before matching
     * is attempted. For example, [ [ ' \(.\)$' ], '' ] will convert 'Baw Baw (S)' to 'Baw Baw'
     * @type {Array[]}
     */
    this.serverReplacements = properties.serverReplacements instanceof Array ? properties.serverReplacements.map(function(r) {
        return [ r[0], r[1].toLowerCase(), new RegExp(r[0].toLowerCase(), 'gi') ];
    }) : [];
    
    /**
     * Array of [regex, replacement] arrays which will be applied to each user-provided ID element before matching
     * is attempted. For example, [ [ ' \(.\)$' ], '' ] will convert 'Baw Baw (S)' to 'Baw Baw'
     * @type {Array[]}
     */
    
    this.dataReplacements = properties.dataReplacements instanceof Array ? properties.dataReplacements.map(function(r) {
        return [ r[0], r[1].toLowerCase(), new RegExp(r[0].toLowerCase(), 'gi') ];
    }) : [];

    this._appliedReplacements = { serverReplacements: {}, dataReplacements: {}, disambigDataReplacements: {} };


    /** The property within the same WFS region that can be used for disambiguation. */
    this.disambigProp = properties.disambigProp;

    /** 
     * Returns the name of a field which uniquely identifies each region. This field is not necessarily used for matching, or
     * of interest to the user, but is needed for reverse lookups. This field must count from zero, and features must be
     * returned in sorted order.
     * @type {string}
     */
    this.uniqueIdProp = defaultValue(properties.uniqueIdProp, 'FID');

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

/*
The flow:

1. CsvCatalogItem wants to check for region mapping, DataTable.checkForRegionVariable
2. which calls RegionProviderList on regionmapping.json
3. RPL loads all RPs, then provides cross references to dab providers
4. CSVCI calls RPL.chooseRegionProvider, which asks each RP to identify a region variable
5. Based on response, it assigns RP to the right variable, sets this.selected.region.

*/

RegionProvider.prototype.setDisambigProperties = function(dp) {
    this.disambigDataReplacements = dp.dataReplacements;
    this.disambigServerReplacements = dp.serverReplacements;
    this.disambigAliases = dp.aliases;
};


/**
 * Turn a WFS list of attribute values into a straight array.
 * TODO: Not sure if this is really necessary - we can surely access the name of that column when needed.
 *
 * @param {String} xml
 * @param {String} propertyName For setting an additional (disambiguating) property on a region.
 * @param {String} replacementsProp
 */
RegionProvider.prototype.loadRegionsFromXML = function(xml, propertyName, replacementsProp) {
    var obj = xml2json(xml);

    if (!defined(obj.member)) {
        console.log(xml);
        var exception = defined(obj.Exception) ? ('<br/><br/>' + obj.Exception.ExceptionText) : '';
        throw new ModelError({ title: 'CSV region mapping', message: 'Couldn\'t load region boundaries for region ' + this.regionProp + exception});
    }
    
    if (!(obj.member instanceof Array)) {
        obj.member = [obj.member];
    }
    if (obj.member.length === 0) {
        throw new ModelError({ title: 'CSV region mapping', message: 'Zero region boundaries found for region ' + this.regionProp });
    }
    for (var i = 0; i < obj.member.length; i++) {
        if (this.regions[i] === undefined) {
            this.regions[i] = {};
        }
        var prop = (!propertyName ? obj.member[i][this.regionProp] : obj.member[i][propertyName]);
        // we apply server-side replacements while loading. If it ever turns out we need
        // to store the un-regexed version, we should add a line here.
        // Potentially we could also convert numeric IDs to integers for faster matching.
        prop = this.applyReplacements(prop.toLowerCase(), replacementsProp);

        // either { id: '123' } or { id: 'Bunbury', STE_NAME: 'VIC' }
        if (!propertyName) {
            this.regions[i].id = prop;
        } else {
            this.regions[i][propertyName] = prop;
        }

        // Here we make a big assumption that every region has a unique identifier (probably called FID), that it counts from zero,
        // and that regions are provided in sorted order from FID 0. We do this to avoid having to explicitly request
        // the FID column, which would double the amount of traffic per region dataset.
        // It is needed to simplify reverse lookups from complex matches (regexes and disambigs)
        this.regions[i][this.uniqueIdProp] = i;
    }
};

/** 
 * Given an entry from the region mapping config, contact our WFS server to get the list of all IDs of that type.
 * 
 * @return {Object} Promise that returns true if IDs were loaded for the first time, or false if already loaded.
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
    var promises = [];
    var url = baseuri.setQuery('valueReference', this.regionProp).toString();
    // note: currently region requests are never proxied.
    promises.push(loadText(url)
        .then(function(xml) {
            that.loadRegionsFromXML(xml, undefined, "serverReplacements");
        }).otherwise(function(err) {
            console.log(err);
            throw(err);
        }));
    // if this column might be ambiguous then fetch the disambiguating values for each column as well (usually State)
    if (this.disambigProp) {
        url = baseuri.setQuery('valueReference', this.disambigProp).toString();
        promises.push(loadText(url).then(function(xml) {
            that.loadRegionsFromXML(xml, that.disambigProp, "disambigServerReplacements");
        }));
    }
    return when.all(promises).yield(true);
};

/** Apply an array of regular expression replacemenst to a string.
 *
 * @param {String} s
 * @param {String} replacementsProp Name of a property containing [ [ regex, replacement], ... ], where replacement is a string which can contain '$1' etc.
 */
RegionProvider.prototype.applyReplacements = function (s, replacementsProp) {
    if (!defined(s)) {
        return undefined;
    }
    var r = s.trim(); // just in case...
    var replacements = this[replacementsProp];
    if (replacements === undefined || replacements.length === 0) {
        return r;
    }

    if (this._appliedReplacements[replacementsProp][r] !== undefined) {
        return this._appliedReplacements[replacementsProp][s]; // [r]? 
    }
    
    replacements.forEach(function(rep) {
        r = r.replace(rep[2], rep[1]);
    });
    this._appliedReplacements[replacementsProp][s] = r;
    return r;
};


/**
 * Checks if a given region code matches a given ID after applying regexs and additional disambiguation lookups
 *
 * @param   {String} id
 * @param   {String} processedCode
 * @param   {String} disambigId
 * @param   {String} processedDisambigCode
 * @returns {Boolean}
 */
RegionProvider.prototype.codeMatchesRegionID = function(id, processedCode, disambigId, processedDisambigCode) {
    if (id !== processedCode) {
        return false; // failed match, even after best efforts
    }
    if (!defined(disambigId)) {
        return true; // unambiguous successful match
    }

    if (defined(disambigId) && !defined(processedDisambigCode)) {
        // warn? we have a value to disambiguate against, but it's not provided
        return true;
    }

    if (disambigId !== processedDisambigCode) {
        console.log ('"' + id + '" matched "' + processedCode + '", but "' + disambigId + '" didn\'t match "' + processedDisambigCode + '"');
        return false;
    }
    return true;
};

/**
 * Given a region code, try to find a region that matches it, using replacements, disambiguation and other wizardry.
 * 
 * @param {String} code Code to search for.
 * @returns {Number} Zero-based index in list of regions if successful, or -1.
 */
RegionProvider.prototype.findRegionIndex = function(code, disambigCode) {
    if (typeof code === 'number') 
        code = String(code);
    var processedCode  = this.applyReplacements(code.toLowerCase(), 'dataReplacements');

    var processedDisambigCode;
    if (defined(disambigCode)) {
        if (typeof disambigCode === 'number')
            disambigCode = String(disambigCode);
        processedDisambigCode = this.applyReplacements(disambigCode.toLowerCase(), 'disambigDataReplacements');
    }
    for (var i = 0; i < this.regions.length; i++) {
        var dabId;
        if (defined(disambigCode) && defined(this.disambigProp)) {
            dabId =  this.regions[i][this.disambigProp];    
        }
        if (this.codeMatchesRegionID(this.regions[i].id, processedCode, dabId, processedDisambigCode)) {
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
            regionVar.setRegionUniqueId(i, this.regions[index][this.uniqueIdProp]);
        }
        results.successes ++;
    }
    return results;
};

/**
 * Pre-generates a function which quickly turns a value into a colour.
 * 
 * @param {Number[]} regionValues Array of values.
 * @param {Function} colorFunc should be function(val) { return [r,g,b,a]; } 
 * @returns {Function} Function of type f(regionIndex) { return [r,g,b,a]; } which may return undefined.
 */
RegionProvider.prototype.getColorLookupFunc = function(regionValues, colorFunc) {
    var colors = regionValues.map(colorFunc);
    return function(regionIndex) {
        return colors[regionIndex];
    };
};

function findVariableForAliases(varNames, aliases) {
    for (var j = 0; j < aliases.length; j++) {
        var re = new RegExp('^' + aliases[j] + '$', 'i');
        for (var i = 0; i < varNames.length; i++) {
            if (re.test(varNames[i])) {
                return varNames[i]; 
            }
        }
    }
    return undefined;
}

/**
 * Returns the region variable of the given name, matching against the aliases provided.
 *
 * @param {String} varNames Array of variable names.
 * @returns {String} The name of the first column that matches any of the given aliases.
 */
RegionProvider.prototype.findRegionVariable = function(varNames) {
    return findVariableForAliases(varNames, this.aliases);
};

/**
 * If a disambiguation column is known for this provider, return a column matching its description.
 *
 * @param {String} varNames Array of variable names.
 * @returns {String} The name of the first column that matches any of the given disambiguation aliases.
 */
RegionProvider.prototype.findDisambigVariable = function(varNames) {
    if (!defined(this.disambigAliases) || this.disambigAliases.length === 0) {
        return undefined;
    }
    return findVariableForAliases(varNames, this.disambigAliases);
};

module.exports = RegionProvider;
