/*global require,Cesium,L,URI,$,toGeoJSON,proj4,proj4_epsg,alert,confirm*/

"use strict";

var corsProxy = require('./corsProxy');
var TableDataSource = require('./TableDataSource');
var GeoData = require('./GeoData');
var readText = require('./readText');

var defaultValue = Cesium.defaultValue;
var DeveloperError = Cesium.DeveloperError;
var FeatureDetection = Cesium.FeatureDetection;
var KmlDataSource = Cesium.KmlDataSource;
var when = Cesium.when;

/**
* @class GeoDataCollection is a collection of geodata instances
* @name GeoDataCollection
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
    this.dataSourceCollection = new Cesium.DataSourceCollection();
    
    this.GeoDataAdded = new Cesium.Event();
    this.GeoDataRemoved = new Cesium.Event();
    this.ViewerChanged = new Cesium.Event();
    this.ShareRequest = new Cesium.Event();

    // IE versions prior to 10 don't support CORS, so always use the proxy.
    this._alwaysUseProxy = (FeatureDetection.isInternetExplorer() && FeatureDetection.internetExplorerVersion()[0] < 10);
    
    //load list of available services for GeoDataCollection
    Cesium.loadJson('./data_sources.json').then(function (obj) {
        that.serviceList = obj;
    });
};


/**
* Set the viewer to use with the geodata collection
* TODO: Change this to use visualizers instead of embedded code
*
* @memberof GeoDataCollection
*
*/
GeoDataCollection.prototype.setViewer = function(obj) {
      //If A cesium scene present then this is in cesium globe
    this.scene = obj.scene;
    this.map = obj.map;

    if (this.scene) {
        this.imageryLayersCollection = this.scene.globe.imageryLayers;
    }
    this.ViewerChanged.raiseEvent(this, obj);
    
    //re-request all the layers on the new map
    for (var i = 0; i < this.layers.length; i++) {
        console.log('Redisplay Layer', this.layers[i].name);
        this.layers[i].skip = true;
        this.sendLayerRequest(this.layers[i]);
    }
};


/**
* Package up a share request and send an event
*
* @memberof GeoDataCollection
*
*/
GeoDataCollection.prototype.setShareRequest = function(obj) {
    var request = this.getShareRequest(obj);
    this.ShareRequest.raiseEvent(this, request);
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

/**
* Add a new geodata item
*
* @memberof GeoDataCollection
*
*/
GeoDataCollection.prototype.add = function(layer) {
    if (layer.skip) {
        layer.skip = false;
        return layer;
    }
    layer.name = this._getUniqueLayerName(layer.name);
    this.layers.push(layer);
    this.GeoDataAdded.raiseEvent(this, layer);
    return layer;
};

/**
* Get a geodata item based on an id (index)
*
* @memberof GeoDataCollection
*
*/
GeoDataCollection.prototype.get = function(id) {
    return this.layers[id];
};

/**
* Remove a geodata item based on an id (index)
*
* @memberof GeoDataCollection
*
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
        else {
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
    else {
        layer.primitive.show = val;
    }
};


// -------------------------------------------
// Handle loading and sharing visualizations
// -------------------------------------------
GeoDataCollection.prototype._stringify = function() {
    var str_layers = [];
    for (var i = 0; i < this.layers.length; i++) {
        var layer = this.layers[i];
        var obj = {name: layer.name, type: layer.type, proxy:layer.proxy,
                   url: layer.url, extent: layer.extent};
        str_layers.push(obj);
    }
    return JSON.stringify(str_layers);
};

// Parse out the unstringified objects and turn them into Cesium objects
GeoDataCollection.prototype._parseObject = function(obj) {
    for (var p in obj) {
        if (p === 'west') {
            return new Cesium.Rectangle(obj.west, obj.south, obj.east, obj.north);
        }
        else if (p === 'red') {
            return new Cesium.Color(obj.red, obj.green, obj.blue, obj.alpha);
        }
        else if (typeof obj[p] === 'object') {
            obj[p] = this._parseObject(obj[p]);
        }
        else {
            return obj;
        }
    }
};

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
 * Loads a GeoDataCollection based on a url, replacing any existing data.
 *
 * @param {Object} url The url to be processed.
 *
 * @returns {Promise} a promise that will resolve when the CZML is processed.
 */
GeoDataCollection.prototype.loadUrl = function(url) {
    //URI suport for over-riding uriParams - put presets in uri_params
    var uri = new URI(url);
    var uri_params = {
        vis_id: undefined,
        vis_str: undefined,
        data_url: undefined
    };
    var overrides = uri.search(true);
    $.extend(uri_params, overrides);
    
    //store the current server location for use when creating urls
    this.visServer = uri.protocol() + '://' + uri.host();
    
        //TODO: remove need for this
    var visStore = 'http://localhost:3000';

    var visUrl = uri_params.vis_url;
    var visID = uri_params.vis_id;
    if (visID) {
        visUrl = visStore + '/get_rec?vis_id=' + visID;
    }
    var visStr = uri_params.vis_str;
    
    var dataUrl = uri_params.data_url;
    var dataFormat = uri_params.format;
    
    var that = this;
    
    //Initialize the view based on vis_id if passed in url
    if (visUrl) {
        //call to server to get json record
        Cesium.when(Cesium.loadJson(visUrl), function(obj) {
                //figure out this for versioning
//            this.visID = obj.visID;
            if (obj.camera !== undefined) {
                var e = JSON.parse(obj.camera);
                var camLayer = { name: 'Camera', extent: new Cesium.Rectangle(e.west, e.south, e.east, e.north)};
                that.zoomTo = true;
                that.GeoDataAdded.raiseEvent(that, camLayer);
            }
           
              //loop through layers adding each one
            var layers = that._parseLayers(obj.layers);
            for (var i = 0; i < layers.length; i++) {
                that.sendLayerRequest(layers[i]);
            }
        });
    }
    else if (visStr) {
        var obj = JSON.parse(visStr);
        if (obj.camera !== undefined) {
            var e = JSON.parse(obj.camera);
            var camLayer = { name: 'Camera', extent: new Cesium.Rectangle(e.west, e.south, e.east, e.north)};
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
        Cesium.loadText(this.dataUrl).then(function (text) { 
            that.zoomTo = true;
            that.loadText(text, that.dataUrl, that.dataFormat);
        });
    }
};


/**
* Get a share request object based on the description passed
*
* @memberof GeoDataCollection
*
*/
GeoDataCollection.prototype.getShareRequest = function( description ) {
    var request = {};
    
    //TODO: bundle up datesets for smaller drag and drop data
    request.layers = this._stringify();
    request.version = '0.0.02';
    request.camera = JSON.stringify(description.camera); //just extent for now
//     if (this.visID) {
//        request.parent = this.visID;
//    }
    request.image = description.image;
    return request;
};

GeoDataCollection.prototype.getShareRequestURL = function( request ) {
    var img = request.image;
    request.image = undefined;
    var requestStr = JSON.stringify(request);
    var url = this.visServer + '?vis_str=' + encodeURIComponent(requestStr);
    request.image = img;
    return url;
};


// -------------------------------------------
// Handle data sources from text
// -------------------------------------------
function endsWith(str, suffix) {
    var strLength = str.length;
    var suffixLength = suffix.length;
    return (suffixLength < strLength) && (str.indexOf(suffix, strLength - suffixLength) !== -1);
}

/**
* Determine if a data format is natively supported based on the extension
*
* @memberof GeoDataCollection
*
*/
GeoDataCollection.prototype.formatSupported = function(srcname) {
    var supported = [".CZML", ".GEOJSON", ".GJSON", ".TOPOJSON", ".JSON", ".TOPOJSON", ".KML", ".KMZ", ".GPX", ".CSV"];
    var sourceUpperCase = srcname.toUpperCase();
    for (var i = 0; i < supported.length; i++) {
        if (endsWith(sourceUpperCase, supported[i])) {
            return true;
        }
    }
    return false;
};

/**
* Load text as a geodata item
*
* @memberof GeoDataCollection
*
 * @param {string} text The text to be processed.
 * @param {string} srcname The text file name to get the format extension from.
 *
*/
GeoDataCollection.prototype.loadText = function(text, srcname, format) {
    var DataSource;
    var sourceUpperCase = srcname.toUpperCase();
    if (format !== undefined) {
        sourceUpperCase = (srcname + '.' + format).toUpperCase();
    }
    console.log(sourceUpperCase);
    
    var layer;
    var dom;

    //TODO: !!! save dataset text for dnd data

        //Natively handled data sources in cesium
    if (endsWith(sourceUpperCase, ".CZML")) {
        var czmlDataSource = new Cesium.CzmlDataSource();
        czmlDataSource.load(JSON.parse(text));
        this.dataSourceCollection.add(czmlDataSource);
            //add it as a layer
        layer = new GeoData({ name: srcname, type: 'DATA' });
        layer.dataSource = czmlDataSource;
        layer.extent = getDataSourceExtent(czmlDataSource);
        this.add(layer);
    }
    else if (endsWith(sourceUpperCase, ".GEOJSON") ||
            endsWith(sourceUpperCase, ".GJSON") ||
            endsWith(sourceUpperCase, ".JSON") ||
            endsWith(sourceUpperCase, ".TOPOJSON")) {
        layer = new GeoData({ name: srcname, type: 'DATA' });
        this.addGeoJsonLayer(JSON.parse(text), srcname, layer);
    } 
        //Convert in browser using toGeoJSON https://github.com/mapbox/togeojson    
    else if (endsWith(sourceUpperCase, ".KML")) {
        layer = new GeoData({ name: srcname, type: 'DATA' });
        dom = (new DOMParser()).parseFromString(text, 'text/xml');    
        this.addGeoJsonLayer(toGeoJSON.kml(dom), srcname, layer);
    } 
    else if (endsWith(sourceUpperCase, ".GPX")) {
        layer = new GeoData({ name: srcname, type: 'DATA' });
        dom = (new DOMParser()).parseFromString(text, 'text/xml');    
        this.addGeoJsonLayer(toGeoJSON.gpx(dom), srcname, layer);
    } 
        //Handle table data using TableDataSource plugin        
    else if (endsWith(sourceUpperCase, ".CSV")) {
        var tableDataSource = new TableDataSource();
        tableDataSource.loadText(text);
        this.dataSourceCollection.add(tableDataSource);
        
        layer = new GeoData({name: srcname, type: 'DATA' });
        layer.dataSource = tableDataSource;
        layer.extent = tableDataSource.dataset.getExtent();
        this.add(layer);
    }
        //Return false so widget can try to send to conversion service
    else {
        console.log('There is no handler for this file based on its extension : ' + srcname);
        return false;
    }
    //TODO: fix this hack
    if (layer !== undefined) {
        layer.url = srcname;
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
    obj.crs = {"type":"EPSG","properties":{"code":"4326"}};
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

function _gml2coord(posList) {
    var pnts = posList.split(/[ ,]+/);
    var coords = [];
    for (var i = 0; i < pnts.length; i+=2) {
        coords.push([parseFloat(pnts[i+1]), parseFloat(pnts[i])]);
    }
    return coords;
}

function _convertFeature(feature, geom_type) {
    var newFeature = {type: "Feature"};
    var pts = (geom_type === 'Point') ? _gml2coord(feature.pos)[0] : _gml2coord(feature.posList);
    newFeature.geometry = { "type": geom_type, "coordinates": pts };
    return newFeature;
}           
            
            
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
    
    if (layer.proxy || this.shouldUseProxy(request)) {
        request = corsProxy.getURL(request);
    }

    Cesium.when(Cesium.loadText(request), function (text) {
        //convert to geojson
        var obj;
        if (text[0] === '{') {
            obj = JSON.parse(text);
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
        that.addGeoJsonLayer(obj, layer.name+'.geojson', layer);
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
        var url = 'http://' + uri.hostname() + uri.path();
        if (layer.proxy || this.shouldUseProxy(url)) {
            proxy = corsProxy;
        }

        if (layerName === 'REST') {
            provider = new Cesium.ArcGisMapServerImageryProvider({
                url: url,
                proxy: proxy
            });
        }
        else {
            provider = new Cesium.WebMapServiceImageryProvider({
                url: url,
                layers : encodeURIComponent(layerName),
                parameters: {
                    'format':'image/png',
                    'transparent':'true',
                    'styles': ''
                },
                proxy: proxy
            });
        }
        layer.primitive = this.imageryLayersCollection.addImageryProvider(provider);
    }
    else {
        var server = request.substring(0, request.indexOf('?'));
        if (layer.proxy || this.shouldUseProxy(server)) {
           server = corsProxy.getURL(server);
        }
        
        if (layerName === 'REST') {
            provider = new L.esri.TiledMapLayer(server);
        }
        else {
            provider = new L.tileLayer.wms(server, {
                layers: layerName,
                format: 'image/png',
                transparent: true
            });
        }
        layer.primitive = provider;
        this.map.addLayer(provider);
    }

    this.add(layer);
};

// Show csv table data
GeoDataCollection.prototype._viewTable = function(request, layer) {
    var that = this;
        //load text here to let me control functions called after
    Cesium.when(Cesium.loadText(request), function (text) {
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
            that.addGeoJsonLayer(dispPoints, layer.name+'.geojson', layer);
        }
    });
};

// Load data file based on extension if loaded as DATA layer
GeoDataCollection.prototype._viewData = function(request, layer) {
    var that = this;
        //load text here to let me control functions called after
    Cesium.when(Cesium.loadText(request), function (text) {
        that.loadText(text, layer.name);
    });
};

// Build a layer based on the description
GeoDataCollection.prototype.sendLayerRequest = function(layer) {
    var request = layer.url;
//    console.log('LAYER REQUEST:',request);
    
    // Deal with the different data Services
    if (layer.type === 'WFS' || layer.type === 'REST' || layer.type === 'GME') {
        this._viewFeature(request, layer);
    }
    else if (layer.type === 'WMS') {
        this._viewMap(request, layer);
    }
    else if (layer.type === 'CSV') {
        this._viewTable(request, layer);
    }
    else if (layer.type === 'DATA') {
        this._viewData(request, layer);
    }
//    if (layer.type === 'CKAN') {
//        this._viewFeature(request, layer);
//    }
    else {
        throw new DeveloperError('Creating layer for unsupported service: '+layer.type);
    }
};


/**
* Build a query to get feature from service
*
* @memberof GeoDataCollection
*
*/
GeoDataCollection.prototype.getOGCFeatureURL = function(description) {
    console.log('Getting ', description.Name);
    
    var request = description.base_url;
    var name  = encodeURIComponent(description.Name);
    if (description.type === 'WMS') {
        request += '?service=wms&request=GetMap&layers=' + name;
        return request;
    }
    else if (description.type === 'WFS') {
        description.version = 1.1;
        request += '?service=wfs&request=GetFeature&typeName=' + name + '&version=' + description.version + '&srsName=EPSG:4326';
        
        //HACK to find out if GA esri service
        if (request.indexOf('www.ga.gov.au') !== -1) {
            description.esri = true;
        }
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
//    else if (description.type === 'CKAN') {
//        for (var i = 0; i < description.resources.length; i++) {
//            var format = description.resources[i].format.toUpperCase();
//            if (format === 'GEOJSON' || format === 'JSON' || format === 'KML') {
//                request = description.resources[i].url;
//                break;
//            }
//        }
//        return request;
//    }
    else {
        throw new Cesium.DeveloperError('Getting feature for unsupported service: '+description.type);
    }
    
    if (description.extent) {
        var ext = description.extent;
        var pos = [ Cesium.Math.toDegrees(ext.west), Cesium.Math.toDegrees(ext.south), 
                    Cesium.Math.toDegrees(ext.east), Cesium.Math.toDegrees(ext.north)];
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


function _recurseLayerList(layer_src, layers) {
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
* @memberof GeoDataCollection
*
*/
GeoDataCollection.prototype.handleCapabilitiesRequest = function(text, description) {
    var json_gml;
    if (text[0] === '{') {
        json_gml = JSON.parse(text);
    }
    else {
        json_gml = $.xml2json(text);
    }
    
//    console.log(json_gml);
    
    //find the array of available layers
    var i;
    var layers = [];
    if (description.type === 'WFS') {
        layers = json_gml.FeatureTypeList.FeatureType;

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
    }
    else if (description.type === 'WMS') {
        var layer_src = [json_gml.Capability.Layer];
        _recurseLayerList(layer_src, layers);
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
        description.extent = Cesium.Rectangle.fromDegrees(parseFloat(ext.xmin), parseFloat(ext.ymin), 
            parseFloat(ext.xmax), parseFloat(ext.ymax));
    }
    else if (description.type === 'CSV') {
        layers = json_gml.Layer;
    }
    else if (description.type === 'GME') {
        layers = json_gml.Layer;
    }
//    else if (description.type === 'CKAN') {
//        layers = json_gml.result.results;
//        for (i = 0; i < layers.length; i++) {
//            layers[i].Name = layers[i].name;
//        }
 //   }
    else {
        throw new DeveloperError('Getting capabilities for unsupported service: ' + description.type);
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
* Get capabilities from service
*
* @memberof GeoDataCollection
*
*/
GeoDataCollection.prototype.getCapabilities = function(description, callback) {
    var request;
    if (description.type === 'CSV' || description.type === 'GME' ) {
        request = description.base_url;
    }
    else if (description.type === 'REST') {
        request = description.base_url + '?f=pjson';
    }
//    else if (description.type === 'CKAN') {
//        request = description.base_url + '/api/3/action/package_search?q=GeoJSON&rows=50';
//    }
    else {
        request = description.base_url + '?service=' + description.type + '&request=GetCapabilities';
    }
    
    console.log('CAPABILITIES REQUEST:',request);
    if (description.proxy || this.shouldUseProxy(request)) {
        request = corsProxy.getURL(request);
    }
    
    var that = this;
    Cesium.when(Cesium.loadText(request), function(text) {
        that.handleCapabilitiesRequest(text, description);
        callback(description);
    });
};


// ----------------
// Add czml and geojson
// ----------------

/**
* Get the geographic extent of a datasource
*
* @memberof GeoDataCollection
* TODO: use Availability to determine time range and then use to getValues
*
*/
function getDataSourceExtent(dataSource) {
    var collection = dataSource.dynamicObjects;
    var objects = collection.getObjects();
    var e0;
    
    var julianDate = new Cesium.JulianDate();

    var cArray;

    for (var i = 0; i < objects.length; i++) {
        if (objects[i].vertexPositions) {
            cArray = objects[i].vertexPositions.getValue(julianDate);
        }
        else if (objects[i].position) {
            cArray = [objects[i].position.getValue(julianDate)];
        }
        else {
            continue;
        }
        var cartArray = Cesium.Ellipsoid.WGS84.cartesianArrayToCartographicArray(cArray);
        var e1 = Cesium.Rectangle.fromCartographicArray(cartArray);
        if (e0 === undefined) {
            e0 = e1;
        }
        else {
            var west = Math.min(e0.west, e1.west);
            var south = Math.min(e0.south, e1.south);
            var east = Math.max(e0.east, e1.east);
            var north = Math.max(e0.north, e1.north);
            e0 = new Cesium.Rectangle(west, south, east, north);
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
    var cartographic = Cesium.Cartographic.fromDegrees(p.x, p.y);
    return Cesium.Ellipsoid.WGS84.cartographicToCartesian(cartographic);
}

// Create a reproject func for GeoJsonDataSource to use
function createCesiumReprojectFunc(proj) {
    return function(coordinates) {
        return myCrsFunction(coordinates, proj);
    };
}

// if we want cesium GeoJsonDataSource to do it
function setCesiumReprojectFunc(code) {   
    Cesium.GeoJsonDataSource.crsNames[code] = createCesiumReprojectFunc(code);
}
*/

function pntReproject(coordinates, id) {
    var source = new proj4.Proj(proj4_epsg[id]);
    var dest = new proj4.Proj('EPSG:4326');
    var p = new proj4.Point(coordinates[0], coordinates[1]);
    proj4(source, dest, p);      //do the transformation.  x and y are modified in place
    return [p.x, p.y];
}


// Get the crs code from the geojson
function getCrsCode(gjson_obj) {
    if (gjson_obj.crs === undefined || gjson_obj.crs.type !== 'EPSG') {
        return "";
    }
    var code = gjson_obj.crs.properties.code;
    if (code === '4283') {
        code = '4326';
    }
    return gjson_obj.crs.type + ':' + code;
}

//  TODO: get new proj4 strings from REST service
//  requires asynchronous layer loading so on hold for now
function addProj4Text(code) {
        //try to get from a service
    var url = 'http://spatialreference.org/ref/epsg/'+code.substring(5)+'/proj4/';
    Cesium.loadText(url).then(function (proj4Text) {
        console.log('Adding new string for ', code, ': ', proj4Text, ' before loading datasource');
        proj4_epsg[code] = proj4Text;
    });
}

// Set the Cesium Reproject func if not already set - return false if can't set
function supportedProjection(code) {
    return proj4_epsg.hasOwnProperty(code);
}

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

function reprojectGeoJSON(obj, crs_code) {
    filterValue(obj, 'coordinates', function(obj, prop) { obj[prop] = filterArray(obj[prop], function(pts) {
            return reprojectPointList(pts, crs_code);
        });
    });
    obj.crs.properties.code = '4326';
}

// -------------------------------------------
// Reduce the resolution of a point list in degrees
// -------------------------------------------
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
    console.log(pts.length, 'points reduced to', pts_out.length);
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


//TODO: think about this in a web worker
//TODO: if we preprocess the reproject than we can use this on non-WGS84 data
function downsampleGeoJSON(obj) {
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

//----------------------------
// Random color generator
//----------------------------
/*
var line_palette = [
    [204, 197, 24, 255],
    [104, 197, 124, 255],
    [104, 107, 224, 255],
    [230, 87, 74, 255],
    [104, 197, 24, 255],
    [104, 227, 124, 255],
    [104, 227, 124, 255]];
var point_palette = [
    [200, 200, 0, 255], 
    [200, 0, 0, 255], 
    [0, 200, 200, 255], 
    [0, 200, 0, 255], 
    [0, 0, 200, 255], 
    [200, 0, 200, 255], 
    [200, 200, 200, 255]];
var palette_idx = 0;

function getRandomColor(palette) {
    var clr = palette[palette_idx++ % palette.length];
    return new Cesium.Color(clr[0]/255, clr[1]/255, clr[2]/255, clr[3]/255);
}
*/

var line_palette = {
    minimumRed : 0.3,
    minimumGreen : 0.3,
    minimumBlue : 0.3,
    maximumRed : 0.8,
    maximumGreen : 0.8,
    maximumBlue : 0.8,
    alpha : 1.0
};
var point_palette = {
    minimumRed : 0.5,
    minimumGreen : 0.5,
    minimumBlue : 0.5,
    maximumRed : 1.0,
    maximumGreen : 1.0,
    maximumBlue : 1.0,
    alpha : 1.0
};

function getRandomColor(palette, seed) {
    console.log(seed);
    if (seed !== undefined) {
        if (typeof seed === 'string') {
            var val = 0;
            for (var i = 0; i < seed.length; i++) {
                val += seed.charCodeAt(i);
            }
            seed = val;
        }
        Cesium.Math.setRandomNumberSeed(seed);
    }
    return Cesium.Color.fromRandom(palette);
}

function getCesiumColor(clr) {
    if (clr instanceof Cesium.Color) {
        return clr;
    }
    return new Cesium.Color(clr.red, clr.green, clr.blue, clr.alpha);
}




/**
* Add a GeoJson object as a geodata datasource
*
* @memberof GeoDataCollection
* TODO: use Availability to determine time range and then use to getValues
*
*/
GeoDataCollection.prototype.addGeoJsonLayer = function(obj, srcname, layer) {
    //set default layer styles
    console.log(layer);
    if (layer.style === undefined) {
        layer.style = {line: {}, point: {}, polygon: {}};
        layer.style.line.color = getRandomColor(line_palette, layer.name);
        layer.style.line.width = 2;
        layer.style.point.color = getRandomColor(point_palette, layer.name);
        layer.style.point.size = 10;
        layer.style.polygon.color = layer.style.line.color;
        layer.style.polygon.fill = false;  //off by default for perf reasons
        layer.style.polygon.fillcolor = layer.style.line.color;
        layer.style.polygon.fillcolor.alpha = 0.75;
    }
    
    var newDataSource = new Cesium.GeoJsonDataSource();
    
    //update default point/line/polygon
    var defaultPoint = newDataSource.defaultPoint;
    var point = new Cesium.DynamicPoint();
    point.color = new Cesium.ConstantProperty(getCesiumColor(layer.style.point.color));
    point.pixelSize = new Cesium.ConstantProperty(layer.style.point.size);
    point.outlineColor = new Cesium.ConstantProperty(Cesium.Color.BLACK);
    point.outlineWidth = new Cesium.ConstantProperty(1);
    defaultPoint.point = point;
    
    var defaultLine = newDataSource.defaultLine;
    var polyline = new Cesium.DynamicPolyline();
    var material = new Cesium.ColorMaterialProperty();
    material.color = new Cesium.ConstantProperty(getCesiumColor(layer.style.line.color));
    polyline.material = material;
    polyline.width = new Cesium.ConstantProperty(layer.style.line.width);
    defaultLine.polyline = polyline;

    var defaultPolygon = newDataSource.defaultPolygon;
    
    defaultPolygon.polyline = polyline;
    
    var polygon = new Cesium.DynamicPolygon();
    polygon.fill = new Cesium.ConstantProperty(layer.style.polygon.fill);
    defaultPolygon.polygon = polygon;
    
    material = new Cesium.ColorMaterialProperty();
    material.color = new Cesium.ConstantProperty(getCesiumColor(layer.style.polygon.fillcolor));
    polygon.material = material;
    
   //Reprojection and downsampling
    var crs_code = getCrsCode(obj);
    if (crs_code !== '' && crs_code !== 'EPSG:4326') {
        if (!supportedProjection(crs_code)) {
//            addProj4Text(code); // post POC
            console.log('Unsupported data projection:', crs_code);
            return;
        }
        else {
            reprojectGeoJSON(obj, crs_code);
        }
    }

    //downsample object if huge
    downsampleGeoJSON(obj);
    
    if (this.map === undefined) {
            //create the object
        newDataSource.load(obj);
        this.dataSourceCollection.add(newDataSource);
            //add it as a layer
        layer.dataSource = newDataSource;
        if (!layer.extent) {
            layer.extent = getDataSourceExtent(newDataSource);
        }
    }
    else {
        var style = {
            "color": layer.style.line.color.toCssColorString(),
            "weight": layer.style.line.width,
            "opacity": 0.9
        };

        var geojsonMarkerOptions = {
            radius: layer.style.point.size / 2.0,
            fillColor: layer.style.point.color.toCssColorString(),
            fillOpacity: 0.9,
            color: "#000",
            weight: 1,
            opacity: 0.9
        };

/*        
         // icons will show up for leaflet print, but unable to set color
        var geojsonIcon = L.icon({
            iconUrl: 'images/pow32.png'
        });
*/
        // GeoJSON
        console.log(obj);
        layer.primitive = L.geoJson(obj, {
            style: style,
            pointToLayer: function (feature, latlng) {
                return L.circleMarker(latlng, geojsonMarkerOptions);
            }
        }).addTo(this.map);
    }
    return this.add(layer);
};

GeoDataCollection.prototype.shouldUseProxy = function(url) {
    if (!this._alwaysUseProxy) {
        return false;
    } else if (url.indexOf('http') < 0) {
        return false;
    }
    return true;
};

GeoDataCollection.prototype.addFile = function(file) {
    var that = this;

    if (this.formatSupported(file.name)) {
        if (file.name.match(/.kmz$/i)) {
            var kmlLayer = new GeoData({ name: file.name, type: 'DATA' });

            var dataSource = new KmlDataSource(corsProxy);
            when(dataSource.loadKmz(file, file.name), function() {
                kmlLayer.extent = getDataSourceExtent(dataSource);
            });
            this.dataSourceCollection.add(dataSource);

            kmlLayer.primitive = dataSource;
            this.add(kmlLayer);
        } else {
            when(readText(file), function (text) {
                that.zoomTo = true;
                that.loadText(text, file.name);
            });
        }
    }
    else {
        if (file.size > 1000000) {
            alert('File is too large to send to conversion service.  Click here for alternative file conversion options.');
        }
        else if (false) {
                //TODO: check against list of support extensions
            alert('File format is not supported by conversion service.  Click here for alternative file conversion options.');
        }
        else {
            if (!confirm('No local format handler.  Click OK to convert via our web service.')) {
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
                        that.loadText(response, file.name+'.geojson');
                    }
                }
            };
            xhr.open('POST', that.geoDataManager.visStore + '/convert');
            xhr.send(formData);
        }
    }
};

module.exports = GeoDataCollection;

