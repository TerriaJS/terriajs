'use strict';

/*global require,L,$*/

var combine = require('../../third_party/cesium/Source/Core/combine');
var defaultValue = require('../../third_party/cesium/Source/Core/defaultValue');
var defined = require('../../third_party/cesium/Source/Core/defined');
var defineProperties = require('../../third_party/cesium/Source/Core/defineProperties');
var DeveloperError = require('../../third_party/cesium/Source/Core/DeveloperError');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');
var loadText = require('../../third_party/cesium/Source/Core/loadText');
var when = require('../../third_party/cesium/Source/ThirdParty/when');
var corsProxy = require('../Core/corsProxy');

var TableDataSource = require('../Map/TableDataSource');
var VarType = require('../Map/VarType');

var Metadata = require('./Metadata');
var ModelError = require('./ModelError');
var CatalogItem = require('./CatalogItem');
var inherit = require('../Core/inherit');
var readText = require('../Core/readText');

var WebMapServiceImageryProvider = require('../../third_party/cesium/Source/Scene/WebMapServiceImageryProvider');
var WebMapServiceCatalogItem = require('./WebMapServiceCatalogItem');
var ImageryLayer = require('../../third_party/cesium/Source/Scene/ImageryLayer');

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
     * Gets or sets the URL from which the {@link CsvCatalogItem#data} was obtained.
     * @type {String}
     */
    this.dataSourceUrl = undefined;

    knockout.track(this, ['url', 'data', 'dataSourceUrl']);
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
     * Gets the Cesium or Leaflet imagery layer object associated with this data source.
     * This property is undefined if the data source is not enabled.
     * @memberOf CsvCatalogItem.prototype
     * @type {Object}
     */
    imageryLayer : {
        get : function() {
            return this._imageryLayer;
        }
    }
});

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
            url : proxyUrl(this.application, this.url),
            layers : this.layers,
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
                    var properties = that.rowProperties(parseInt(id,10));
                    results[0].description = that._tableDataSource.describe(properties);
                }
                return results;
            });
        };

        this._imageryLayer = new ImageryLayer(imageryProvider, {alpha : 0.6} );

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
            layers : this.layers,
            opacity : 0.6
        };
        options = combine(defaultValue(WebMapServiceCatalogItem.defaultParameters), options);

        this._imageryLayer = new L.tileLayer.wms(proxyUrl(this.application, this.url), options);

        var that = this;
        this._imageryLayer.setFilter(function () {
            new L.CanvasFilter(this, {
                channelFilter: function (image) {
                    return recolorImage(image, that.colorFunc);
                }
           }).render();
        });
        this.wmsFeatureInfoFilter = function(result) {
                if (defined(result)) {
                    var properties = result.features[0].properties;
                    var id = properties[that.regionProp];
                    properties = combine(properties, that.rowProperties(parseInt(id,10)));
                    properties.FID = undefined;
                    properties[that.regionProp] = undefined;
                    result.features[0].properties = properties;
                }
                return result;
            };

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

CsvCatalogItem.prototype._rebuild = function() {
    if (defined(this.application.cesium)) {
        this._hideInCesium();
        this._showInCesium();
    }
    else {
        this._hideInLeaflet();
        this._showInLeaflet();
    }
};

function proxyUrl(application, url) {
    if (defined(application.corsProxy) && application.corsProxy.shouldUseProxy(url)) {
        return application.corsProxy.getURL(url);
    }

    return url;
}



//////////////////////////////////////////////////////////////////////////

function loadTable(csvItem, text) {
    csvItem._tableDataSource.loadText(text);

    if (!csvItem._tableDataSource.dataset.hasLocationData()) {
        console.log('No locaton date found in csv file - trying to match based on region');
        csvItem.data = text;
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
                csvItem.legendUrl = csvItem._tableDataSource.getLegendGraphic();
            }
        });
    }
    else {
        csvItem.clock = csvItem._tableDataSource.clock;
        csvItem.rectangle = csvItem._tableDataSource.dataset.getExtent();
        csvItem.legendUrl = csvItem._tableDataSource.getLegendGraphic();
    }
}


//////////////////////////////////////////////////////////////////////////

//Recolor an image using a color function
function recolorImage(image, colorFunc) {
    var length = image.data.length;  //pixel count * 4
    for (var i = 0; i < length; i += 4) {
        if (image.data[i+3] < 255) {
            continue;
        }
        if (image.data[i] === 0) {
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
        "aliases": ['state', 'ste']
    },
    'CED': {
        "name":"region_map:FID_CED_2011_AUST",
        "regionProp": "CED_CODE",
        "aliases": ['ced']
    },
    'SED': {
        "name":"region_map:FID_SED_2011_AUST",
        "regionProp": "SED_CODE",
        "aliases": ['sed']
    },
    'POA': {
        "name":"region_map:FID_POA_2011_AUST",
        "regionProp": "POA_CODE",
        "aliases": ['poa', 'postcode']
    },
    'LGA': {
        "name":"region_map:FID_LGA_2011_AUST",
        "regionProp": "LGA_CODE11",
        "aliases": ['lga']
    },
    'SCC': {
        "name":"region_map:FID_SCC_2011_AUST",
        "regionProp": "SCC_CODE",
        "aliases": ['scc', 'suburb']
    },
    'SA4': {
        "name":"region_map:FID_SA4_2011_AUST",
        "regionProp": "SA4_CODE11",
        "aliases": ['sa4']
    },
    'SA3': {
        "name":"region_map:FID_SA3_2011_AUST",
        "regionProp": "SA3_CODE11",
        "aliases": ['sa3']
    },
    'SA2': {
        "name":"region_map:FID_SA2_2011_AUST",
        "regionProp": "SA2_MAIN11",
        "aliases": ['sa2']
    },
// COMMENTING OUT SA1: it works, but server performance is just too slow to be widely usable
//    'SA1': {
//        "name":"region_map:FID_SA1_2011_AUST",
//        "regionProp": "SA1_7DIG11",
//        "aliases": ['sa1']
//    }
};

//TODO: if we add enum capability and then can work with any unique field
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
            idMap.push(parseInt(obj.member[i][regionDescriptor.regionProp],10));
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

function determineRegionType(dataset) {
    var vars = dataset.getVarList();

    var regionType;
    var idx = -1;
    //try to figure out the region variable
    for (regionType in regionWmsMap) {
        if (regionWmsMap.hasOwnProperty(regionType)) {
            idx = determineRegionVar(vars, regionWmsMap[regionType].aliases);
            if (idx !== -1) {
                break;
            }
        }
    }
    
    //if no match, try to derive regionType from region_id to use native abs census files
    if (idx === -1) {
        var absRegion = 'region_id';
        idx = vars.indexOf(absRegion);
        if (idx === -1) {
            return;
        }
        var code = dataset.getDataValue(absRegion, 0);
        regionType = code.replace(/[0-9]/g, '');
        if (regionWmsMap[regionType] === undefined) {
            return;
        }
        var vals = dataset.getDataValues(absRegion);
        var new_vals = [];
        for (var i = 0; i < vals.length; i++) {
            var id = dataset.getDataValue(absRegion, vals[i]).replace( /^\D+/g, '');
            new_vals.push(parseInt(id,10));
        }

        dataset.variables[absRegion].vals = new_vals;
        dataset.variables[regionType] = dataset.variables[absRegion];
        delete dataset.variables[absRegion];
        vars = dataset.getVarList();
        idx = vars.indexOf(regionType);
    }
    return { idx: idx, regionType: regionType};
}

function createRegionLookupFunc(csvItem) {
    if (!defined(csvItem) || !defined(csvItem._tableDataSource) || !defined(csvItem._tableDataSource.dataset)) {
        return;
    }
    var dataSource = csvItem._tableDataSource;
    var dataset = dataSource.dataset;
    var regionDescriptor = regionWmsMap[csvItem.regionType];
 
    var codes = dataset.getDataValues(csvItem.regionVar);
    var vals = dataset.getDataValues(dataset.getCurrentVariable());
    var ids = regionDescriptor.idMap;
    var lookup = new Array(ids.length);
    // get value for each id
    for (var i = 0; i < codes.length; i++) {
        var id = ids.indexOf(codes[i]);
        lookup[id] = vals[i];
    }
    // set color for each code
    var colors = [];
    for (var idx = dataset.getMinVal(); idx <= dataset.getMaxVal(); idx++) {
        colors[idx] = dataSource._mapValue2Color(idx);
    }
    //   color lookup function used by the region mapper
    csvItem.colorFunc = function(id) {
        return colors[lookup[id]];
    };
    // used to get current variable data
    csvItem.valFunc = function(code) {
        var rowIndex = codes.indexOf(code);
        return vals[rowIndex];
    };
    // used to get all region data properties
    csvItem.rowProperties = function(code) {
        var rowIndex = codes.indexOf(code);
        return dataset.getDataRow(rowIndex);
    };
}

function setRegionVariable(csvItem, regionVar, regionType) {
    if (!(csvItem._tableDataSource instanceof TableDataSource)) {
        return;
    }

    csvItem.regionVar = regionVar;
    var regionDescriptor = regionWmsMap[regionType];
    if (csvItem.regionType !== regionType) {
        csvItem.regionType = regionType;

        csvItem.url = regionServer;
        csvItem.layers = regionDescriptor.name;

        csvItem.regionProp = regionDescriptor.regionProp;
    }
    console.log('Region type:', csvItem.regionType, ', Region var:', csvItem.regionVar);
        
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
    dataset.setCurrentVariable({ variable: newVar});
    createRegionLookupFunc(csvItem);
    
    console.log('Var set to:', newVar);

    csvItem._rebuild();
}

function setRegionColorMap(csvItem, dataColorMap) {
     if (!(csvItem._tableDataSource instanceof TableDataSource)) {
        return;
    }

    csvItem._tableDataSource.setColorGradient(dataColorMap);
    createRegionLookupFunc(csvItem);

    csvItem._rebuild();
}


function addRegionMap(csvItem) {
    if (!(csvItem._tableDataSource instanceof TableDataSource)) {
        return;
    }
    //see if we can do region mapping
    var dataSource = csvItem._tableDataSource;
    var dataset = dataSource.dataset;

    //if csvItem includes style/var info then use that
    if (!defined(csvItem.style) || !defined(csvItem.style.table)) {
        var regionObj = determineRegionType(dataset);
        if (regionObj === undefined) {
            return;
        }
        var idx = regionObj.idx;
        var regionType = regionObj.regionType;

            //change current var if necessary
        var dataVar = dataset.getCurrentVariable();
        var vars = dataset.getVarList();
        if (dataVar === vars[idx]) {
            dataVar = (idx === 0) ? vars[1] : vars[0];
        }
            //set default style if none set
        var style = {line: {}, point: {}, polygon: {}, table: {}};
        style.table.lat = undefined;
        style.table.lon = undefined;
        style.table.alt = undefined;
        style.table.region = vars[idx];
        style.table.regionType = regionType;
        style.table.time = dataset.getVarID(VarType.TIME);
        style.table.data = dataVar;
        style.table.colorMap = [
            {offset: 0.0, color: 'rgba(200,0,0,1.00)'},
            {offset: 0.5, color: 'rgba(200,200,200,1.0)'},
            {offset: 0.5, color: 'rgba(200,200,200,1.0)'},
            {offset: 1.0, color: 'rgba(0,0,200,1.0)'}
        ];
        csvItem.style = style;
    }

    if (defined(csvItem.style.table.colorMap)) {
        dataSource.setColorGradient(csvItem.style.table.colorMap);
    }
    dataSource.setCurrentVariable(csvItem.style.table.data);

    //to make lint happy
    if (false) {
        setRegionColorMap();
        setRegionDataVariable();
    }
    
    //TODO: figure out how sharing works or doesn't
    
    return setRegionVariable(csvItem, csvItem.style.table.region, csvItem.style.table.regionType);
}



module.exports = CsvCatalogItem;
