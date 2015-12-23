'use strict';

/*global require*/
var corsProxy = require('../Core/corsProxy');
var defined = require('terriajs-cesium/Source/Core/defined');
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var loadText = require('terriajs-cesium/Source/Core/loadText');
var loadJson = require('terriajs-cesium/Source/Core/loadJson');
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

    /**
     * Look-up table of attributes, for speed. 
     * @type {Object}
     */
    this._idIndex = {};

    /**
     * The URL of a pre-generated JSON file containing just a long list of IDs for a given
     * layer attribute, in the order of ascending feature IDs (fids). If defined, it will
     * be used in preference to requesting those attributes from the WFS server.
     * @type {String}
     */
    this.regionIdsFile = properties.regionIdsFile;

    /**
     * JSON file for disambiguation attribute, as per regionIdsFile.
     * @type {String}
     */
    this.regionDisambigIdsFile = properties.regionDisambigIdsFile;



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
 * Fetch a list of region IDs in feature ID (FID) order by querying a WFS server.
 * This is a slower fall-back method if we don't have a pre-computed JSON list available.
 *
 * @return Object in same format as needed by processRegionIds
 */
RegionProvider.prototype.loadRegionsFromWfs = function(propName) {

    var baseuri = URI(this.server).addQuery({
        service: 'wfs',
        version: '2.0',
        request: 'getPropertyValue',
        typenames: this.layerName
    });

    // get the list of IDs that we will attempt to match against for this column
    var url = baseuri.setQuery('valueReference', propName).toString();

    if (corsProxy.shouldUseProxy(url)) {
        url = corsProxy.getURL(url);
    }
    return loadText(url)    
        .then(function(xml) {
            var obj = xml2json(xml);

            if (!defined(obj.member)) {
                console.log(xml);
                var exception = defined(obj.Exception) ? ('<br/><br/>' + obj.Exception.ExceptionText) : '';
                throw new ModelError({ title: 'CSV region mapping', message: 'Couldn\'t load region boundaries for region ' + propName + exception});
            }

            if (!(obj.member instanceof Array)) {
                obj.member = [obj.member];
            }
            if (obj.member.length === 0) {
                throw new ModelError({ title: 'CSV region mapping', message: 'Zero region boundaries found for region ' + propName });
            }
            return { values: obj.member.map(function(m) { return m[propName] }) };
        });
};

/** 
 *  Given a list of region IDs in feature ID order, apply server replacements if needed, and build an index.
 */
RegionProvider.prototype.processRegionIds = function(values, propertyName, replacementsProp) {
    var that = this;
    var isNumeric = (typeof values[0] === 'number');
    
    var isDisambiguation = defined(propertyName);

    if (!isDisambiguation) {
        propertyName = 'id';
    }
    // There is also generally a `layer` and `property` property in this file, which we ignore for now.
    return values.map(function(id, i) {

        if (that.regions[i] === undefined) {
            that.regions[i] = {};
        }
        
        if (!isNumeric) {
            id = id.toLowerCase();
            // we apply server-side replacements while loading. If it ever turns out we need
            // to store the un-regexed version, we should add a line here.
            id = that.applyReplacements(id, replacementsProp);
        }

        that.regions[i][propertyName] = id;

        // store a lookup by attribute, for performance.
        if (!isDisambiguation) {
            if (!defined(that._idIndex[id])) {
                that._idIndex[id] = i;
            } else {            
                // if we have already seen this value before, store an array of values, not one value.
                if (typeof that._idIndex[id] === 'object' /* meaning, array */) {
                    that._idIndex[id].push(i);
                } else {
                    that._idIndex[id] = [that._idIndex[id], i];
                }
            }

            // Here we make a big assumption that every region has a unique identifier (probably called FID), that it counts from zero,
            // and that regions are provided in sorted order from FID 0. We do this to avoid having to explicitly request
            // the FID column, which would double the amount of traffic per region dataset.
            // It is needed to simplify reverse lookups from complex matches (regexes and disambigs)
            that.regions[i][that.uniqueIdProp] = i;
        } // else nothing, we don't maintain an index of disambiguation values (it wouldn't be helpful)
    });
};

/**
 * Given an entry from the region mapping config, load the IDs that correspond to it, and possibly to disambiguation properties.
 *
 * @return {Object} Promise that returns true if IDs were loaded for the first time, or false if already loaded.
 */
RegionProvider.prototype.loadRegionIDs = function() {
    var that = this;
    function fetchAndProcess(idListFile, idProp, propertyName, replacementsVar) {
        if (!defined(idListFile) && !defined(idProp)) {
            return when(true);
        }
        var p;
        if (defined(idListFile)) {
            p = loadJson(idListFile);
        } else {
            p = that.loadRegionsFromWfs(idProp);
        }
        p.then(function(json) {
            return that.processRegionIds(json.values, propertyName, replacementsVar);
        }).otherwise(function(err) {
            console.log(err);
            throw(err);
        });
        return p;
    }

    if (this.regions.length > 0) {
        return when(false); // already loaded, so return insta-promise.
    }
    if (this.server === undefined) {
        // technically this may not be a problem yet, but it will be when we want to actually fetch tiles.
        throw (new DeveloperError('No server for region mapping defined: ' + this.regionType));
    }
    var promises = [
        fetchAndProcess(this.regionIdsFile, this.regionProp, undefined, 'serverReplacements'),
        fetchAndProcess(this.regionDisambigIdsFile, this.disambigProp, this.disambigProp, 'disambigServerReplacements')];
    
    return when.all(promises).yield(true);
};

/** Apply an array of regular expression replacements to a string.
 *
 * @param {String} s
 * @param {String} replacementsProp Name of a property containing [ [ regex, replacement], ... ], where replacement is a string which can contain '$1' etc.
 */
RegionProvider.prototype.applyReplacements = function (s, replacementsProp) {
    if (!defined(s)) {
        return undefined;
    }
    var r;
    if (typeof s === 'number') {
        r = String(s);
    } else {
        r = s.toLowerCase().trim();
    }
    var replacements = this[replacementsProp];
    if (replacements === undefined || replacements.length === 0) {
        return r;
    }

    if (this._appliedReplacements[replacementsProp][r] !== undefined) {
        return this._appliedReplacements[replacementsProp][r];
    }

    replacements.forEach(function(rep) {
        r = r.replace(rep[2], rep[1]);
    });
    this._appliedReplacements[replacementsProp][s] = r;
    return r;
};

/**
 * Given a region code, try to find a region that matches it, using replacements, disambiguation, indexes and other wizardry.
 *
 * @param {String} code Code to search for.
 * @returns {Number} Zero-based index in list of regions if successful, or -1.
 */
RegionProvider.prototype.findRegionIndex = function(code, disambigCode) {
    var processedCode  = this.applyReplacements(code, 'dataReplacements');

    var id = this._idIndex[processedCode];
    if (!defined(id)) {
        // didn't find anything
        return -1;
    } else if (typeof id === 'number') {
        // found an unambiguous match
        return id;
    } else {        
        var ids = id; // found an ambiguous match
        if (!defined(disambigCode)) {
            // we have an ambiguous value, but nothing with which to disambiguate. We pick the first, warn.
            console.warn('Ambiguous value found in region mapping: ' + processedCode);
            return ids[0];
        }
        var processedDisambigCode = this.applyReplacements(disambigCode, 'disambigDataReplacements');

        // Check out each of the matching IDs to see if the disambiguation field matches the one we have.
        for (var i = 0; i < ids.length; i++) {
            if (this.regions[ids[i]][this.disambigProp] === processedDisambigCode) {
                return ids[i];
            }
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
