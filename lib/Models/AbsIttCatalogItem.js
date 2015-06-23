/*global require*/
'use strict';

var csv = require('../ThirdParty/csv');
var URI = require('URIjs');

var clone = require('terriajs-cesium/Source/Core/clone');
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var freezeObject = require('terriajs-cesium/Source/Core/freezeObject');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var objectToQuery = require('terriajs-cesium/Source/Core/objectToQuery');
var loadJson = require('terriajs-cesium/Source/Core/loadJson');
var loadText = require('terriajs-cesium/Source/Core/loadText');
var when = require('terriajs-cesium/Source/ThirdParty/when');

var CatalogItem = require('./CatalogItem');
var CsvCatalogItem = require('./CsvCatalogItem');
var inherit = require('../Core/inherit');
var Metadata = require('./Metadata');
var ModelError = require('./ModelError');

var AbsDataset = require('./AbsDataset');
var AbsConcept = require('./AbsConcept');
var AbsCode = require('./AbsCode');


/**
 * A {@link CatalogItem} representing region-mapped data obtained from the Australia Bureau of Statistics
 * (ABS) ITT query interface.  Documentation for the query interface is found here: http://stat.abs.gov.au/itt/r.jsp?api
 *
 * @alias AbsIttCatalogItem
 * @constructor
 * @extends CatalogItem
 * 
 * @param {Terria} terria The Terria instance.
 */
var AbsIttCatalogItem = function(terria) {
    CatalogItem.call(this, terria);

    this._csvCatalogItem = undefined;
    this._metadata = undefined;
    this._absDataset = undefined;
    this._absDataTable = undefined;
    this._absDataText = undefined;

    this._filterColumnMap = [];

    this._regionTypeActive = false;


    /**
     * Gets or sets the URL of the ABS ITT API, typically http://stat.abs.gov.au/itt/query.jsp.
     * This property is observable.
     * @type {String}
     */
    this.url = undefined;

    /**
     * Gets or sets the ID of the ABS dataset.  You can obtain a list of all datasets by querying
     * http://stat.abs.gov.au/itt/query.jsp?method=GetDatasetList (or equivalent).  This property
     * is observable.
     * @type {String}
     */
    this.dataSetID = undefined;

    /**
     * Gets or sets the ABS region type to query.  You can obtain a list of all available region types for
     * a dataset by querying
     * http://stat.abs.gov.au/itt/query.jsp?method=GetCodeListValue&datasetid=ABS_CENSUS2011_B25&concept=REGIONTYPE&format=json
     * (or equivalent).  This property is observable.
     * @type {String}
     */
    this.regionType = undefined;

    /**
     * Gets or sets the ABS region concept.  You can obtain a list of all available concepts for
     * a dataset by querying
     * http://stat.abs.gov.au/itt/query.jsp?method=GetDatasetConcepts&datasetid=ABS_CENSUS2011_B19
     * (or equivalent).  This property is observable.
     * @type {String}
     */
    this.regionConcept = undefined;

    /**
     * Gets the list of initial concepts and codes on which to filter the data.  You can obtain a list of all available
     * concepts for a dataset by querying http://stat.abs.gov.au/itt/query.jsp?method=GetDatasetConcepts&datasetid=ABS_CENSUS2011_B25
     * (or equivalent) and a list of the possible values for a concept by querying
     * http://stat.abs.gov.au/itt/query.jsp?method=GetCodeListValue&datasetid=ABS_CENSUS2011_B25&concept=MEASURE&format=json.
     * @type {Array}
     */
    this.filter = [];

    /**
     * Gets or sets the opacity (alpha) of the data item, where 0.0 is fully transparent and 1.0 is
     * fully opaque.  This property is observable.
     * @type {Number}
     * @default 0.6
     */
    this.opacity = 0.6;

    /**
     * Gets or sets whether to show percentages or raw values.  This property is observable.
     * @type {Boolean}
     * @default true
     */
    this.displayPercent = true;

    /**
     * Gets or sets the styling for the abs data.  This property is observable.
     * @type {object}
     * @default undefined
     */
    this.tableStyle = undefined;

    knockout.track(this, ['url', 'dataSetID', 'regionType', 'regionConcept', 'filter', 'tableStyle', '_absDataset', 'opacity', 'displayPercent']);

    knockout.defineProperty(this, 'absDataset', {
        get : function() {
            return this._absDataset;
        },
        set : function(value) {
            this._absDataset = value;
        }
    });

    knockout.getObservable(this, 'opacity').subscribe(function(newValue) {
        if (defined(this._csvCatalogItem)) {
            this._csvCatalogItem.opacity = this.opacity;
        }
    }, this);

    knockout.getObservable(this, 'tableStyle').subscribe(function(newValue) {
        if (defined(this._csvCatalogItem)) {
            this._csvCatalogItem.tableStyle = this.tableStyle;
        }
    }, this);

    knockout.getObservable(this, 'displayPercent').subscribe(function(newValue) {
        updateAbsResults(this);
    }, this);

};

inherit(CatalogItem, AbsIttCatalogItem);

defineProperties(AbsIttCatalogItem.prototype, {
    /**
     * Gets the type of data member represented by this instance.
     * @memberOf AbsIttCatalogItem.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return 'abs-itt';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, 'GPX'.
     * @memberOf AbsIttCatalogItem.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'ABS.Stat';
        }
    },

    /**
     * Gets the metadata associated with this data source and the server that provided it, if applicable.
     * @memberOf GpxCatalogItem.prototype
     * @type {Metadata}
     */
    metadata : {
        get : function() {
            var result = new Metadata();
            result.isLoading = false;
            result.dataSourceErrorMessage = 'This data source does not have any details available.';
            result.serviceErrorMessage = 'This service does not have any details available.';
            return result;
        }
    },


    /**
     * Gets a value indicating whether this data source, when enabled, can be reordered with respect to other data sources.
     * Data sources that cannot be reordered are typically displayed above reorderable data sources.
     * @memberOf CsvCatalogItem.prototype
     * @type {Boolean}
     */
    supportsReordering : {
        get : function() {
            return true;
        }
    },
    /**
     * Gets a value indicating whether the opacity of this data source can be changed.
     * @memberOf ImageryLayerCatalogItem.prototype
     * @type {Boolean}
     */
    supportsOpacity : {
        get : function() {
            return true;
        }
    },

    /**
     * Gets the Cesium or Leaflet imagery layer object associated with this data source.
     * This property is undefined if the data source is not enabled.
     * @memberOf CsvCatalogItem.prototype
     * @type {Object}
     */
    imageryLayer : {
        get : function() {
            if (defined(this._csvCatalogItem)) {
                return this._csvCatalogItem.imageryLayer;
            }
            return undefined;
        }
    },

    /**
     * Gets the set of names of the properties to be serialized for this object when {@link CatalogMember#serializeToJson} is called
     * and the `serializeForSharing` flag is set in the options.
     * @memberOf ImageryLayerCatalogItem.prototype
     * @type {String[]}
     */
    propertiesForSharing : {
        get : function() {
            return AbsIttCatalogItem.defaultPropertiesForSharing;
        }
    }
});

/**
 * Gets or sets the default set of properties that are serialized when serializing a {@link CatalogItem}-derived object with the
 * `serializeForSharing` flag set in the options.
 * @type {String[]}
 */
AbsIttCatalogItem.defaultPropertiesForSharing = clone(CatalogItem.defaultPropertiesForSharing);
AbsIttCatalogItem.defaultPropertiesForSharing.push('opacity');
AbsIttCatalogItem.defaultPropertiesForSharing.push('tableStyle');
AbsIttCatalogItem.defaultPropertiesForSharing.push('filter');
AbsIttCatalogItem.defaultPropertiesForSharing.push('regionConcept');
AbsIttCatalogItem.defaultPropertiesForSharing.push('displayPercent');
//TODO: need to store csv style with the shared properties
freezeObject(AbsIttCatalogItem.defaultPropertiesForSharing);


//Just the items that would influence the load from the abs server or the file (w/regionType)
AbsIttCatalogItem.prototype._getValuesThatInfluenceLoad = function() {
    return [this.url, this.dataSetID, this.regionType];
};

//TODO: look at exposing these
//      use region or regiontype concept to decide on region
function skipConcept(concept, regionConcept) {
    var conceptMask = ["STATE","REGIONTYPE","FREQUENCY",regionConcept];
    for (var i = 0; i < conceptMask.length; i++) {
        if (conceptMask[i] === concept) {
            return true;
        }
    }
    return false;
}


AbsIttCatalogItem.prototype._load = function() {

    this._csvCatalogItem = new CsvCatalogItem(this.terria);
    this._csvCatalogItem.opacity = this.opacity;
    this._csvCatalogItem.tableStyle = this.tableStyle;

    var that = this;
    var concepts, codeGroups, conceptNameMap, loadPromises = [];
    var createDefaultFilter = (this.filter.length === 0);

    this._absDataset = new AbsDataset();

    //generate the url or filename to load
    if (this.dataSetID === 'FILE') {
        loadPromises.push(loadText(this.url + '_' + this.regionType + '_short.csv').then( function(text) {
            that._absDataTable = csv.toArrays(text, {
                onParseValue: csv.hooks.castToScalar
            });
        }));
        loadPromises.push(loadJson(this.url + '.json').then(function(json) {
            concepts = json.concepts;
            codeGroups = json.codeGroups;
            that._filterColumnMap = json.filterColumnMap;
        }));
        this.regionConcept = this.regionConcept || 'region_id';
    } 
    else {
        var baseUrl = cleanAndProxyUrl(this.terria, this.url);
        var parameters = {
            method: 'GetDatasetConcepts',
            datasetid: this.dataSetID,
            format: 'json'
        };
        var url = baseUrl + '?' + objectToQuery(parameters);

        loadPromises.push(loadJson(url).then(function(json) {
            concepts = json.concepts;
        }));
        this.regionConcept = this.regionConcept || 'REGION';
    }

    loadPromises.push(loadText('data/2011Census_TOT_' + this.regionType + '.csv').then( function(text) {
        that._absTotalTable = csv.toArrays(text, {
            onParseValue: csv.hooks.castToScalar
        });
    }));

    //cover for missing human readable name in api
    loadPromises.push(loadJson('data/abs_names.json').then(function(json) {
        conceptNameMap = json;
    }));
    
    function updateConceptName(concept) {
        if (!defined(conceptNameMap[concept.name])) {
            return;
        }
        if (typeof conceptNameMap[concept.name] === 'string') {
            concept.name = conceptNameMap[concept.name];
        }
        else {
            var codeMap = conceptNameMap[concept.name];
            for (var j = 0; j < concept.items.length; j++) {
                if (defined(codeMap[concept.items[j].name])) {
                    concept.name = codeMap[concept.items[j].name];
                    return;
                }
            }
        }
    }

    return when.all(loadPromises).then(function() {
        //call GetDatasetConcepts and then GetCodeListValue to build up a tree
        //  describing the layout of the data

        var promises = [];

        function addConceptCodes(concept, json) {

            that.absDataset.items.push(concept);

            var codes = json.codes;

            function absCodeUpdate() {
                //close feature info panel and then update results
                that.terria.pickedFeatures = undefined;
                return updateAbsResults(that);
            }
            if (createDefaultFilter) {
                for (var i = 0; i < codes.length; ++i) {
                    if (codes[i].parentCode === "") {
                        that.filter.push(concept.code + '.' + codes[i].code);
                        break;
                    }
                }
            }

            function addTree(parent, codes) {
                for (var i = 0; i < codes.length; ++i) {
                    var parentCode = (parent instanceof AbsCode) ? parent.code : '';
                    if (codes[i].parentCode === parentCode) {
                        var absCode = new AbsCode(codes[i].code, codes[i].description);
                        var codeFilter = concept.code + '.' + absCode.code;
                        if (that.filter.indexOf(codeFilter) !== -1) {
                            absCode.isActive = true;
                        }
                        if (parentCode === '' && codes.length < 50) {
                            absCode.isOpen = true;
                        }
                        absCode.parent = parent;
                        absCode.updateFunction = absCodeUpdate;
                        parent.items.push(absCode);
                        addTree(absCode, codes);
                    }
                }
            }
            addTree(concept, codes);

            updateConceptName(concept);
        }

        var loadFunc = function(url, concept) {
            return loadJson(url).then( function(json) {
                addConceptCodes(concept, json);
            });
        };

        for (var i = 0; i < concepts.length; ++i) {
            var conceptID = concepts[i];

            that._regionTypeActive |= (conceptID === 'REGIONTYPE');

            if (skipConcept(conceptID, that.regionConcept)) {
                continue;
            }

            var parameters = {
                method: 'GetCodeListValue',
                datasetid: that.dataSetID,
                concept: conceptID,
                format: 'json'
            };

            var url = baseUrl + '?' + objectToQuery(parameters);

            var concept = new AbsConcept(conceptID);

            if (defined(codeGroups)) {
                var json = codeGroups[conceptID];
                if (defined(json)) {
                    promises.push(addConceptCodes(concept, json));
                }
            }
            else {
                promises.push(loadFunc(url, concept));
            }
        }
        return when.all(promises).then( function(results) {

            that.absDataset.items.sort(function(a, b){ return (a.name > b.name) ? 1 : -1; });

            return when(updateAbsResults(that)).then(function() {
                that._absDataset.isLoading = false;
            });

        });
    }).otherwise(function(e) {
        throw new ModelError({
            sender: that,
            title: 'Item is not available',
            message: '\
An error occurred while invoking GetCodeListValue on the ABS ITT server.  \
<p>This error may indicate that the item you opened is temporarily unavailable or there is a \
problem with your internet connection.  Try opening the group again, and if the problem persists, please report it by \
sending an email to <a href="mailto:'+that.terria.supportEmail+'">'+that.terria.supportEmail+'</a>.</p>'
        });
    });
};

AbsIttCatalogItem.prototype._enable = function() {
    if (defined(this._csvCatalogItem)) {
        this._csvCatalogItem._enable();
    }
};

AbsIttCatalogItem.prototype._disable = function() {
    if (defined(this._csvCatalogItem)) {
        this._csvCatalogItem._disable();
    }
};

AbsIttCatalogItem.prototype._show = function() {
    if (defined(this._csvCatalogItem)) {
        this._csvCatalogItem._show();
    }
};

AbsIttCatalogItem.prototype._hide = function() {
    if (defined(this._csvCatalogItem)) {
        this._csvCatalogItem._hide();
    }
};

AbsIttCatalogItem.prototype._cache = function() {
    //walk through tree
    console.log('caching ABS dataset:', this.name);

    var that = this;

    var promise = !defined(that.absDataset) ? this.load() : undefined;
    return when(promise).then( function() {
        function setAllCodesActive(parent, activeState) {
            for (var i = 0; i < parent.items.length; i++) {
                if (parent.items[i] instanceof AbsCode) {
                    parent.items[i].isActive = activeState;
                }
                setAllCodesActive(parent.items[i], activeState);
            }
        }

        setAllCodesActive(that.absDataset, true);
        return when(updateAbsDataCsvText(that, true)).then(function() {
            //set back to default state
            setAllCodesActive(that.absDataset, false);
            for (var i = 0; i < that.absDataset.items.length; i++) {
                if (defined(that.absDataset.items[i].items[0])) {
                    that.absDataset.items[i].items[0].isActive = true;
                }
            }
            return updateAbsResults(that);
        });
    });

};

function cleanAndProxyUrl(terria, url) {
    return proxyUrl(terria, cleanUrl(url));
}

function cleanUrl(url) {
    // Strip off the search portion of the URL
    var uri = new URI(url);
    uri.search('');
    return uri.toString();
}

function proxyUrl(terria, url) {
    if (defined(terria.corsProxy) && terria.corsProxy.shouldUseProxy(url)) {
        return terria.corsProxy.getURL(url);
    }

    return url;
}

function updateAbsResults(absItem) {
    return when(updateAbsDataCsvText(absItem)).then(function() {
        return when(absItem._csvCatalogItem.dynamicUpdate(absItem._absDataText)).then(function() {
            absItem.legendUrl = absItem._absDataText === '' ? '' : absItem._csvCatalogItem.legendUrl;
            absItem.terria.currentViewer.notifyRepaintRequired();
        });
    });
}


function updateAbsDataCsvText(absItem, serializeCalls) {

    //walk tree to get active codes
    var activeCodes = [];
    absItem.filter = [];
    absItem._absDataText = '';
    function appendActiveCodes(parent, idxConcept, conceptCode) {
        for (var i = 0; i < parent.items.length; i++) {
            var node = parent.items[i];
            if (node.isActive) {
                var codeFilter = conceptCode + '.' + node.code;
                absItem.filter.push(codeFilter);
                activeCodes[idxConcept].push({filter: codeFilter, name: node.name});
            }
            appendActiveCodes(node, idxConcept, conceptCode);
        }
    }

    //check that we can create valid filters
    var bValidSelection = true;
    for (var f = 0; f < absItem._absDataset.items.length; f++) {
        var concept = absItem._absDataset.items[f];
        activeCodes[f] = [];
        appendActiveCodes(concept, f, concept.code);
        if (activeCodes[f].length === 0) {
            bValidSelection = false;
        }
    }

    if (!bValidSelection) {
        return;
    }

    console.log(activeCodes);

    //build filters from activeCodes
    var queryFilters = [];
    var queryNames = [];
    function buildQueryFilters(idxConcept, filterIn, nameIn) {
        for (var i = 0; i < activeCodes[idxConcept].length; i++) {
            var filter = filterIn.slice();
            filter.push(activeCodes[idxConcept][i].filter);
            var name = nameIn.slice();
            name.push(activeCodes[idxConcept][i].name);
            if (idxConcept+1 === activeCodes.length) {
                queryFilters.push(filter);
                queryNames.push(name);
            } else {
                buildQueryFilters(idxConcept+1, filter, name);
            }
        }
    }
    buildQueryFilters(0, [], []);

    function getFilterDataIndex(filter) {
        var codes = filter.split(',');
        for (var i = 0; i < absItem._filterColumnMap.length; i++) {
            var totMatch = 0;
            for (var j = 0; j < codes.length; j++, totMatch++) {
                if (absItem._filterColumnMap[i].filter.indexOf(codes[j]) === -1) {
                    break;
                }
            }
            if (totMatch === codes.length) {
                return i;
            }
        }
        return -1;
    }

    var loadFilterData = function(url, filterItem) {
        if (getFilterDataIndex(filterItem.filter) !== -1) {
            return;
        }
        return loadText(url).then(function(text) {
            var data;
            try {
                data = csv.toArrays(text, {
                    onParseValue: csv.hooks.castToScalar
                });
            }
            catch (err) {
                console.log('ABS ERROR:',err.message);
            }
            if (!defined(data) || data.length === 0) {
                return;
            }
            //clean up occasional spurious extra lines from response
            if (data.length > 0 && data[data.length-1].length < data[0].length) {
                data.length--;
            }
            filterItem.colName =  filterItem.filter.split(',').join('_');
            var ndx = data[0].indexOf('Value');
            data[0][ndx] = filterItem.colName;
            if (!defined(absItem._absDataTable)) {
                absItem._absDataTable = data;
            } else {
                data.forEach( function(row, r) {
                    absItem._absDataTable[r].push(row[ndx]);
                });
            }
            absItem._filterColumnMap.push(filterItem);
        });
    };

    var promises = [];

    var currentFilterList = [];
    var baseUrl = cleanAndProxyUrl(absItem.terria, absItem.url);
    var regionType = absItem.regionType;
    function cacheFeedback(){ console.log('loading', queryFilters.length); }
    for (var i = 0; i < queryFilters.length; ++i) {
        var filterItem = {
            filter: queryFilters[i].join(','),
            name: queryNames[i].join(' ')
        };
        currentFilterList.push(filterItem);

        if (absItem.dataSetID === 'FILE') {
            continue;
        }

            //abs data with regiontype concept
        var regionArg = absItem._regionTypeActive ? ',REGIONTYPE.' + regionType : '';

        var parameters = {
            method: 'GetGenericData',
            datasetid: absItem.dataSetID,
            and: filterItem.filter + regionArg,
            or: absItem.regionConcept,
            format: 'csv'
        };
        var url = baseUrl + '?' + objectToQuery(parameters);

        var promise = loadFilterData(url, filterItem);
        promises.push(promise);
        // used when caching to keep from bombing the server
        if (serializeCalls) {
            when(promise).then(cacheFeedback());
        }
    }

        //When promises all done then sum up date for final csv
    return when.all(promises).then( function(results) {
        var csvArray = absItem._absDataTable;
        // A hack to deal with ABS returning an exception on some filters
        if (!defined(csvArray)) {
            csvArray = absItem._absTotalTable;
        }
        if (!defined(csvArray) || csvArray.length === 0) {
            return;
        }
        var finalCsvArray = [];
        var regionCol = csvArray[0].indexOf(absItem.regionConcept);

        finalCsvArray.push([absItem.displayPercent ? "Region Percentage" : "Region Count", absItem.regionType]);
        var cols = [];
        if (csvArray[0].indexOf('Description') !== -1) {
            finalCsvArray[0].push('Description');
            cols.push(csvArray[0].indexOf('Description'));
        }
        for (var f = 0; f < currentFilterList.length; f++) {
            var idx = getFilterDataIndex(currentFilterList[f].filter);
            if (idx !== -1) {
                var colName = absItem._filterColumnMap[idx].colName;
                finalCsvArray[0].push(currentFilterList[f].name);
                cols.push(csvArray[0].indexOf(colName));
            }
        }

        for (var r = 1; r < csvArray.length; r++) {
            var newRow = [0, csvArray[r][regionCol]];
            for (var c = 0; c < cols.length; c++) {
                var val = csvArray[r][cols[c]];
                newRow.push(val);
                if (typeof val !== 'string') {
                    newRow[0] += val;
                }
            }
            if (absItem.displayPercent) {
                var tot = absItem._absTotalTable[r][3];
                newRow[0] = tot <= 0 ? 0 : Math.min(100.0, Math.round(newRow[0] * 10000 / tot)/100);
            }
            finalCsvArray.push(newRow);
        }

        //check that the created csvArray is ok
        if (defined(finalCsvArray) && finalCsvArray.length > 0) {
            //Serialize the arrays
            var joinedRows = finalCsvArray.map(function(arr) {
                return arr.join(',');
            });
            absItem._absDataText = joinedRows.join('\n');
        }
    });
}


module.exports = AbsIttCatalogItem;