

"use strict";

var TableDataSource = require('./TableDataSource');
var GeoData = require('./GeoData');


var defaultValue = Cesium.defaultValue;

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
    this.shareRequest = false;
    
    this.visStore = 'http://geospace.research.nicta.com.au:3000';

    var that = this;
    
    //Init the dataSourceCollection
    this.dataSourceCollection = new Cesium.DataSourceCollection();
    
    this.GeoDataAdded = new Cesium.Event();
    this.GeoDataRemoved = new Cesium.Event();
    this.ViewerChanged = new Cesium.Event();
    this.ShareRequest = new Cesium.Event();
    
    //load list of available services for GeoDataCollection
    Cesium.loadJson('./data_sources.json').then(function (obj) {
        that.serviceList = obj;
    });
}


/**
* Set the viewer to use with the geodata collection
* TODO: Change this to use visualizers instead of embedded code
*
* @memberof GeoDataCollection
*
*/
GeoDataCollection.prototype.setViewer = function(obj) {
      //If A cesium scene present then this is in cesium globe
    var scene = obj.scene;
    var map = obj.map;

    if (scene) {
        this.dataSourceDisplay = new Cesium.DataSourceDisplay(scene, this.dataSourceCollection);
        this.imageryLayersCollection = scene.globe.imageryLayers;
    }
    else {
        if (this.dataSourceDisplay !== undefined) {
            this.dataSourceDisplay.destroy();
        }
    }
    this.ViewerChanged.raiseEvent(this, obj);
    
    for (var i = 0; i < this.layers.length; i++) {
        console.log('Redisplay Layer', this.layers[i].name);
        this.layers[i].map = obj.map;
        this.layers[i].skip = true;
        this.sendLayerRequest(this.layers[i]);
    }
}


/**
* Package up a share request and send an event
*
* @memberof GeoDataCollection
*
*/
GeoDataCollection.prototype.setShareRequest = function(obj) {
    this.shareRequest = false;
    var request = this.getShareRequest(obj);
    
    this.ShareRequest.raiseEvent(this, request);
}


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
}

/**
* Update the GeoDataCollection based on the current time
*
* @memberof GeoDataCollection
*
*/
GeoDataCollection.prototype.update = function(date) {
    if (this.dataSourceDisplay !== undefined && !this.dataSourceDisplay.isDestroyed()) {
        this.dataSourceDisplay.update(date);
    }
}

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
}

/**
* Get a geodata item based on an id (index)
*
* @memberof GeoDataCollection
*
*/
GeoDataCollection.prototype.get = function(id) {
    return this.layers[id];
}

/**
* Remove a geodata item based on an id (index)
*
* @memberof GeoDataCollection
*
*/
GeoDataCollection.prototype.remove = function(id) {
    var layer = this.get(id);
    if (layer.dataSource) {
        if (this.dataSourceCollection.contains(layer.dataSource)) {
            this.dataSourceCollection.remove(layer.dataSource);
        }
        else {
            layer.dataSource.destroy();
        }
    }
    else {
        this.imageryLayersCollection.remove(layer.primitive);
    }
    this.layers.splice(id, 1);
    this.GeoDataRemoved.raiseEvent(this, layer);
}


/**
* Set whether to show a geodata item based on id
*
 * @param {Object} layer The layer to be processed.
 * @param {Boolean} val The setting of the show parameter.
*
*/
GeoDataCollection.prototype.show = function(layer, val) {
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
}


// -------------------------------------------
// Handle loading and sharing visualizations
// -------------------------------------------
GeoDataCollection.prototype._stringify = function() {
    var str_layers = [];
    for (var i = 0; i < this.layers.length; i++) {
        var obj = {};
        for (var prop in this.layers[i]) {
            if (this.layers[i].hasOwnProperty(prop) && prop !== 'primitive' 
                && prop !== 'dataSource') {
                obj[prop] = this.layers[i][prop];
            }
        }
        str_layers.push(obj);
    }
    return JSON.stringify(str_layers);
}

GeoDataCollection.prototype._parse = function(str_layers) {
    var layers = JSON.parse(str_layers);
    var obj_layers = [];
    for (var i = 0; i < layers.length; i++) {
        var layer = layers[i];
        for (var p in layer) {
            //TODO: fix this and make it more general if possible
            if (layer[p].west) {
                var e = layer[p];
                layer[p] = new Cesium.Rectangle(e.west, e.south, e.east, e.north);
            }
        }
        obj_layers.push(layer);
    }
    return obj_layers;
}



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
        vis_server: this.visStore,
        vis_id: undefined,
        data_url: undefined
    };
    var overrides = uri.search(true);
    $.extend(uri_params, overrides);

    this.visStore = uri_params.vis_server;
    this.visID = uri_params.vis_id;
    this.dataUrl = uri_params.data_url;
    
    var that = this;
   
    //TODO: support more than 1 dataurl/visID
    //Initialize the view based on vis_id if passed in url
    if (this.visID) {
        //call to server to get json record
        var url = this.visStore + '/get_rec?vis_id=' + this.visID;
        Cesium.when(Cesium.loadJson(url), function(obj) {
            console.log(obj);
            that.visID = obj._id;
            var cam = JSON.parse(obj.camera);
            //TODO: need to come up with general cam parameters for 2D/3D
              //loop through layers adding each one
            var layers = that._parse(obj.layers);
            for (var i = 0; i < layers.length; i++) {
                that.sendLayerRequest(layers[i]);
            }
        });
    }
    else if (this.dataUrl) {
        Cesium.loadText(this.dataUrl).then(function (text) { 
            that.loadText(text, that.dataUrl);
        });
    }
}


/**
* Get a share request object based on the description passed
*
* @memberof GeoDataCollection
*
*/
GeoDataCollection.prototype.getShareRequest = function( description ) {
    var request = {};
    
    request.title = '';
    request.description = '';
    var tags = [];
    for (var i = 0; i < this.layers.length; i++) {
        tags.push(this.layers[i].name);
    }
    request.tags = tags.toString();
    //TODO: bundle up datesets for smaller drag and drop data
    request.layers = this._stringify();
    request.version = '0.0.01';
    request.image = description.image;
    var cam = description.camera;
    if (cam !== undefined) {
        request.camera = JSON.stringify({ e: cam.positionWC, v: cam.directionWC, u: cam.upWC });
    }
    if (this.visID) {
        request.parent = this.visID;
    }
    return request;
}

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
    var supported = [".CZML", ".GEOJSON", ".JSON", ".TOPOJSON", ".KML", ".GPX", ".CSV"];
    var sourceUpperCase = srcname.toUpperCase();
    for (var i = 0; i < supported.length; i++) {
        if (endsWith(sourceUpperCase, supported[i])) {
            return true;
        }
    }
    return false;
}

/**
* Load text as a geodata item
*
* @memberof GeoDataCollection
*
 * @param {string} text The text to be processed.
 * @param {string} srcname The text file name to get the format extension from.
 *
*/
GeoDataCollection.prototype.loadText = function(text, srcname) {
    var DataSource;
    var sourceUpperCase = srcname.toUpperCase();
    console.log(sourceUpperCase);
    
    //TODO: save dataset text for dnd data

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
    else if (endsWith(sourceUpperCase, ".GEOJSON") || //
            endsWith(sourceUpperCase, ".JSON") || //
            endsWith(sourceUpperCase, ".TOPOJSON")) {
        layer = new GeoData({ name: srcname, type: 'DATA' });
        this.addGeoJsonLayer(JSON.parse(text), srcname, layer);
        this.add(layer);
    } 
        //Convert in browser using toGeoJSON https://github.com/mapbox/togeojson    
    else if (endsWith(sourceUpperCase, ".KML")) {
        layer = new GeoData({ name: srcname, type: 'DATA' });
        var dom = (new DOMParser()).parseFromString(text, 'text/xml');    
        this.addGeoJsonLayer(toGeoJSON.kml(dom), srcname, layer);
        this.add(layer);
    } 
    else if (endsWith(sourceUpperCase, ".GPX")) {
        layer = new GeoData({ name: srcname, type: 'DATA' });
        var dom = (new DOMParser()).parseFromString(text, 'text/xml');    
        this.addGeoJsonLayer(toGeoJSON.gpx(dom), srcname, layer);
        this.add(layer);
    } 
        //Handle table data using TableDataSource plugin        
    else if (endsWith(sourceUpperCase, ".CSV")) {
        var tableDataSource = new TableDataSource();
        tableDataSource.loadText(text);
        this.dataSourceCollection.add(tableDataSource);
        
        var layer = new GeoData({name: srcname, type: 'DATA' });
        layer.dataSource = tableDataSource;
        layer.extent = tableDataSource.dataset.getExtent();
        this.add(layer);
    }
        //Return false so widget can try to send to conversion service
    else {
        console.log('There is no handler for this file based on its extension : ' + srcname);
        return false;
     }
     return true;
}


// -------------------------------------------
// Convert OGC Data Sources
// -------------------------------------------
//Function to intercept and fix up ESRI REST Json to GeoJSON
//TODO: multipoint, multipolyline, multipolygon
function _EsriRestJson2GeoJson(obj) {
    if (obj.geometryType === undefined || obj.features === undefined || obj.type === 'FeatureCollection') {
        return obj;
    }
    obj.type = "FeatureCollection";
    obj.crs = {"type":"EPSG","properties":{"code":"4326"}};
    for (var i = 0; i < obj.features.length; i++) {
        var feature = obj.features[i];
        feature.type = "Feature";
        feature.properties = feature.attributes;
           //TODO: test this on more instances
        if (obj.geometryType === "esriGeometryPoint") {
            var pts = [feature.geometry.x, feature.geometry.y ];
            var geom = { "type": "Point", "coordinates": pts };
            feature.geometry = geom;
        }
        else if (obj.geometryType === "esriGeometryPolyline") {
            var pts = feature.geometry.paths[0];
            var geom = { "type": "LineString", "coordinates": pts };
            feature.geometry = geom;
        }
        else if (obj.geometryType === "esriGeometryPolygon") {
            var pts = feature.geometry.paths[0];
            var geom = { "type": "Polygon", "coordinates": pts };
            feature.geometry = geom;
        }
    }
    return obj;
}

function _gml2coord(posList) {
    var pnts = posList.split(/[ ,]+/);
    var coords = [];
    for (var i = 0; i < pnts.length; i+=2) {
        coords.push([parseFloat(pnts[i]), parseFloat(pnts[i+1])]);
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
    for (var i = 0; i < obj.featureMember.length; i++) {
           //TODO: get feature properties from non-SHAPE properties
        //feature.properties = feature.attributes;

        //Recursively find features and add to FeatureCollection
        filterValue(obj.featureMember[i], 'Point', function(feature) { newObj.features.push(_convertFeature(feature, 'Point')); });
        filterValue(obj.featureMember[i], 'LineString', function(feature) { newObj.features.push(_convertFeature(feature, 'LineString')); });
        filterValue(obj.featureMember[i], 'Polygon', function(feature) { newObj.features.push(_convertFeature(feature, 'Polygon')); });
    }
    return newObj;
}


// -------------------------------------------
// Connect to OGC Data Sources
// -------------------------------------------

GeoDataCollection.prototype._viewFeature = function(request, layer) {
    var that = this;
    console.log('GeoJSON request', request);
    
    if (layer.proxy) {
        var proxy = new Cesium.DefaultProxy('/proxy/');
        request = proxy.getURL(request);
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
            obj = _EsriGml2GeoJson(obj);
            console.log(obj);
        }
            //TODO: move render target here from addGeoJsonLayer
        layer = that.addGeoJsonLayer(obj, layer.name+'.geojson', layer);
        that.add(layer);
    });
}


//TODO: figure out proxy issues
// Show wms map
GeoDataCollection.prototype._viewMap = function(request, layer) {
    if (layer.map === undefined) {
        var uri = new URI(request);
        var wmsServer = request.substring(0, request.indexOf('?'));
        var params = uri.search(true);
        var layerName = params.layers;
        var url = 'http://' + uri.hostname() + uri.path();
        var provider, proxy;
        if (layer.proxy) {
            proxy = new Cesium.DefaultProxy('/proxy/');
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
                    'styles': '',
                },
                proxy: proxy
            });
        }
        layer.primitive = this.imageryLayersCollection.addImageryProvider(provider);
    }
    else {
        var uri = new URI(request);
        var server = request.substring(0, request.indexOf('?'));
        var params = uri.search(true);
        var layerName = params.layers;
        if (layer.proxy) {
            proxy = new Cesium.DefaultProxy('/proxy/');
            server = proxy.getURL(server);
        }
        
        if (layerName === 'REST') {
            provider = new L.esri.TiledMapLayer(server);
        }
        else {
            provider = new L.tileLayer.wms(server+'%3f', {
                layers: layerName,
                format: 'image/png',
                transparent: true,
                });
        }
        layer.map.addLayer(provider);
    }

    this.add(layer);
}


// Show csv data
GeoDataCollection.prototype._viewTable = function(request, layer) {
    var that = this;
        //load text here to let me control functions called after
    Cesium.when(Cesium.loadText(request), function (text) {
        var tableDataSource = new TableDataSource();
        tableDataSource.loadText(text);
        if (layer.map === undefined) {
            that.dataSourceCollection.add(tableDataSource);
            layer.dataSource = tableDataSource;
        }
        else {
            var pointList = tableDataSource.dataset.getPointList();
            var dispPoints = [];
            for (var i = 0; i < pointList.length; i++) {
                dispPoints.push({ type: 'Point', coordinates: pointList[i].pos});
            }
            L.geoJson(dispPoints).addTo(layer.map);
        }
        that.add(layer);
    });
}

// Build a layer based on the description
GeoDataCollection.prototype.sendLayerRequest = function(layer) {
    var request = layer.url;
    
    console.log('LAYER REQUEST:',request);
    
    // Deal with the different data Services
    if (layer.type === 'WFS' || layer.type === 'REST' || layer.type === 'CKAN' || layer.type === 'GME') {
        this._viewFeature(request, layer);
    }
    else if (layer.type === 'WMS') {
        this._viewMap(request, layer);
    }
    else if (layer.type === 'CSV') {
        this._viewTable(request, layer);
    }
    else {
        throw new DeveloperError('Creating layer for unsupported service: '+layer.type);
    }
}


/**
* Build a query to get feature from service
*
* @memberof GeoDataCollection
*
*/
GeoDataCollection.prototype.getOGCFeatureURL = function(description) {
    console.log('Getting ', description.feature);
    
    var request = description.base_url;
    var name  = encodeURIComponent(description.Name);
    if (description.type === 'WMS') {
        request += '?service=wms&request=GetMap&layers=' + name;
        return request;
    }
    else if (description.type === 'WFS') {
        description.version = '1.1.0';
        request += '?service=wfs&request=GetFeature&typeName=' + name + '&version=1.1.0&srsName=EPSG:4326';
        
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
        request += '/'+description.idx;
        request += '/query?geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&returnGeometry=true&f=pjson';
    }
    else {
        throw new Cesium.DeveloperError('Getting feature for unsupported service: '+description.type);
    }
    
    if (description.extent) {
        var ext = description.extent;
        var pos = [ Cesium.Math.toDegrees(ext.west), Cesium.Math.toDegrees(ext.south), 
                    Cesium.Math.toDegrees(ext.east), Cesium.Math.toDegrees(ext.north)];
        //crazy ogc bbox rules - first is old lon/lat ordering, second is newer lat/lon ordering
        var version = parseFloat(description.version);
        if (description.type === 'WFS' && version <= 1.1) {
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
}


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
    
    console.log(json_gml);
    
   //find the array of available layers
    var layers = [];
    if (description.type === 'WFS') {
        layers = json_gml.FeatureTypeList.FeatureType;
    }
    else if (description.type === 'WMS') {
        var layer_src = [json_gml.Capability.Layer];
        _recurseLayerList(layer_src, layers)
    }
    else if (description.type === 'REST') {
        layers = json_gml.layers;
        for (var i = 0; i < layers.length; i++) {
            layers[i].Name = layers[i].name;
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
    else if (description.type === 'CKAN') {
        layers = json_gml.result.results;
        for (var i = 0; i < layers.length; i++) {
            layers[i].Name = layers[i].name;
        }
        description.extent
    }
    else {
        throw new DeveloperError('Getting capabilities for unsupported service: '+description.type);
    }
    
    //get the version
    if (json_gml.ServiceIdentification) {
        description.version = parseFloat(json_gml.ServiceIdentification.ServiceTypeVersion);
    }
    else if (json_gml.Service) {
        description.version = parseFloat(json_gml.version);
    }
    
    description.Layer = layers;
}

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
    else if (description.type === 'CKAN') {
        request = description.base_url + '/api/3/action/package_search?q=GeoJSON&rows=50';
    }
    else {
        request = description.base_url + '?service=' + description.type + '&request=GetCapabilities';
    }
    
    if (description.proxy) {
        var proxy = new Cesium.DefaultProxy('/proxy/');
        request = proxy.getURL(request);
    }
    console.log('CAPABILITIES REQUEST:',request);
    
    var that = this;
    Cesium.when(Cesium.loadText(request), function(text) {
        that.handleCapabilitiesRequest(text, description);
        callback(description);
    });
}


// ----------------
// Add czml and geojson
// ----------------
function createReprojectFunc(proj) {
    return function(coordinates) {
        return myCrsFunction(coordinates, proj);
    }
}

//Add the already supported strings from the projections file
for (var proj in proj4_epsg ) {
    Cesium.GeoJsonDataSource.crsNames[proj] = createReprojectFunc(proj);
}
    
function addProj4String(crs_code, func) {
    Cesium.loadText('http://spatialreference.org/ref/epsg/'+crs_code.substring(5)+'/proj4/').then(function (proj4Text) {
        console.log('Adding new string for ', crs_code, ': ', proj4Text, ' before loading datasource');
            //Add support to GeoJSONDataSource
//            Cesium.GeoJsonDataSource.crsNames[crs_code] = createReprojectFunc(crs_code);
            //Call the loading function
//            func();
    });
}

function getCrsCode(gjson_obj) {
    if (gjson_obj.crs === undefined || gjson_obj.crs.type !== 'EPSG') {
        return "";
    }
    var code = gjson_obj.crs.properties.code;
    if (code === '4283') {
        code === '4236';
    }
    return gjson_obj.crs.type + ':' + code;
}

function canConvertCrsCode(code) {
    return (Cesium.GeoJsonDataSource.crsNames[code] !== undefined);
}

//convert coord from arbitrary projection to WGS84
function myReproject(coordinates, proj_str) {
    var source = new proj4.Proj(proj_str);
    var dest = new proj4.Proj('EPSG:4326');
    var p = new proj4.Point(coordinates[0], coordinates[1]);
    proj4(source, dest, p);      //do the transformation.  x and y are modified in place
    return [p.x, p.y];
}

//function for GeoJSONDataSource to reproject coords
function myCrsFunction(coordinates, id) {
    var source = new proj4.Proj(proj4_epsg[id]);
    var dest = new proj4.Proj('EPSG:4326');
    var p = new proj4.Point(coordinates[0], coordinates[1]);
    proj4(source, dest, p);      //do the transformation.  x and y are modified in place
    var cartographic = Cesium.Cartographic.fromDegrees(p.x, p.y);
    return Cesium.Ellipsoid.WGS84.cartographicToCartesian(cartographic);
}


function _mergeRectangle(e0, e1) {
    var west = Math.min(e0.west, e1.west);
    var south = Math.min(e0.south, e1.south);
    var east = Math.max(e0.east, e1.east);
    var north = Math.max(e0.north, e1.north);
    return new Cesium.Rectangle(west, south, east, north);
};


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
    var e0, cartArray;
    
    var julianDate = new Cesium.JulianDate();

    for (var i = 0; i < objects.length; i++) {
      if (objects[i].vertexPositions) {
          var cArray = objects[i].vertexPositions.getValue(julianDate);
      }
      else if (objects[i].position) {
          var cArray = [objects[i].position.getValue(julianDate)];
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
          e0 = _mergeRectangle(e0, e1);
      }
}
    return e0;
}

// -------------------------------------------
// Reduce the resolution of a point list in degrees
// -------------------------------------------
function reducePointList(pts, epsilon, limit) {
    if (!(pts[0] instanceof Array)) {
        return pts;  //point
    }
    if (pts.length < 100) {
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
};

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

// find a member by name in the gml
function filterValue(obj, prop, func) {
    for (var p in obj) {
        if (obj.hasOwnProperty(p) === false)
            continue;
        else if (obj[prop] !== undefined) {
            if (func && (typeof func == "function")) {
                (func)(obj[prop]);
            }
        }
        else if (typeof obj[p] === "object") {
            filterValue(obj[p], prop, func);
        }
    }
}

//TODO: think about this in a web worker
//TODO: tune limits, include camera(?), retry if still too big
function downsampleGeoJSON(obj) {
    filterValue(obj, 'coordinates', function(obj) { obj = filterArray(obj, function(pts) {
        return reducePointList(pts, 0.01, 20);
    }); });
}


// Random color generator
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
    return new Cesium.Color(clr[0]/255, clr[1]/255, clr[2]/255, clr[3]/255)
}


function getCesiumColor(clr) {
    if (clr instanceof Cesium.Color) {
        return clr;
    }
    return new Cesium.Color(clr.red, clr.green, clr.blue, clr.alpha)
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
    if (layer.style === undefined) {
        layer.style = {line: {}, point: {}, polygon: {}};
        layer.style.line.color = getRandomColor(line_palette);
        layer.style.line.width = 2;
        layer.style.point.color = getRandomColor(point_palette);
        layer.style.point.size = 10;
        layer.style.polygon.color = layer.style.line.color;
        layer.style.polygon.fill = false;  //off by default for perf reasons
        layer.style.polygon.fillcolor = layer.style.line.color;
        layer.style.polygon.fillcolor.alpha = 0.5;
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
    
   //Reprojection support and downsampling
    var crs_code = getCrsCode(obj);
    if (crs_code !== '' && crs_code !== 'EPSG:4326') {
        //reprojection needs to happen
        //if not in list then need to go to a service to look up
        if (canConvertCrsCode(crs_code)) {
            console.log('GeoJSONDataSource will convert this');
        }
        else {
            console.log('===Going to spatial reference service to try to get proj4 string');
            addProj4String(crs_code, function() {console.log('ADD LOADING FUNC HERE');});
        }
    }
    else {
            //downsample object if huge
            //TODO: if we preprocess the reproject than we can use this on non-WGS84 data
        var obj_size = JSON.stringify(obj).length;
        var cnt = {tot:0, longest:0};
        filterValue(obj, 'coordinates', function(pts) { countPnts(pts, cnt); });
        console.log('finished', cnt);
        if (cnt.longest > 100 && cnt.tot > 100000) {
            downsampleGeoJSON(obj);
            console.log('downsampled object from', obj_size, 'bytes to', JSON.stringify(obj).length);
        }
    }
    
    if (layer.map === undefined) {
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
            "color": "#ff7800",
            "weight": 5,
            "opacity": 0.65
        };

        // GeoJSON
        L.geoJson(obj, {
            style: style
        }).addTo(layer.map);
    }
    return layer;
}

module.exports = GeoDataCollection;

