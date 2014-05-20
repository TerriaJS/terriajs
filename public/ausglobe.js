/*!
 * Copyright(c) 2012-2013 National ICT Australia Limited (NICTA).  All rights reserved.
 */

!function(e){if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.ausglobe=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
"use strict";

var Variable = _dereq_('./Variable');

/*!
 * Copyright(c) 2012-2013 National ICT Australia Limited (NICTA).  All rights reserved.
 */
 
var defaultValue = Cesium.defaultValue;

var EMPTY_OBJECT = {};

var VarType = {LON: 0, LAT: 1, ALT: 2, TIME: 3, SCALAR: 4, ENUM: 5 };

/**
* @class Dataset is a container for table based datasets
* @name Dataset
*
* @alias Dataset
* @internalConstructor
* @constructor
*/
var Dataset = function() {
    this._nodataVal = 1e-34;
    this._rowCnt = 0;
    this._dataShape = undefined;
    this._varID = [];
    this._variables = undefined;
    this._loadingData = false;
};

/**
* Return the geographic extent of the dataset
*
* @memberof Dataset
*
*/
Dataset.prototype.getExtent = function () {
    var minpos = [0, 0, 0];
    var maxpos = [0, 0, 0];
    var type = [VarType.LON, VarType.LAT, VarType.ALT];
    for (var p in type) {
        if (this._varID[type[p]]) {
            minpos[p] = this._variables[this._varID[type[p]]].min;
            maxpos[p] = this._variables[this._varID[type[p]]].max;
        }
    }
    return Cesium.Rectangle.fromDegrees(minpos[0], minpos[1], maxpos[0], maxpos[1]);
}

Dataset.prototype.getMinVal = function () {
    if (this._variables && this._varID[VarType.SCALAR]) {
        return this._variables[this._varID[VarType.SCALAR]].min;
    }
};

Dataset.prototype.getMaxVal = function () {
    if (this._variables && this._varID[VarType.SCALAR]) {
        return this._variables[this._varID[VarType.SCALAR]].max;
    }
};

Dataset.prototype.getMinTime = function () {
    if (this._variables && this._varID[VarType.TIME]) {
        return this._variables[this._varID[VarType.TIME]].time_var.min;
    }
};

Dataset.prototype.getMaxTime = function () {
    if (this._variables && this._varID[VarType.TIME]) {
        return this._variables[this._varID[VarType.TIME]].time_var.max;
    }
};


/**
* Get a list of available scalar and enum type variables
*
* @memberof Dataset
*
*/
Dataset.prototype.getVarList = function () {
    var ret = [];
    for (var v in this._variables) {
        if (this._variables[v].type === VarType.SCALAR || this._variables[v].type === VarType.ENUM) {
            ret.push(v);
        }
    }
    return ret;
};

// Determine the min, max, and type of each variable
Dataset.prototype._processVariables = function () {
    this._varID = [];

    for (var id in this._variables) {
        var variable = this._variables[id];
        //guess var type if not set
        if (variable.type === undefined) {
            variable.guessVarType(id);
        }
        if (variable.type === VarType.TIME) {
            variable.processTimeVar();            //calculate time variables
            //if failed then default type to scalar
            if (variable.time_var === undefined) {
                variable.type = VarType.SCALAR;
            }
        }
        if (variable.type !== VarType.TIME) {
            variable._calculateVarMinMax();            //calculate var min/max
        }
        //deal with enumerated variables
        if (variable.type === VarType.SCALAR && variable.min > variable.max) {
            variable.type = VarType.ENUM;
            variable.processEnumVar();            //calculate enum variables
        }

        //set the varIDs
        for (var vt in VarType) {
            if (this._varID[VarType[vt]] === undefined && variable.type === VarType[vt]) {
                this._varID[VarType[vt]] = id;
            }
        }
    }

    //set variable if preset
    if (this._var_name && this._var_name.length && this._variables[this._var_name]) {
        this._varID[VarType.SCALAR] = this._var_name;
    }

    if (this._varID[VarType.SCALAR] === undefined) {
        this._varID[VarType.SCALAR] = this._varID[VarType.ENUM];
    }
    //set point count
    this._rowCnt = this._variables[this._varID[VarType.SCALAR]].vals.length;

    //save the shape information
    if (this._dataShape === undefined) {
        this._dataShape = [this._rowCnt];
    }
};


/**
* Load a JSON object into a dataset
*
* @memberof Dataset
* NOTE: result is now the same format as returned by d3.csv.parseRows
*
*/
Dataset.prototype.loadJson = function (result) {

    var dataObject = { positions: [], data_values: [] };
    this._dataShape = undefined;

    //create the variable set
    this._variables = {};
    var columnNames = result[0];
    for (var c = 0; c < columnNames.length; c++) {
        var name = columnNames[c];
        var variable = new Variable();
        for (var i = 1; i < result.length; ++i) {
            variable.vals.push(result[i][c]);
        }
        this._variables[name] = variable;
    }

    //calculate variable type and min/max vals
    this._processVariables();

    if (this._var_name) {
        this.setCurrentVariable({ variable: this._var_name });
    }

    console.log(this);

    this._loadingData = false;
};

/**
* Load text into a dataset
*
* @memberof Dataset
*
*/
Dataset.prototype.loadText = function (text) {
    var result = $.csv.toArrays(text, {
            onParseValue: $.csv.hooks.castToScalar
        });
    this.loadJson(result);
}

/**
* Load a dataset - returns header and optionally variable data
*
* @memberof Dataset
*
*/
Dataset.prototype.loadUrl = function (description) {
    description = defaultValue(description, EMPTY_OBJECT);

    this._url = defaultValue(description.url, this._url);
    this._var_name = defaultValue(description.variable, '');

    if (!this._url) {
        return;
    }

    console.log('loading: ' + this._url);

    this._loadingData = true;
    var that = this;
    
    Cesium.when(Cesium.loadText(this._url), function (text) { that.loadText(text); });
};

/**
* Set the current variable
*
* @memberof Dataset
*
*/
Dataset.prototype.setCurrentVariable = function (description) {
    if (!this._variables[description.variable] || 
        this._variables[description.variable].vals.length === 0) {
        return;
    }
    this._var_name = description.variable;
    if (this._var_name.length && this._variables[this._var_name]) {
        this._varID[VarType.SCALAR] = this._var_name;
    }
};

function _float_equals(a, b) { return (Math.abs((a - b) / b) < 0.00001); }

/**
* Get the current variable
*
* @memberof Dataset
*
*/
Dataset.prototype.getCurrentVariable = function () {
    return this._varID[VarType.SCALAR];
};


/**
* Get a data value
*
* @memberof Dataset
*
*/
Dataset.prototype.getDataValue = function (var_name, idx) {
    var variable = this._variables[var_name];
    if (variable === undefined || variable.vals === undefined) {
        return undefined;
    }
    if (variable.type === VarType.ENUM) {
        return variable.enum_list[variable.vals[idx]];
    }
    else if (variable.type === VarType.TIME) {
        return variable.time_var.vals[idx];
    }
     return variable.vals[idx];
};

/**
* Get all of the data values
*
* @memberof Dataset
*
*/
Dataset.prototype.getDataValues = function (var_name) {
    if (this._variables[var_name] === undefined || this._variables[var_name].vals === undefined) {
        return undefined;
    }
    return this._variables[var_name].vals;
};


/**
* Return a boolean as to whether this is a nodata item
*
* @memberof Dataset
*
*/
Dataset.prototype.isNoData = function (pt_val) {
    return _float_equals(this._nodataVal, pt_val);
};

/**
* Get a set of data points and positions for the current variable
*
* @memberof Dataset
*
*/
Dataset.prototype.getPointList = function (maxPts) {

    var lon = this._varID[VarType.LON] ? this._variables[this._varID[VarType.LON]].vals : undefined;
    var lat = this._varID[VarType.LAT] ? this._variables[this._varID[VarType.LAT]].vals : undefined;
    var alt = this._varID[VarType.ALT] ? this._variables[this._varID[VarType.ALT]].vals : undefined;
    var vals = this._variables[this._varID[VarType.SCALAR]].vals;
    var time = this._varID[VarType.TIME] ? this._variables[this._varID[VarType.TIME]].time_var.vals : undefined;
    if (maxPts === undefined) {
        maxPts = vals.length;
    }

    var ret = [];
    for (var i = 0; i < vals.length && i < maxPts; i++) {
        var rec = {val: vals[i]};
        rec.time =  time ? time[i] : undefined;
        rec.pos = [lon ? lon[i] : 0.0, lat ? lat[i] : 0.0, alt ? alt[i] : 0.0];
        ret.push(rec);
    }
    return ret;
};


/**
* Destroy the object and release resources
*
* @memberof Dataset
*
*/
Dataset.prototype.destroy = function () {
    return Cesium.destroyObject(this);
};

module.exports = Dataset;


},{"./Variable":5}],2:[function(_dereq_,module,exports){


"use strict";

var defaultValue = Cesium.defaultValue;


/**
* @class GeoData is a container for generic geodata
* @name GeoData
*
* @alias GeoData
* @internalConstructor
* @constructor
*/
var GeoData = function(description) {
    this.name = defaultValue(description.name, 'New Item');
    this.show = defaultValue(description.show, true);
    this.type = defaultValue(description.type, 'UNKNOWN');
    this.primitive = defaultValue(description.primitive, undefined);
    this.extent = defaultValue(description.extent, undefined);
    this.url = defaultValue(description.url, undefined);
    this.style = defaultValue(description.style, undefined);
}

module.exports = GeoData;



},{}],3:[function(_dereq_,module,exports){


"use strict";

var TableDataSource = _dereq_('./TableDataSource');
var GeoData = _dereq_('./GeoData');


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
    
    console.log(request);
    Cesium.when(Cesium.loadText(request), function (text) {
        var obj;
        if (text[0] === '{') {
            obj = JSON.parse(text);
            obj = _EsriRestJson2GeoJson(obj);  //ESRI Rest
        }
        else {
            obj = $.xml2json(text);         //ESRI WFS
            obj = _EsriGml2GeoJson(obj);
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
        var proxy;
        if (params.proxy) {
            proxy = new Cesium.DefaultProxy('/proxy/');
        }
        
        var provider = new Cesium.WebMapServiceImageryProvider({
            url: url,
            layers : encodeURIComponent(layerName),
            parameters: {
                'format':'image/png',
                'transparent':'true',
                'styles': '',
            },
            proxy: proxy
        });
//        provider.defaultAlpha = 0.7;
        layer.primitive = this.imageryLayersCollection.addImageryProvider(provider);
    }
    else {
       //WMS leaflet method of displaying wms data
        var uri = new URI(request);
        var wmsServer = request.substring(0, request.indexOf('?'));
        var params = uri.search(true);
        var layerName = params.layers;
        L.tileLayer.wms(wmsServer, {
            layers: layerName,
            format: 'image/png',
            transparent: true,
        }).addTo(layer.map);
        console.log(layerName, layer.map);
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
        if (layer.proxy) {
            var proxy = new Cesium.DefaultProxy('/proxy/');
            request = proxy.getURL(request);
        }
        this._viewFeature(request, layer);
    }
    else if (layer.type === 'WMS') {
        if (layer.proxy) {
            request += '&proxy=true';
        }
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
        request += '?service=wfs&request=GetFeature&typeName=' + name + '&version=' + description.version + '&srsName=EPSG:4326';
        if (description.esri === undefined) {
            request += '&outputFormat=JSON';
        }
        if (description.count) {
          if (description.version < 2) {
            request += '&maxFeatures=' + description.count;
          }
          else {
            request += '&count=' + description.count;
          }
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
        if (json_gml.Esri) {
            description.esri = true;
        }
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


},{"./GeoData":2,"./TableDataSource":4}],4:[function(_dereq_,module,exports){
"use strict";

var Dataset = _dereq_('./Dataset');

/*
TableDataSource object for displaying geo-located datasets
For the time being it acts as a layer on top of a CzmlDataSource
And writes a czml file for it to display
*/

//TODO: DOCUMENT using model in GeoJsonDataSource

var defaultValue = Cesium.defaultValue;

var EMPTY_OBJECT = {};


/**
* @class TableDataSource is a cesium based datasource for table based geodata
* @name TableDataSource
*
* @alias TableDataSource
* @internalConstructor
* @constructor
*/
var TableDataSource = function () {

    //Create a czmlDataSource to piggyback on
    this.czmlDataSource = new Cesium.CzmlDataSource();
    this.dataset = new Dataset();
    this.show = true;

    this.color = Cesium.Color.RED;

    this.pts_max = 10000;
    this.leadTimeMin = 0;
    this.trailTimeMin = 60;
    this.scale = 1.0;
    this.scale_by_val = true;

    var defaultGradient = [
        {offset: 0.0, color: '#00f'},
        {offset: 0.25, color: '#0ff'},
        {offset: 0.25, color: '#0ff'},
        {offset: 0.5, color: '#0f0'},
        {offset: 0.5, color: '#0f0'},
        {offset: 0.75, color: '#ff0'},
        {offset: 0.75, color: '#ff0'},
        {offset: 1.0, color: '#f00'}
    ];
    this.colorGradient = defaultGradient;
    this.setColorGradient(defaultGradient);
};

Cesium.defineProperties(TableDataSource.prototype, {
        /**
         * Gets a human-readable name for this instance.
         * @memberof TableDataSource.prototype
         * @type {String}
         */
        name : {
            get : function() {
                return this.czmlDataSource.name;
            }
        },
         /**
         * Gets the clock settings defined by the loaded CZML.  If no clock is explicitly
         * defined in the CZML, the combined availability of all objects is returned.  If
         * only static data exists, this value is undefined.
         * @memberof TableDataSource.prototype
         * @type {DynamicClock}
         */
       clock : {
            get : function() {
                return this.czmlDataSource.clock;
            }
        },
         /**
         * Gets the collection of {@link DynamicObject} instances.
         * @memberof TableDataSource.prototype
         * @type {DynamicObjectCollection}
         */
       dynamicObjects : {
            get : function() {
                return this.czmlDataSource.dynamicObjects;
            }
        },
         /**
         * Gets a value indicating if the data source is currently loading data.
         * @memberof TableDataSource.prototype
         * @type {Boolean}
         */
       isLoading : {
            get : function() {
                return this.czmlDataSource.isLoading;
            }
        },
         /**
         * Gets an event that will be raised when the underlying data changes.
         * @memberof TableDataSource.prototype
         * @type {Event}
         */
       changedEvent : {
            get : function() {
                return this.czmlDataSource.changedEvent;
            }
        },
         /**
         * Gets an event that will be raised if an error is encountered during processing.
         * @memberof TableDataSource.prototype
         * @type {Event}
         */
       errorEvent : {
            get : function() {
                return this.czmlDataSource.errorEvent;
            }
        },
        /**
         * Gets an event that will be raised when the data source either starts or stops loading.
         * @memberof TableDataSource.prototype
         * @type {Event}
         */
        loadingEvent : {
            get : function() {
                return this.czmlDataSource.loadingEvent;
            }
        }
});

/**
 * Asynchronously loads the Table at the provided url, replacing any existing data.
 *
 * @param {Object} url The url to be processed.
 *
 * @returns {Promise} a promise that will resolve when the CZML is processed.
 */
TableDataSource.prototype.loadUrl = function (url) {
    var that = this;
    this.dataset.loadUrl({ url: url, callback: function (data) {
        that.setLeadTimeByPercent(0.0);
        that.setTrailTimeByPercent(1.0);
        that.czmlDataSource.load(that.getDataPointList(), 'TableDataSource');
        }
    });
};

/**
 * Asynchronously loads the Table from text, replacing any existing data.
 *
 * @param {Object} text The text to be processed.
 *
 * @returns {Promise} a promise that will resolve when the CZML is processed.
 */
TableDataSource.prototype.loadText = function (text) {
    var that = this;
    this.dataset.loadText(text);
    that.setLeadTimeByPercent(0.0);
    that.setTrailTimeByPercent(1.0);
    that.czmlDataSource.load(that.getDataPointList(), 'TableDataSource');
};

/**
* Load a variable
*
* @memberof TableDataSource
*
*/
TableDataSource.prototype.setCurrentVariable = function (varname) {
    var that = this;
    this.dataset.setCurrentVariable({ variable: varname, callback: function (data) { 
        that.czmlDataSource.load(that.getDataPointList(), 'TableDataSource');
        }
    });
};


/**
* Replaceable visualizer function
*
* @memberof TableDataSource
*
*/
TableDataSource.prototype.czmlRecFromPoint = function (point) {
    var rec = {
        "billboard" : {
            "horizontalOrigin" : "CENTER",
            "verticalOrigin" : "BOTTOM",
            "image" : "./images/pow32.png",
            "scale" : 1.0,
            "color" : { "rgba" : [255, 0, 0, 255] },
            "show" : [{
                "interval" : "2011-02-04T16:00:00Z/2011-04-04T18:00:00Z",
                "boolean" : true
            }]
        },
        "position" : {
            "cartographicDegrees" : [0, 0, 0]
        }
    };
    rec.billboard.color.rgba = this._mapValue2Color(point.val);
    rec.billboard.scale = this._mapValue2Scale(point.val);
    for (var p = 0; p < 3; p++) {
        rec.position.cartographicDegrees[p] = point.pos[p];
    }

    var start = point.time.addMinutes(-this.leadTimeMin);
    var finish = point.time.addMinutes(this.trailTimeMin);
    rec.billboard.show[0].interval = start.toIso8601() + '/' + finish.toIso8601();
    return rec;
};


/**
* Get a list of display records for the current point list.
*  Currently defaults to a czml based output
*
* @memberof TableDataSource
*
*/
TableDataSource.prototype.getDataPointList = function () {
    var data = this.dataset;
    if (data._loadingData) {
        return;
    }
    //update the datapoint collection
    var pointList = this.dataset.getPointList();
    
    var dispRecords = [];
    
    for (var i = 0; i < pointList.length; i++) {
        //set position, scale, color, and display time
        var rec = this.czmlRecFromPoint(pointList[i]);
        dispRecords.push(rec);
    }
    return dispRecords;
};

TableDataSource.prototype._getNormalizedPoint = function (pt_val) {
    var data = this.dataset;
    if (data === undefined || data.isNoData(pt_val)) {
        return undefined;
    }
    var min_val = data.getMinVal();
    var max_val = data.getMaxVal();
    var normPoint = (max_val === min_val) ? 0 : (pt_val - min_val) / (max_val - min_val);
    return normPoint;
};

TableDataSource.prototype._mapValue2Scale = function (pt_val) {
    var scale = this.scale;
    var normPoint = this._getNormalizedPoint(pt_val);
    if (normPoint !== undefined) {
        scale *= (this.scale_by_val ? 1.0 * normPoint + 0.5 : 1.0);
    }
    return scale;
};


TableDataSource.prototype._mapValue2Color = function (pt_val) {
    var colors = this.dataImage;
    if (colors === undefined) {
        return this.color;
    }
    var normPoint = this._getNormalizedPoint(pt_val);
    var color = [0, 0, 0, 0];
    if (normPoint !== undefined) {
        var clr_idx = Math.floor(normPoint * (colors.data.length / 4 - 1)) * 4;
        color = colors.data.subarray(clr_idx, clr_idx+4);
        color[3] *= this.color.alpha;
    }
    return color;
};

/**
* Set the lead time by percent
*
* @memberof TableDataSource
*
*/
TableDataSource.prototype.setLeadTimeByPercent = function (pct) {
    if (this.dataset) {
        var data = this.dataset;
        this.leadTimeMin = data.getMinTime().getMinutesDifference(data.getMaxTime()) * pct / 100.0;
    }
}

/**
* Set the trailing time by percent
*
* @memberof TableDataSource
*
*/
TableDataSource.prototype.setTrailTimeByPercent = function (pct) {
    if (this.dataset) {
        var data = this.dataset;
        this.trailTimeMin = data.getMinTime().getMinutesDifference(data.getMaxTime()) * pct / 100.0;
    }
}


//TODO: canvas is an easy way to do this, but html5 specific
TableDataSource.prototype.createGradient = function (ctx) {
    var w = ctx.canvas.width;
    var h = ctx.canvas.height;

    // Create Linear Gradient
    var lingrad = ctx.createLinearGradient(0,0,0,h);
    var grad = this.colorGradient;
    for (var i = 0; i < grad.length; i++) {
        lingrad.addColorStop(grad[i].offset, grad[i].color);
    }
    ctx.fillStyle = lingrad;
    ctx.fillRect(0,0,w,h);
};

/**
* Set the gradient used to color the data points
*
* @memberof TableDataSource
*
*/
TableDataSource.prototype.setColorGradient = function () {
    //create 2d canvas
    if (!document.getElementById("grad_div")) {
        $('body').append('<div id="grad_div"></div>');
        $('<canvas/>', { 'id': 'gradCanvas', 'Width': 64, 'Height': 256, 'Style': "display: none" }).appendTo('#grad_div');
    }
    var grad_canvas = $('#gradCanvas')[0];
    var ctx = grad_canvas.getContext('2d');
    this.createGradient(ctx);
    this.dataImage = ctx.getImageData(0, 0, 1, 256);
};

/**
* Destroy the object and release resources
*
* @memberof TableDataSource
*
*/
TableDataSource.prototype.destroy = function () {
    return Cesium.destroyObject(this);
};

module.exports = TableDataSource;

},{"./Dataset":1}],5:[function(_dereq_,module,exports){
"use strict";

/*!
 * Copyright(c) 2012-2013 National ICT Australia Limited (NICTA).  All rights reserved.
 */
 
 
var VarType = {LON: 0, LAT: 1, ALT: 2, TIME: 3, SCALAR: 4, ENUM: 5 };

/**
* @class Variable contains a single variable from a table dataset
* @name Variable
*
* @alias Variable
* @internalConstructor
* @constructor
*/
var Variable = function () {
    this.vals = [];
    this.fNoData = 1e-34;
    this.min = undefined;
    this.max = undefined;
    this.type = undefined;
    this.time_var = undefined;
    this.enum_list = undefined;
};

Variable.prototype._calculateVarMinMax = function () {
    var vals = this.vals;
    var min_val = Number.MAX_VALUE;
    var max_val = -Number.MAX_VALUE;
    for (var i = 0; i < vals.length; i++) {
        if (vals[i] === undefined || vals[i] === null) {
            vals[i] = this.fNoData;
        }
        else {
            if (min_val > vals[i]) {
                min_val = vals[i];
            }
            if (max_val < vals[i]) {
                max_val = vals[i];
            }
        }
    }
    this.min = min_val;
    this.max = max_val;
};

Variable.prototype._calculateTimeMinMax = function () {
    var vals = this.vals;
    var min_val = vals[0];
    var max_val = vals[0];
    for (var i = 1; i < vals.length; i++) {
        if (min_val.greaterThan(vals[i])) {
            min_val = vals[i];
        }
        if (max_val.lessThan(vals[i])) {
            max_val = vals[i];
        }
    }
    this.min = min_val;
    this.max = max_val;
};

function _isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

function _swapDateFormat(v) {
    var part = v.split(/[/-]/);
    if (part.length === 3) {
        v = part[1] + '/' + part[0] + '/' + part[2];
    }
    return v;
}

/**
* Convert input time variable to Cesium Time variable
*
* @memberof Variable
*
*/
Variable.prototype.processTimeVar = function () {
    if (this.type !== VarType.TIME) {
        return;
    }
    //time parsing functions
    function time_string(v) { //  9/2/94 0:56
        return Cesium.JulianDate.fromDate(new Date(v));
    }
    function time_excel(v) {   // 40544.4533
        var date = Cesium.JulianDate.fromDate(new Date('January 1, 1970 0:00:00'));
        date = date.addDays(Math.floor(v) - 25569.0); //account for offset to 1900
        date = date.addSeconds((v - Math.floor(v)) * 60 * 60 * 24);
        return date;
    }
    function time_utc(v) {   //12321231414434
        return Cesium.JulianDate.fromDate(Date.setTime(v));
    }
    function time_sosus(v) {   //19912410952050
        var date = new Cesium.JulianDate(0, 0);
        var date_str = v.toString();
        var year = parseInt(date_str.substring(0, 4), 10);
        var dayofyear = parseInt(date_str.substring(4, 7), 10);
        if (date_str.length !== 14 || year < 1950 || year > 2050 || dayofyear > 366) {
            return date;
        }
        var d = new Date();
        d.setUTCFullYear(year);
        d.setUTCHours(date_str.substring(7, 9), date_str.substring(9, 11), date_str.substring(11, 13));
        date = Cesium.JulianDate.fromDate(d).addDays(dayofyear);
        return date;
    }
    //create new Cessium time variable to attach to the variable
    var time_var = new Variable();
    var vals = this.vals;
    //select time parsing function
    var parseFunc;
    if (parseInt(vals[0], 10) > 500000) {
        if (time_sosus(vals[0]).getJulianDayNumber() !== 0) {
            parseFunc = time_sosus;
        }
        else {
            parseFunc = time_utc;
        }
    }
    else if (_isNumber(vals[0])) {
        parseFunc = time_excel;
    }
    else {
        parseFunc = time_string;
    }
    //parse the time values
    var bSuccess = false;
    try {
        for (var i = 0; i < vals.length; i++) {
            time_var.vals[i] = parseFunc(vals[i]);
        }
        bSuccess = true;
    }
    catch (err) {
        if (parseFunc === time_string) {
            console.log('Trying swap of day and month in date strings');
            time_var.vals = [];
            try {
                for (var i = 0; i < vals.length; i++) {
                    time_var.vals[i] = parseFunc(_swapDateFormat(vals[i]));
                }
                bSuccess = true;
            }
            catch (err) {
            }
        }
    }
    if (bSuccess) {
        time_var._calculateTimeMinMax();
        this.time_var = time_var;
    }
    else {
        this.type = VarType.SCALAR;
        console.log('Unable to parse time variable');
    }
};


/**
* Convert input enum variable to values and enum_list
*
* @memberof Variable
*
*/
Variable.prototype.processEnumVar = function () {
    if (this.type !== VarType.ENUM) {
        return;
    }
    //create new enum list for the variable
    var enum_list = [];
    for (var i = 0; i < this.vals.length; i++) {
        if (this.vals[i] === this.fNoData) {
            this.vals[i] = 'undefined';
        }
        var n = enum_list.indexOf(this.vals[i]);
        if (n === -1) {
            n = enum_list.length;
            enum_list.push(this.vals[i]);
        }
        this.vals[i] = parseFloat(n);
    }
    this.enum_list = enum_list;
    this.calculateVarMinMax();
};


/**
* Based on variable name, guess what the VarType should be
*
* @memberof Variable
*
*/
Variable.prototype.guessVarType = function (name) {
    //functions to try to figure out position and time variables.
    function match_col(name, hints) {
        var name = name.toLowerCase();
        for (var h in hints) {
            var hint = hints[h].toLowerCase();
            if (name.indexOf(hint) === 0 || name.indexOf(' ' + hint) !== -1 || name.indexOf('_' + hint) !== -1) {
                return true;
            }
        }
        return false;
    }

    var hint_set = [
        { hints: ['lon'], type: VarType.LON },
        { hints: ['lat'], type: VarType.LAT },
        { hints: ['depth', 'height', 'elevation'], type: VarType.ALT },
        { hints: ['time', 'date'], type: VarType.TIME }];

    for (var vt in hint_set) {
        if (match_col(name, hint_set[vt].hints)) {
            this.type = hint_set[vt].type;
            return;
        }
    }
    this.type = VarType.SCALAR;
};

/**
* Destroy the object and release resources
*
* @memberof Variable
*
*/
Variable.prototype.destroy = function () {
    return Cesium.destroyObject(this);
};

module.exports = Variable;




},{}],6:[function(_dereq_,module,exports){
module.exports = {
  Variable: _dereq_('./Variable'),
  Dataset: _dereq_('./Dataset'),
  TableDataSource: _dereq_('./TableDataSource'),
  GeoData: _dereq_('./GeoData'),
  GeoDataCollection: _dereq_('./GeoDataCollection')
};


},{"./Dataset":1,"./GeoData":2,"./GeoDataCollection":3,"./TableDataSource":4,"./Variable":5}]},{},[6])
(6)
});