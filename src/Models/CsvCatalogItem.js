'use strict';

/*global require,L,$*/

var Cartesian2 = require('../../third_party/cesium/Source/Core/Cartesian2');
var CesiumMath = require('../../third_party/cesium/Source/Core/Math');
var clone = require('../../third_party/cesium/Source/Core/clone');
var combine = require('../../third_party/cesium/Source/Core/combine');
var DataSourceClock = require('../../third_party/cesium/Source/DataSources/DataSourceClock');
var defaultValue = require('../../third_party/cesium/Source/Core/defaultValue');
var defined = require('../../third_party/cesium/Source/Core/defined');
var defineProperties = require('../../third_party/cesium/Source/Core/defineProperties');
var DeveloperError = require('../../third_party/cesium/Source/Core/DeveloperError');
var ImageryLayer = require('../../third_party/cesium/Source/Scene/ImageryLayer');
var freezeObject = require('../../third_party/cesium/Source/Core/freezeObject');
var JulianDate = require('../../third_party/cesium/Source/Core/JulianDate');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');
var loadText = require('../../third_party/cesium/Source/Core/loadText');
var Rectangle = require('../../third_party/cesium/Source/Core/Rectangle');
var WebMapServiceImageryProvider = require('../../third_party/cesium/Source/Scene/WebMapServiceImageryProvider');
var WebMapServiceCatalogItem = require('./WebMapServiceCatalogItem');
var WebMercatorProjection = require('../../third_party/cesium/Source/Core/WebMercatorProjection');
var WebMercatorTilingScheme = require('../../third_party/cesium/Source/Core/WebMercatorTilingScheme');
var when = require('../../third_party/cesium/Source/ThirdParty/when');

var CatalogItem = require('./CatalogItem');
var corsProxy = require('../Core/corsProxy');
var inherit = require('../Core/inherit');
var Metadata = require('./Metadata');
var ModelError = require('./ModelError');
var readText = require('../Core/readText');
var TableDataSource = require('../Map/TableDataSource');

/**
 * A {@link CatalogItem} representing CSV data.
 *
 * @alias CsvCatalogItem
 * @constructor
 * @extends CatalogItem
 * 
 * @param {Application} application The application.
 * @param {String} [url] The URL from which to retrieve the CSV data.
 */
var CsvCatalogItem = function(application, url) {
    CatalogItem.call(this, application);

    this._tableDataSource = undefined;
    this._clock = undefined;
    this._clockTickUnsubscribe = undefined;

    this._regionMapped = false;

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
     * Gets or sets the tableStyle object
     * @type {Object}
     */
    this.tableStyle = undefined;

   /**
     * Gets or sets the opacity (alpha) of the data item, where 0.0 is fully transparent and 1.0 is
     * fully opaque.  This property is observable.
     * @type {Number}
     * @default 0.6
     */
    this.opacity = 0.6;

    knockout.track(this, ['url', 'data', 'tableStyle', 'opacity', '_clock']);

    knockout.getObservable(this, 'opacity').subscribe(function(newValue) {
        updateOpacity(this);
    }, this);

    delete this.__knockoutObservables.clock;
    knockout.defineProperty(this, 'clock', {
        get : function() {
            return this._clock;
        },
        set : function(value) {
            this._clock = value;
        }
    });

    // Subscribe to isShown changing and add/remove the clock tick subscription as necessary.
    knockout.getObservable(this, 'isShown').subscribe(function() {
        updateClockSubscription(this);
    }, this);

    knockout.getObservable(this, 'clock').subscribe(function() {
        updateClockSubscription(this);
    }, this);
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
            return this._regionMapped;
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
CsvCatalogItem.data is expected to be a Blob, File, or String, but it was not any of these. \
This may indicate a bug in National Map or incorrect use of the National Map API. \
If you believe it is a bug in National Map, please report it by emailing \
<a href="mailto:nationalmap@lists.nicta.com.au">nationalmap@lists.nicta.com.au</a>.'
                });
            }
        });
    } else if (defined(that.url)) {
        return loadText(proxyUrl(that.application, that.url)).then(function(text) {
            return loadTable(that, text);
        }).otherwise(function(e) {
            throw new ModelError({
                sender: that,
                title: 'Could not load CSV file',
                message: '\
An error occurred while retrieving CSV data from the provided link.'
            });
        });
    }
};

CsvCatalogItem.prototype._enableInCesium = function() {
};

CsvCatalogItem.prototype._disableInCesium = function() {
};

CsvCatalogItem.prototype._showInCesium = function() {

    if (!this._regionMapped) {
        var dataSources = this.application.dataSources;
        if (dataSources.contains(this._tableDataSource)) {
            throw new DeveloperError('This data source is already shown.');
        }

        dataSources.add(this._tableDataSource);
    }
    else {
        var scene = this.application.cesium.scene;

        var imageryProvider = new WebMapServiceImageryProvider({
            url : proxyUrl(this.application, this.regionServer),
            layers : this.regionLayers,
            parameters : WebMapServiceCatalogItem.defaultParameters
        });

        imageryProvider.base_requestImage = imageryProvider.requestImage;
        var that = this;
        imageryProvider.requestImage = function(x, y, level) {
            var imagePromise = imageryProvider.base_requestImage(x, y, level);
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
            //remap image layer featurePicking Func
        imageryProvider.base_pickFeatures = imageryProvider.pickFeatures;
        imageryProvider.pickFeatures = function(x, y, level, longitude, latitude) {
            var featurePromise = imageryProvider.base_pickFeatures(x, y, level, longitude, latitude);
            if (!defined(featurePromise)) {
                return featurePromise;
            }
            
            return when(featurePromise, function(results) {
                if (defined(results)) {
                    var id = results[0].data.properties[that.regionProp];
                    var properties = that.rowProperties(id);
                    results[0].description = that._tableDataSource.describe(properties);
                }
                return results;
            });
        };

        this._imageryLayer = new ImageryLayer(imageryProvider, {alpha : this.opacity} );

        scene.imageryLayers.add(this._imageryLayer);

    }
};

CsvCatalogItem.prototype._hideInCesium = function() {

    if (!this._regionMapped) {
        var dataSources = this.application.dataSources;
        if (!dataSources.contains(this._tableDataSource)) {
            throw new DeveloperError('This data source is not shown.');
        }
        
        dataSources.remove(this._tableDataSource, false);
    }
    else {
        if (!defined(this._imageryLayer)) {
            throw new DeveloperError('This data source is not enabled.');
        }
        
        var scene = this.application.cesium.scene;
        scene.imageryLayers.remove(this._imageryLayer);
        this._imageryLayer = undefined;
    }
};

CsvCatalogItem.prototype._enableInLeaflet = function() {
};

CsvCatalogItem.prototype._disableInLeaflet = function() {
};

CsvCatalogItem.prototype._showInLeaflet = function() {

    if (!this._regionMapped) {
        this._showInCesium();
    }
    else {
        if (defined(this._imageryLayer)) {
            throw new DeveloperError('This data source is already enabled.');
        }
        
        var map = this.application.leaflet.map;
        
        var options = {
            layers : this.regionLayers,
            opacity : this.opacity
        };
        options = combine(defaultValue(WebMapServiceCatalogItem.defaultParameters), options);

        this._imageryLayer = new L.tileLayer.wms(proxyUrl(this.application, this.regionServer), options);

        var that = this;
        this._imageryLayer.setFilter(function () {
            new L.CanvasFilter(this, {
                channelFilter: function (image) {
                    return recolorImage(image, that.colorFunc);
                }
           }).render();
        });

        map.addLayer(this._imageryLayer);
    }
};

CsvCatalogItem.prototype._hideInLeaflet = function() {
    if (!this._regionMapped) {
        this._hideInCesium();
    }
    else {
        if (!defined(this._imageryLayer)) {
            throw new DeveloperError('This data source is not enabled.');
        }

        var map = this.application.leaflet.map;
        map.removeLayer(this._imageryLayer);
        this._imageryLayer = undefined;
    }
};

CsvCatalogItem.prototype.pickFeaturesInLeaflet = function(mapExtent, mapWidth, mapHeight, pickX, pickY) {
    if (!this._regionMapped) {
        return undefined;
    }

    var projection = new WebMercatorProjection();
    var sw = projection.project(Rectangle.southwest(mapExtent));
    var ne = projection.project(Rectangle.northeast(mapExtent));

    var tilingScheme = new WebMercatorTilingScheme({
        rectangleSouthwestInMeters: sw,
        rectangleNortheastInMeters: ne
    });

    // Compute the longitude and latitude of the pick location.
    var x = CesiumMath.lerp(sw.x, ne.x, pickX / (mapWidth - 1));
    var y = CesiumMath.lerp(ne.y, sw.y, pickY / (mapHeight - 1));

    var ll = projection.unproject(new Cartesian2(x, y));

    // Use a Cesium imagery provider to pick features.
    var imageryProvider = new WebMapServiceImageryProvider({
        url : proxyUrl(this.application, this.regionServer),
        layers : this.regionLayers,
        tilingScheme : tilingScheme,
        tileWidth : mapWidth,
        tileHeight : mapHeight
    });

    var pickFeaturesPromise = imageryProvider.pickFeatures(0, 0, 0, ll.longitude, ll.latitude);
    if (!defined(pickFeaturesPromise)) {
        return pickFeaturesPromise;
    }

    var that = this;
    return pickFeaturesPromise.then(function(results) {
        if (defined(results)) {
            var id = results[0].data.properties[that.regionProp];
            var properties = that.rowProperties(id);
            results[0].description = that._tableDataSource.describe(properties);
        }
        return results;
    });
};

function proxyUrl(application, url) {
    if (defined(application.corsProxy) && application.corsProxy.shouldUseProxy(url)) {
        return application.corsProxy.getURL(url);
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

        csvItem.application.currentViewer.notifyRepaintRequired();
    }
}

CsvCatalogItem.prototype._redisplay = function() {
    if (defined(this._imageryLayer)) {
        if (defined(this.application.cesium)) {
            this._hideInCesium();
            this._showInCesium();
        } else {
            this._hideInLeaflet();
            this._showInLeaflet();
        }
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
            csvItem._clockTickSubscription = csvItem.application.clock.onTick.addEventListener(onClockTick.bind(undefined, csvItem));
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

function createRegionMappingClock(csvItem) {
    if (defined(csvItem.clock)) {
        return;
    }
    var newClock;
    var dataSource = csvItem._tableDataSource;
    if (defined(dataSource) && defined(dataSource.dataset) && dataSource.dataset.hasTimeData()) {
        var startTime = dataSource.dataset.getMinTime();
        var stopTime = dataSource.dataset.getMaxTime();
        var totalDuration = JulianDate.secondsDifference(stopTime, startTime);

        newClock = new DataSourceClock();
        newClock.startTime = startTime;
        newClock.stopTime = stopTime;
        newClock.currentTime = startTime;
        newClock.multiplier = totalDuration / 60;
    }
    return newClock;
}

//////////////////////////////////////////////////////////////////////////

function loadTable(csvItem, text) {

    csvItem._tableDataSource.loadText(text);
    if (defined(csvItem.tableStyle)) {
        csvItem._tableDataSource.maxDisplayValue = csvItem._maxDisplayValue;
        csvItem._tableDataSource.minDisplayValue = csvItem._minDisplayValue;
        csvItem._tableDataSource.setTableStyle(csvItem.tableStyle);
    }


    if (!csvItem._tableDataSource.dataset.hasLocationData()) {
        console.log('No locaton date found in csv file - trying to match based on region');
        return when(addRegionMap(csvItem), function() {
            if (csvItem._regionMapped !== true) {
                throw new ModelError({
                    sender: csvItem,
                    title: 'Could not load CSV file',
                    message: '\
Could not find any location parameters for latitude and longitude and was not able to determine \
a region mapping column.'
                });
            }
            else {
                csvItem.clock = createRegionMappingClock(csvItem);
                csvItem.legendUrl = csvItem._tableDataSource.getLegendGraphic();
                csvItem.application.currentViewer.notifyRepaintRequired();
            }
        });
    }
    else {
        csvItem.clock = csvItem._tableDataSource.clock;
        csvItem.rectangle = csvItem._tableDataSource.dataset.getExtent();
        csvItem.legendUrl = csvItem._tableDataSource.getLegendGraphic();
        csvItem.application.currentViewer.notifyRepaintRequired();
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


var regionServer = 'http://geoserver-nm.nicta.com.au/region_map/ows';
var regionWmsMap = {
    'STE': {
        "name":"region_map:FID_STE_2011_AUST",
        "regionProp": "STE_CODE11",
        "aliases": ['state', 'ste'],
        "digits": 1
    },
    'SA4': {
        "name":"region_map:FID_SA4_2011_AUST",
        "regionProp": "SA4_CODE11",
        "aliases": ['sa4'],
        "digits": 3
    },
    'SA3': {
        "name":"region_map:FID_SA3_2011_AUST",
        "regionProp": "SA3_CODE11",
        "aliases": ['sa3'],
        "digits": 5
    },
    'SA2': {
        "name":"region_map:FID_SA2_2011_AUST",
        "regionProp": "SA2_MAIN11",
        "aliases": ['sa2'],
        "digits": 9
    },
// COMMENTING OUT SA1: it works, but server performance is just too slow to be widely usable
//    'SA1': {
//        "name":"region_map:FID_SA1_2011_AUST",
//        "regionProp": "SA1_7DIG11",
//        "aliases": ['sa1'],
//        "digits": 11
//    },
    'POA': {
        "name":"region_map:FID_POA_2011_AUST",
        "regionProp": "POA_CODE",
        "aliases": ['poa', 'postcode'],
        "digits": 4
    },
    'CED': {
        "name":"region_map:FID_CED_2011_AUST",
        "regionProp": "CED_CODE",
        "aliases": ['ced'],
        "digits": 3
    },
    'SED': {
        "name":"region_map:FID_SED_2011_AUST",
        "regionProp": "SED_CODE",
        "aliases": ['sed'],
        "digits": 5
    },
    'LGA': {
        "name":"region_map:FID_LGA_2011_AUST",
        "regionProp": "LGA_CODE11",
        "aliases": ['lga'],
        "digits": 5
    },
    'SSC': {
        "name":"region_map:FID_SCC_2011_AUST",
        "regionProp": "SSC_CODE",
        "aliases": ['ssc', 'suburb'],
        "digits": 5
    },
    'CNT2': {
        "name":"region_map:FID_TM_WORLD_BORDERS",
        "regionProp": "ISO2",
        "aliases": ['iso2'],
        "digits": 2
    },
    'CNT3': {
        "name":"region_map:FID_TM_WORLD_BORDERS",
        "regionProp": "ISO3",
        "aliases": ['country', 'iso3'],
        "digits": 3
    }
};


function loadRegionIDs(regionDescriptor) {
    if (defined(regionDescriptor.idMap)) {
        return;
    }

    var url = regionServer + '?service=wfs&version=2.0&request=getPropertyValue';
    url += '&typenames=' + regionDescriptor.name;
    url += '&valueReference=' + regionDescriptor.regionProp;
    url = corsProxy.getURL(url);
    return loadText(url).then(function (text) { 
        var obj = $.xml2json(text);

        if (!defined(obj.member)) {
            return;
        }

        var idMap = [];
            //this turns ids into numbers since they are that way in table data
        for (var i = 0; i < obj.member.length; i++) {
            idMap.push(obj.member[i][regionDescriptor.regionProp]);
        }
        regionDescriptor.idMap = idMap;
    }, function(err) {
        console.log(err);
    });
}

function determineRegionVar(vars, aliases) {
    for (var i = 0; i < vars.length; i++) {
        var varName = vars[i].toLowerCase();
        for (var j = 0; j < aliases.length; j++) {
            if (varName.substring(0,aliases[j].length) === aliases[j]) {
                return i;
            }
        }
    }
    return -1;
}


//TODO: determine enum or value code here rather than separate region records
function determineRegionType(dataset) {
    var vars = dataset.getVarList();

    var regionType, regionVariable, region;
    //try to figure out the region variable
    for (region in regionWmsMap) {
        if (regionWmsMap.hasOwnProperty(region)) {
            var idx = determineRegionVar(vars, regionWmsMap[region].aliases);
            if (idx !== -1) {
                regionType = region;
                regionVariable = vars[idx];
                break;
            }
        }
    }
    
    //if no match, try to derive regionType from region_id to use native abs census files
    if (!defined(regionType)) {
        var absRegion = 'region_id';
        if (vars.indexOf(absRegion) === -1) {
            return;
        }
        var code = dataset.getDataValue(absRegion, 0);
        if (typeof code === 'string') {
            region = code.replace(/[0-9]/g, '');
            if (!defined(regionWmsMap[region])) {
                return;
            }
            regionType = region;
            var vals = dataset.getDataValues(absRegion);
            var new_vals = [];
            for (var i = 0; i < vals.length; i++) {
                var id = dataset.getDataValue(absRegion, vals[i]).replace( /^\D+/g, '');
                new_vals.push(parseInt(id,10));
            }
            dataset.variables[absRegion].vals = new_vals;
            dataset.variables[absRegion].enumList = undefined;
        } else {
            var digits = code.toString().length;
            for (region in regionWmsMap) {
                if (regionWmsMap.hasOwnProperty(region)) {
                    if (digits === regionWmsMap[region].digits) {
                        regionType = region;
                        break;
                    }
                }
            }
        }
        if (defined(regionType)) {
            regionVariable = regionType;
            dataset.variables[regionType] = dataset.variables[absRegion];
            delete dataset.variables[absRegion];
        }
    }
    return { regionType: regionType, regionVariable: regionVariable };
}

function createRegionLookupFunc(csvItem) {
    if (!defined(csvItem) || !defined(csvItem._tableDataSource) || !defined(csvItem._tableDataSource.dataset)) {
        return;
    }
    var dataSource = csvItem._tableDataSource;
    var dataset = dataSource.dataset;
    var regionDescriptor = regionWmsMap[csvItem.regionType];
 
    var numericCodes = false;
    var codes = dataset.getEnumValues(csvItem.regionVariable);
    var ids = regionDescriptor.idMap;
    if (!defined(codes)) {
        numericCodes = true;
        codes = dataset.getDataValues(csvItem.regionVariable);
        for (var n = 0; n < ids.length; n++) {
            ids[n] = parseInt(ids[n],10);
        }
    }
    var vals = dataset.getDataValues(dataset.getDataVariable());
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
                colors[index] = dataSource._mapValue2Color(vals[row]);
            }
        }
    } else {
        for (var i = 0; i < csvItem.recs.length; i++) {
            row  = csvItem.recs[i];
            codeMap[i] = codes[row];
            index = ids.indexOf(codes[row]);
            if (index >= 0 && colors[index][3] === 0) {
                colors[index] = dataSource._mapValue2Color(vals[row]);
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

function setRegionVariable(csvItem, regionVariable, regionType) {
    if (!(csvItem._tableDataSource instanceof TableDataSource)) {
        return;
    }

    csvItem.regionVariable = regionVariable;
    var regionDescriptor = regionWmsMap[regionType];
    if (csvItem.regionType !== regionType) {
        csvItem.regionType = regionType;

        csvItem.regionServer = regionServer;
        csvItem.regionLayers = regionDescriptor.name;

        csvItem.regionProp = regionDescriptor.regionProp;
    }
    console.log('Region type:', csvItem.regionType, ', Region var:', csvItem.regionVariable);
        
    return when(loadRegionIDs(regionDescriptor), function() {
        createRegionLookupFunc(csvItem);
        csvItem._regionMapped = true;
    });
}


function setRegionDataVariable(csvItem, newVar) {
    if (!(csvItem._tableDataSource instanceof TableDataSource)) {
        return;
    }

    var dataSource = csvItem._tableDataSource;
    var dataset = dataSource.dataset;
    dataset.setDataVariable(newVar);
    createRegionLookupFunc(csvItem);
    
    console.log('Var set to:', newVar);

    csvItem._redisplay();
}

function setRegionColorMap(csvItem, dataColorMap) {
     if (!(csvItem._tableDataSource instanceof TableDataSource)) {
        return;
    }

    csvItem._tableDataSource.setColorGradient(dataColorMap);
    createRegionLookupFunc(csvItem);

    csvItem._redisplay();
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
    var tableStyle = csvItem.tableStyle || {};
    if (!defined(tableStyle.regionType) || !defined(tableStyle.regionVariable)) {
        var result = determineRegionType(dataset);
        if (!defined(result) || !defined(result.regionType)) {
            return;
        }
        tableStyle.regionVariable = result.regionVariable;
        tableStyle.regionType = result.regionType;
    }
        //change current var if necessary
    if (!defined(tableStyle.dataVariable)) {
        var dataVar = dataset.getDataVariable();
        var vars = dataset.getVarList();
        if (vars.indexOf(dataVar) === -1 || dataVar === tableStyle.regionVariable) {
            tableStyle.dataVariable = (vars.indexOf(tableStyle.regionVariable) === 0) ? vars[1] : vars[0];
        }
        tableStyle.dataVariable = dataVar;
        dataSource.setDataVariable(dataVar);
    }
        //build an interesting color map if none present
    if (!defined(tableStyle.colorMap)) {
        tableStyle.colorMap = [
            {offset: 0.0, color: 'rgba(239,210,193,1.00)'},
            {offset: 0.25, color: 'rgba(221,139,116,1.0)'},
            {offset: 0.5, color: 'rgba(255,127,46,1.0)'},
            {offset: 0.75, color: 'rgba(255,65,43,1.0)'},
            {offset: 1.0, color: 'rgba(111,0,54,1.0)'}
        ];
        dataSource.setColorGradient(tableStyle.colorMap);
    }

    csvItem.tableStyle = tableStyle;

    //to keep lint happy
    if (false) {
        setRegionColorMap();
        setRegionDataVariable();
    }
    
    //TODO: figure out how sharing works or doesn't
    
    return setRegionVariable(csvItem, tableStyle.regionVariable, tableStyle.regionType);
}



module.exports = CsvCatalogItem;
