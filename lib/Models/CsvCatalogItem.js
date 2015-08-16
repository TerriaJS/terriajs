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
var WebMapServiceImageryProvider = require('terriajs-cesium/Source/Scene/WebMapServiceImageryProvider');
var WebMapServiceCatalogItem = require('./WebMapServiceCatalogItem');
var WebMercatorTilingScheme = require('terriajs-cesium/Source/Core/WebMercatorTilingScheme');
var when = require('terriajs-cesium/Source/ThirdParty/when');

var CatalogItem = require('./CatalogItem');
//var corsProxy = require('../Core/corsProxy'); // really not used?
var ImageryLayerCatalogItem = require('./ImageryLayerCatalogItem');
var inherit = require('../Core/inherit');
var Metadata = require('./Metadata');
var ModelError = require('./ModelError');
var readText = require('../Core/readText');
var TableDataSource = require('../Map/TableDataSource');
var TileLayerFilter = require('../ThirdParty/TileLayer.Filter');

var CsvDataset = require('./CsvDataset');
var CsvVariable = require('./CsvVariable');

var RegionMapping = require('./RegionMapping');

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
/* For region-mapped files, enable the WMS imagery layer, with recoloring.
*/
CsvCatalogItem.prototype._createImageryProvider = function(time) {
    var imageryProvider = new WebMapServiceImageryProvider({
        url: proxyUrl( this.terria, this._tableStyle.regionProvider.server),
        layers: this._tableStyle.regionProvider.layerName,
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
                var context = getCanvasContext(that, image);
                image = recolorImageWithCanvasContext(context, image, that.colorFunc);
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
                var id = results[i].data.properties[that._tableStyle.regionProvider.regionProp];
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
/* Check if we need to display a new set of points/regions due to the time changing. */
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
    updateRegionMapping(csvItem, csvItem._tableStyle, false);
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
    // If there is specifically a 'lat' and 'lon' column.
    if (!csvItem._tableDataSource.dataset.hasLocationData()) {
        console.log('No lat&lon columns found in csv file - trying to match based on region');
        // ## Consider preserving the regionmapping object for future loads?
        var rm = new RegionMapping(csvItem.terria);
        return rm.init()
        .then(function() {
            return when(addRegionMap(csvItem, rm));
        }).then(function() {
            if (csvItem._regionMapped) {
                finishTableLoad(csvItem);
            } else {
                throw new ModelError({
                    sender: csvItem,
                    title: 'Unable to load CSV file',
                    message: 'We were unable to find any location parameters for latitude and \
                      longitude or to determine a column to use for region mapping.'
                });
            }
            return rm;
        });            
    }
    else {
        finishTableLoad(csvItem);
    }
}


/* Initialise region map properties. */
function addRegionMap(csvItem, regionmaps) {
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
    if (!defined(tableStyle.regionProvider) || !defined(tableStyle.regionVariable)) {
        var result = regionmaps.determineRegionType(dataset); //### Now returns a region (RegionProvider)
        if (!result || !defined(result.regionProvider)) {
            return;
        }
        tableStyle.regionVariable = result.regionVariable;
        tableStyle.regionProvider = result.regionProvider;
    }
    // if the region variable is the first column, then the data variable has to be the second column. 
    if (!defined(tableStyle.dataVariable)) {
        var dataVar = dataset.getDataVariable();
        var varNames = dataset.getDataVariableList();
        if (varNames.indexOf(dataVar) === -1 || dataVar === tableStyle.regionVariable) {
            dataVar = (varNames.indexOf(tableStyle.regionVariable) === 0) ? varNames[1] : varNames[0];
            dataSource.setDataVariable(dataVar);
        }
        tableStyle.dataVariable = dataVar;
    }
    // if no color map is provided through an init file, use this default colour scheme
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

    return updateTableStyle(csvItem, tableStyle);
}

/* Set tableStyle property and redraw */
function updateTableStyle(csvItem, tableStyle) {

    csvItem._tableStyle = tableStyle;

    if (!(csvItem._tableDataSource instanceof TableDataSource)) {
        return;
    }

    csvItem._tableDataSource.setDisplayStyle(csvItem._tableStyle);

    if (!defined(csvItem._tableStyle.regionProvider) || !defined(csvItem._tableStyle.regionVariable)) {
        return;
    }
    var regionProvider = csvItem._tableStyle.regionProvider;
    return regionProvider.loadRegionIDs().then(function(requiredReload) {
        updateRegionMapping(csvItem, tableStyle, requiredReload !== false);
    });
}
//## something not right here
function updateRegionMapping(csvItem, tableStyle, showFeedback) {
    var regionProvider = tableStyle.regionProvider;
    var results = regionProvider.getRegionValues(csvItem._tableDataSource.dataset, tableStyle.regionVariable);
    if (showFeedback) {
        regionProvider.showFeedback(results, tableStyle.regionVariable, csvItem.name, csvItem.terria);
    }

    csvItem.colorFunc = regionProvider.getColorLookupFunc(results.regionValues, csvItem._tableDataSource._mapValue2Color.bind(csvItem._tableDataSource));
    csvItem._regionMapped = true;
    csvItem._redisplay(); // not sure if this is needed - on first load the imagery provider hasn't been set up so does nothing.

}


// Where do these two functions go really?
/* Recolor a raster image pixel by pixel, replacing encoded identifiers with some calculated value. */
function recolorImage(image, colorFunc) {
    var length = image.data.length;  //pixel count * 4
    for (var i = 0; i < length; i += 4) {
        // Region identifiers are encoded in the blue and green channels, with R=0 and A=255
        if (image.data[i+3] < 255 || image.data[i] !== 0) {
            // Set any pixel that is not part of a region completely transparent
            image.data[i+3] = 0;
            continue;
        }
        // Convert the colour of a pixel back into the identifier of the region it belongs to
        var idx = image.data[i+1] * 0x100 + image.data[i+2];
        // Convert that identifier into the data-mapped colour it should display as.
        var clr = colorFunc(idx);
        if (defined(clr)) {
            for (var j = 0; j < 4; j++) {
                image.data[i+j] = clr[j];
            }
        }
        else {
            // This is a region but we don't have data for it, so make it transparent. Possibly should be configurable.
            image.data[i+3] = 0;
        }
        //image.data[i]=128; //###
        //image.data[i+3] = 200;
    }
    return image;
}

function getCanvasContext(csvItem, img) {
    var context = csvItem._canvas2dContext;
    if (!defined(context) || context.canvas.width !== img.width || context.canvas.height !== img.height) {
        var canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;

        context = canvas.getContext("2d");
        csvItem._canvas2dContext = context;
    }
    return context;
}

/* Copy an image to a newly created Canvas, then perform recoloring there. */
function recolorImageWithCanvasContext(context, img, colorFunc) {
    if (!defined(context)) {
        throw new DeveloperError('No context for image recoloring.');
    }

    // Copy the image contents to the canvas
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    context.drawImage(img, 0, 0);
    var image = context.getImageData(0, 0, context.canvas.width, context.canvas.height);
    image = recolorImage(image, colorFunc);
    return image;
}





module.exports = CsvCatalogItem;

// SA1_7dig_11_code (ABS table builder)

