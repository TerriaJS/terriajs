'use strict';

/*global require*/
var proj4 = require('proj4');

var CesiumMath = require('terriajs-cesium/Source/Core/Math');
var Color = require('terriajs-cesium/Source/Core/Color');
var ColorMaterialProperty = require('terriajs-cesium/Source/DataSources/ColorMaterialProperty');
var ConstantProperty = require('terriajs-cesium/Source/DataSources/ConstantProperty');
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var GeoJsonDataSource = require('terriajs-cesium/Source/DataSources/GeoJsonDataSource');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var loadJson = require('terriajs-cesium/Source/Core/loadJson');
var loadText = require('terriajs-cesium/Source/Core/loadText');
var Rectangle = require('terriajs-cesium/Source/Core/Rectangle');
var when = require('terriajs-cesium/Source/ThirdParty/when');

var PointGraphics = require('terriajs-cesium/Source/DataSources/PointGraphics');

var Metadata = require('./Metadata');
var ModelError = require('./ModelError');
var CatalogItem = require('./CatalogItem');
var inherit = require('../Core/inherit');
var Proj4Definitions = require('../Map/Proj4Definitions');
var readJson = require('../Core/readJson');

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
 * A {@link CatalogItem} representing GeoJSON feature data.
 *
 * @alias GeoJsonCatalogItem
 * @constructor
 * @extends CatalogItem
 *
 * @param {Terria} terria The Terria instance.
 * @param {String} [url] The URL from which to retrieve the GeoJSON data.
 */
var GeoJsonCatalogItem =  function(terria, url) {
     CatalogItem.call(this, terria);

    this._geoJsonDataSource = undefined;
    this._readyData = undefined;

    /**
     * Gets or sets the URL from which to retrieve GeoJSON data.  This property is ignored if
     * {@link GeoJsonCatalogItem#data} is defined.  This property is observable.
     * @type {String}
     */
    this.url = url;

    /**
     * Gets or sets the GeoJSON data, represented as a binary blob, object literal, or a Promise for one of those things.
     * This property is observable.
     * @type {Blob|Object|Promise}
     */
    this.data = undefined;

    /**
     * Gets or sets the URL from which the {@link GeoJsonCatalogItem#data} was obtained.  This will be used
     * to resolve any resources linked in the GeoJSON file, if any.
     * @type {String}
     */
    this.dataSourceUrl = undefined;

    knockout.track(this, ['url', 'data', 'dataSourceUrl']);
};

inherit(CatalogItem, GeoJsonCatalogItem);

GeoJsonCatalogItem.proj4BaseUrl = 'proj4def/';

defineProperties(GeoJsonCatalogItem.prototype, {
    /**
     * Gets the type of data member represented by this instance.
     * @memberOf GeoJsonCatalogItem.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return 'geojson';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, 'GeoJSON'.
     * @memberOf GeoJsonCatalogItem.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'GeoJSON';
        }
    },

    /**
     * Gets the metadata associated with this data source and the server that provided it, if applicable.
     * @memberOf GeoJsonCatalogItem.prototype
     * @type {Metadata}
     */
    metadata : {
        get : function() {
            // TODO: maybe return the FeatureCollection's properties?
            var result = new Metadata();
            result.isLoading = false;
            result.dataSourceErrorMessage = 'This data source does not have any details available.';
            result.serviceErrorMessage = 'This service does not have any details available.';
            return result;
        }
    }
});

GeoJsonCatalogItem.prototype._getValuesThatInfluenceLoad = function() {
    return [this.url, this.data];
};

GeoJsonCatalogItem.prototype._load = function() {
    this._geoJsonDataSource = new GeoJsonDataSource(this.name);

    var that = this;

    if (defined(that.data)) {
        return when(that.data, function(data) {
            var promise;
            if (typeof Blob !== 'undefined' && data instanceof Blob) {
                promise = readJson(data);
            } else if (data instanceof String || typeof data === 'string') {
                try {
                    promise = JSON.parse(data);
                } catch(e) {
                    throw new ModelError({
                        sender: that,
                        title: 'Error loading GeoJSON',
                        message: '\
            An error occurred parsing the provided data as JSON.  This may indicate that the file is invalid or that it \
            is not supported by '+that.terria.appName+'.  If you would like assistance or further information, please email us \
            at <a href="mailto:'+that.terria.supportEmail+'">'+that.terria.supportEmail+'</a>.'
                    });
                }
            } else {
                promise = data;
            }

            return when(promise, function(json) {
                that.data = json;
                return updateModelFromData(that, json);
            }).otherwise(function() {
                throw new ModelError({
                    sender: that,
                    title: 'Error loading GeoJSON',
                    message: '\
            An error occurred while loading a GeoJSON file.  This may indicate that the file is invalid or that it \
            is not supported by '+that.terria.appName+'.  If you would like assistance or further information, please email us \
            at <a href="mailto:'+that.terria.supportEmail+'">'+that.terria.supportEmail+'</a>.'
                });
            });
        });
    } else {
        return loadJson(proxyUrl( that.terria, that.url)).then(function(json) {
            return updateModelFromData(that, json);
        }).otherwise(function(e) {
            throw new ModelError({
                sender: that,
                title: 'Could not load JSON',
                message: '\
An error occurred while retrieving JSON data from the provided link.  \
<p>If you entered the link manually, please verify that the link is correct.</p>\
<p>This error may also indicate that the server does not support <a href="http://enable-cors.org/" target="_blank">CORS</a>.  If this is your \
server, verify that CORS is enabled and enable it if it is not.  If you do not control the server, \
please contact the administrator of the server and ask them to enable CORS.  Or, contact the '+that.terria.appName+' \
team by emailing <a href="mailto:'+that.terria.supportEmail+'">'+that.terria.supportEmail+'</a> \
and ask us to add this server to the list of non-CORS-supporting servers that may be proxied by '+that.terria.appName+' \
itself.</p>\
<p>If you did not enter this link manually, this error may indicate that the data source you\'re trying to add is temporarily unavailable or there is a \
problem with your internet connection.  Try adding the data source again, and if the problem persists, please report it by \
sending an email to <a href="mailto:'+that.terria.supportEmail+'">'+that.terria.supportEmail+'</a>.</p>'
            });
        });
    }
};

GeoJsonCatalogItem.prototype._enable = function() {
};

GeoJsonCatalogItem.prototype._disable = function() {
};

GeoJsonCatalogItem.prototype._show = function() {
    if (!defined(this._geoJsonDataSource)) {
        throw new DeveloperError('This data source is not enabled.');
    }

    var dataSources =  this.terria.dataSources;
    if (dataSources.contains(this._geoJsonDataSource)) {
        throw new DeveloperError('This data source is already shown.');
    }

    dataSources.add(this._geoJsonDataSource);
};

GeoJsonCatalogItem.prototype._hide = function() {
    if (!defined(this._geoJsonDataSource)) {
        throw new DeveloperError('This data source is not enabled.');
    }

    var dataSources =  this.terria.dataSources;
    if (!dataSources.contains(this._geoJsonDataSource)) {
        throw new DeveloperError('This data source is not shown.');
    }

    dataSources.remove(this._geoJsonDataSource, false);
};

function updateModelFromData(geoJsonItem, geoJson) {
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
        if (!defined(geoJsonItem.name) || geoJsonItem.name.length === 0 || nameIsDerivedFromUrl(geoJsonItem.name, geoJsonItem.url)) {
            geoJsonItem.name = name;
        }
    }

    // Reproject the features if they're not already EPSG:4326.
    var promise = reprojectToGeographic(geoJson);

    return when(promise, function() {
        // If we don't already have a rectangle, compute one.
        if (!defined(geoJsonItem.rectangle) || Rectangle.equals(geoJsonItem.rectangle, Rectangle.MAX_VALUE)) {
            geoJsonItem.rectangle = getGeoJsonExtent(geoJson);
        }

        geoJsonItem._readyData = geoJson;

        return loadGeoJson(geoJsonItem);
    });
}

function nameIsDerivedFromUrl(name, url) {
    if (name === url) {
        return true;
    }

    if (!url) {
        return false;
    }

    // Is the name just the end of the URL?
    var indexOfNameInUrl = url.lastIndexOf(name);
    if (indexOfNameInUrl >= 0 && indexOfNameInUrl === url.length - name.length) {
        return true;
    }

    return false;
}

function proxyUrl(terria, url) {
    if (defined(terria.corsProxy) && terria.corsProxy.shouldUseProxy(url)) {
        return terria.corsProxy.getURL(url);
    }

    return url;
}

function loadGeoJson(geoJsonItem) {
    var fillPolygons = false;
    var pointColor = getRandomColor(pointPalette, geoJsonItem.name);
    var lineColor = getRandomColor(lineAndFillPalette, geoJsonItem.name);
    var fillColor = Color.clone(lineColor);
    fillColor.alpha = 0.75;

    var pointSize = 10;
    var lineWidth = 2;

    var dataSource = geoJsonItem._geoJsonDataSource;
    return dataSource.load(geoJsonItem._readyData).then(function() {
        var entities = dataSource.entities.values;

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

            var billboard = entity.billboard;
            if (defined(billboard)) {
                entity.point = new PointGraphics({
                    color: pointColor,
                    pixelSize: pointSize,
                    outlineWidth: 1,
                    outlineColor: Color.BLACK
                });
                entity.billboard = undefined;
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

// Set the Cesium Reproject func if not already set - return false if can't set
function checkProjection(code) {
    if (Proj4Definitions.hasOwnProperty(code)) {
        return true;
    }

    var url = GeoJsonCatalogItem.proj4BaseUrl + code;
    return when(loadText(url), function (proj4Text) {
            Proj4Definitions[code] = proj4Text;
            console.log('Added new string for', code, '=', proj4Text);
            return true;
        }, function(err) {
            return false;
        });
 }

function reprojectToGeographic(geoJson) {
    var code;

    if (!defined(geoJson.crs)) {
        code = undefined;
    } else if (geoJson.crs.type === 'EPSG') {
        code = 'EPSG:' + geoJson.crs.properties.code;
    } else if (geoJson.crs.type === 'name' &&
               defined(geoJson.crs.properties) &&
               defined(geoJson.crs.properties.name)) {
        if (geoJson.crs.properties.name.indexOf('EPSG:') === 0) {
            code = geoJson.crs.properties.name;
        } else if (geoJson.crs.properties.name.indexOf('CRS84') !== -1) {
            code = 'EPSG:4326';
        }
    }

    geoJson.crs = {
        type: 'EPSG',
        properties: {
            code: '4326'
        }
    };

    if (!defined(code) || code === 'EPSG:4326' || code === 'EPSG:4283') {
        return true;
    }

   return when(checkProjection(code), function(result) {
        if (result) {
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
        } else {
            throw new DeveloperError('The crs code for this datasource is unsupported.');
        }
    });
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
    var source = new proj4.Proj(Proj4Definitions[id]);
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

module.exports = GeoJsonCatalogItem;
