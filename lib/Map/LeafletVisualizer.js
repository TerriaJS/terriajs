
"use strict";

/*global require*/
var L = require('leaflet');
var AssociativeArray = require('terriajs-cesium/Source/Core/AssociativeArray');
var Cartesian2 = require('terriajs-cesium/Source/Core/Cartesian2');
var Cartesian3 = require('terriajs-cesium/Source/Core/Cartesian3');
var Cartographic = require('terriajs-cesium/Source/Core/Cartographic');
var CesiumMath = require('terriajs-cesium/Source/Core/Math');
var Color = require('terriajs-cesium/Source/Core/Color');
var defined = require('terriajs-cesium/Source/Core/defined');
var destroyObject = require('terriajs-cesium/Source/Core/destroyObject');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var Ellipsoid = require('terriajs-cesium/Source/Core/Ellipsoid');
var Property = require('terriajs-cesium/Source/DataSources/Property');
var writeTextToCanvas = require('terriajs-cesium/Source/Core/writeTextToCanvas');
var PolylineGlowMaterialProperty = require('terriajs-cesium/Source/DataSources/PolylineGlowMaterialProperty');


var defaultColor = Color.WHITE;
var defaultOutlineColor = Color.BLACK;
var defaultOutlineWidth = 1.0;
var defaultPixelSize = 5.0;

var defaultWidth = 5.0;

//NOT IMPLEMENTED
// Path primitive - no need identified
// Ellipse primitive - no need identified
// Ellipsoid primitive - 3d prim - no plans for this
// Model primitive - 3d prim - no plans for this

/**
 * A {@link Visualizer} which maps {@link Entity#point} to Leaflet primitives.
 * @alias LeafletGeomVisualizer
 * @constructor
 *
 * @param {LeafletScene} leafletScene The Leaflet scene that the the primitives will be rendered in.
 * @param {EntityCollection} entityCollection The entityCollection to visualize.
 */
var LeafletGeomVisualizer = function(leafletScene, entityCollection) {
    if (!defined(leafletScene)) {
        throw new DeveloperError('leafletScene is required.');
    }
    if (!defined(entityCollection)) {
        throw new DeveloperError('entityCollection is required.');
    }

    var featureGroup = L.featureGroup().addTo(leafletScene.map);
    entityCollection.collectionChanged.addEventListener(LeafletGeomVisualizer.prototype._onCollectionChanged, this);

    this._leafletScene = leafletScene;
    this._featureGroup = featureGroup;
    this._entityCollection = entityCollection;
    this._entitiesToVisualize = new AssociativeArray();
    this._entityHash = {};

    this._onCollectionChanged(entityCollection, entityCollection.values, [], []);
};


LeafletGeomVisualizer.prototype._onCollectionChanged = function(entityCollection, added, removed, changed) {
    var i;
    var entity;
    var featureGroup = this._featureGroup;
    var entities = this._entitiesToVisualize;
    var entityHash = this._entityHash;

    for (i = added.length - 1; i > -1; i--) {
        entity = added[i];
        if (((defined(entity._point) || defined(entity._billboard) || defined(entity._label)) && defined(entity._position))
            || defined(entity._polyline) || defined(entity._polygon)) {

            entities.set(entity.id, entity);
            entityHash[entity.id] = {};
        }
    }

    for (i = changed.length - 1; i > -1; i--) {
        entity = changed[i];
        if (((defined(entity._point) || defined(entity._billboard) || defined(entity._label)) && defined(entity._position))
            || defined(entity._polyline) || defined(entity._polygon)) {
            entities.set(entity.id, entity);
            entityHash[entity.id] = entityHash[entity.id] || {};
        } else {
            cleanEntity(entity, featureGroup, entityHash);
            entities.remove(entity.id);
        }
    }

    for (i = removed.length - 1; i > -1; i--) {
        entity = removed[i];
        cleanEntity(entity, featureGroup, entityHash);
        entities.remove(entity.id);
    }
};


function cleanEntity(entity, group, entityHash) {
    var details = entityHash[entity.id];

    cleanPoint(entity, group, details);
    cleanPolygon(entity, group, details);
    cleanBillboard(entity, group, details);
    cleanLabel(entity, group, details);
    cleanPolyline(entity, group, details);

    delete entityHash[entity.id];
}

function cleanPoint(entity, group, details) {
    if (defined(details.point)) {
        group.removeLayer(details.point.layer);
        details.point = undefined;
    }
}

function cleanPolygon(entity, group, details) {
    if (defined(details.polygon)) {
        group.removeLayer(details.polygon.layer);
        details.polygon = undefined;
    }
}

function cleanBillboard(entity, group, details) {
    if (defined(details.billboard)) {
        group.removeLayer(details.billboard.layer);
        details.billboard = undefined;
    }
}

function cleanLabel(entity, group, details) {
    if (defined(details.label)) {
        group.removeLayer(details.label.layer);
        details.label = undefined;
    }
}

function cleanPolyline(entity, group, details) {
    if (defined(details.polyline)) {
        group.removeLayer(details.polyline.layer);
        details.polyline = undefined;
    }
}

/**
 * Updates the primitives created by this visualizer to match their
 * Entity counterpart at the given time.
 *
 * @param {JulianDate} time The time to update to.
 * @returns {Boolean} This function always returns true.
 */
LeafletGeomVisualizer.prototype.update = function(time) {
    //>>includeStart('debug', pragmas.debug);
    if (!defined(time)) {
        throw new DeveloperError('time is required.');
    }
    //>>includeEnd('debug');

    var entities = this._entitiesToVisualize.values;
    var entityHash = this._entityHash;

    for (var i = 0, len = entities.length; i < len; i++) {
        var entity = entities[i];
        var entityDetails = entityHash[entity.id];

        if (defined(entity._point)) {
            this._updatePoint(entity, time, entityHash, entityDetails);
        }
        if (defined(entity._billboard)) {
            this._updateBillboard(entity, time, entityHash, entityDetails);
        }
        if (defined(entity._label)) {
            this._updateLabel(entity, time, entityHash, entityDetails);
        }
        if (defined(entity._polyline)) {
            this._updatePolyline(entity, time, entityHash, entityDetails);
        }
        if (defined(entity._polygon)) {
            this._updatePolygon(entity, time, entityHash, entityDetails);
        }
    }

    return true;
};

/**
 * Computes the rectangular bounds which encloses the collection of
 * entities to be visualized.
 *
 * @returns {LatLngBounds} The computed bounds.
 */
LeafletGeomVisualizer.prototype.getLatLngBounds = function() {
    let result;

    Object.keys(this._entityHash).forEach(entityId => {
        const entityDetails = this._entityHash[entityId];

        Object.keys(entityDetails).forEach(primitiveId => {
            const primitive = entityDetails[primitiveId];

            if (defined(primitive.layer)) {
                if (defined(primitive.layer.getBounds)) {
                    const bounds = primitive.layer.getBounds();
                    if (defined(bounds)) {
                        result = result === undefined ? L.latLngBounds(bounds.getSouthWest(), bounds.getNorthEast()) : result.extend(bounds);
                    }
                }
                if (defined(primitive.layer.getLatLng)) {
                    const latLng = primitive.layer.getLatLng();
                    if (defined(latLng)) {
                        result = result === undefined ? L.latLngBounds([latLng]) : result.extend(latLng);
                    }
                }
            }
        });
    });

    return result;
};

var cartographicScratch = new Cartographic();

function positionToLatLng(position) {
    var cartographic = Ellipsoid.WGS84.cartesianToCartographic(position, cartographicScratch);
    return L.latLng(CesiumMath.toDegrees(cartographic.latitude), CesiumMath.toDegrees(cartographic.longitude));
}

LeafletGeomVisualizer.prototype._updatePoint = function(entity, time, entityHash, entityDetails) {
    var featureGroup = this._featureGroup;
    var pointGraphics = entity._point;

    var show = entity.isAvailable(time) && Property.getValueOrDefault(pointGraphics._show, time, true);
    if (!show) {
        cleanPoint(entity, featureGroup, entityDetails);
        return;
    }

    var details = entityDetails.point;
    if (!defined(details)) {
        details = entityDetails.point = {
            layer: undefined,
            lastPosition: new Cartesian3(),
            lastPixelSize: 1,
            lastColor: new Color(),
            lastOutlineColor: new Color(),
            lastOutlineWidth: 1
        };
    }

    var position = Property.getValueOrUndefined(entity._position, time);
    if (!defined(position)) {
        cleanPoint(entity, featureGroup, entityDetails);
        return;
    }

    var pixelSize = Property.getValueOrDefault(pointGraphics._pixelSize, time, defaultPixelSize);
    var color = Property.getValueOrDefault(pointGraphics._color, time, defaultColor);
    var outlineColor = Property.getValueOrDefault(pointGraphics._outlineColor, time, defaultOutlineColor);
    var outlineWidth = Property.getValueOrDefault(pointGraphics._outlineWidth, time, defaultOutlineWidth);

    var layer = details.layer;

    if (!defined(layer)){
        var pointOptions = {
            radius: pixelSize / 2.0,
            fillColor: color.toCssColorString(),
            fillOpacity: color.alpha,
            color: outlineColor.toCssColorString(),
            weight: outlineWidth,
            opacity: outlineColor.alpha
        };

        layer = details.layer = L.circleMarker(positionToLatLng(position), pointOptions);
        layer.on('click', featureClicked.bind(undefined, this, entity));
        layer.on('mousedown', featureMousedown.bind(undefined, this, entity));
        featureGroup.addLayer(layer);

        Cartesian3.clone(position, details.lastPosition);
        details.lastPixelSize = pixelSize;
        Color.clone(color, details.lastColor);
        Color.clone(outlineColor, details.lastOutlineColor);
        details.lastOutlineWidth = outlineWidth;

        return;
    }

    if (!Cartesian3.equals(position, details.lastPosition)) {
        layer.setLatLng(positionToLatLng(position));
        Cartesian3.clone(position, details.lastPosition);
    }

    if (pixelSize !== details.lastPixelSize) {
        layer.setRadius(pixelSize / 2.0);
        details.lastPixelSize = pixelSize;
    }

    var options = layer.options;
    var applyStyle = false;

    if (!Color.equals(color, details.lastColor)) {
        options.fillColor = color.toCssColorString();
        options.fillOpacity = color.alpha;
        Color.clone(color, details.lastColor);
        applyStyle = true;
    }

    if (!Color.equals(outlineColor, details.lastOutlineColor)) {
        options.color = outlineColor.toCssColorString();
        options.opacity = outlineColor.alpha;
        Color.clone(outlineColor, details.lastOutlineColor);
        applyStyle = true;
    }

    if (outlineWidth !== details.lastOutlineWidth) {
        options.weight = outlineWidth;
        details.lastOutlineWidth = outlineWidth;
        applyStyle = true;
    }

    if (applyStyle) {
        layer.setStyle(options);
    }
};

LeafletGeomVisualizer.prototype._updatePolygon = function(entity, time, entityHash, entityDetails) {
    var featureGroup = this._featureGroup;
    var polygonGraphics = entity._polygon;

    var show = entity.isAvailable(time) && Property.getValueOrDefault(polygonGraphics._show, time, true);
    if (!show) {
        cleanPolygon(entity, featureGroup, entityDetails);
        return;
    }

    var details = entityDetails.polygon;
    if (!defined(details)) {
        details = entityDetails.polygon = {
            layer: undefined,
            lastHierarchy: undefined,
            lastFill: undefined,
            lastFillColor: new Color(),
            lastOutline: undefined,
            lastOutlineColor: new Color()
        };
    }

    var hierarchy = Property.getValueOrUndefined(polygonGraphics._hierarchy, time);
    if (!defined(hierarchy)) {
        cleanPolygon(entity, featureGroup, entityDetails);
        return;
    }

    var fill = Property.getValueOrDefault(polygonGraphics._fill, time, true);
    var outline = Property.getValueOrDefault(polygonGraphics._outline, time, true);
    var outlineColor = Property.getValueOrDefault(polygonGraphics._outlineColor, time, defaultOutlineColor);

    var material = Property.getValueOrUndefined(polygonGraphics._material, time);
    var fillColor;
    if (defined(material) && defined(material.color)) {
        fillColor = material.color;
    } else {
        fillColor = defaultColor;
    }

    var layer = details.layer;
    if (!defined(layer)) {
        var polygonOptions = {
            fill: fill,
            fillColor: fillColor.toCssColorString(),
            fillOpacity: fillColor.alpha,
            weight: outline ? 1.0 : 0.0,
            color: outlineColor.toCssColorString(),
            opacity: outlineColor.alpha
        };

        layer = details.layer = L.polygon(hierarchyToLatLngs(hierarchy), polygonOptions);
        layer.on('click', featureClicked.bind(undefined, this, entity));
        layer.on('mousedown', featureMousedown.bind(undefined, this, entity));
        featureGroup.addLayer(layer);

        details.lastHierarchy = hierarchy;
        details.lastFill = fill;
        details.lastOutline = outline;
        Color.clone(fillColor, details.lastFillColor);
        Color.clone(outlineColor, details.lastOutlineColor);

        return;
    }

    if (hierarchy !== details.lastHierachy) {
        layer.setLatLngs(hierarchyToLatLngs(hierarchy));
        details.lastHierachy = hierarchy;
    }

    var options = layer.options;
    var applyStyle = false;

    if (fill !== details.lastFill) {
        options.fill = fill;
        details.lastFill = fill;
        applyStyle = true;
    }

    if (outline !== details.lastOutline) {
        options.weight = outline ? 1.0 : 0.0;
        details.lastOutline = outline;
        applyStyle = true;
    }

    if (!Color.equals(fillColor, details.lastFillColor)) {
        options.fillColor = fillColor.toCssColorString();
        options.fillOpacity = fillColor.alpha;
        Color.clone(fillColor, details.lastFillColor);
        applyStyle = true;
    }

    if (!Color.equals(outlineColor, details.lastOutlineColor)) {
        options.color = outlineColor.toCssColorString();
        options.opacity = outlineColor.alpha;
        Color.clone(outlineColor, details.lastOutlineColor);
        applyStyle = true;
    }

    if (applyStyle) {
        layer.setStyle(options);
    }
};

function hierarchyToLatLngs(hierarchy) {
    // This function currently does not handle polygons with holes.

    var positions = Array.isArray(hierarchy) ? hierarchy : hierarchy.positions;
    var carts = Ellipsoid.WGS84.cartesianArrayToCartographicArray(positions);
    var latlngs = [];
    for (var i = 0; i < carts.length; ++i) {
        latlngs.push(L.latLng(CesiumMath.toDegrees(carts[i].latitude), CesiumMath.toDegrees(carts[i].longitude)));
    }

    return latlngs;
}

//Recolor an image using 2d canvas
function recolorBillboard(img, color) {
    var canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;

    // Copy the image contents to the canvas
    var context = canvas.getContext("2d");
    context.drawImage(img, 0, 0);
    var image = context.getImageData(0, 0, canvas.width, canvas.height);
    var normClr = [color.red, color.green, color.blue, color.alpha];

    var length = image.data.length;  //pixel count * 4
    for (var i = 0; i < length; i += 4) {
        for (var j = 0; j < 4; j++) {
            image.data[j+i] *= normClr[j];
        }
    }

    context.putImageData(image, 0, 0);
    return canvas.toDataURL();
//    return context.getImageData(0, 0, canvas.width, canvas.height);
}

//Single pixel black dot
var tmpImage = "data:image/gif;base64,R0lGODlhAQABAPAAAAAAAP///yH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==";

//NYI: currently skipping all the camera distance related properties
LeafletGeomVisualizer.prototype._updateBillboard = function(entity, time, entityHash, entityDetails) {
    var markerGraphics = entity._billboard;
    var featureGroup = this._featureGroup;
    var position, marker;

    var details = entityDetails.billboard;
    if (!defined(details)) {
        details = entityDetails.billboard = {
            layer: undefined
        };
    }

    var geomLayer = details.layer;

    var show = entity.isAvailable(time) && Property.getValueOrDefault(markerGraphics._show, time, true);
    if (show) {
        position = Property.getValueOrUndefined(entity._position, time);
        show = defined(position);
    }
    if (!show) {
        cleanBillboard(entity, featureGroup, entityDetails);
        return;
    }

    var cart = Ellipsoid.WGS84.cartesianToCartographic(position);
    var latlng = L.latLng( CesiumMath.toDegrees(cart.latitude), CesiumMath.toDegrees(cart.longitude) );
    var image = Property.getValueOrDefault(markerGraphics._image, time, undefined);
    var height = Property.getValueOrDefault(markerGraphics._height, time, undefined);
    var width = Property.getValueOrDefault(markerGraphics._width, time, undefined);
    var color = Property.getValueOrDefault(markerGraphics._color, time, defaultColor);
    var scale = Property.getValueOrDefault(markerGraphics._scale, time, 1.0);
    var verticalOrigin = Property.getValueOrDefault(markerGraphics._verticalOrigin, time, 0);
    var horizontalOrigin = Property.getValueOrDefault(markerGraphics._horizontalOrigin, time, 0);
    var pixelOffset = Property.getValueOrDefault(markerGraphics._pixelOffset, time, Cartesian2.ZERO);

    var imageUrl;
    if (defined(image)) {
        if (typeof image === 'string') {
            imageUrl = image;
        } else if (defined(image.toDataURL)) {
            imageUrl = image.toDataURL();
        } else if (defined(image.url)) {
            imageUrl = image.url;
        } else {
            imageUrl = image.src;
        }
    }

    var iconOptions = {
        color: color.toCssColorString(),
        origUrl: imageUrl,
        scale: scale,
        horizontalOrigin: horizontalOrigin,  //value: left, center, right
        verticalOrigin: verticalOrigin      //value: bottom, center, top
    };

    if (defined(height) || defined(width)) {
        iconOptions.iconSize = [width, height];
    }

    var redrawIcon = false;
    if (!defined(geomLayer)) {
        var markerOptions = {icon: L.icon({iconUrl: tmpImage})};
        marker = L.marker(latlng, markerOptions);
        marker.on('click', featureClicked.bind(undefined, this, entity));
        marker.on('mousedown', featureMousedown.bind(undefined, this, entity));
        featureGroup.addLayer(marker);
        details.layer = marker;
        redrawIcon = true;
    } else {
        marker = geomLayer;
        if (!marker._latlng.equals(latlng)) {
            marker.setLatLng(latlng);
        }
        for (var prop in iconOptions) {
            if (iconOptions[prop] !== marker.options.icon.options[prop]) {
                redrawIcon = true;
                break;
            }
        }
    }

    if (redrawIcon) {
        var drawBillboard = function(image, dataurl) {
            iconOptions.iconUrl = dataurl || image;
            if (!defined(iconOptions.iconSize)) {
                iconOptions.iconSize = [image.width * scale, image.height * scale];
            }
            var w = iconOptions.iconSize[0], h = iconOptions.iconSize[1];
            var xOff = (w/2)*(1-horizontalOrigin) - pixelOffset.x;
            var yOff = (h/2)*(1+verticalOrigin) - pixelOffset.y;
            iconOptions.iconAnchor = [xOff, yOff];

            if (!color.equals(defaultColor)) {
                iconOptions.iconUrl = recolorBillboard(image, color);
            }
            marker.setIcon(L.icon(iconOptions));
        };
        var img = new Image();
        img.onload = function() {
            drawBillboard(img, imageUrl);
        };
        img.src = imageUrl;
    }
};


LeafletGeomVisualizer.prototype._updateLabel = function(entity, time, entityHash, entityDetails) {
    var labelGraphics = entity._label;
    var featureGroup = this._featureGroup;
    var position, marker;

    var details = entityDetails.label;
    if (!defined(details)) {
        details = entityDetails.label = {
            layer: undefined
        };
    }

    var geomLayer = details.layer;

    var show = entity.isAvailable(time) && Property.getValueOrDefault(labelGraphics._show, time, true);
    if (show) {
        position = Property.getValueOrUndefined(entity._position, time);
        show = defined(position);
    }
    if (!show) {
        cleanLabel(entity, featureGroup, entityDetails);
        return;
    }

    var cart = Ellipsoid.WGS84.cartesianToCartographic(position);
    var latlng = L.latLng( CesiumMath.toDegrees(cart.latitude), CesiumMath.toDegrees(cart.longitude) );
    var text = Property.getValueOrDefault(labelGraphics._text, time, undefined);
    var font = Property.getValueOrDefault(labelGraphics._font, time, undefined);
    var scale = Property.getValueOrDefault(labelGraphics._scale, time, 1.0);
    var fillColor = Property.getValueOrDefault(labelGraphics._fillColor, time, defaultColor);
    var verticalOrigin = Property.getValueOrDefault(labelGraphics._verticalOrigin, time, 0);
    var horizontalOrigin = Property.getValueOrDefault(labelGraphics._horizontalOrigin, time, 0);
    var pixelOffset = Property.getValueOrDefault(labelGraphics._pixelOffset, time, Cartesian2.ZERO);

    var iconOptions = {
        text: text,
        font: font,
        color: fillColor.toCssColorString(),
        scale: scale,
        horizontalOrigin: horizontalOrigin,  //value: left, center, right
        verticalOrigin: verticalOrigin      //value: bottom, center, top
    };

    var redrawLabel = false;
    if (!defined(geomLayer)) {
        var markerOptions = {icon: L.icon({iconUrl: tmpImage})};
        marker = L.marker(latlng, markerOptions);
        marker.on('click', featureClicked.bind(undefined, this, entity));
        marker.on('mousedown', featureMousedown.bind(undefined, this, entity));
        featureGroup.addLayer(marker);
        details.layer = marker;
        redrawLabel = true;
    } else {
        marker = geomLayer;
        if (!marker._latlng.equals(latlng)) {
            marker.setLatLng(latlng);
        }
        for (var prop in iconOptions) {
            if (iconOptions[prop] !== marker.options.icon.options[prop]) {
                redrawLabel = true;
                break;
            }
        }
    }

    if (redrawLabel) {
        var drawBillboard = function(image, dataurl) {
            iconOptions.iconUrl = dataurl || image;
            if (!defined(iconOptions.iconSize)) {
                iconOptions.iconSize = [image.width * scale, image.height * scale];
            }
            var w = iconOptions.iconSize[0], h = iconOptions.iconSize[1];
            var xOff = (w/2)*(1-horizontalOrigin) - pixelOffset.x;
            var yOff = (h/2)*(1+verticalOrigin) - pixelOffset.y;
            iconOptions.iconAnchor = [xOff, yOff];
            marker.setIcon(L.icon(iconOptions));
        };

        var canvas = writeTextToCanvas(text, {fillColor: fillColor, font: font});
        var imageUrl = canvas.toDataURL();

        var img = new Image();
        img.onload = function() {
            drawBillboard(img, imageUrl);
        };
        img.src = imageUrl;
    }
};

LeafletGeomVisualizer.prototype._updatePolyline = function(entity, time, entityHash, entityDetails) {
    var polylineGraphics = entity._polyline;
    var featureGroup = this._featureGroup;
    var positions, polyline;

    var details = entityDetails.polyline;
    if (!defined(details)) {
        details = entityDetails.polyline = {
            layer: undefined
        };
    }

    var geomLayer = details.layer;

    var show = entity.isAvailable(time) && Property.getValueOrDefault(polylineGraphics._show, time, true);
    if (show) {
        positions = Property.getValueOrUndefined(polylineGraphics._positions, time);
        show = defined(positions);
    }
    if (!show) {
        cleanPolyline(entity, featureGroup, entityDetails);
        return;
    }

    var carts = Ellipsoid.WGS84.cartesianArrayToCartographicArray(positions);
    var latlngs = [];
    for (var p = 0; p < carts.length; p++) {
        latlngs.push(L.latLng( CesiumMath.toDegrees(carts[p].latitude), CesiumMath.toDegrees(carts[p].longitude)));
    }

    var color;
    var width;
    if (polylineGraphics._material instanceof PolylineGlowMaterialProperty) {
        color = defaultColor;
        width = defaultWidth;
    } else {
        color = Property.getValueOrDefault(polylineGraphics._material.color, time, defaultColor);
        width = Property.getValueOrDefault(polylineGraphics._width, time, defaultWidth);
    }

    var polylineOptions = {
        color: color.toCssColorString(),
        weight: width,
        opacity: color.alpha
    };

    if (!defined(geomLayer)) {
        if (latlngs.length > 0) {
            polyline = L.polyline(latlngs, polylineOptions);
            polyline.on('click', featureClicked.bind(undefined, this, entity));
            polyline.on('mousedown', featureMousedown.bind(undefined, this, entity));
            featureGroup.addLayer(polyline);
            details.layer = polyline;
        }
    } else {
        polyline = geomLayer;
        var curLatLngs = polyline.getLatLngs();
        var bPosChange = (latlngs.length !== curLatLngs.length);
        for (var i = 0; i < curLatLngs.length && !bPosChange; i++) {
            if (!curLatLngs[i].equals(latlngs[i])) {
                bPosChange = true;
            }
        }
        if (bPosChange) {
            polyline.setLatLngs(latlngs);
        }
        for (var prop in polylineOptions) {
            if (polylineOptions[prop] !== polyline.options[prop]) {
                polyline.setStyle(polylineOptions);
                break;
            }
        }
    }
};

/**
 * Returns true if this object was destroyed; otherwise, false.
 *
 * @returns {Boolean} True if this object was destroyed; otherwise, false.
 */
LeafletGeomVisualizer.prototype.isDestroyed = function() {
    return false;
};

/**
 * Removes and destroys all primitives created by this instance.
 */
LeafletGeomVisualizer.prototype.destroy = function() {
    var entities = this._entitiesToVisualize.values;
    var entityHash = this._entityHash;

    for (var i = entities.length - 1; i > -1; i--) {
        cleanEntity(entities[i], this._featureGroup, entityHash);
    }

    this._entityCollection.collectionChanged.removeEventListener(LeafletGeomVisualizer.prototype._onCollectionChanged, this);
    this._leafletScene.map.removeLayer(this._featureGroup);
    return destroyObject(this);
};

////////////////////////////////////////////////////////

var LeafletVisualizer = function() {
};

LeafletVisualizer.prototype.visualizersCallback = function(leafletScene, entityCluster, dataSource) {
    var entities = dataSource.entities;
    return [new LeafletGeomVisualizer(leafletScene, entities)];
};


function featureClicked(visualizer, entity, event) {
    visualizer._leafletScene.featureClicked.raiseEvent(entity, event);
}

function featureMousedown(visualizer, entity, event) {
    visualizer._leafletScene.featureMousedown.raiseEvent(entity, event);
}

module.exports = LeafletVisualizer;
