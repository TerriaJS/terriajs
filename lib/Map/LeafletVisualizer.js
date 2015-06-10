
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
var isArray = require('terriajs-cesium/Source/Core/isArray');
var PolygonHierarchy = require('terriajs-cesium/Source/Core/PolygonHierarchy');
var Property = require('terriajs-cesium/Source/DataSources/Property');
var writeTextToCanvas = require('terriajs-cesium/Source/Core/writeTextToCanvas');


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

    this._onCollectionChanged(entityCollection, entityCollection.values, [], []);
};


LeafletGeomVisualizer.prototype._onCollectionChanged = function(entityCollection, added, removed, changed) {
    var i;
    var entity;
    var featureGroup = this._featureGroup;
    var entities = this._entitiesToVisualize;

    for (i = added.length - 1; i > -1; i--) {
        entity = added[i];
        if (((defined(entity._point) || defined(entity._billboard) || defined(entity._label)) && defined(entity._position))
            || defined(entity._polyline) || defined(entity._polygon)) {
            entities.set(entity.id, entity);
        }
    }

    for (i = changed.length - 1; i > -1; i--) {
        entity = changed[i];
        if (((defined(entity._point) || defined(entity._billboard) || defined(entity._label)) && defined(entity._position))
            || defined(entity._polyline) || defined(entity._polygon)) {
            entities.set(entity.id, entity);
        } else {
            cleanEntity(entity, featureGroup);
            entities.remove(entity.id);
        }
    }

    for (i = removed.length - 1; i > -1; i--) {
        entity = removed[i];
        cleanEntity(entity, featureGroup);
        entities.remove(entity.id);
    }
};


function cleanEntity(entity, group) {
    if (defined(entity._pointDetails)) {
        group.removeLayer(entity._pointDetails.layer);
        entity._pointDetails = undefined;
    }
    if (defined(entity._geomBillboard)) {
        group.removeLayer(entity._geomBillboard);
        entity._geomBillboard = undefined;
    }
    if (defined(entity._geomLabel)) {
        group.removeLayer(entity._geomLabel);
        entity._geomLabel = undefined;
    }
    if (defined(entity._geomPolyline)) {
        group.removeLayer(entity._geomPolyline);
        entity._geomPolyline = undefined;
    }
    if (defined(entity._geomPolygon)) {
        group.removeLayer(entity._geomPolygon);
        entity._geomPolygon = undefined;
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
    for (var i = 0, len = entities.length; i < len; i++) {
        var entity = entities[i];
        if (defined(entity._point)) {
            this._updatePoint(entity, time);
        }
        if (defined(entity._billboard)) {
            this._updateBillboard(entity, time);
        }
        if (defined(entity._label)) {
            this._updateLabel(entity, time);
        }
        if (defined(entity._polyline)) {
            this._updatePolyline(entity, time);
        }
        if (defined(entity._polygon)) {
            this._updatePolygon(entity, time);
        }
    }
    return true;
};

var cartographicScratch = new Cartographic();

function positionToLatLng(position) {
    var cartographic = Ellipsoid.WGS84.cartesianToCartographic(position, cartographicScratch);
    return L.latLng(CesiumMath.toDegrees(cartographic.latitude), CesiumMath.toDegrees(cartographic.longitude));
}

LeafletGeomVisualizer.prototype._updatePoint = function(entity, time) {
    var featureGroup = this._featureGroup;
    var pointGraphics = entity._point;

    var show = entity.isAvailable(time) && Property.getValueOrDefault(pointGraphics._show, time, true);
    if (!show) {
        cleanEntity(entity, featureGroup);
        return;
    }

    var details = entity._pointDetails;
    if (!defined(details)) {
        details = entity._pointDetails = {
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
        cleanEntity(entity, featureGroup);
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
LeafletGeomVisualizer.prototype._updateBillboard = function(entity, time) {
    var markerGraphics = entity._billboard;
    var featureGroup = this._featureGroup;
    var geomLayer = entity._geomBillboard;
    var position, marker;
    var show = entity.isAvailable(time) && Property.getValueOrDefault(markerGraphics._show, time, true);
    if (show) {
        position = Property.getValueOrUndefined(entity._position, time);
        show = defined(position);
    }
    if (!show) {
        cleanEntity(entity, featureGroup);
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
        featureGroup.addLayer(marker);
        entity._geomBillboard = marker;
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


LeafletGeomVisualizer.prototype._updateLabel = function(entity, time) {
    var labelGraphics = entity._label;
    var featureGroup = this._featureGroup;
    var geomLayer = entity._geomLabel;
    var position, marker;
    var show = entity.isAvailable(time) && Property.getValueOrDefault(labelGraphics._show, time, true);
    if (show) {
        position = Property.getValueOrUndefined(entity._position, time);
        show = defined(position);
    }
    if (!show) {
        cleanEntity(entity, featureGroup);
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
        featureGroup.addLayer(marker);
        entity._geomLabel = marker;
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

LeafletGeomVisualizer.prototype._updatePolyline = function(entity, time) {
    var polylineGraphics = entity._polyline;
    var featureGroup = this._featureGroup;
    var geomLayer = entity._geomPolyline;
    var positions, polyline;
    var show = entity.isAvailable(time) && Property.getValueOrDefault(polylineGraphics._show, time, true);
    if (show) {
        positions = Property.getValueOrUndefined(polylineGraphics._positions, time);
        show = defined(positions);
    }
    if (!show) {
        cleanEntity(entity, featureGroup);
        return;
    }

    var carts = Ellipsoid.WGS84.cartesianArrayToCartographicArray(positions);
    var latlngs = [];
    for (var p = 0; p < carts.length; p++) {
        latlngs.push(L.latLng( CesiumMath.toDegrees(carts[p].latitude), CesiumMath.toDegrees(carts[p].longitude)));
    }
    var color = Property.getValueOrDefault(polylineGraphics._material.color, time, defaultColor);
    var width = Property.getValueOrDefault(polylineGraphics._width, time, defaultWidth);

    var polylineOptions = {
        color: color.toCssColorString(),
        weight: width,
        opacity: color.alpha
    };

    if (!defined(geomLayer)) {
        polyline = L.polyline(latlngs, polylineOptions);
        polyline.on('click', featureClicked.bind(undefined, this, entity));
        featureGroup.addLayer(polyline);
        entity._geomPolyline = polyline;
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

LeafletGeomVisualizer.prototype._updatePolygon = function(entity, time) {
    var polygonGraphics = entity._polygon;
    var featureGroup = this._featureGroup;
    var geomLayer = entity._geomPolygon;
    var positions, polygon;
    var show = entity.isAvailable(time) && Property.getValueOrDefault(polygonGraphics._show, time, true);
    if (show) {
        var hierarchy = Property.getValueOrUndefined(polygonGraphics._hierarchy, time);
        if (isArray(hierarchy)) {
            hierarchy = new PolygonHierarchy(hierarchy);
        }
        positions = hierarchy ? hierarchy.positions : undefined;
        show = defined(positions);
    }
    if (!show) {
        cleanEntity(entity, featureGroup);
        return;
    }

    var carts = Ellipsoid.WGS84.cartesianArrayToCartographicArray(positions);
    var latlngs = [];
    for (var p = 0; p < carts.length; p++) {
        latlngs.push(L.latLng( CesiumMath.toDegrees(carts[p].latitude), CesiumMath.toDegrees(carts[p].longitude)));
    }
    var material = Property.getValueOrUndefined(polygonGraphics._material, time);
    var color;
    if (defined(material) && defined(material.color)) {
        color = material.color;
    } else {
        color = defaultColor;
    }

    var fill = Property.getValueOrDefault(polygonGraphics._fill, time, true);
    var outline = Property.getValueOrDefault(polygonGraphics._outline, time, true);
    var outlineColor = Property.getValueOrDefault(polygonGraphics._outlineColor, time, defaultOutlineColor);

    var polygonOptions = {
        fill: fill,
        fillColor: color.toCssColorString(),
        fillOpacity: color.alpha,
        weight: outline ? 1.0 : 0.0,
        color: outlineColor.toCssColorString(),
        opacity: outlineColor.alpha
     };

    if (!defined(geomLayer)) {
        polygon = L.polygon(latlngs, polygonOptions);
        polygon.on('click', featureClicked.bind(undefined, this, entity));
        featureGroup.addLayer(polygon);
        entity._geomPolygon = polygon;
    } else {
        polygon = geomLayer;
        var curLatLngs = polygon.getLatLngs;
        var bPosChange = (latlngs.length !== curLatLngs.length);
        for (var i = 0; i < curLatLngs.length && !bPosChange; i++) {
            if (!curLatLngs[i].equals(latlngs[i])) {
                bPosChange = true;
            }
        }
        if (bPosChange) {
            polygon.setLatLngs(latlngs);
        }
        for (var prop in polygonOptions) {
            if (polygonOptions[prop] !== polygon.options[prop]) {
                polygon.setStyle(polygonOptions);
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
    for (var i = entities.length - 1; i > -1; i--) {
        cleanEntity(entities[i], this._featureGroup);
    }
    this._entityCollection.collectionChanged.removeEventListener(LeafletGeomVisualizer.prototype._onCollectionChanged, this);
    this._leafletScene.map.removeLayer(this._featureGroup);
    return destroyObject(this);
};

/////////////////////////////////////////////////////////

var LeafletVisualizer = function() {
};

LeafletVisualizer.prototype.visualizersCallback = function(leafletScene, dataSource) {
    var entities = dataSource.entities;
    return [new LeafletGeomVisualizer(leafletScene, entities)];
};

function featureClicked(visualizer, entity) {
    visualizer._leafletScene.featureClicked.raiseEvent(entity);
}

module.exports = LeafletVisualizer;
