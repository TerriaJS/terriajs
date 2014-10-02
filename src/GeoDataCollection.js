/*global require,L,URI,$,toGeoJSON,proj4,proj4_epsg,alert,confirm*/

"use strict";

var corsProxy = require('./corsProxy');
var TableDataSource = require('./TableDataSource');
var VarType = require('./VarType');
var GeoData = require('./GeoData');
var readText = require('./readText');

var PopupMessage = require('./viewer/PopupMessage');

var ArcGisMapServerImageryProvider = require('../third_party/cesium/Source/Scene/ArcGisMapServerImageryProvider');
var CesiumMath = require('../third_party/cesium/Source/Core/Math');
var Color = require('../third_party/cesium/Source/Core/Color');
var ColorMaterialProperty = require('../third_party/cesium/Source/DataSources/ColorMaterialProperty');
var ConstantProperty = require('../third_party/cesium/Source/DataSources/ConstantProperty');
var CzmlDataSource = require('../third_party/cesium/Source/DataSources/CzmlDataSource');
var DataSourceCollection = require('../third_party/cesium/Source/DataSources/DataSourceCollection');
var defaultValue = require('../third_party/cesium/Source/Core/defaultValue');
var defined = require('../third_party/cesium/Source/Core/defined');
var DeveloperError = require('../third_party/cesium/Source/Core/DeveloperError');
var Ellipsoid = require('../third_party/cesium/Source/Core/Ellipsoid');
var CesiumEvent = require('../third_party/cesium/Source/Core/Event');
var FeatureDetection = require('../third_party/cesium/Source/Core/FeatureDetection');
var GeoJsonDataSource = require('../third_party/cesium/Source/DataSources/GeoJsonDataSource');
var JulianDate = require('../third_party/cesium/Source/Core/JulianDate');
var KmlDataSource = require('../third_party/cesium/Source/DataSources/KmlDataSource');
var loadBlob = require('../third_party/cesium/Source/Core/loadBlob');
var loadJson = require('../third_party/cesium/Source/Core/loadJson');
var loadText = require('../third_party/cesium/Source/Core/loadText');
var PointGraphics = require('../third_party/cesium/Source/DataSources/PointGraphics');
var PolygonGraphics = require('../third_party/cesium/Source/DataSources/PolygonGraphics');
var PolylineGraphics = require('../third_party/cesium/Source/DataSources/PolylineGraphics');
var Rectangle = require('../third_party/cesium/Source/Core/Rectangle');
var WebMapServiceImageryProvider = require('../third_party/cesium/Source/Scene/WebMapServiceImageryProvider');
var WebMercatorTilingScheme = require('../third_party/cesium/Source/Core/WebMercatorTilingScheme');
var when = require('../third_party/cesium/Source/ThirdParty/when');

/**
* This class is loosely based on the cesium DataSource/DataSourceCollection
* model for feature data loading or converting to load each dataset as a
* GeoJsonDataCollection in Cesium or a GeoJson Layer in Leaflet.  
* 
* The WMS data, the url is passed to the Cesium and Leaflet WMS imagery layers.
*
* This also supports a TableDataSourceCollection which will be an addition to
* Cesium.
*
* @alias GeoDataCollection
* @internalConstructor
* @constructor
*/
var GeoDataCollection = function() {
    
    this.layers = [];
    
    var that = this;
    
    this.scene = undefined;
    this.map = undefined;

    //Init the dataSourceCollection
    this.dataSourceCollection = new DataSourceCollection();
    
    this.GeoDataAdded = new CesiumEvent();
    this.GeoDataRemoved = new CesiumEvent();
    this.GeoDataReordered = new CesiumEvent();
    this.ViewerChanged = new CesiumEvent();
    this.ShareRequest = new CesiumEvent();

    //load list of available services for National Map
    this.services = [];
};


/**
* Set the viewer to use with the geodata collection.
*
* @param {Object} options Object with the following properties:
* @param {Object} [options.scene] Set to Cesium Viewer scene object if Cesium Viewer.
* @param {Object} [options.map] Set to Leaflet map object if Leaflet Viewer.
*/
GeoDataCollection.prototype.setViewer = function(options) {
      //If A cesium scene present then this is in cesium globe
    this.scene = options.scene;
    this.map = options.map;

    if (this.scene) {
        this.imageryLayersCollection = this.scene.globe.imageryLayers;
    }
    this.ViewerChanged.raiseEvent(this, options);
    
    //re-request all the layers on the new map
    for (var i = 0; i < this.layers.length; i++) {
        if (this.layers[i].type === 'WMS') {
            this.layers[i].skip = true;
            this.sendLayerRequest(this.layers[i]);
        }
    }
};


GeoDataCollection.prototype._getUniqueLayerName = function(name) {
    var base_name = name;
    var matches = true;
    var n = 1;
    while (matches) {
        matches = false;
        for (var i = 0; i < this.layers.length; i++) {
            if (this.layers[i].name === name) {
                matches = true;
            }
        }
        if (matches) {
            name = base_name + ' (' + n + ')';
            n++;
        }
    }
    return name;
};

function isFeatureLayer(collection, layer) {
    if (defined(layer.dataSource)) {
        return true;
    } else if (!collection.map) {
        return false;
    } else if (layer.primitive instanceof L.GeoJSON) {
        return true;
    }
}


function loadErrorResponse(err) {
    var msg = new PopupMessage({
        container : document.body,
        title : 'HTTP Error ' + (defined(err.statusCode) ? err.statusCode : ''),
        message : '\
An error occurred while accessing the web service link and the data cannot be shown.  If you entered the link manually, please verify that the link is correct. \
<p>This error may also indicate that the server does not support <a href="http://enable-cors.org/" target="_blank">CORS</a>.  If this is your \
server, verify that CORS is enabled and enable it if it is not.  If you do not control the server, \
please contact the administrator of the server and ask them to enable CORS.  Or, contact the National \
Map team by emailing <a href="mailto:nationalmap@lists.nicta.com.au">nationalmap@lists.nicta.com.au</a> \
and ask us to add this server to the list of non-CORS-supporting servers that may be proxied by \
National Map itself.</p>'
    });
}

/**
* Add a new geodata item
*
* @param {Object} layer The layer to move.
*
* @returns {Object} The new layer added to the collection.
*/
GeoDataCollection.prototype.add = function(layer) {
    if (layer.skip) {
        layer.skip = false;
        return layer;
    }
    layer.name = this._getUniqueLayerName(layer.name);

    // Feature layers go on the bottom (which is the top in display order), then map layers go above that.
    var firstFeatureLayer = this.layers.length;
    for (var i = 0; i < this.layers.length; ++i) {
        if (!this.isLayerMovable(this.layers[i])) {
            firstFeatureLayer = i;
            break;
        }
    }

    if (!this.isLayerMovable(this, layer)) {
        this.layers.push(layer);
    } else {
        this.layers.splice(firstFeatureLayer, 0, layer);
    }

    // Force Leaflet to display the layers in the intended order.
    if (defined(this.map)) {
        for (var layerIndex = 0; layerIndex < this.layers.length; ++layerIndex) {
            var currentLayer = this.layers[layerIndex];
            if (defined(currentLayer.primitive)) {
                currentLayer.primitive.setZIndex(layerIndex + 100);
            }
        }
    }

    this.GeoDataAdded.raiseEvent(this, layer);
    return layer;
};

GeoDataCollection.prototype.isLayerMovable = function(layer) {
    return !isFeatureLayer(this, layer);
};

/**
 * Moves the given layer up so that it is displayed above the layers below it.
 * This effectively moves the layer later in the layers array.
 *
 * @param {Object} layer The layer to move.
 */
GeoDataCollection.prototype.moveUp = function(layer) {
    // Feature layers cannot be reordered.
    if (!this.isLayerMovable(layer)) {
        return;
    }

    var currentIndex = this.layers.indexOf(layer);
    var newIndex = currentIndex + 1;
    if (newIndex >= this.layers.length) {
        return;
    }

    var layerAbove = this.layers[newIndex];

    // We can't reorder past a feature layer.
    if (!this.isLayerMovable(layerAbove)) {
        return;
    }

    this.layers[currentIndex] = layerAbove;
    this.layers[newIndex] = layer;

    if (!defined(this.map)) {
        var layerIndex = this.imageryLayersCollection.indexOf(layer.primitive);
        var aboveIndex = this.imageryLayersCollection.indexOf(layerAbove.primitive);
        while (layerIndex !== -1 && aboveIndex !== -1 && aboveIndex > layerIndex) {
            this.imageryLayersCollection.raise(layer.primitive);
            layerIndex = this.imageryLayersCollection.indexOf(layer.primitive);
            aboveIndex = this.imageryLayersCollection.indexOf(layerAbove.primitive);
        }
    } else {
        for (var i = 0; i < this.layers.length; ++i) {
            var currentLayer = this.layers[i];
            if (defined(currentLayer.primitive)) {
                currentLayer.primitive.setZIndex(i + 100);
            }
        }
    }

    this.GeoDataReordered.raiseEvent(this);
};

/**
 * Moves the given layer down so that it is displayed under the layers above it.
 * This effectively moves the layer earlier in the layers array.
 *
 * @param {Object} layer The layer to move.
 */
GeoDataCollection.prototype.moveDown = function(layer) {
    // Feature layers cannot be reordered.
    if (!this.isLayerMovable(layer)) {
        return;
    }

    var currentIndex = this.layers.indexOf(layer);
    var newIndex = currentIndex - 1;
    if (newIndex < 0) {
        return;
    }

    var layerBelow = this.layers[newIndex];

    // We can't reorder past a feature layer.
    if (!this.isLayerMovable(layerBelow)) {
        return;
    }

    this.layers[currentIndex] = layerBelow;
    this.layers[newIndex] = layer;

    if (!defined(this.map)) {
        var layerIndex = this.imageryLayersCollection.indexOf(layer.primitive);
        var belowIndex = this.imageryLayersCollection.indexOf(layerBelow.primitive);
        while (layerIndex !== -1 && belowIndex !== -1 && belowIndex < layerIndex) {
            this.imageryLayersCollection.lower(layer.primitive);
            layerIndex = this.imageryLayersCollection.indexOf(layer.primitive);
            belowIndex = this.imageryLayersCollection.indexOf(layerBelow.primitive);
        }
    } else {
        for (var i = 0; i < this.layers.length; ++i) {
            var currentLayer = this.layers[i];
            if (defined(currentLayer.primitive)) {
                currentLayer.primitive.setZIndex(i + 100);
            }
        }
    }

    this.GeoDataReordered.raiseEvent(this);
};

/**
* Get a geodata item based on an id.
*
* @param {Integer} id id of the layer to return
*
* @returns {Object} A layer from the collection.
*/
GeoDataCollection.prototype.get = function(id) {
    return this.layers[id];
};

/**
* Remove a geodata item based on an id
*
* @param {Integer} id id of the layer to return
*/
GeoDataCollection.prototype.remove = function(id) {
    var layer = this.get(id);
    if (layer === undefined) {
        console.log('ERROR: layer not found:', id);
        return;
    }
    if (layer.dataSource) {
        if (this.dataSourceCollection.contains(layer.dataSource)) {
            this.dataSourceCollection.remove(layer.dataSource);
        }
        else if (defined(layer.dataSource.destroy)) {
            layer.dataSource.destroy();
        }
    }
    else if (this.map === undefined) {
        this.imageryLayersCollection.remove(layer.primitive);
    }
    else {
        this.map.removeLayer(layer.primitive);
    }
    
    this.layers.splice(id, 1);
    this.GeoDataRemoved.raiseEvent(this, layer);
};

GeoDataCollection.prototype.removeAll = function() {
    for (var i = this.layers.length - 1; i >= 0; --i) {
        this.remove(i);
    }
};

/**
* Set whether to show a geodata item based on id
*
 * @param {Object} layer The layer to be processed.
 * @param {Boolean} val The setting of the show parameter.
*
*/
GeoDataCollection.prototype.show = function(layer, val) {
    if (layer === undefined) {
        console.log('ERROR: layer not found.');
        return;
    }
    layer.show = val;
    if (layer.dataSource) {
        if (val) {
            this.dataSourceCollection.add(layer.dataSource);
        }
        else {
            this.dataSourceCollection.remove(layer.dataSource, false);
        }
    }
    else if (this.map === undefined) {
        if (layer.primitive !== undefined) {
            layer.primitive.show = val;
        }
    }
    else {
        if (val) {
            this.map.addLayer(layer.primitive);
        }
        else {
            this.map.removeLayer(layer.primitive);
        }
    }
};


/**
* Check the server health for a layer
*
 * @param {Object} layer The layer to be checked.
 * @param {Function} succeed Function to carry out if server OK
 * @param {Function} fail Function to carry out if server returns an err
*
*/
GeoDataCollection.prototype.checkServerHealth = function(layer, succeed, fail) {
    if (layer.type === 'DATA') {
        if (defined(succeed)) {
            succeed(layer);
        }
        return;
    }
    // pinging the service url to see if it's alive
    var paramIdx = layer.url.indexOf('?');
    var url = (paramIdx !== -1) ? layer.url.substring(0, paramIdx) : layer.url;
    if (corsProxy.shouldUseProxy(url)) {
        url = corsProxy.getURL(url);
    }
    var that = this;
    loadText(url).then(function (text) {
        if (defined(succeed)) {
            succeed(layer);
        }
    }, function(err) {
        if (defined(fail)) {
            fail(layer);
        }
        loadErrorResponse(err);
    });
};


// -------------------------------------------
// Services for GeoDataCollection
// -------------------------------------------
/**
 * Adds a set of services to the available GeodataCollection services.
 *
 * @param {Object} services An array of JSON service objects to add to the list.
 *
 */
GeoDataCollection.prototype.addServices = function(services) {
    if (services === undefined) {
        return;
    }

    for (var i = 0; i < services.length; i++) {
        console.log('added service for:', services[i].name);
        this.services.push(services[i]);
    }
};

/**
 * Returns an array of available services
 *
 * @returns {Array} an array of available services as JSON objects.
 */
GeoDataCollection.prototype.getServices = function() {
    return this.services;
};

// -------------------------------------------
// Handle loading and sharing visualizations
// -------------------------------------------
//stringify and remove cyclical links in the layers
GeoDataCollection.prototype._stringify = function() {
    var str_layers = [];
    for (var i = 0; i < this.layers.length; i++) {
        var layer = this.layers[i];
        if (layer.show === false) {
            console.log('Skipping hidden layer in share request:', layer.name);
            continue;
        }
        var url = defined(layer.shareUrl) ? layer.shareUrl : layer.url;
        if (!defined(url) || url === '') {
            console.log('Skipping d+d layer in share request:', layer.name);
            continue;
        }
        var obj = {name: layer.name, type: layer.type, style: layer.style,
                   url: url, extent: layer.extent};
        str_layers.push(obj);
    }
    return JSON.stringify(str_layers);
};

// Parse out the unstringified objects and turn them into Cesium objects
GeoDataCollection.prototype._parseObject = function(obj) {
    for (var p in obj) {
        if (p === 'west') {
            return new Rectangle(obj.west, obj.south, obj.east, obj.north);
        }
        else if (p === 'red') {
            return new Color(obj.red, obj.green, obj.blue, obj.alpha);
        }
        else if (typeof obj[p] === 'object') {
            obj[p] = this._parseObject(obj[p]);
        }
    }
    return obj;
};

// Parse the string back into a layer collection
GeoDataCollection.prototype._parseLayers = function(str_layers) {
    var layers = JSON.parse(str_layers);
    var obj_layers = [];
    for (var i = 0; i < layers.length; i++) {
        var layer = layers[i];
        for (var p in layer) {
            if (typeof layer[p] === 'object') {
                layer[p] = this._parseObject(layer[p]);
            }
        }
        obj_layers.push(layer);
    }
    return obj_layers;
};



/**
 * Loads a GeoDataCollection based on the intial url used to launch it
 *  supports the following query params on the url: data_url, vis_url, vis_str
 *
 * @param {Object} url The url to be processed.
 *
 */
GeoDataCollection.prototype.loadInitialUrl = function(url) {
    //URI suport for over-riding uriParams - put presets in uri_params
    var uri = new URI(url);
    var uri_params = {
        vis_url: undefined,
        vis_str: undefined,
        data_url: undefined
    };
    var overrides = uri.search(true);
    $.extend(uri_params, overrides);
    
    //store the current server location for use when creating urls
    this.visServer = uri.protocol() + '://' + uri.host();
    
        //TODO: Determine where this should live or if it should
    this.supportServer = 'http://geospace.research.nicta.com.au';

    var visUrl = uri_params.vis_url;
    var visStr = uri_params.vis_str;
    
    var dataUrl = uri_params.data_url;
    var dataFormat = uri_params.format;
    
    var that = this;
    
    //Initialize the view based on vis_id if passed in url
    if (visUrl) {
        //call to server to get json record
        loadJson(visUrl).then( function(obj) {
                //capture an id if it is passed
            that.visID = obj.id;
            if (obj.camera !== undefined) {
                var e = JSON.parse(obj.camera);
                var camLayer = { name: 'Camera', extent: new Rectangle(e.west, e.south, e.east, e.north)};
                that.zoomTo = true;
                that.GeoDataAdded.raiseEvent(that, camLayer);
            }
           
              //loop through layers adding each one
            var layers = that._parseLayers(obj.layers);
            for (var i = 0; i < layers.length; i++) {
                that.sendLayerRequest(layers[i]);
            }
        }, function(err) {
            loadErrorResponse(err);
        });
    }
    else if (visStr) {
        var obj = JSON.parse(visStr);
        that.visID = obj.id;
        if (obj.camera !== undefined) {
            var e = JSON.parse(obj.camera);
            var camLayer = { name: 'Camera', extent: new Rectangle(e.west, e.south, e.east, e.north)};
            that.zoomTo = true;
            that.GeoDataAdded.raiseEvent(that, camLayer);
        }
       
          //loop through layers adding each one
        var layers = that._parseLayers(obj.layers);
        for (var i = 0; i < layers.length; i++) {
            that.sendLayerRequest(layers[i]);
        }
    }
    else if (dataUrl) {
        dataUrl = decodeURIComponent(dataUrl);
        that.loadUrl(dataUrl, dataFormat);
    }
};

/**
 * Loads a data file based on the  url
 *
 * @param {Object} url The url to be processed.
 *
 */
GeoDataCollection.prototype.loadUrl = function(url, format) {
    var that = this;
    if (format || that.formatSupported(url)) {
        if (format === undefined) {
            format = getFormatFromUrl(url);
        }
        if (corsProxy.shouldUseProxy(url)) {
            if (url.indexOf('http:') === -1) {
                url = 'http:' + url;
            }
            url = corsProxy.getURL(url);
        }
        if (format === 'KMZ') {
            loadBlob(url).then( function(blob) {
                blob.name = url;
                that.addFile(blob);
            }, function(err) {
                loadErrorResponse(err);
            });
        } else {
            loadText(url).then(function (text) { 
                that.zoomTo = true;
                that.loadText(text, url, format);
            }, function(err) {
                loadErrorResponse(err);
            });
        }
    }
};


/**
* Package up a share request and send an event
*
* @param {Object} options Object with the following properties:
* @param {Object} [options.image] An image dataUrl with the current view.
* @param {Object} [options.camera] Current camera settings (just extent for now)
*/
GeoDataCollection.prototype.setShareRequest = function(options) {
    var request = this.getShareRequest(options);
    this.ShareRequest.raiseEvent(this, request);
};


/**
* Get a share request object based on the description passed
*
* @param {Object} description Object with the following properties:
* @param {Object} [description.image] An image dataUrl with the current view.
* @param {Object} [description.camera] Current camera settings (just extent for now)
*
* @returns {Object} A request object
*
*/
GeoDataCollection.prototype.getShareRequest = function( description ) {
    var request = {};
    
    //TODO: bundle up datesets for smaller drag and drop data
    request.layers = this._stringify();
    request.version = '0.0.02';
    request.camera = JSON.stringify(description.camera); //just extent for now
    if (this.visID) {
        request.id = this.visID;
    }
    request.image = description.image;
    return request;
};


/**
* Given a share request object, turn it into a valid url to launch in viewer
*
* @param {Object} request Object containing the share request
*
* @returns {Url} A url that will launch in the viewer
*/
GeoDataCollection.prototype.getShareRequestURL = function( request ) {
    var img = request.image;
    request.image = undefined;
    var requestStr = JSON.stringify(request);
    var url = this.visServer + '?vis_str=' + encodeURIComponent(requestStr);
    request.image = img;
    return url;
};


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
function recolorImageWithCanvas(img, colorFunc) {
    var canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;

    // Copy the image contents to the canvas
    var context = canvas.getContext("2d");
    context.drawImage(img, 0, 0);
    var image = context.getImageData(0, 0, canvas.width, canvas.height);
    
    image = recolorImage(image, colorFunc);
    
    context.putImageData(image, 0, 0);
    return context.getImageData(0, 0, canvas.width, canvas.height);
}


var regionServer = 'http://geoserver.research.nicta.com.au/region_map/ows';
var regionWmsMap = {
    'STE': {
        "Name":"region_map:FID_STE_2011_AUST",
        "regionProp": "STE_CODE11",
        "aliases": ['state', 'ste']
    },
    'CED': {
        "Name":"region_map:FID_CED_2011_AUST",
        "regionProp": "CED_CODE",
        "aliases": ['ced']
    },
    'SED': {
        "Name":"region_map:FID_SED_2011_AUST",
        "regionProp": "SED_CODE",
        "aliases": ['sed']
    },
    'POA': {
        "Name":"region_map:FID_POA_2011_AUST",
        "regionProp": "POA_CODE",
        "aliases": ['poa', 'postcode']
    },
    'LGA': {
        "Name":"region_map:FID_LGA_2011_AUST",
        "regionProp": "LGA_CODE11",
        "aliases": ['lga']
    },
    'SCC': {
        "Name":"region_map:FID_SCC_2011_AUST",
        "regionProp": "SCC_CODE",
        "aliases": ['scc', 'suburb']
    },
    'SA4': {
        "Name":"region_map:FID_SA4_2011_AUST",
        "regionProp": "SA4_CODE11",
        "aliases": ['sa4']
    },
    'SA3': {
        "Name":"region_map:FID_SA3_2011_AUST",
        "regionProp": "SA3_CODE11",
        "aliases": ['sa3']
    },
    'SA2': {
        "Name":"region_map:FID_SA2_2011_AUST",
        "regionProp": "SA2_MAIN11",
        "aliases": ['sa2']
    },
    'SA1': {
        "Name":"region_map:FID_SA1_2011_AUST",
         "regionProp": "SA1_7DIG11",
        "aliases": ['sa1']
    }
};

//TODO: if we add enum capability and then can work with any unique field
//TODO: need way to support a progress display on slow loads
function loadRegionIDs(description, succeed, fail) {
    var url = regionServer + '?service=wfs&version=2.0&request=getPropertyValue';
    url += '&typeNames=' + description.Name;
    url += '&valueReference=' + description.regionProp;
    loadText(url).then(function (text) { 
        var obj = $.xml2json(text);
        var idMap = [];
            //for now this turns ids into numbers since they are that way in table data
            //btw: since javascript uses doubles this is not a problem for the numerical ids
        for (var i = 0; i < obj.member.length; i++) {
            idMap.push(parseInt(obj.member[i][description.regionProp],10));
        }
        description.idMap = idMap;
        succeed();
    }, function(err) {
        loadErrorResponse(err);
        fail();
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

GeoDataCollection.prototype.createRegionLookupFunc = function(layer) {
    if (!defined(layer) || !defined(layer.baseDataSource) || !defined(layer.baseDataSource.dataset)) {
        return;
    }
    var tableDataSource = layer.baseDataSource;
    var dataset = tableDataSource.dataset;
    var vars = dataset.getVarList();
    var description = regionWmsMap[layer.regionType];
 
    var codes = dataset.getDataValues(layer.regionVar);
    var ids = description.idMap;
    var vals = dataset.getDataValues(dataset.getCurrentVariable());
    var lookup = new Array(ids.length);
    for (var i = 0; i < codes.length; i++) {
        var id = ids.indexOf(codes[i]);
        lookup[id] = vals[i];
    }
    // set color for each code
    var colors = [];
    for (var idx = dataset.getMinVal(); idx <= dataset.getMaxVal(); idx++) {
        colors[idx] = tableDataSource._mapValue2Color(idx);
    }
    //   create colorFunc used by the region mapper
    layer.colorFunc = function(id) {
        return colors[lookup[id]];
    };
    // can be used to get point data
    layer.valFunc = function(code) {
        var rowIndex = codes.indexOf(code);
        return vals[rowIndex];
    };
    layer.rowProperties = function(code) {
        var rowIndex = codes.indexOf(code);
        return dataset.getDataRow(rowIndex);
    };
};

GeoDataCollection.prototype.setRegionVariable = function(layer, regionVar, regionType) {
    if (layer.regionVar === regionVar && layer.regionType === regionType) {
        return;
    }

    layer.regionVar = regionVar;
    var description = regionWmsMap[regionType];
    if (layer.regionType !== regionType) {
        layer.regionType = regionType;
        description.type = 'WMS';
        description.base_url = regionServer;

        layer.url = this.getOGCFeatureURL(description);
        layer.regionProp = description.regionProp;
    }
    console.log('Region type:', layer.regionType, ', Region var:', layer.regionVar);
        
    var that = this;
    var succeed = function() {
         that.createRegionLookupFunc(layer);
        //remove layer and recreate from scratch
        var currentIndex = that.layers.indexOf(layer);
        if (currentIndex !== -1) {
            that.remove(currentIndex);
        }
       that._viewMap(layer.url, layer);
    };
    var fail = function () {
        console.log('failed to load region ids from server');
    };

    if (!defined(description.idMap)) {
        loadRegionIDs(description, succeed, fail);
    }
    else {
        succeed();
    }
};

GeoDataCollection.prototype.setRegionDataVariable = function(layer, newVar) {
    var tableDataSource = layer.baseDataSource;
    var dataset = tableDataSource.dataset;
    if (dataset.getCurrentVariable() === newVar) {
        return;
    }
    dataset.setCurrentVariable({ variable: newVar}); 
    this.createRegionLookupFunc(layer);
    
    console.log('Var set to:', newVar);
        //redisplay layer to update
    this.show(layer, false);
    this.show(layer, true);
};

GeoDataCollection.prototype.setRegionColorMap = function(layer, dataColorMap) {
    layer.baseDataSource.setColorGradient(dataColorMap);
    this.createRegionLookupFunc(layer);
        //redisplay layer to update
    this.show(layer, false);
    this.show(layer, true);
};

GeoDataCollection.prototype.addRegionMap = function(layer) {
    //see if we can do region mapping
    var dataset = layer.baseDataSource.dataset;
    var vars = dataset.getVarList();

    //if layer includes style/var info then use that
    if (!defined(layer.style) || !defined(layer.style.table)) {
        var regionType;
        var idx = -1;
        for (regionType in regionWmsMap) {
            if (regionWmsMap.hasOwnProperty(regionType)) {
                idx = determineRegionVar(vars, regionWmsMap[regionType].aliases);
                if (idx !== -1) {
                    break;
                }
            }
        }
        
        if (idx === -1) {
            return;
        }

            //change current var if necessary
        var dataVar = dataset.getCurrentVariable();
        if (dataVar === vars[idx]) {
            dataVar = vars[idx+1];
        }
        
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
        layer.style = style;
    }

    if (defined(layer.style.table.colorMap)) {
        layer.baseDataSource.setColorGradient(layer.style.table.colorMap);
    }
    layer.baseDataSource.setCurrentVariable(layer.style.table.data);
    
        //capture url to use for sharing
    layer.shareUrl = layer.url || '';
    
    this.setRegionVariable(layer, layer.style.table.region, layer.style.table.regionType);
};

/////////////////////////////////////////////////////////////////////////////////

// -------------------------------------------
// Handle data sources from text
// -------------------------------------------
// Derive a format from a url
function getFormatFromUrl(url) {
    if (url === undefined) {
        return;
    }
        //try to parse as url and get format
    var uri = new URI(url);
    var params = uri.search(true);
    if (params.outputFormat || params.f) {
        var str = params.outputFormat || params.f;
        return str.toUpperCase();
    }
        //try to get from extension
    var idx = url.lastIndexOf('.');
    if (idx !== -1 && (idx > url.lastIndexOf('/'))) {
        return url.toUpperCase().substring(idx+1);
    }
}

/**
* Determine if a data format is natively supported based on the format derived from the srcname
*
* @param {String} srcname Name of data file
*
* @returns {Boolean} true if supported natively, false otherwise
*/
GeoDataCollection.prototype.formatSupported = function(srcname) {
    var supported = ["CZML", "GEOJSON", "GJSON", "TOPOJSON", "JSON", "TOPOJSON", "KML", "KMZ", "GPX", "CSV"];
    var format = getFormatFromUrl(srcname);
    
    for (var i = 0; i < supported.length; i++) {
        if (format === supported[i]) {
            return true;
        }
    }
    return false;
};

/**
* Load text as a geodata item
*
 * @param {String} text The text to be processed.
 * @param {String} srcname The text file name to get the format extension from.
 * @param {String} [format] Format override for dataset
 * @param {Object} [layer] Layer object if that already exists.
*
* @returns {Boolean} true if processed
*/
GeoDataCollection.prototype.loadText = function(text, srcname, format, layer) {
    var DataSource;
    
    var dom;
    
    if (layer === undefined) {
        layer = new GeoData({ name: srcname, type: 'DATA' });
    }
    if (format === undefined) {
        format = getFormatFromUrl(srcname);
    }
    format = format.toUpperCase();
    
    //TODO: Save dataset text for dnd data

        //Natively handled data sources in cesium
    if (format === "CZML") {
        var czmlDataSource = new CzmlDataSource();
        czmlDataSource.load(JSON.parse(text));
        this.dataSourceCollection.add(czmlDataSource);
            //add it as a layer
        layer.dataSource = czmlDataSource;
        layer.extent = getDataSourceExtent(czmlDataSource);
        this.add(layer);
    }
    else if (format === "GEOJSON" ||
            format === "GJSON" ||
            format === "JSON" ||
            format === "TOPOJSON") {
        this.addGeoJsonLayer(JSON.parse(text), layer);
    } 
        //Convert in browser using toGeoJSON https://github.com/mapbox/togeojson    
    else if (format === "KML") {
        dom = (new DOMParser()).parseFromString(text, 'text/xml');    
        this.addGeoJsonLayer(toGeoJSON.kml(dom), layer);
    } 
    else if (format === "GPX") {
        dom = (new DOMParser()).parseFromString(text, 'text/xml');    
        this.addGeoJsonLayer(toGeoJSON.gpx(dom), layer);
    } 
        //Handle table data using TableDataSource plugin        
    else if (format === "CSV") {
        var tableDataSource = new TableDataSource();
        tableDataSource.loadText(text);
        if (!tableDataSource.dataset.hasLocationData()) {
            console.log('No locaton date found in csv file - trying to match based on region');
            layer.baseDataSource = tableDataSource;
            this.addRegionMap(layer);
        }
        else {
            if (!defined(layer.style) || !defined(layer.style.table)) {
                var dataset = tableDataSource.dataset;
                var style = {line: {}, point: {}, polygon: {}, table: {}};
                style.table.lon = dataset.getVarID(VarType.LON);
                style.table.lat = dataset.getVarID(VarType.LAT);
                style.table.alt = dataset.getVarID(VarType.ALT);
                style.table.time = dataset.getVarID(VarType.TIME);
                style.table.data = dataset.getVarID(VarType.SCALAR);
                style.table.imageUrl = undefined;
                style.table.colorMap = undefined;
                layer.style = style;
            }
            if (defined(layer.style.table.colorMap)) {
                tableDataSource.setColorGradient(layer.style.table.colorMap);
            }
            if (defined(layer.style.table.imageUrl)) {
                tableDataSource.setImageUrl(layer.style.table.imageUrl);
            }
            if (defined(layer.style.table.data)) {
                tableDataSource.setCurrentVariable(layer.style.table.data);
            }
            if (this.map === undefined) {
                this.dataSourceCollection.add(tableDataSource);
                layer.dataSource = tableDataSource;
                layer.extent = tableDataSource.dataset.getExtent();
                this.add(layer);
            }
            else {
                var pointList = tableDataSource.dataset.getPointList();
                var geojson = {type: "FeatureCollection", crs: {"type":"EPSG","properties":{"code":"4326"}}, features: []};
                for (var i = 0; i < pointList.length; i++) {
                    geojson.features[i] = {
                        "type" : "Feature", 
                        "properties" : tableDataSource.dataset.getDataRow(pointList[i].row),
                        "geometry" : { "type": "Point", "coordinates": pointList[i].pos }
                    };
                }
                this.addGeoJsonLayer(geojson, layer);
            }
        }
    }
        //Return false so widget can try to send to conversion service
    else {
        console.log('There is no handler for this file based on its extension : ' + srcname);
        return false;
    }
    return true;
};


// -------------------------------------------
// Convert OGC Data Sources to GeoJSON
// -------------------------------------------
//Function to intercept and fix up ESRI REST Json to GeoJSON
//TODO: multipoint, multipolyline, multipolygon
function _EsriRestJson2GeoJson(obj) {
    if (obj.geometryType === undefined || obj.features === undefined || obj.type === 'FeatureCollection') {
        return obj;
    }

    var pts;
    var geom;

    obj.type = "FeatureCollection";
    var code = obj.spatialReference.latestWkid || obj.spatialReference.wkid;
    if (defined(code)) {
        obj.crs = {"type":"EPSG","properties":{"code": code}};
    }
    for (var i = 0; i < obj.features.length; i++) {
        var feature = obj.features[i];
        feature.type = "Feature";
        feature.properties = feature.attributes;
        if (obj.geometryType === "esriGeometryPoint") {
            pts = [feature.geometry.x, feature.geometry.y ];
            geom = { "type": "Point", "coordinates": pts };
            feature.geometry = geom;
        }
        else if (obj.geometryType === "esriGeometryPolyline") {
            pts = feature.geometry.paths[0];
            geom = { "type": "LineString", "coordinates": pts };
            feature.geometry = geom;
        }
        else if (obj.geometryType === "esriGeometryPolygon") {
            pts = feature.geometry.paths[0];
            geom = { "type": "Polygon", "coordinates": pts };
            feature.geometry = geom;
        }
    }
    return obj;
}

//Utility function to change esri gml positions to geojson positions
function _gml2coord(posList) {
    var pnts = posList.split(/[ ,]+/);
    var coords = [];
    for (var i = 0; i < pnts.length; i+=2) {
        coords.push([parseFloat(pnts[i+1]), parseFloat(pnts[i])]);
    }
    return coords;
}

//Utility function to convert esri gml based feature to geojson
function _convertFeature(feature, geom_type) {
    var newFeature = {type: "Feature"};
    var pts = (geom_type === 'Point') ? _gml2coord(feature.pos)[0] : _gml2coord(feature.posList);
    newFeature.geometry = { "type": geom_type, "coordinates": pts };
    return newFeature;
}           
            
            
//Utility function to convert esri gml to geojson
function _EsriGml2GeoJson(obj) {
    var newObj = {type: "FeatureCollection", crs: {"type":"EPSG","properties":{"code":"4326"}}, features: []};

    function pointFilterFunction(obj, prop) {
        newObj.features.push(_convertFeature(obj[prop], 'Point'));
    }

    function lineStringFilterFunction(obj, prop) {
        newObj.features.push(_convertFeature(obj[prop], 'LineString'));
    }

    function polygonFilterFunction(obj, prop) {
        newObj.features.push(_convertFeature(obj[prop], 'Polygon'));
    }

    for (var i = 0; i < obj.featureMember.length; i++) {
           //TODO: get feature properties from non-SHAPE properties if present
        //feature.properties = feature.attributes;

        //Recursively find features and add to FeatureCollection
        filterValue(obj.featureMember[i], 'Point', pointFilterFunction);
        filterValue(obj.featureMember[i], 'LineString', lineStringFilterFunction);
        filterValue(obj.featureMember[i], 'Polygon', polygonFilterFunction);
    }
    return newObj;
}


// Filter a geojson coordinates array structure
var filterArray = function (pts, func) {
    if (!(pts[0] instanceof Array) || !((pts[0][0]) instanceof Array) ) {
        pts = func(pts);
        return pts;
    }
    for (var i = 0; i < pts.length; i++) {
        pts[i] = filterArray(pts[i], func);  //at array of arrays of points
    }
    return pts;
};

// find a member by name in the gml
function filterValue(obj, prop, func) {
    for (var p in obj) {
        if (obj.hasOwnProperty(p) === false) {
            continue;
        }
        else if (p === prop) {
            if (func && (typeof func === 'function')) {
                (func)(obj, prop);
            }
        }
        else if (typeof obj[p] === 'object') {
            filterValue(obj[p], prop, func);
        }
    }
}

// -------------------------------------------
// Connect to OGC Data Sources
// -------------------------------------------
GeoDataCollection.prototype._viewFeature = function(request, layer) {
    var that = this;
    
    if (corsProxy.shouldUseProxy(request)) {
        request = corsProxy.getURL(request);
    }

    loadText(request).then( function (text) {
        //convert to geojson
        var obj;
        if (text[0] === '{') {
            obj = JSON.parse(text);
            if (obj.exceededTransferLimit) {
                console.log('WARNING: Data retrieval limit enforced by service!');
            }
            obj = _EsriRestJson2GeoJson(obj);  //ESRI Rest
        }
        else {
            obj = $.xml2json(text);         //ESRI WFS
            if (obj.Exception !== undefined) {
                console.log('Exception returned by the WFS Server:', obj.Exception.ExceptionText);
            }
            obj = _EsriGml2GeoJson(obj);
                //Hack for gazetteer since the coordinates are flipped
            if (text.indexOf('gazetter') !== -1) {
                for (var i = 0; i < obj.features.length; i++) {
                    var pt = obj.features[i].geometry.coordinates; 
                    var t = pt[0]; pt[0] = pt[1]; pt[1] = t;
                 }
            }
        }
        that.addGeoJsonLayer(obj, layer);
    }, function(err) {
        loadErrorResponse(err);
    });
};

// Show wms map
GeoDataCollection.prototype._viewMap = function(request, layer) {
    var uri = new URI(request);
    var params = uri.search(true);
    var layerName = params.layers;

    var provider;
    var proxy;

    if (this.map === undefined) {
        var wmsServer = request.substring(0, request.indexOf('?'));
        var url = wmsServer; //'http://' + uri.hostname() + uri.path();
        if (corsProxy.shouldUseProxy(url)) {
            if (layer.description && layer.description.username && layer.description.password) {
                proxy = corsProxy.withCredentials(layer.description.username, layer.description.password);
            } else {
                proxy = corsProxy;
            }
        }

        if (layerName === 'REST') {
            provider = new ArcGisMapServerImageryProvider({
                url: url,
                proxy: proxy
            });
        }
        else {
            var wmsOptions = {
                url: url,
                layers : encodeURIComponent(layerName),
                parameters: {
                    format: 'image/png',
                    transparent: true,
                    styles: '',
                    exceptions: 'application/vnd.ogc.se_xml'
                },
                proxy: proxy
            };

            var crs;
            if (defined(layer.description)) {
                if (defined(layer.description.CRS)) {
                    crs = layer.description.CRS;
                } else {
                    crs = layer.description.SRS;
                }
            }
            if (defined(crs)) {
                if (crsIsMatch(crs, 'EPSG:4326')) {
                    // Standard Geographic
                } else if (crsIsMatch(crs, 'CRS:84')) {
                    // Another name for EPSG:4326
                    wmsOptions.parameters.srs = 'CRS:84';
                } else if (crsIsMatch(crs, 'EPSG:4283')) {
                    // Australian system that is equivalent to EPSG:4326.
                    wmsOptions.parameters.srs = 'EPSG:4283';
                } else if (crsIsMatch(crs, 'EPSG:3857')) {
                    // Standard Web Mercator
                    wmsOptions.tilingScheme = new WebMercatorTilingScheme();
                } else if (crsIsMatch(crs, 'EPSG:900913')) {
                    // Older code for Web Mercator
                    wmsOptions.tilingScheme = new WebMercatorTilingScheme();
                    wmsOptions.parameters.srs = 'EPSG:900913';
                } else {
                    // No known supported CRS listed.  Try the default, EPSG:4326, and hope for the best.
                }
            }

            provider = new WebMapServiceImageryProvider(wmsOptions);
            
            if (defined(layer.colorFunc)) {
                    //remap image layer color func
                provider.base_requestImage = provider.requestImage;
                provider.requestImage = function(x, y, level) {
                    var imagePromise = provider.base_requestImage(x, y, level);
                    if (!defined(imagePromise)) {
                        return imagePromise;
                    }
                    
                    return when(imagePromise, function(image) {
                        if (defined(image)) {
                            image = recolorImageWithCanvas(image, layer.colorFunc);
                        }
                        return image;
                    });
                };
                    //remap image layer featurePicking Func
                provider.base_pickFeatures = provider.pickFeatures;
                provider.pickFeatures = function(x, y, level, longitude, latitude) {
                    var featurePromise = provider.base_pickFeatures(x, y, level, longitude, latitude);
                    if (!defined(featurePromise)) {
                        return featurePromise;
                    }
                    
                    return when(featurePromise, function(results) {
                        if (defined(results)) {
                            var id = results[0].data.properties[layer.regionProp];
                            var properties = layer.rowProperties(parseInt(id,10));
                            results[0].description = layer.baseDataSource.describe(properties);
                        }
                        return results;
                    });
                };
            }
        }
        layer.primitive = this.imageryLayersCollection.addImageryProvider(provider);
        layer.primitive.alpha = 0.6;
    }
    else {
        var server = request.substring(0, request.indexOf('?'));
        if (corsProxy.shouldUseProxy(server)) {
           server = corsProxy.getURL(server);
        }
        
        if (layerName === 'REST') {
            provider = new L.esri.tiledMapLayer(server);
        }
        else {
            provider = new L.tileLayer.wms(server, {
                layers: layerName,
                format: 'image/png',
                transparent: true,
                exceptions: 'application/vnd.ogc.se_xml'
            });
            
            if (defined(layer.colorFunc)) {
                provider.setFilter(function () {
                    new L.CanvasFilter(this, {
                        channelFilter: function (image) {
                            return recolorImage(image, layer.colorFunc);
                        }
                   }).render();
                });
            }
        }
        provider.setOpacity(0.6);
        layer.primitive = provider;
        this.map.addLayer(provider);
    }

    this.add(layer);
};

function crsIsMatch(crs, matchValue) {
    if (crs === matchValue) {
        return true;
    }

    if (crs instanceof Array && crs.indexOf(matchValue) >= 0) {
        return true;
    }

     return false;
}

// Show csv table data
GeoDataCollection.prototype._viewTable = function(request, layer) {
    var that = this;
        //load text here to let me control functions called after
    loadText(request).then( function (text) {
        var tableDataSource = new TableDataSource();
        tableDataSource.loadText(text);
        if (that.map === undefined) {
            that.dataSourceCollection.add(tableDataSource);
            layer.dataSource = tableDataSource;
            that.add(layer);
        }
        else {
            var pointList = tableDataSource.dataset.getPointList();
            var dispPoints = [];
            for (var i = 0; i < pointList.length; i++) {
                dispPoints.push({ type: 'Point', coordinates: pointList[i].pos});
            }
            that.addGeoJsonLayer(dispPoints, layer);
        }
    }, function(err) {
        loadErrorResponse(err);
    });
};

// Load data file based on extension if loaded as DATA layer
GeoDataCollection.prototype._viewData = function(url, layer) {
    var that = this;
    var format = getFormatFromUrl(url);
    
    if (corsProxy.shouldUseProxy(url)) {
        if (url.indexOf('http:') === -1) {
            url = 'http:' + url;
        }
        url = corsProxy.getURL(url);
    }
        //added this here to handle loading kmz's from init.json file
    if (format === 'KMZ') {
        loadBlob(url).then( function(blob) {
            blob.name = url;
            that.addFile(blob, layer);
        }, function(err) {
            loadErrorResponse(err);
        });
    } else if (url) {
            //load text here to let me control functions called after
        loadText(url).then (function (text) {
            that.loadText(text, layer.name, format, layer);
        }, function(err) {
            loadErrorResponse(err);
        });
    }
};

/**
* Determine if a data format is natively supported based on the format derived from the srcname
*
* @param {Object} layer The layer object to make into a visible layer.
*
*/
GeoDataCollection.prototype.sendLayerRequest = function(layer) {
    var request = layer.url;
    if (!defined(layer.show)) {
        layer.show = true;
    }
//    console.log('LAYER REQUEST:',request);
    
    // Deal with the different data Services
    if (layer.type === 'WFS' || layer.type === 'REST' || layer.type === 'GME') {
        this._viewFeature(request, layer);
    }
    else if (layer.type === 'WMS') {
        this._viewMap(request, layer);
    }
    else if (layer.type === 'DATA') {
        this._viewData(request, layer);
    }
    else {
        throw new DeveloperError('Creating layer for unsupported service: '+layer.type);
    }
};


/**
* Build a query to get feature from service
*
* @param {Object} description Object with the following properties:
* @param {String} description.Name Name of feature.
* @param {Url} description.base_url The url for the service
* @param {String} description.type The identifier of the service
* @param {String} [description.version] The version of the service to use
* @param {String} [description.esri] If this is an ESRI OGC service
* @param {Integer} [description.count] Maximum number of features to return
* @param {Object} [description.extent] Extent filter for feature request
*/
GeoDataCollection.prototype.getOGCFeatureURL = function(description) {
    console.log('Getting ', description.Name || description.name);
    
    var request = description.base_url;
    var name  = encodeURIComponent(description.Name);
    if (description.type === 'WMS') {
        request += '?service=wms&request=GetMap&layers=' + name;
        return request;
    }
    else if (description.type === 'WFS') {
        description.version = 1.1;
        request += '?service=wfs&request=GetFeature&typeName=' + name + '&version=' + description.version + '&srsName=EPSG:4326';
        
        if (description.esri === undefined) {
            request += '&outputFormat=JSON';
        }
        if (description.count) {
            request += '&maxFeatures=' + description.count;
        }
    }
    else if (description.type === 'REST') {
        request += '/' + description.name;
        request += '/query?geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&returnGeometry=true&f=pjson';
    }
    else {
//        throw new DeveloperError('Getting feature for unsupported service: '+description.type);
    }
    
    if (description.extent) {
        var ext = description.extent;
        var pos = [ CesiumMath.toDegrees(ext.west), CesiumMath.toDegrees(ext.south), 
                    CesiumMath.toDegrees(ext.east), CesiumMath.toDegrees(ext.north)];
        //crazy ogc bbox rules - first is old lon/lat ordering, second is newer lat/lon ordering
        var version = parseFloat(description.version);
        if (description.type === 'WFS' && version < 1.1) {
            request = request + '&bbox='+pos[0]+','+pos[1]+','+pos[2]+','+pos[3];
        }
        else if (description.type === 'REST') {
            request = request + '&geometry='+pos[0]+','+pos[1]+','+pos[2]+','+pos[3];
        }
        else {
            request = request + '&bbox='+pos[1]+','+pos[0]+','+pos[3]+','+pos[2]+',urn:x-ogc:def:crs:EPSG:6.9:4326';
        }
    }
    
    return request;
};


//Utility function to derive a collection from a service
function _getCollectionFromServiceLayers(layers, description) {
    var obj = {"name":"Data Sets", "Layer": []};
    for (var i = 0; i < layers.length; i++) {
        var layer = layers[i];
        var name = layer.Name;
        var idx = name.indexOf(':');
        var topic_name = name.substring(0, idx);
        var topic; // = undefined;
        for (var j = 0; j < obj.Layer.length; j++) {
            if (obj.Layer[j].name === topic_name) {
                topic = obj.Layer[j];
                break;
            }
        } 
        if (topic === undefined) {
            topic = {
                name: topic_name, 
                base_url: description.base_url,
                type: description.type,
                queryable: 0,
                Layer: []
            };
            obj.Layer.push(topic);
        }
        var dataset = {
            Name: name.substring(idx+1), 
            Title: name.substring(idx+1), 
            BoundingBox: {
                west: layer.EX_GeographicBoundingBox.westBoundLongitude,
                east: layer.EX_GeographicBoundingBox.eastBoundLongitude,
                south: layer.EX_GeographicBoundingBox.southBoundLatitude,
                north: layer.EX_GeographicBoundingBox.northBoundLatitude                
            },
            queryable: 1
        };
        topic.Layer.push(dataset);
    }
    var collection = {"name":"Data Collection", "Layer": [ obj ] };
    console.log(JSON.stringify(collection));
}

//Utility function to flatten layer hierarchy
function _recurseLayerList(layer_src, layers) {
    if (!(layer_src instanceof Array)) {
        layer_src = [layer_src];
    }
    for (var i = 0; i < layer_src.length; i++) {
        if (layer_src[i].Layer) {
            if (layer_src[i].queryable === 1) {
                layers.push(layer_src[i]);
            }
            _recurseLayerList(layer_src[i].Layer, layers);
        }
        else {
            layers.push(layer_src[i]);
        }
    }
}

/**
* Parse through capabilities to get possible layers
*
* @param {String} text The text returned from the Capabilities request.
* @param {Object} description Object with the following properties:
* @param {String} description.Name Name of feature.
* @param {Url} description.base_url The url for the service
* @param {String} description.type The identifier of the service
* @param {String} [description.version] The version of the service to use
* @param {String} [description.esri] If this is an ESRI OGC service
* @param {Integer} [description.count] Maximum number of features to return
* @param {Object} [description.extent] Extent filter for feature request
*
* @returns {Array} An array of layer descripters from the service
*/
GeoDataCollection.prototype.handleCapabilitiesRequest = function(text, description) {
    var json_gml;
    if (text[0] === '{') {
        json_gml = JSON.parse(text);
    }
    else {
        json_gml = $.xml2json(text);
    }
    
    //find the array of available layers
    var i;
    var layers = [];
    if (description.type === 'WFS') {
        layers = json_gml.FeatureTypeList.FeatureType;
        if (!(layers instanceof Array)) {
            layers = [layers];
        }

        // If the data source name is just its URL, and we have a better title from GetCapabilities, use it.
        var title;
        if (json_gml.ServiceIdentification !== undefined) {
            title = json_gml.ServiceIdentification.Title;
        }
        else if (json_gml.Service !== undefined) { //wfs 1.0
            title = json_gml.Service.Title;
        }
        if (title && description.name === description.base_url) {
            description.name = title;
        }
        
        if (json_gml.Esri !== undefined || layers[0].OutputFormats !== undefined) {
            description.esri = true;
        }
    }
    else if (description.type === 'WMS') {
        var layer_src = [json_gml.Capability.Layer];
        _recurseLayerList(layer_src, layers);
//        _getCollectionFromServiceLayers(layers, description)
    }
    else if (description.type === 'REST') {
        var layer = json_gml.layers;
        for (i = 0; i < layer.length; i++) {
            if (layer[i].subLayerIds instanceof Array) {
                continue;
            }
            layer[i].Title = layer[i].name;
            layer[i].name = layer[i].id;
            layers.push(layer[i]);
        }
        var ext = json_gml.fullExtent;
        description.extent = Rectangle.fromDegrees(parseFloat(ext.xmin), parseFloat(ext.ymin), 
            parseFloat(ext.xmax), parseFloat(ext.ymax));
    }
    else if (description.type === 'CKAN') {
        layers = [];
        var results = json_gml.result.results;
        for (var resultIndex = 0; resultIndex < results.length; ++resultIndex) {
            var result = results[resultIndex];
            var resources = result.resources;
            for (var resourceIndex = 0; resourceIndex < resources.length; ++resourceIndex) {
                var resource = resources[resourceIndex];
                if (resource.format !== 'wms') {
                    continue;
                }

                var wmsUrl = resource.wms_url;
                if (!defined(wmsUrl)) {
                    wmsUrl = resource.url;
                    if (!defined(wmsUrl)) {
                        continue;
                    }
                }

                // Extract the layer name from the WMS URL.
                var uri = new URI(wmsUrl);
                var params = uri.search(true);
                var layerName = params.LAYERS;

                // Remove the query portion of the WMS URL.
                var queryIndex = wmsUrl.indexOf('?');
                var url;
                if (queryIndex >= 0) {
                    url = wmsUrl.substring(0, queryIndex);
                } else {
                    url = wmsUrl;
                }

                var textDescription = result.notes.replace(/\n/g, '<br/>');
                if (defined(result.license_url)) {
                    textDescription += '<br/>[Licence](' + result.license_url + ')';
                }

                var bbox;
                var bboxString = result.geo_coverage;
                if (defined(bboxString)) {
                    var parts = bboxString.split(',');
                    if (parts.length === 4) {
                        bbox = {
                            west : parts[0],
                            south : parts[1],
                            east : parts[2],
                            north : parts[3]
                        };
                    }
                }

                layers.push({
                    Name: layerName,
                    Title: result.title,
                    base_url: url,
                    type: 'WMS',
                    description: textDescription,
                    BoundingBox : bbox
                });
            }
        }
    }
    else {
        throw new DeveloperError('Somehow got capabilities from unsupported type: ' + description.type);
    }
    
    //get the version
    if (json_gml.ServiceIdentification) {
        description.version = parseFloat(json_gml.ServiceIdentification.ServiceTypeVersion);
    }
    else if (json_gml.Service) {
        description.version = parseFloat(json_gml.version);
    }
    
    description.Layer = layers;
};

/**
* Get capabilities from service for WMS, WFS and REST
*  This also include GME and ESRI backends via their version of WMS/WFS
*
* @param {Object} description Object with the following properties:
* @param {Url} description.base_url The url for the service
* @param {String} description.type The identifier of the service
* @param {String} description.username Username for password authenticated services
* @param {String} description.password Password for password authenticated services
* @param {Function} callback Function to carry out at the successful completion of the request
*/
GeoDataCollection.prototype.getCapabilities = function(description, callback) {
    var request;
    if (description.type === 'REST') {
        request = description.base_url + '?f=pjson';
    }
    else if (description.type === 'CKAN') {
        request = description.base_url;
    }
    else if (description.type === 'WMS' || description.type === 'WFS') {
        request = description.base_url + '?service=' + description.type + '&request=GetCapabilities';
    }
    else {
        throw new DeveloperError('Cannot get capabilites for service: ' + description.type);
    }
   
    console.log('CAPABILITIES REQUEST:',request);
    if (corsProxy.shouldUseProxy(request)) {
        request = corsProxy.getURL(request);
    }

    var that = this;
    loadText(request, undefined, description.username, description.password).then ( function(text) {
        that.handleCapabilitiesRequest(text, description);
        callback(description);
    }, function(err) {
        loadErrorResponse(err);
    });
};


// ----------------
// Add geojson
// ----------------

/**
* Get the geographic extent of a datasource
*
* @param {Object} dataSource Cesium.DataSource object
*
* @returns {Object} A Cesium.Rectangle object bounding the data points
*/
function getDataSourceExtent(dataSource) {
    var collection = dataSource.entities;
    var objects = collection.entities;
    var e0;
    
    var julianDate = new JulianDate();

    var cArray;

    for (var i = 0; i < objects.length; i++) {
        if (objects[i].positions) {
            cArray = objects[i].positions.getValue(julianDate);
        }
        else if (objects[i].position) {
            cArray = [objects[i].position.getValue(julianDate)];
        }
        else {
            continue;
        }
        var cartArray = Ellipsoid.WGS84.cartesianArrayToCartographicArray(cArray);
        var e1 = Rectangle.fromCartographicArray(cartArray);
        if (e0 === undefined) {
            e0 = e1;
        }
        else {
            var west = Math.min(e0.west, e1.west);
            var south = Math.min(e0.south, e1.south);
            var east = Math.max(e0.east, e1.east);
            var north = Math.max(e0.north, e1.north);
            e0 = new Rectangle(west, south, east, north);
        }
    }
    return e0;
}



// -------------------------------------------
// Reproject geojson to WGS84
// -------------------------------------------

/*
//function for GeoJSONDataSource to reproject coords
function myCrsFunction(coordinates, id) {
    var source = new proj4.Proj(proj4_epsg[id]);
    var dest = new proj4.Proj('EPSG:4326');
    var p = new proj4.Point(coordinates[0], coordinates[1]);
    proj4(source, dest, p);      //do the transformation.  x and y are modified in place
    var cartographic = Cartographic.fromDegrees(p.x, p.y);
    return Ellipsoid.WGS84.cartographicToCartesian(cartographic);
}

// Create a reproject func for GeoJsonDataSource to use
function createCesiumReprojectFunc(proj) {
    return function(coordinates) {
        return myCrsFunction(coordinates, proj);
    };
}

// if we want cesium GeoJsonDataSource to do it
function setCesiumReprojectFunc(code) {   
    GeoJsonDataSource.crsNames[code] = createCesiumReprojectFunc(code);
}
*/

// Function to pass to reproject function
function pntReproject(coordinates, id) {
    var source = new proj4.Proj(proj4_epsg[id]);
    var dest = new proj4.Proj('EPSG:4326');
    var p = new proj4.Point(coordinates[0], coordinates[1]);
    proj4(source, dest, p);      //do the transformation.  x and y are modified in place
    return [p.x, p.y];
}


// Get the crs code from the geojson
function getCrsCode(gjson_obj) {
    var code;

    if (!defined(gjson_obj.crs)) {
        return '';
    } else if (gjson_obj.crs.type === 'EPSG') {
        code = gjson_obj.crs.properties.code;
    } else if (gjson_obj.crs.type === 'name' &&
               defined(gjson_obj.crs.properties) &&
               defined(gjson_obj.crs.properties.name) &&
               gjson_obj.crs.properties.name.indexOf('EPSG:') === 0) {
        code = gjson_obj.crs.properties.name.substring(5);
    } else {
        return '';
    }

    return 'EPSG:' + code;
}

//  TODO: get new proj4 strings from REST service
//  requires asynchronous layer loading so on hold for now
function addProj4Text(code) {
        //try to get from a service
    var url = 'http://geospace.research.nicta.com.au/proj4def/' + code;
    loadText(url).then(function (proj4Text) {
        console.log('Adding new string for ', code, ': ', proj4Text, ' before loading datasource');
        proj4_epsg[code] = proj4Text;
    }, function(err) {
        loadErrorResponse(err);
    });
}

// Set the Cesium Reproject func if not already set - return false if can't set
function supportedProjection(code) {
    return proj4_epsg.hasOwnProperty(code);
}

// Reproject a point list based on the supplied crs code
function reprojectPointList(pts, code) {
    if (!(pts[0] instanceof Array)) {
        return pntReproject(pts, code);  //point
    }
    var pts_out = [];
    for (var i = 0; i < pts.length; i++) {
        pts_out.push(pntReproject(pts[i], code));
    }
    return pts_out;
}

// Reproject a GeoJson based on the supplied crs code
function reprojectGeoJSON(obj, crs_code) {
    if (crs_code !== 'EPSG:4283') {
        filterValue(obj, 'coordinates', function(obj, prop) { obj[prop] = filterArray(obj[prop], function(pts) {
                return reprojectPointList(pts, crs_code);
            });
        });
    }
    obj.crs = {
        type: 'EPSG',
        properties: {
            code: '4326'
        }
    };
}

// Reduce the resolution of a point list in degrees
function reducePointList(pts, epsilon, limit) {
    if (!(pts[0] instanceof Array)) {
        return pts;  //point
    }
    if (pts.length < 50) {
        return pts;
    }
    //reduce points in polyline using a simple greedy algorithm
    var pts_out = [];
    var skip_cnt;
    for (var v = 0; v < pts.length; v += skip_cnt) {
        pts_out.push(pts[v]);
         //keep skipping until something further away then epsilon or limit points removed
        for (skip_cnt = 1; skip_cnt < limit; skip_cnt++) {
            if (v + skip_cnt >= pts.length) {
                break;
            }
            if ((Math.abs(pts[v][0] - pts[v + skip_cnt][0]) + Math.abs(pts[v ][1] - pts[v + skip_cnt][1])) > epsilon) {
                break;
            }
        }
    }
    return pts_out;
}

// Filter a geojson coordinates array structure
var countPnts = function (pts, cnt) {
    if (!(pts[0] instanceof Array) ) {
        cnt.tot++;
    }
    else if (!((pts[0][0]) instanceof Array) ) {
        cnt.tot += pts.length;
        if (pts.length > cnt.longest) {
            cnt.longest = pts.length;
        }
    }
    else {
        for (var i = 0; i < pts.length; i++) {
            countPnts(pts[i], cnt);  //at array of arrays of points
        }
    }
};

// Get Extent of geojson
var getExtent = function (pts, ext) {
    if (!(pts[0] instanceof Array) ) {
        if (pts[0] < ext.west)  { ext.west = pts[0];  }
        if (pts[0] > ext.east)  { ext.east = pts[0];  } 
        if (pts[1] < ext.south) { ext.south = pts[1]; }
        if (pts[1] > ext.north) { ext.north = pts[1]; }
    }
    else if (!((pts[0][0]) instanceof Array) ) {
        for (var i = 0; i < pts.length; i++) {
            getExtent(pts[i], ext);
        }
    }
    else {
        for (var j = 0; j < pts.length; j++) {
            getExtent(pts[j], ext);  //at array of arrays of points
        }
    }
};


function _getGeoJsonExtent(geojson) {
    var ext = {west:180, east:-180, south:90, north: -90};
    filterValue(geojson, 'coordinates', function(obj, prop) { getExtent(obj[prop], ext); });
    return Rectangle.fromDegrees(ext.west, ext.south, ext.east, ext.north);
}
           
            
//Lazy function to downsample GeoJson
function _downsampleGeoJSON(obj) {
    var obj_size = JSON.stringify(obj).length;
    var cnt = {tot:0, longest:0};
    filterValue(obj, 'coordinates', function(obj, prop) { countPnts(obj[prop], cnt); });
    if (cnt.longest < 50 || cnt.tot < 10000) {
        console.log('Skipping downsampling');
        return;
    }
    filterValue(obj, 'coordinates', function(obj, prop) { obj[prop] = filterArray(obj[prop], function(pts) {
        return reducePointList(pts, 0.005, 10);
    }); });
    console.log('downsampled object from', obj_size, 'bytes to', JSON.stringify(obj).length);
}


var line_palette = {
    minimumRed : 0.4,
    minimumGreen : 0.4,
    minimumBlue : 0.4,
    maximumRed : 0.9,
    maximumGreen : 0.9,
    maximumBlue : 0.9,
    alpha : 1.0
};
var point_palette = {
    minimumRed : 0.6,
    minimumGreen : 0.6,
    minimumBlue : 0.6,
    maximumRed : 1.0,
    maximumGreen : 1.0,
    maximumBlue : 1.0,
    alpha : 1.0
};


//Get a random color for the data based on the passed seed (usually dataset name)
function getRandomColor(palette, seed) {
    if (seed !== undefined) {
        if (typeof seed === 'string') {
            var val = 0;
            for (var i = 0; i < seed.length; i++) {
                val += seed.charCodeAt(i);
            }
            seed = val;
        }
        CesiumMath.setRandomNumberSeed(seed);
    }
    return Color.fromRandom(palette);
}

//Convert a color object into Color object
function getCesiumColor(clr) {
    if (clr instanceof Color) {
        return clr;
    }
    return new Color(clr.red, clr.green, clr.blue, clr.alpha);
}




/**
* Add a GeoJson object as a geodata datasource layer
*
 * @param {Object} geojson The GeoJson object to add
 * @param {Object} [layer] The layer to add if it already exists
*
 * @returns {Object} layer The layer that wa added
*/
GeoDataCollection.prototype.addGeoJsonLayer = function(geojson, layer) {
    //set default layer styles
    if (layer.style === undefined || layer.style.line) {
        var style = layer.style || {line: {}, point: {}, polygon: {}, table: {}};
        style.line.color = getRandomColor(line_palette, layer.name);
        style.line.width = 2;
        style.point.color = getRandomColor(point_palette, layer.name);
        style.point.size = 10;
        style.polygon.color = style.line.color;
        style.polygon.fill = false;  //off by default for perf reasons
        style.polygon.fillcolor = style.line.color;
        style.polygon.fillcolor.alpha = 0.75;
        layer.style = style;
    }

    // If this GeoJSON is an object literal with a single property, treat that
    // property as the name of the data source, and the property's value as the
    // actual GeoJSON.
    var numProperties = 0;
    var propertyName;
    for (propertyName in geojson) {
        if (geojson.hasOwnProperty(propertyName)) {
            ++numProperties;
            if (numProperties > 1) {
                break; // no need to count past 2 properties.
            }
        }
    }

    var name;
    if (numProperties === 1) {
        name = propertyName;
        geojson = geojson[propertyName];
    }
    
   //Reprojection
    var crs_code = getCrsCode(geojson);
    if (crs_code !== '' && crs_code !== 'EPSG:4326') {
        if (!supportedProjection(crs_code)) {
//            addProj4Text(code); // post POC
            console.log('Unsupported data projection:', crs_code);
            return;
        }
        else {
            reprojectGeoJSON(geojson, crs_code);
        }
    }

    //try to downsample object if huge
    _downsampleGeoJSON(geojson);
    
    if (!layer.extent) {
        layer.extent = _getGeoJsonExtent(geojson);
    }
    
    var newDataSource = new GeoJsonDataSource(name);

    newDataSource.load(geojson).then(function() {
        var entities = newDataSource.entities.entities;

        for (var i = 0; i < entities.length; ++i) {
            var entity = entities[i];
            var material;

            //update default point/line/polygon
            var point = entity.point;
            if (defined(point)) {
                point.color = new ConstantProperty(getCesiumColor(layer.style.point.color));
                point.pixelSize = new ConstantProperty(layer.style.point.size);
                point.outlineColor = new ConstantProperty(Color.BLACK);
                point.outlineWidth = new ConstantProperty(1);
            }

            var polyline = entity.polyline;
            if (defined(polyline)) {
                material = new ColorMaterialProperty();
                material.color = new ConstantProperty(getCesiumColor(layer.style.line.color));
                polyline.material = material;
                polyline.width = new ConstantProperty(layer.style.line.width);
            }

            var polygon = entity.polygon;
            if (defined(polygon)) {
                polygon.fill = new ConstantProperty(layer.style.polygon.fill);
                polygon.outline = new ConstantProperty(true);

                material = new ColorMaterialProperty();
                material.color = new ConstantProperty(getCesiumColor(layer.style.polygon.fillcolor));
                polygon.material = material;
            }
        }
    });
    this.dataSourceCollection.add(newDataSource);
        //add it as a layer
    layer.dataSource = newDataSource;
    return this.add(layer);
};

/**
* Add a file object to the layers
*
* @param {Object} file A javascript file object
*
*/
GeoDataCollection.prototype.addFile = function(file, layer) {
    var that = this;

    if (this.formatSupported(file.name)) {
        if (file.name.match(/.kmz$/i)) {
            if (!defined(layer)) {
                layer = new GeoData({ name: file.name, type: 'DATA' });
            }
            var dataSource = new KmlDataSource(corsProxy);
            when(dataSource.loadKmz(file, file.name), function() {
                layer.extent = getDataSourceExtent(dataSource);
                that.dataSourceCollection.add(dataSource);
                layer.dataSource = dataSource;
                that.zoomTo = true;
                that.add(layer);
            });
        } else {
            when(readText(file), function (text) {
                that.zoomTo = true;
                that.loadText(text, file.name, undefined, layer);
            });
        }
    }
    else {
        if (file.size > 1000000) {
            alert('File is too large to send to conversion service.  Click here for alternative file conversion options.');
        }
          //TODO: check against list of support extensions to avoid unnecessary forwarding
        else {
            if (!confirm('No local format handler.  Click OK to try to convert via our web service.')) {
                return;
            }
            // generate form data to submit text for conversion
            var formData = new FormData();
            formData.append('input_file', file);

            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    var response = xhr.responseText;
                    if (response.substring(0,1) !== '{') {
                        console.log(response);
                        alert('Error trying to convert: ' + file.name);
                    }
                    else {
                        that.zoomTo = true;
                        that.loadText(response, file.name, "GEOJSON");
                    }
                }
            };
            xhr.open('POST', that.supportServer + '/convert');
            xhr.send(formData);
        }
    }
};

module.exports = GeoDataCollection;

