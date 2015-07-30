'use strict';

/*global require*/
var L = require('leaflet');

var clone = require('terriajs-cesium/Source/Core/clone');
var DataSourceClock = require('terriajs-cesium/Source/DataSources/DataSourceClock');
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var freezeObject = require('terriajs-cesium/Source/Core/freezeObject');
var JulianDate = require('terriajs-cesium/Source/Core/JulianDate');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var loadText = require('terriajs-cesium/Source/Core/loadText');
var loadJson = require('terriajs-cesium/Source/Core/loadJson');
var WebMapServiceImageryProvider = require('terriajs-cesium/Source/Scene/WebMapServiceImageryProvider');
var WebMapServiceCatalogItem = require('./WebMapServiceCatalogItem');
var WebMercatorTilingScheme = require('terriajs-cesium/Source/Core/WebMercatorTilingScheme');
var when = require('terriajs-cesium/Source/ThirdParty/when');

var CatalogItem = require('./CatalogItem');
var corsProxy = require('../Core/corsProxy');
var ImageryLayerCatalogItem = require('./ImageryLayerCatalogItem');
var inherit = require('../Core/inherit');
var Metadata = require('./Metadata');
var ModelError = require('./ModelError');
var readText = require('../Core/readText');
var TableDataSource = require('../Map/TableDataSource');
var TileLayerFilter = require('../ThirdParty/TileLayer.Filter');
var xml2json = require('../ThirdParty/xml2json');

var CsvDataset = require('./CsvDataset');
var CsvVariable = require('./CsvVariable');


TileLayerFilter.initialize(L);

/**
 * A {@link CatalogItem} representing CSV data.
 *
 * @alias CsvCatalogItem
 * @constructor
 * @extends CatalogItem
 *
 * @param {Terria} terria The Terria instance.
 * @param {String} [url] The URL from which to retrieve the CSV data.
 */
var CsvCatalogItem = function(terria, url) {
    CatalogItem.call(this, terria);

    this._tableDataSource = undefined;

    this._clockTickUnsubscribe = undefined;

    this._regionWmsMap = undefined;
    this._regionDescriptor = undefined;
    this._regionMapped = false;

    this._csvDataset = undefined;

    this._clockTickUnsubscribe = undefined;

    this._tableStyle = {};

    /**
     * Gets or sets the URL from which to retrieve CSV data.  This property is ignored if
     * {@link GeoJsonCatalogItem#data} is defined.  This property is observable.
     * @type {String}
     */
    this.url = url;

    /**
     * Gets or sets the CSV data, represented as a binary Blob, a string, or a Promise for one of those things.
     * This property is observable.
     * @type {Blob|String|Promise}
     */
    this.data = undefined;

    /**
     * Gets or sets the URL from which the {@link CsvCatalogItem#data} was obtained.  This is informational; it is not
     * used.  This propery is observable.
     * @type {String}
     */
    this.dataSourceUrl = undefined;

   /**
     * Gets or sets the opacity (alpha) of the data item, where 0.0 is fully transparent and 1.0 is
     * fully opaque.  This property is observable.
     * @type {Number}
     * @default 0.6
     */
    this.opacity = 0.6;

    /**
     * Keeps the layer on top of all other imagery layers.  This property is observable.
     * @type {Boolean}
     * @default false
     */
    this.keepOnTop = false;

    /**
     * Disable the ability to change the display of the dataset via csvDataset.
     * This property is observable.
     * @type {Boolean}
     * @default false
     */
    this.disableUserChanges = false;

    knockout.track(this, ['url', 'data', 'dataSourceUrl', 'opacity', 'keepOnTop', '_regionMapped', '_csvDataset', 'disableUserChanges']);

    knockout.defineProperty(this, 'csvDataset', {
        get : function() {
            return this._csvDataset;
        },
        set : function(value) {
            this._csvDataset = value;
        }
    });

    knockout.getObservable(this, 'opacity').subscribe(function(newValue) {
        updateOpacity(this);
    }, this);

    knockout.getObservable(this, 'isShown').subscribe(function() {
        updateClockSubscription(this);
    }, this);

    knockout.getObservable(this, 'clock').subscribe(function() {
        updateClockSubscription(this);
    }, this);

    /**
     * Gets or sets the tableStyle object
     * TODO: add definition for subfields
     * @type {Object}
     */
    knockout.defineProperty(this, 'tableStyle', {
        get : function() {
            return this._tableStyle;
        },
        set : function(value) {
            updateTableStyle(this, value);
        }
    });
};

inherit(CatalogItem, CsvCatalogItem);

defineProperties(CsvCatalogItem.prototype, {
    /**
     * Gets the type of data member represented by this instance.
     * @memberOf CsvCatalogItem.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return 'csv';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, 'CSV'.
     * @memberOf CsvCatalogItem.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'Comma-Separated Values (CSV)';
        }
    },

    /**
     * Gets the metadata associated with this data source and the server that provided it, if applicable.
     * @memberOf CsvCatalogItem.prototype
     * @type {Metadata}
     */
    metadata : {  //TODO: return metadata if tableDataSource defined
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
            return this._regionMapped && !this.keepOnTop;
        }
    },

    /**
     * Gets a value indicating whether the opacity of this data source can be changed.
     * @memberOf ImageryLayerCatalogItem.prototype
     * @type {Boolean}
     */
    supportsOpacity : {
        get : function() {
            return this._regionMapped;
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
            return this._imageryLayer;
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
            return CsvCatalogItem.defaultPropertiesForSharing;
        }
    }
});

/**
 * Gets or sets the default set of properties that are serialized when serializing a {@link CatalogItem}-derived object with the
 * `serializeForSharing` flag set in the options.
 * @type {String[]}
 */
CsvCatalogItem.defaultPropertiesForSharing = clone(CatalogItem.defaultPropertiesForSharing);
CsvCatalogItem.defaultPropertiesForSharing.push('keepOnTop');
CsvCatalogItem.defaultPropertiesForSharing.push('disableUserChanges');
CsvCatalogItem.defaultPropertiesForSharing.push('opacity');
CsvCatalogItem.defaultPropertiesForSharing.push('tableStyle');
freezeObject(CsvCatalogItem.defaultPropertiesForSharing);


CsvCatalogItem.prototype._getValuesThatInfluenceLoad = function() {
    return [this.url, this.data];
};

CsvCatalogItem.prototype._load = function() {
    if (defined(this._tableDataSource)) {
        this._tableDataSource.destroy();
    }

    this._tableDataSource = new TableDataSource();

    var that = this;

    if (defined(this.data)) {
        return when(that.data, function(data) {
            if (typeof Blob !== 'undefined' && data instanceof Blob) {
                return readText(data).then(function(text) {
                    return loadTable(that, text);
                });
            } else if (typeof data === 'string') {
                return loadTable(that, data);
            } else {
                throw new ModelError({
                    sender: that,
                    title: 'Unexpected type of CSV data',
                    message: '\
CsvCatalogItem data is expected to be a Blob, File, or String, but it was not any of these. \
This may indicate a bug in terriajs or incorrect use of the terriajs API. \
If you believe it is a bug in '+that.terria.appName+', please report it by emailing \
<a href="mailto:'+that.terria.supportEmail+'">'+that.terria.supportEmail+'</a>.'
                });
            }
        });
    } else if (defined(that.url)) {
        return loadText(proxyUrl( that.terria, that.url)).then(function(text) {
            return loadTable(that, text);
        }).otherwise(function(e) {
            throw new ModelError({
                sender: that,
                title: 'Unable to load CSV file',
                message: '\
An error occurred while retrieving CSV data from the provided link.'
            });
        });
    }
};

CsvCatalogItem.prototype._enable = function() {
    if (this._regionMapped) {
        this._imageryLayer = ImageryLayerCatalogItem.enableLayer(this, this._createImageryProvider(), this.opacity);

        if (defined( this.terria.leaflet)) {
            var that = this;
            this._imageryLayer.setFilter(function () {
                new L.CanvasFilter(this, {
                    channelFilter: function (image) {
                        return recolorImage(image, that.colorFunc);
                    }
                }).render();
            });
        }
    }
};

CsvCatalogItem.prototype._disable = function() {
    if (this._regionMapped) {
        ImageryLayerCatalogItem.disableLayer(this, this._imageryLayer);
        this._imageryLayer = undefined;
    }
};

CsvCatalogItem.prototype._show = function() {
    if (!this._regionMapped) {
        var dataSources =  this.terria.dataSources;
        if (dataSources.contains(this._tableDataSource)) {
            throw new DeveloperError('This data source is already shown.');
        }

        dataSources.add(this._tableDataSource);
    }
    else {
        ImageryLayerCatalogItem.showLayer(this, this._imageryLayer);
    }
};

CsvCatalogItem.prototype._hide = function() {
    if (!this._regionMapped) {
        var dataSources =  this.terria.dataSources;
        if (!dataSources.contains(this._tableDataSource)) {
            throw new DeveloperError('This data source is not shown.');
        }

        dataSources.remove(this._tableDataSource, false);
    }
    else {
        ImageryLayerCatalogItem.hideLayer(this, this._imageryLayer);
    }
};

CsvCatalogItem.prototype._createImageryProvider = function(time) {
    var imageryProvider = new WebMapServiceImageryProvider({
        url: proxyUrl( this.terria, this._regionDescriptor.server),
        layers: this._regionDescriptor.layerName,
        parameters: WebMapServiceCatalogItem.defaultParameters,
        getFeatureInfoParameters: WebMapServiceCatalogItem.defaultParameters,
        tilingScheme: new WebMercatorTilingScheme()
    });

    var that = this;

    // Override requestImage to recolor the images.
    imageryProvider.base_requestImage = imageryProvider.requestImage;
    imageryProvider.requestImage = function(x, y, level) {
        var imagePromise = this.base_requestImage(x, y, level);
        if (!defined(imagePromise)) {
            return imagePromise;
        }

        return when(imagePromise, function(image) {
            if (defined(image)) {
                image = recolorImageWithCanvas(that, image, that.colorFunc);
            }
            return image;
        });
    };

    // Override pickFeatures to add more metadata.
    imageryProvider.base_pickFeatures = imageryProvider.pickFeatures;
    imageryProvider.pickFeatures = function(x, y, level, longitude, latitude) {
        var featurePromise = this.base_pickFeatures(x, y, level, longitude, latitude);
        if (!defined(featurePromise)) {
            return featurePromise;
        }

        return when(featurePromise, function(results) {
            if (!defined(results) || results.length === 0) {
                return;
            }

            for (var i = 0; i < results.length; ++i) {
                var id = results[i].data.properties[that._regionDescriptor.regionProp];
                var properties = that.rowProperties(id);
                results[i].description = that._tableDataSource.describe(properties);
            }

            return results;
        });
    };

    return imageryProvider;
};

function proxyUrl(terria, url) {
    if (defined(terria.corsProxy) && terria.corsProxy.shouldUseProxy(url)) {
        return terria.corsProxy.getURL(url);
    }

    return url;
}



function updateOpacity(csvItem) {
    if (defined(csvItem._imageryLayer)) {
        if (defined(csvItem._imageryLayer.alpha)) {
            csvItem._imageryLayer.alpha = csvItem.opacity;
        }

        if (defined(csvItem._imageryLayer.setOpacity)) {
            csvItem._imageryLayer.setOpacity(csvItem.opacity);
        }

        csvItem.terria.currentViewer.notifyRepaintRequired();
    }
}

CsvCatalogItem.prototype._redisplay = function() {
    if (defined(this._imageryLayer)) {
        this._hide();
        this._disable();
        this._enable();
        this._show();
    }
};

CsvCatalogItem.prototype.dynamicUpdate = function(text) {
    this.data = text;
    var that = this;

    return when(this.load()).then(function () {
        that._redisplay();
    });
};

function updateClockSubscription(csvItem) {
    if (csvItem.isShown && defined(csvItem.clock) && csvItem._regionMapped) {
        // Subscribe
        if (!defined(csvItem._clockTickSubscription)) {
            csvItem._clockTickSubscription = csvItem.terria.clock.onTick.addEventListener(onClockTick.bind(undefined, csvItem));
        }
    } else {
        // Unsubscribe
        if (defined(csvItem._clockTickSubscription)) {
            csvItem._clockTickSubscription();
            csvItem._clockTickSubscription = undefined;
        }
    }
}

function onClockTick(csvItem, clock) {
    var hasTimeData = csvItem._tableDataSource.dataset.hasTimeData();
    if (!hasTimeData || !csvItem.isEnabled || !csvItem.isShown) {
        return;
    }
    //check if time has changed
    if (defined(csvItem.lastTime) && JulianDate.equals(clock.currentTime, csvItem.lastTime)) {
        return;
    }
    csvItem.lastTime = clock.currentTime;

    //check if record data has changed
    var recs = csvItem._tableDataSource.getDataPointList(clock.currentTime);
    var recText = JSON.stringify(recs);
    if (defined(csvItem.lastRecText) && recText === csvItem.lastRecText) {
        return;
    }
    csvItem.lastRecText = recText;

    //redisplay if we have new data
    csvItem.recs = recs;
    createRegionLookupFunc(csvItem);
    csvItem._redisplay();
}

function finishTableLoad(csvItem) {

    var source = csvItem._tableDataSource;

        //set up the clock
    if (!csvItem._regionMapped) {
        csvItem.clock = source.clock;
    }
    else {
        if (!defined(csvItem.clock)) {
            var newClock;
            var dataSource = source;
            if (defined(dataSource) && defined(dataSource.dataset) && dataSource.dataset.hasTimeData()) {
                var startTime = dataSource.dataset.getTimeMinValue();
                var stopTime = dataSource.dataset.getTimeMaxValue();
                var totalDuration = JulianDate.secondsDifference(stopTime, startTime);

                newClock = new DataSourceClock();
                newClock.startTime = startTime;
                newClock.stopTime = stopTime;
                newClock.currentTime = startTime;
                newClock.multiplier = totalDuration / 60;
                }
            csvItem.clock = newClock;
        }
    }

    var varNames = source.dataset.getDataVariableList();
    if (varNames.length > 0 && !csvItem.disableUserChanges) {
        //create ko dataset for now viewing ui
        var csvDataset = new CsvDataset();
        for (var i = 0; i < varNames.length; i++) {
            csvDataset.items.push(new CsvVariable(varNames[i], csvDataset));
        }
        csvDataset.setSelected(source.dataset.getDataVariable());
        csvDataset.updateFunction = function (varName) { 
                //set new variable and clear var specific styling
            var tableStyle = csvItem._tableStyle;
            tableStyle.dataVariable = varName;
            tableStyle.minDisplayValue = undefined;
            tableStyle.maxDisplayValue = undefined;
            tableStyle.featureInfoFields = undefined;
            tableStyle.legendTicks = 0;
            updateTableStyle(csvItem, tableStyle);

            csvItem.legendUrl = source.getLegendGraphic();
            csvItem.terria.currentViewer.notifyRepaintRequired();
        };
        csvItem.csvDataset = csvDataset;
    }

        //prepare visuals and repaint
    csvItem.rectangle = source.dataset.getExtent();
    csvItem.legendUrl = source.getLegendGraphic();
    csvItem.terria.currentViewer.notifyRepaintRequired();
}

//////////////////////////////////////////////////////////////////////////


function loadTable(csvItem, text) {

    if (defined(csvItem._tableStyle)) {
        csvItem._tableDataSource.setDisplayStyle(csvItem._tableStyle);
    }

    csvItem._tableDataSource.loadText(text);

    if (!csvItem._tableDataSource.dataset.hasLocationData()) {
        console.log('No locaton date found in csv file - trying to match based on region');
        return loadJson(csvItem.terria.regionMappingDefinitionsUrl).then(function(obj) {
            csvItem._regionWmsMap = obj.regionWmsMap;
            return when(addRegionMap(csvItem), function() {
                if (csvItem._regionMapped) {
                    finishTableLoad(csvItem);
                }
                else {
                    throw new ModelError({
                        sender: csvItem,
                        title: 'Unable to load CSV file',
                        message: 'We were unable to find any location parameters for latitude and \
                          longitude or to determine a column to use for region mapping.'
                    });
                }
            });
        });
    }
    else {
        finishTableLoad(csvItem);
    }
}


//////////////////////////////////////////////////////////////////////////

//Recolor an image using a color function
function recolorImage(image, colorFunc) {
    var length = image.data.length;  //pixel count * 4
    for (var i = 0; i < length; i += 4) {
        if (image.data[i+3] < 255 || image.data[i] !== 0) {
            image.data[i+3] = 0;
            continue;
        }
        var idx = image.data[i+1] * 0x100 + image.data[i+2];
        var clr = colorFunc(idx);
        if (defined(clr)) {
            for (var j = 0; j < 4; j++) {
                image.data[i+j] = clr[j];
            }
        }
        else {
            image.data[i+3] = 0;
        }
    }
    return image;
}

//Recolor an image using 2d canvas
function recolorImageWithCanvas(csvCatalogItem, img, colorFunc) {
    var context = csvCatalogItem._canvas2dContext;

    if (!defined(context) || context.canvas.width !== img.width || context.canvas.height !== img.height) {
        var canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;

        context = csvCatalogItem._canvas2dContext = canvas.getContext("2d");
    }

    // Copy the image contents to the canvas
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    context.drawImage(img, 0, 0);
    var image = context.getImageData(0, 0, context.canvas.width, context.canvas.height);

    return recolorImage(image, colorFunc);
}


function loadRegionIDs(regionDescriptor) {
    if (defined(regionDescriptor.idMap)) {
        return;
    }

    var url = regionDescriptor.server + '?service=wfs&version=2.0&request=getPropertyValue';
    url += '&typenames=' + regionDescriptor.layerName;
    url += '&valueReference=' + regionDescriptor.regionProp;
    url = corsProxy.getURL(url);
    return loadText(url).then(function (text) {
        var obj = xml2json(text);

        if (!defined(obj.member)) {
            return;
        }

        var idMap = [];
            //this turns ids into numbers since they are that way in table data
        if (obj.member instanceof Array) {
            for (var i = 0; i < obj.member.length; i++) {
                idMap.push(obj.member[i][regionDescriptor.regionProp]);
            }
        } else {
            idMap.push(obj.member[regionDescriptor.regionProp]);
        }
        regionDescriptor.idMap = idMap;
    }, function(err) {
        console.log(err);
    });
}


function createRegionLookupFunc(csvItem) {
    if (!defined(csvItem) || !defined(csvItem._tableDataSource) || !defined(csvItem._tableDataSource.dataset)) {
        return;
    }
    var dataSource = csvItem._tableDataSource;
    var dataset = dataSource.dataset;
    var regionVariable = csvItem._tableStyle.regionVariable;

    var numericCodes = false;
    var codes = dataset.getVariableEnums(regionVariable);
    var ids = csvItem._regionDescriptor.idMap;

    if (!defined(codes)) {
        numericCodes = true;
        codes = dataset.getVariableValues(regionVariable);
        for (var n = 0; n < ids.length; n++) {
            ids[n] = parseInt(ids[n],10);
        }
    }
    var vals = dataset.getVariableValues(dataset.getDataVariable());
    var colors = new Array(ids.length);
    for (var c = 0; c < colors.length; c++) {
        colors[c] = [0, 0, 0, 0];
    }

    // set color for each code
    var row, index, codeMap = [];
    if (!defined(csvItem.recs)) {
        for (row = 0; row < codes.length; row++) {
            index = ids.indexOf(codes[row]);
            if (index >= 0 && colors[index][3] === 0) {
                colors[index] = dataSource._mapValue2Color(defined(vals) ? vals[row] : undefined);
            }
        }
    } else {
        for (var i = 0; i < csvItem.recs.length; i++) {
            row  = csvItem.recs[i];
            codeMap[i] = codes[row];
            index = ids.indexOf(codes[row]);
            if (index >= 0 && colors[index][3] === 0) {
                colors[index] = dataSource._mapValue2Color(defined(vals) ? vals[row] : undefined);
            }
        }
    }

    //   color lookup function used by the region mapper
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


function determineRegionType(dataset, regionWmsMap) {
    var varNames = dataset.getVariableNames();

    var varNameLC = [], varTextCodes = [];
    varNames.map(function(name) {
        varNameLC.push(name.toLowerCase());
        varTextCodes.push(defined(dataset.getVariableEnumList(name)));
    });

    //try to figure out the region variable and type based on aliases
    for (var region in regionWmsMap) {
        if (regionWmsMap.hasOwnProperty(region)) {
            var aliases = regionWmsMap[region].aliases;
            for (var i = 0; i < varNames.length; i++) {
                //check that it is the right type of codes
                if ((regionWmsMap[region].textCodes && !varTextCodes[i]) || (!regionWmsMap[region].textCodes && varTextCodes[i])) {
                    continue;
                }
                for (var j = 0; j < aliases.length; j++) {
                    if (varNameLC[i].substring(0,aliases[j].length) === aliases[j]) {
                        return { regionType: region, regionVariable: varNames[i] };
                    }
                }
            }
        }
    }
    return { };
}


function updateTableStyle(csvItem, tableStyle) {

    csvItem._tableStyle = tableStyle;

    if (!(csvItem._tableDataSource instanceof TableDataSource)) {
        return;
    }

    csvItem._tableDataSource.setDisplayStyle(csvItem._tableStyle);

    if (defined(csvItem._tableStyle.regionType) && defined(csvItem._tableStyle.regionVariable)) {
        csvItem._regionDescriptor = csvItem._regionWmsMap[csvItem._tableStyle.regionType];
        return when(loadRegionIDs(csvItem._regionDescriptor), function() {
            createRegionLookupFunc(csvItem);
            csvItem._regionMapped = true;
            csvItem._redisplay();
        });
    }
}


function addRegionMap(csvItem) {
    if (!(csvItem._tableDataSource instanceof TableDataSource)) {
        return;
    }

    var dataSource = csvItem._tableDataSource;
    var dataset = dataSource.dataset;
    csvItem.colorFunc = function(id) { return [0,0,0,0]; };
    if (dataset.getRowCount() === 0) {
        return;
    }

        //fill in missing tableStyle settings
    var tableStyle = csvItem._tableStyle || {};
    if (!defined(tableStyle.regionType) || !defined(tableStyle.regionVariable)) {
        var result = determineRegionType(dataset, csvItem._regionWmsMap);
        if (!defined(result) || !defined(result.regionType)) {
            return;
        }
        tableStyle.regionVariable = result.regionVariable;
        tableStyle.regionType = result.regionType;
    }
        //change current var if necessary
    if (!defined(tableStyle.dataVariable)) {
        var dataVar = dataset.getDataVariable();
        var varNames = dataset.getDataVariableList();
        if (varNames.indexOf(dataVar) === -1 || dataVar === tableStyle.regionVariable) {
            dataVar = (varNames.indexOf(tableStyle.regionVariable) === 0) ? varNames[1] : varNames[0];
            dataSource.setDataVariable(dataVar);
        }
        tableStyle.dataVariable = dataVar;
    }
        //build a color map if none present
    if (!defined(tableStyle.colorMap)) {
        tableStyle.colorMap = [
            {offset: 0.0, color: 'rgba(239,210,193,1.00)'},
            {offset: 0.25, color: 'rgba(221,139,116,1.0)'},
            {offset: 0.5, color: 'rgba(255,127,46,1.0)'},
            {offset: 0.75, color: 'rgba(255,65,43,1.0)'},
            {offset: 1.0, color: 'rgba(111,0,54,1.0)'}
        ];
        tableStyle.legendTicks = 3;
    }

    console.log(tableStyle);

    return updateTableStyle(csvItem, tableStyle);
}


module.exports = CsvCatalogItem;
