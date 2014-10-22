'use strict';

/*global require,L,URI,$,proj4,proj4_epsg*/

var CesiumMath = require('../../third_party/cesium/Source/Core/Math');
var clone = require('../../third_party/cesium/Source/Core/clone');
var Color = require('../../third_party/cesium/Source/Core/Color');
var ColorMaterialProperty = require('../../third_party/cesium/Source/DataSources/ColorMaterialProperty');
var combine = require('../../third_party/cesium/Source/Core/combine');
var ConstantProperty = require('../../third_party/cesium/Source/DataSources/ConstantProperty');
var defaultValue = require('../../third_party/cesium/Source/Core/defaultValue');
var defined = require('../../third_party/cesium/Source/Core/defined');
var defineProperties = require('../../third_party/cesium/Source/Core/defineProperties');
var DeveloperError = require('../../third_party/cesium/Source/Core/DeveloperError');
var GeoJsonDataSource = require('../../third_party/cesium/Source/DataSources/GeoJsonDataSource');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');
var loadJson = require('../../third_party/cesium/Source/Core/loadJson');
var loadXML = require('../../third_party/cesium/Source/Core/loadXML');
var Rectangle = require('../../third_party/cesium/Source/Core/Rectangle');
var when = require('../../third_party/cesium/Source/ThirdParty/when');

var corsProxy = require('../corsProxy');
var DataSourceMetadataViewModel = require('./DataSourceMetadataViewModel');
var DataSourceMetadataItemViewModel = require('./DataSourceMetadataItemViewModel');
var GeoDataCatalogError = require('./GeoDataCatalogError');
var GeoDataSourceViewModel = require('./GeoDataSourceViewModel');
var ImageryLayerDataSourceViewModel = require('./ImageryLayerDataSourceViewModel');
var inherit = require('../inherit');
var rectangleToLatLngBounds = require('../rectangleToLatLngBounds');
var runLater = require('../runLater');

var lineAndFillPalette = {
    minimumRed : 0.4,
    minimumGreen : 0.4,
    minimumBlue : 0.4,
    maximumRed : 0.9,
    maximumGreen : 0.9,
    maximumBlue : 0.9,
    alpha : 1.0
};

var pointPalette = {
    minimumRed : 0.6,
    minimumGreen : 0.6,
    minimumBlue : 0.6,
    maximumRed : 1.0,
    maximumGreen : 1.0,
    maximumBlue : 1.0,
    alpha : 1.0
};

/**
 * A {@link GeoDataSourceViewModel} representing GeoJSON feature data.
 *
 * @alias GeoJsonDataSourceViewModel
 * @constructor
 * @extends GeoDataSourceViewModel
 * 
 * @param {GeoDataCatalogContext} context The context for the group.
 * @param {String} [url] The URL from which to retrieve the GeoJSON data.
 */
var GeoJsonDataSourceViewModel = function(context, url) {
    GeoDataSourceViewModel.call(this, context);

    this._cesiumDataSource = undefined;

    this._loadedUrl = undefined;
    this._loadedData = undefined;
    
    this._readyData = undefined;

    /**
     * Gets or sets the URL from which to retrieve GeoJSON data.  This property is ignored if
     * {@link GeoJsonDataSourceViewModel#data} is defined.  This property is observable.
     * @type {String}
     */
    this.url = url;

    /**
     * Gets or sets the GeoJSON data, represented as an object literal (not a string).  This property
     * may also be a promise that will resolve to the GeoJSON data.
     * This property is observable.
     * @type {Object|Promise}
     */
    this.data = undefined;

    knockout.track(this, ['url', 'data']);
};

GeoJsonDataSourceViewModel.prototype = inherit(GeoDataSourceViewModel.prototype);

defineProperties(GeoJsonDataSourceViewModel.prototype, {
    /**
     * Gets the type of data member represented by this instance.
     * @memberOf GeoJsonDataSourceViewModel.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return 'geojson';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, 'GeoJSON'.
     * @memberOf GeoJsonDataSourceViewModel.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'GeoJSON';
        }
    },

    /**
     * Gets the metadata associated with this data source and the server that provided it, if applicable.
     * @memberOf GeoJsonDataSourceViewModel.prototype
     * @type {DataSourceMetadataViewModel}
     */
    metadata : {
        get : function() {
            // TODO: maybe return the FeatureCollection's properties?
            var result = new DataSourceMetadataViewModel();
            result.isLoading = false;
            result.dataSourceErrorMessage = 'This data source does not have any details available.';
            result.serviceErrorMessage = 'This service does not have any details available.';
            return result;
        }
    }
});

/**
 * Processes the GeoJSON data supplied via the {@link GeoJsonDataSourceViewModel#data} property.  If
 * {@link GeoJsonDataSourceViewModel#data} is undefined, this method downloads GeoJSON data from 
 * {@link GeoJsonDataSourceViewModel#url} and processes that.  It is safe to call this method multiple times.
 * It is called automatically when the data source is enabled.
 */
GeoJsonDataSourceViewModel.prototype.load = function() {
    if ((this.url === this._loadedUrl && this.data === this._loadedData) || this.isLoading === true) {
        return;
    }

    this.isLoading = true;

    var that = this;
    runLater(function() {
        that._loadedUrl = that.url;
        that._loadedData = that.data;

        if (that.data) {
            when(that.data, function(json) {
                that.data = json;
                updateViewModelFromData(that, json);
                that.isLoading = false;
            }).otherwise(function() {
                that.isLoading = false;
            });
        } else {
            loadJson(that.url).then(function(json) {
                that.isLoading = false;
                updateViewModelFromData(that, json);
            }).otherwise(function(e) {
                that.isLoading = false;
                that.context.error.raiseEvent(new GeoDataCatalogError({
                    sender: that,
                    title: 'Could not load JSON',
                    message: '\
An error occurred while retrieving JSON data from the provided link.  \
<p>If you entered the link manually, please verify that the link is correct.</p>\
<p>This error may also indicate that the server does not support <a href="http://enable-cors.org/" target="_blank">CORS</a>.  If this is your \
server, verify that CORS is enabled and enable it if it is not.  If you do not control the server, \
please contact the administrator of the server and ask them to enable CORS.  Or, contact the National \
Map team by emailing <a href="mailto:nationalmap@lists.nicta.com.au">nationalmap@lists.nicta.com.au</a> \
and ask us to add this server to the list of non-CORS-supporting servers that may be proxied by \
National Map itself.</p>\
<p>If you did not enter this link manually, this error may indicate that the data source you\'re trying to add is temporarily unavailable or there is a \
problem with your internet connection.  Try adding the data source again, and if the problem persists, please report it by \
sending an email to <a href="mailto:nationalmap@lists.nicta.com.au">nationalmap@lists.nicta.com.au</a>.</p>'
                }));
                that.isEnabled = false;
                that._loadedUrl = undefined;
                that._loadedData = undefined;
            });
        }
    });
};

GeoJsonDataSourceViewModel.prototype._enableInCesium = function() {
    if (defined(this._cesiumDataSource)) {
        throw new DeveloperError('This data source is already enabled.');
    }

    this._cesiumDataSource = new GeoJsonDataSource(this.name);
    loadGeoJson(this);
};

GeoJsonDataSourceViewModel.prototype._disableInCesium = function() {
    if (!defined(this._cesiumDataSource)) {
        throw new DeveloperError('This data source is not enabled.');
    }

    this._cesiumDataSource = undefined;
};

GeoJsonDataSourceViewModel.prototype._showInCesium = function() {
    if (!defined(this._cesiumDataSource)) {
        throw new DeveloperError('This data source is not enabled.');
    }

    var dataSources = this.context.cesiumViewer.dataSources;
    if (dataSources.contains(this._cesiumDataSource)) {
        throw new DeveloperError('This data source is already shown.');
    }

    dataSources.add(this._cesiumDataSource);
};

GeoJsonDataSourceViewModel.prototype._hideInCesium = function() {
    if (!defined(this._cesiumDataSource)) {
        throw new DeveloperError('This data source is not enabled.');
    }

    var dataSources = this.context.cesiumViewer.dataSources;
    if (!dataSources.contains(this._cesiumDataSource)) {
        throw new DeveloperError('This data source is not shown.');
    }

    dataSources.remove(this._cesiumDataSource, false);
};

GeoJsonDataSourceViewModel.prototype._enableInLeaflet = function() {
    this._enableInCesium();
};

GeoJsonDataSourceViewModel.prototype._disableInLeaflet = function() {
    this._disableInCesium();
};

GeoJsonDataSourceViewModel.prototype._showInLeaflet = function() {
    if (!defined(this._cesiumDataSource)) {
        throw new DeveloperError('This data source is not enabled.');
    }

    var dataSources = this.context.leafletMap.dataSources;
    if (dataSources.contains(this._cesiumDataSource)) {
        throw new DeveloperError('This data source is already shown.');
    }

    dataSources.add(this._cesiumDataSource);
};

GeoJsonDataSourceViewModel.prototype._hideInLeaflet = function() {
    if (!defined(this._cesiumDataSource)) {
        throw new DeveloperError('This data source is not enabled.');
    }

    var dataSources = this.context.leafletMap.dataSources;
    if (!dataSources.contains(this._cesiumDataSource)) {
        throw new DeveloperError('This data source is not shown.');
    }

    dataSources.remove(this._cesiumDataSource, false);
};

function updateViewModelFromData(viewModel, geoJson) {
    // If this GeoJSON data is an object literal with a single property, treat that
    // property as the name of the data source, and the property's value as the
    // actual GeoJSON.
    var numProperties = 0;
    var propertyName;
    for (propertyName in geoJson) {
        if (geoJson.hasOwnProperty(propertyName)) {
            ++numProperties;
            if (numProperties > 1) {
                break; // no need to count past 2 properties.
            }
        }
    }

    var name;
    if (numProperties === 1) {
        name = propertyName;
        geoJson = geoJson[propertyName];

        // If we don't already have a name, or our name is just derived from our URL, update the name.
        if (!defined(viewModel.name) || viewModel.name.length === 0 || nameIsDerivedFromUrl(viewModel.name, viewModel.url)) {
            viewModel.name = name;
        }
    }

    // Reproject the features if they're not already EPSG:4326.
    reprojectToGeographic(geoJson);

    // If we don't already have a rectangle, compute one.
    if (!defined(viewModel.rectangle) || Rectangle.equals(viewModel.rectangle, Rectangle.MAX_VALUE)) {
        viewModel.rectangle = getGeoJsonExtent(geoJson);
    }

    viewModel._readyData = geoJson;

    loadGeoJson(viewModel);
}

function nameIsDerivedFromUrl(name, url) {
    if (name === url) {
        return true;
    }

    // Is the name just the end of the URL?
    var indexOfNameInUrl = url.lastIndexOf(name);
    if (indexOfNameInUrl >= 0 && indexOfNameInUrl === url.length - name.length) {
        return true;
    }

    return false;
}

function proxyUrl(context, url) {
    if (defined(context.corsProxy) && context.corsProxy.shouldUseProxy(url)) {
        return context.corsProxy.getURL(url);
    }

    return url;
}

function loadGeoJson(viewModel) {
    if (!(viewModel._cesiumDataSource instanceof GeoJsonDataSource) || !defined(viewModel._readyData)) {
        return;
    }

    var fillPolygons = false;
    var pointColor = getRandomColor(pointPalette, viewModel.name);
    var lineColor = getRandomColor(lineAndFillPalette, viewModel.name);
    var fillColor = Color.clone(lineColor);
    fillColor.alpha = 0.75;

    var pointSize = 10;
    var lineWidth = 2;

    var dataSource = viewModel._cesiumDataSource;
    dataSource.load(viewModel._readyData).then(function() {
        var entities = dataSource.entities.entities;

        for (var i = 0; i < entities.length; ++i) {
            var entity = entities[i];
            var material;

            // Update default point/line/polygon
            var point = entity.point;
            if (defined(point)) {
                point.color = new ConstantProperty(pointColor);
                point.pixelSize = new ConstantProperty(pointSize);
                point.outlineColor = new ConstantProperty(Color.BLACK);
                point.outlineWidth = new ConstantProperty(1);
            }

            var polyline = entity.polyline;
            if (defined(polyline)) {
                material = new ColorMaterialProperty();
                material.color = new ConstantProperty(lineColor);
                polyline.material = material;
                polyline.width = new ConstantProperty(lineWidth);
            }

            var polygon = entity.polygon;
            if (defined(polygon)) {
                polygon.fill = new ConstantProperty(fillPolygons);
                polygon.outline = new ConstantProperty(true);

                material = new ColorMaterialProperty();
                material.color = new ConstantProperty(fillColor);
                polygon.material = material;
            }
        }
    });
}

// Get a random color for the data based on the passed seed (usually dataset name)
function getRandomColor(palette, seed) {
    if (defined(seed)) {
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

// Get the CRS code from the GeoJSON
function getCrsCode(geoJson) {
    var code;

    if (!defined(geoJson.crs)) {
        return undefined;
    } else if (geoJson.crs.type === 'EPSG') {
        code = geoJson.crs.properties.code;
    } else if (geoJson.crs.type === 'name' &&
               defined(geoJson.crs.properties) &&
               defined(geoJson.crs.properties.name) &&
               geoJson.crs.properties.name.indexOf('EPSG:') === 0) {
        code = geoJson.crs.properties.name.substring(5);
    } else {
        return undefined;
    }

    return 'EPSG:' + code;
}

function reprojectToGeographic(geoJson) {
    var code;

    if (!defined(geoJson.crs)) {
        code = undefined;
    } else if (geoJson.crs.type === 'EPSG') {
        code = 'EPSG:' + geoJson.crs.properties.code;
    } else if (geoJson.crs.type === 'name' &&
               defined(geoJson.crs.properties) &&
               defined(geoJson.crs.properties.name) &&
               geoJson.crs.properties.name.indexOf('EPSG:') === 0) {
        code = geoJson.crs.properties.name;
    } else {
        code = undefined;
    }

    if (defined(code) && code !== 'EPSG:4326' && code !== 'EPSG:4283') {
        filterValue(
            geoJson,
            'coordinates',
            function(obj, prop) {
                obj[prop] = filterArray(
                    obj[prop],
                    function(pts) {
                        return reprojectPointList(pts, code);
                    });
            });
    }

    geoJson.crs = {
        type: 'EPSG',
        properties: {
            code: '4326'
        }
    };
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

// Filter a geojson coordinates array structure
function filterArray(pts, func) {
    if (!(pts[0] instanceof Array) || !((pts[0][0]) instanceof Array) ) {
        pts = func(pts);
        return pts;
    }
    for (var i = 0; i < pts.length; i++) {
        pts[i] = filterArray(pts[i], func);  //at array of arrays of points
    }
    return pts;
}

// Function to pass to reproject function
function pntReproject(coordinates, id) {
    var source = new proj4.Proj(proj4_epsg[id]);
    var dest = new proj4.Proj('EPSG:4326');
    var p = proj4.toPoint(coordinates);
    proj4(source, dest, p);      //do the transformation.  x and y are modified in place
    return [p.x, p.y];
}

// Get Extent of geojson
function getExtent(pts, ext) {
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
}

function getGeoJsonExtent(geoJson) {
    var ext = {west:180, east:-180, south:90, north: -90};
    filterValue(geoJson, 'coordinates', function(obj, prop) { getExtent(obj[prop], ext); });
    return Rectangle.fromDegrees(ext.west, ext.south, ext.east, ext.north);
}

module.exports = GeoJsonDataSourceViewModel;
