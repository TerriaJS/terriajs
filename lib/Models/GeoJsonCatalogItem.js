'use strict';

/*global require*/

var Cartesian3 = require('terriajs-cesium/Source/Core/Cartesian3');
var Color = require('terriajs-cesium/Source/Core/Color');
var ColorMaterialProperty = require('terriajs-cesium/Source/DataSources/ColorMaterialProperty');
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var Entity = require('terriajs-cesium/Source/DataSources/Entity');
var GeoJsonDataSource = require('terriajs-cesium/Source/DataSources/GeoJsonDataSource');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var loadBlob = require('terriajs-cesium/Source/Core/loadBlob');
var loadJson = require('terriajs-cesium/Source/Core/loadJson');
var PolylineGraphics = require('terriajs-cesium/Source/DataSources/PolylineGraphics');
var Rectangle = require('terriajs-cesium/Source/Core/Rectangle');
var when = require('terriajs-cesium/Source/ThirdParty/when');
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var zip = require('terriajs-cesium/Source/ThirdParty/zip');
var topojson = require('terriajs-cesium/Source/ThirdParty/topojson');

var PointGraphics = require('terriajs-cesium/Source/DataSources/PointGraphics');

var DataSourceCatalogItem = require('./DataSourceCatalogItem');
var standardCssColors = require('../Core/standardCssColors');
var formatPropertyValue = require('../Core/formatPropertyValue');
var hashFromString = require('../Core/hashFromString');
var inherit = require('../Core/inherit');
var Metadata = require('./Metadata');
var proxyCatalogItemUrl = require('./proxyCatalogItemUrl');
var readJson = require('../Core/readJson');
var TerriaError = require('../Core/TerriaError');
var Reproject = require('../Map/Reproject');

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
    DataSourceCatalogItem.call(this, terria);

    this._dataSource = undefined;
    this._readyData = undefined;

    this.url = url;

    /**
     * Gets or sets the GeoJSON data, represented as a binary blob, object literal, or a Promise for one of those things.
     * If this property is set, {@link CatalogItem#url} is ignored.
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

    /*
     * Gets or sets an object of style information which will be used instead of the default, but won't override
       styles set on individual GeoJSON features. Styles follow the SimpleStyle spec: https://github.com/mapbox/simplestyle-spec/tree/master/1.1.0
       `marker-opacity` and numeric values for `marker-size` are also supported.
       @type {Object}
    */
    this.style = undefined;

    knockout.track(this, ['data', 'dataSourceUrl', 'style']);
};

inherit(DataSourceCatalogItem, GeoJsonCatalogItem);

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
    },
    /**
     * Gets the data source associated with this catalog item.
     * @memberOf GeoJsonCatalogItem.prototype
     * @type {DataSource}
     */
    dataSource : {
        get : function() {
            return this._dataSource;
        }
    }
});

GeoJsonCatalogItem.prototype._getValuesThatInfluenceLoad = function() {
    return [this.url, this.data];
};

var zipFileRegex = /.zip\b/i;
var geoJsonRegex = /.geojson\b/i;

var simpleStyleIdentifiers = ['title', 'description', //
'marker-size', 'marker-symbol', 'marker-color', 'stroke', //
'stroke-opacity', 'stroke-width', 'fill', 'fill-opacity'];

// This next function modelled on Cesium.geoJsonDataSource's defaultDescribe.
function describeWithoutUnderscores(properties, nameProperty) {
    var html = '';
    for (var key in properties) {
        if (properties.hasOwnProperty(key)) {
            if (key === nameProperty || simpleStyleIdentifiers.indexOf(key) !== -1) {
                continue;
            }
            var value = properties[key];
            if (typeof value === 'object') {
                value = describeWithoutUnderscores(value);
            } else {
                value = formatPropertyValue(value);
            }
            key = key.replace(/_/g, ' ');
            if (defined(value)) {
                html += '<tr><th>' + key + '</th><td>' + value + '</td></tr>';
            }
        }
    }
    if (html.length > 0) {
        html = '<table class="cesium-infoBox-defaultTable"><tbody>' + html + '</tbody></table>';
    }
    return html;
}

GeoJsonCatalogItem.prototype._load = function() {
    this._dataSource = new GeoJsonDataSource(this.name);

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
                    throw new TerriaError({
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
                throw new TerriaError({
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
        var jsonPromise;
        if (zipFileRegex.test(that.url)) {
            if (typeof FileReader === 'undefined') {
                throw new TerriaError({
                    sender: that,
                    title: 'Unsupported web browser',
                    message: '\
Sorry, your web browser does not support the File API, which '+this.terria.appName+' requires in order to \
load this dataset.  Please upgrade your web browser.  For the best experience, we recommend the latest versions of \
<a href="http://www.google.com/chrome" target="_blank">Google Chrome</a>, or \
<a href="http://www.mozilla.org/firefox" target="_blank">Mozilla Firefox</a>, or \
<a href="http://www.microsoft.com/ie" target="_blank">Internet Explorer 11</a>.'
                });
            }

            jsonPromise = loadBlob(proxyCatalogItemUrl(that, that.url, '1d')).then(function(blob) {
                var deferred = when.defer();
                zip.createReader(new zip.BlobReader(blob), function(reader) {
                    // Look for a file with a .geojson extension.
                    reader.getEntries(function(entries) {
                        var resolved = false;
                        for (var i = 0; i < entries.length; i++) {
                            var entry = entries[i];
                            if (geoJsonRegex.test(entry.filename)) {
                                getJson(entry, deferred);
                                resolved = true;
                            }
                        }

                        if (!resolved) {
                            deferred.reject();
                        }
                    });
                }, function(e) {
                    deferred.reject(e);
                });
                return deferred.promise;
            });
        } else {
            jsonPromise = loadJson(proxyCatalogItemUrl(that, that.url, '1d'));
        }

        return jsonPromise.then(function(json) {
            return updateModelFromData(that, json);
        }).otherwise(function(e) {
            if (e instanceof TerriaError) {
                throw e;
            }

            throw new TerriaError({
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

function getJson(entry, deferred) {
    entry.getData(new zip.Data64URIWriter(), function(uri) {
        deferred.resolve(loadJson(uri));
    });
}

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
    var promise = reprojectToGeographic(geoJsonItem, geoJson);

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

/**
 * Get a random color for the data based on the passed string (usually dataset name).
 * @private
 * @param  {String[]} cssColors Array of css colors, eg. ['#AAAAAA', 'red'].
 * @param  {String} name Name to base the random choice on.
 * @return {String} A css color, eg. 'red'.
 */
function getRandomCssColor(cssColors, name) {
    var index = hashFromString(name || '') % cssColors.length;
    return cssColors[index];
}


function loadGeoJson(geoJsonItem) {
    /* Style information is applied as follows, in decreasing priority:
    - simple-style properties set directly on individual features in the GeoJSON file
    - simple-style properties set as the 'Style' property on the catalog item
    - our 'options' set below (and point styling applied after Cesium loads the GeoJSON)
    - if anything is underspecified there, then Cesium's defaults come in.

    See https://github.com/mapbox/simplestyle-spec/tree/master/1.1.0
    */

    function defaultColor(colorString, name) {
        if (colorString === undefined) {
            var color = Color.fromCssColorString(getRandomCssColor(standardCssColors.highContrast, name));
            color.alpha = 1;
            return color;
        } else {
            return Color.fromCssColorString(colorString);
        }
    }

    function getColor(color) {
        if (typeof color === 'string' || color instanceof String) {
            return Color.fromCssColorString(color);
        } else {
            return color;
        }
    }

    function parseMarkerSize(sizeString) {
        var sizes = {
            small : 24,
            medium : 48,
            large : 64
        };

        if (sizeString === undefined) {
            return undefined;
        }

        if (sizes[sizeString]) {
            return sizes[sizeString];
        }
        return Number.parseInt(sizeString, 10); // SimpleStyle doesn't allow 'marker-size: 20', but people will do it.
    }

    var dataSource = geoJsonItem._dataSource;

    var style = defaultValue(geoJsonItem.style, {});

    var options = {
        describe: describeWithoutUnderscores,
        markerSize : defaultValue(parseMarkerSize(style['marker-size']), 20),
        markerSymbol: style['marker-symbol'], // and undefined if none
        markerColor : defaultColor(style['marker-color'], geoJsonItem.name),
        strokeWidth : defaultValue(style['stroke-width'], 2),
        polygonStroke: getColor(defaultValue(style.stroke, '#000000')),
        polylineStroke: defaultColor(style.stroke, geoJsonItem.name),
        markerOpacity: style['marker-opacity'] // not in SimpleStyle spec or supported by Cesium but see below
    };

    options.fill = defaultColor(style.fill, (geoJsonItem.name || '') + ' fill');
    if (defined(style['stroke-opacity'])) {
        options.stroke.alpha = parseFloat(style['stroke-opacity']);
    }
    if (defined(style['fill-opacity'])) {
        options.fill.alpha = parseFloat(style['fill-opacity']);
    } else {
        options.fill.alpha = 0.75;
    }

    return dataSource.load(geoJsonItem._readyData, options).then(function() {
        var entities = dataSource.entities.values;

        for (var i = 0; i < entities.length; ++i) {
            var entity = entities[i];

            /* If no marker symbol was provided but Cesium has generated one for a point, then turn it into
               a filled circle instead of the default marker. */
            if (defined(entity.billboard) &&
                !defined(entity.properties['marker-symbol']) &&
                !defined(options.markerSymbol)) {
                entity.point = new PointGraphics({
                    color: getColor(defaultValue(entity.properties['marker-color'], options.markerColor)),
                    pixelSize: defaultValue(entity.properties['marker-size'], options.markerSize / 2),
                    outlineWidth: defaultValue(entity.properties['stroke-width'], options.strokeWidth),
                    outlineColor: getColor(defaultValue(entity.properties.stroke, options.polygonStroke))
                });
                if (defined (entity.properties['marker-opacity'])) {
                    // not part of SimpleStyle spec, but why not?
                    entity.point.color.alpha = parseFloat(entity.properties['marker-opacity']);
                }
                entity.billboard = undefined;
            }
            if (defined(entity.billboard) && defined(entity.properties['marker-opacity'])) {
                entity.billboard.color = new Color(1.0, 1.0, 1.0, parseFloat(entity.properties['marker-opacity']));
            }

            // Cesium on Windows can't render polygons with a stroke-width > 1.0.  And even on other platforms it
            // looks bad because WebGL doesn't mitre the lines together nicely.
            // As a workaround for the special case where the polygon is unfilled anyway, change it to a polyline.
            if (defined(entity.polygon) && polygonHasWideOutline(entity.polygon) && !polygonIsFilled(entity.polygon)) {
                entity.polyline = new PolylineGraphics();
                entity.polyline.show = entity.polygon.show;

                if (defined(entity.polygon.outlineColor)) {
                    entity.polyline.material = new ColorMaterialProperty(entity.polygon.outlineColor.getValue());
                }

                var hierarchy = entity.polygon.hierarchy.getValue();

                var positions = hierarchy.positions;
                closePolyline(positions);

                entity.polyline.positions = positions;
                entity.polyline.width = entity.polygon.outlineWidth;

                createEntitiesFromHoles(dataSource.entities, hierarchy.holes, entity);

                entity.polygon = undefined;
            }
        }
    });
}

function createEntitiesFromHoles(entityCollection, holes, mainEntity) {
    if (!defined(holes)) {
        return;
    }

    for (var i = 0; i < holes.length; ++i) {
        createEntityFromHole(entityCollection, holes[i], mainEntity);
    }
}

function createEntityFromHole(entityCollection, hole, mainEntity) {
    if (!defined(hole) || !defined(hole.positions) || hole.positions.length === 0) {
        return;
    }

    var entity = new Entity();

    entity.name = mainEntity.name;
    entity.availability = mainEntity.availability;
    entity.description = mainEntity.description;
    entity.properties = mainEntity.properties;

    entity.polyline = new PolylineGraphics();
    entity.polyline.show = mainEntity.polyline.show;
    entity.polyline.material = mainEntity.polyline.material;
    entity.polyline.width = mainEntity.polyline.width;

    closePolyline(hole.positions);
    entity.polyline.positions = hole.positions;

    entityCollection.add(entity);

    createEntitiesFromHoles(entityCollection, hole.holes, mainEntity);
}

function closePolyline(positions) {
    // If the first and last positions are more than a meter apart, duplicate the first position so the polyline is closed.
    if (positions.length >= 2 && !Cartesian3.equalsEpsilon(positions[0], positions[positions.length - 1], 0.0, 1.0)) {
        positions.push(positions[0]);
    }
}

function polygonHasWideOutline(polygon) {
    return defined(polygon.outlineWidth) && polygon.outlineWidth.getValue() > 1;
}

function polygonIsFilled(polygon) {
    var fill = true;
    if (defined(polygon.fill)) {
        fill = polygon.fill.getValue();
    }

    if (!fill) {
        return false;
    }

    if (!defined(polygon.material)) {
        // The default is solid white.
        return true;
    }

    var materialProperties = polygon.material.getValue();
    if (defined(materialProperties) && defined(materialProperties.color) && materialProperties.color.alpha === 0.0) {
        return false;
    }

    return true;
}

function reprojectToGeographic(geoJsonItem, geoJson) {
    var code;

    if (!defined(geoJson.crs)) {
        code = undefined;
    } else if (geoJson.crs.type === 'EPSG') {
        code = 'EPSG:' + geoJson.crs.properties.code;
    } else if (geoJson.crs.type === 'name' &&
               defined(geoJson.crs.properties) &&
               defined(geoJson.crs.properties.name)) {
        code = Reproject.crsStringToCode(geoJson.crs.properties.name);
    }

    geoJson.crs = {
        type: 'EPSG',
        properties: {
            code: '4326'
        }
    };

    if (!Reproject.willNeedReprojecting(code)) {
        return true;
    }

   return when(Reproject.checkProjection(geoJsonItem.terria.configParameters.proj4ServiceBaseUrl, code), function(result) {
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

// Reproject a point list based on the supplied crs code.
function reprojectPointList(pts, code) {
    if (!(pts[0] instanceof Array)) {
        return Reproject.reprojectPoint(pts, code, "EPSG:4326");
    }
    var pts_out = [];
    for (var i = 0; i < pts.length; i++) {
        pts_out.push(Reproject.reprojectPoint(pts[i], code, "EPSG:4326"));
    }
    return pts_out;
}

// Find a member by name in the gml.
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

// Filter a geojson coordinates array structure.
function filterArray(pts, func) {
    if (!(pts[0] instanceof Array) || !((pts[0][0]) instanceof Array) ) {
        pts = func(pts);
        return pts;
    }

    var result = new Array(pts.length);
    for (var i = 0; i < pts.length; i++) {
        result[i] = filterArray(pts[i], func);  //at array of arrays of points
    }
    return result;
}

// Get Extent of geojson.
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
            getExtent(pts[j], ext);  // An array of arrays of points.
        }
    }
}

function getGeoJsonExtent(geoJson) {
    var testGeometry = geoJson;
    if(defined(geoJson.type) && geoJson.type === 'Topology') {
        testGeometry = topoJsonToFeaturesArray(geoJson);
    }

    var ext = {west:180, east:-180, south:90, north: -90};
    filterValue(testGeometry, 'coordinates', function(obj, prop) { getExtent(obj[prop], ext); });
    return Rectangle.fromDegrees(ext.west, ext.south, ext.east, ext.north);
}

function topoJsonToFeaturesArray(topoJsonData) {
    var result = [];

    for(var object in topoJsonData.objects) {
        if(topoJsonData.objects.hasOwnProperty(object)) {
            result.push(topojson.feature(topoJsonData, topoJsonData.objects[object]));
        }
    }

    return result;
}

module.exports = GeoJsonCatalogItem;
