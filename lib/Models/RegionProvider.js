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
Instantiate a region provider by giving it an entry from the region mapping JSON file.
*/
var RegionProvider = function(regionType, properties) {
    this.regionType = regionType;
    this.regionProp = properties.regionProp;
    this.description = properties.description;

    this.layerName = properties.layerName;
    this.server = properties.server;
    this.aliases = defaultValue(properties.aliases, [this.regiontype]);
    this.serverReplacements = properties.serverReplacements;
    this.serverRegexReplace = properties.serverRegexReplace;
    this.serverRegexFind = properties.serverRegexFind ;
    this.dataRegexFind = properties.dataRegexFind;
    this.dataRegexReplace = properties.dataRegexReplace;
    this.dataReplacements = properties.dataReplacements;
    this.disambigColumns = properties.disambigColumns;
    this.textCode = defaultValue(properties.textCodes, false); // yes, it's singular...

    this.regions = []; // array of properties of individual regions after fetching from server

};

RegionProvider.prototype.getAllIds = function() {
    //???
};


/* Turn a WFS list of attribute values into a straight array

   propertyName: optional, for setting an additional (disambiguating) property on a region
   Not sure if this is really necessary - we can surely access the name of that column when needed.

 */
RegionProvider.prototype.loadRegionsFromXML = function(xml, propertyName) {
//function parseIdsXML (text, regionProp) {
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

/** Given an entry from the region mapping config, contact our WFS server to get the list of all IDs of that type 
  @returns Promise that returns array of true if IDs were loaded for the first time, or single false variable if not.
*/

RegionProvider.prototype.loadRegionIDs = function() {
    if (this.regions.length > 0) {
        return when(false); // already loaded, so return insta-promise.
    }
    var that = this;

    var baseurl = this.server + '?service=wfs&version=2.0&request=getPropertyValue';
    baseurl += '&typenames=' + this.layerName;
    baseurl += '&valueReference=';
    var url = corsProxy.getURL(baseurl + this.regionProp);
    // get the list of IDs that we will attempt to match against for this column
    var p = [loadText(url).then(function(xml) {
            that.loadRegionsFromXML(xml);
            return true;
            }, function(err) {
                console.log(err);
            })];
    // if this column might be ambiguous then fetch the disambiguating values for each column as well (usually State)
    var dab = this.disambigColumns;
    if (defined(dab)) {
        
        url = corsProxy.getURL(baseurl + dab[0].regionProp);
        p.push(loadText(url).then(function(xml) {
            that.loadRegionsFromXML(xml, dab[0].regionProp); /// ### this is probably not at all right.
            return true;
        }));
    }
    return when.all(p);
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
    code = String(code); //## should be happening upstream somewhere
    id = String(id); 
    if (applyReplacements(id, this.serverReplacements) !== applyReplacements(code, this.dataReplacements)) {
        return false; // failed match, even after best efforts
    }
    if (!defined(this.disambigColumns) || this.disambigColumns.length === 0) {
        return true; // unambiguous successful match
    }

    // descriptor of the disambiguation column. Likely "STE_NAME"
    // we can use the aliases etc from that region descriptor, but not the layer name or regionProp - because we'll be accessing a column in
    // the primary region table
    // ### AUGH our region generally doesn't have the properties of other descriptors


    return true; /* ######## Removing disambiguation for now

    var dabrd = csvItem._regionWmsMap[rd.disambigColumns[0].region];

    // just support 1 disambiguation column for now
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

RegionProvider.prototype.findRegionIndex = function(code) { //, ids, rd, row) {
    for (var j = 0; j < this.regions.length; j++) {
        if (this.codeMatchesRegionID(code, this.regions[j].id)) {
            return j;
        }
    }
    return -1;
};
/*
    if (typeof code === "number") {
        index = ids.indexOf(code);
    } else {
        index = ids.indexOf(String(code).toLowerCase());
        var rd = csvItem._regionDescriptor;
        // If exact match fails, try filtering down to a canonical version to match.
        if (index < 0 && (defined(rd.serverReplacements) || defined(rd.dataReplacements))) {
            for (var j = 0; j < ids.length; j++) {
                if (codeMatchesRegionID(code, ids[j], row, j, rd, csvItem)) {
                    index = j; break;
                }
            }
        }
    }
}
*/
/**
    Provides a list of values for each region, based on a provided dataset.
*/
RegionProvider.prototype.getRegionValues = function (dataset, regionVariable) {
    if (this.regions.length < 1) {
        throw new DeveloperError('Region provider not ready to match regions.');
    }
    var codes = dataset.getVariableEnums(regionVariable);
    /*var ids = csvItem._regionDescriptor.idMap.map(function(v) {
        return v.toLowerCase();
    });*/
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
        totalrows: 0
    };
    // whether to use time-mapped data points?
    // ### Find out what this rec thing is really about var userecs = defined(csvItem.recs);
    // loop over each row, setting a color for the region it refers to
    for (var i = 0; i < codes.length; i++) {
        /*if (userecs) {
            row = csvItem.recs[i];
            codeMap[i] = codes[row];
        } else {*/
        var row = i;
        //}
        results.totalrows++;
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

        //colors[index] = dataSource._mapValue2Color(defined(vals) ? vals[row] : undefined);
        results.successes ++;
    }
    return results;


};

/* colorFunc should be function(val) { return [r,g,b,a]; } */
RegionProvider.prototype.getColorLookupFunc = function(regionValues, colorFunc) {
    var colors = regionValues.map(colorFunc);
    return function(regionIndex) {
        // actually maybe it's ok to return undefined after all
        return colors[regionIndex] !== undefined ? colors[regionIndex] : [0,0,0,0]; //# is it important to get rid of this if?
    };

};


/* Returns the index of the first column that left-matches any of the given aliases */
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
        console.log(results.successes  + ' out of ' + results.totalrows + ' "' + regionVariable + '" regions matched successfully in ' + itemName);
        return;
    }
    msg = "" + results.successes + " out of " + results.totalrows + " '<samp>" + regionVariable + "</samp>' regions matched.<br/><br/>" + msg;
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


/* Generates data-specific colorFunc(), valFunc(), rowProperties() functions used for color remapping. */
/*function createRegionLookupFunc(csvItem) {

    if (!defined(csvItem) || !defined(csvItem._tableDataSource) || !defined(csvItem._tableDataSource.dataset)) {
        return;
    }
    var dataSource = csvItem._tableDataSource;
    var dataset = dataSource.dataset;
    var regionVariable = csvItem._tableStyle.regionVariable;

    var numericCodes = false;
    var codes = dataset.getVariableEnums(regionVariable);
    var ids = csvItem._regionDescriptor.idMap.map(function(v) {
        return v.toLowerCase();
    });

    if (!defined(codes)) {
        // not an enum type? the IDs must be digit-based and have been misclassified as numbers
        numericCodes = true;
        codes = dataset.getVariableValues(regionVariable);
        for (var n = 0; n < ids.length; n++) {
            ids[n] = parseInt(ids[n],10);
        }
    }

    var vals = dataset.getVariableValues(dataset.getDataVariable());
    // colors array defines the colour for each region id, transparent by default
    var colors = new Array(ids.length);
    for (var c = 0; c < colors.length; c++) {
        colors[c] = [0, 0, 0, 0];
    }

    // set color for each code
    var row, index, codeMap = [];
    var multimatches = {}, failedmatches = {};
    var successes = 0, totalrows=0;

    // whether to use time-mapped data points?
    var userecs = defined(csvItem.recs);
    // loop over each row, setting a color for the region it refers to
    for (var i = 0; i < (userecs ? csvItem.recs.length : codes.length); i++) {
        if (userecs) {
            row = csvItem.recs[i];
            codeMap[i] = codes[row];
        } else {
            row = i;
        }
        totalrows++;
        index = findRegionIndex(codes[row], ids, csvItem._regionDescriptor, row);

        if (index < 0) {
            failedmatches[codes[row]] = true;
            continue;
        }
        if (colors[index][3] !== 0) {
            multimatches[codes[row]] = true;
            continue;
        }
        colors[index] = dataSource._mapValue2Color(defined(vals) ? vals[row] : undefined);
        successes ++;
    }

    showFeedBack(multimatches, failedmatches, successes, totalrows, regionVariable, csvItem);

    //  This color lookup function is used by the region mapper and gives a data-mapped color
    // back for a region ID
    csvItem.colorFunc = function(id) {
        return colors[id];
    };

    function getRowIndex(code) {
        if (codeMap.length > 0) {
            return csvItem.recs[codeMap.indexOf(code)];
        }
        return codes.indexOf(numericCodes ? parseInt(code,10) : code);
    }

    // used to get current variable data
    csvItem.valFunc = function(code) {
        return vals[getRowIndex(code)];
    };
    // used to get all region data properties
    csvItem.rowProperties = function(code) {
        return dataset.getDataRow(getRowIndex(code));
    };
}
*/