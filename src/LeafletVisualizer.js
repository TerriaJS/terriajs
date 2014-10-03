
"use strict";

/*global require,L,URI,$,Document,alert,console*/
var AssociativeArray = require('../third_party/cesium/Source/Core/AssociativeArray');
var Cartesian3 = require('../third_party/cesium/Source/Core/Cartesian3');
var Color = require('../third_party/cesium/Source/Core/Color');
var defined = require('../third_party/cesium/Source/Core/defined');
var destroyObject = require('../third_party/cesium/Source/Core/destroyObject');
var DeveloperError = require('../third_party/cesium/Source/Core/DeveloperError');
var Property = require('../third_party/cesium/Source/DataSources/Property');
var Ellipsoid = require('../third_party/cesium/Source/Core/Ellipsoid');
var CesiumMath = require('../third_party/cesium/Source/Core/Math');
 

var defaultColor = Color.WHITE;
var defaultOutlineColor = Color.BLACK;
var defaultOutlineWidth = 1.0;
var defaultPixelSize = 5.0;

var defaultWidth = 5.0;


/**
 * A {@link Visualizer} which maps {@link Entity#point} to a {@link Billboard}.
 * @alias LeafletGeomVisualizer
 * @constructor
 *
 * @param {Scene} map The map the primitives will be rendered in.
 * @param {EntityCollection} entityCollection The entityCollection to visualize.
 */
var LeafletGeomVisualizer = function(map, entityCollection) {
    //>>includeStart('debug', pragmas.debug);
    if (!defined(map)) {
        throw new DeveloperError('map is required.');
    }
    if (!defined(entityCollection)) {
        throw new DeveloperError('entityCollection is required.');
    }
    //>>includeEnd('debug');

    var featureGroup = L.featureGroup().addTo(map);
    entityCollection.collectionChanged.addEventListener(LeafletGeomVisualizer.prototype._onCollectionChanged, this);

    this._map = map;
    this._featureGroup = featureGroup;
    this._entityCollection = entityCollection;
    this._entitiesToVisualize = new AssociativeArray();

    this._onCollectionChanged(entityCollection, entityCollection.entities, [], []);
};


LeafletGeomVisualizer.prototype._onCollectionChanged = function(entityCollection, added, removed, changed) {
    var i;
    var entity;
    var featureGroup = this._featureGroup;
    var entities = this._entitiesToVisualize;

    for (i = added.length - 1; i > -1; i--) {
        entity = added[i];
        if ((defined(entity._point) || defined(entity._polyline) || defined(entity._polygon))
                 && defined(entity._position)) {
            entities.set(entity.id, entity);
        }
    }

    for (i = changed.length - 1; i > -1; i--) {
        entity = changed[i];
        if ((defined(entity._point) || defined(entity._polyline) || defined(entity._polygon))
                && defined(entity._position)) {
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
    var geomLayer = entity._geomLayer;
    if (defined(geomLayer)) {
        group.removeLayer(geomLayer);
    }
}


LeafletGeomVisualizer.prototype.updatePoint = function(entity, time) {
    var pointGraphics = entity._point;
    var featureGroup = this._featureGroup;
    var geomLayer = entity._geomLayer;
    var position;
    var show = entity.isAvailable(time) && Property.getValueOrDefault(pointGraphics._show, time, true);
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
    var color = Property.getValueOrDefault(pointGraphics._color, time, defaultColor);
    var outlineColor = Property.getValueOrDefault(pointGraphics._outlineColor, time, defaultOutlineColor);
    var outlineWidth = Property.getValueOrDefault(pointGraphics._outlineWidth, time, defaultOutlineWidth);
    var pixelSize = Property.getValueOrDefault(pointGraphics._pixelSize, time, defaultPixelSize);

    var pointOptions = {
        radius: pixelSize / 2.0,
        fillColor: color.toCssColorString(),
        fillOpacity: 0.9,
        color: outlineColor.toCssColorString(),
        weight: outlineWidth,
        opacity: 0.9
    };

    if (!defined(geomLayer)) {
        var point = L.circleMarker(latlng, pointOptions);
        featureGroup.addLayer(point);
        entity._geomLayer = point;
    } else {
        var point = geomLayer;
        if (!point._latlng.equals(latlng)) {
            point.setLatLng(latlng);
        }
        for (var prop in pointOptions) {
            if (pointOptions[prop] !== point.options[prop]) {
                point.setStyle(markerOptions);
                break;
            }
        }
    }
}

LeafletGeomVisualizer.prototype.updatePolyline = function(entity, time) {
    var polylineGraphics = entity._polyline;
    var featureGroup = this._featureGroup;
    var geomLayer = entity._geomLayer;
    var positions;
    var show = entity.isAvailable(time) && Property.getValueOrDefault(polylineGraphics._show, time, true);
    if (show) {
        positions = Property.getValueOrUndefined(entity._positions, time);
        show = defined(positions);
    }
    if (!show) {
        cleanEntity(entity, featureGroup);
        return;
    }

    var carts = Ellipsoid.WGS84.cartesianArrayToCartographicArray(positions);
    var latlngs = [];
    for (var i = 0; i < carts.length; i++) {
        latlngs.push(L.latLng( CesiumMath.toDegrees(carts[i].latitude), CesiumMath.toDegrees(cart[i].longitude)));
    }
    var color = Property.getValueOrDefault(polylineGraphics._material.color, time, defaultColor);
    var width = Property.getValueOrDefault(polylineGraphics._width, time, defaultWidth);

    var polylineOptions = {
        color: color.toCssColorString(),
        weight: width,
        opacity: 0.9
    };

    if (!defined(geomLayer)) {
        var polyline = L.polyline(latlngs, polylineOptions);
        featureGroup.addLayer(polyline);
        entity._geomLayer = polyline;
    } else {
        var polyline = geomLayer;
        var curLatLngs = polyline.getLatLngs;
        for (var i = 0; i < curLatLngs.length; i++) {
            if (!curLatLngs[i].equals(latlng[i])) {
                polyline.setLatLngs(latlngs);
                break;
            }
        }
        for (var prop in polylineOptions) {
            if (polylineOptions[prop] !== polyline.options[prop]) {
                polyline.setStyle(polylineOptions);
                break;
            }
        }
    }
}

LeafletGeomVisualizer.prototype.updatePolygon = function(entity, time) {
    var polygonGraphics = entity._polygon;
    var featureGroup = this._featureGroup;
    var geomLayer = entity._geomLayer;
    var positions;
    var show = entity.isAvailable(time) && Property.getValueOrDefault(polygonGraphics._show, time, true);
    if (show) {
        positions = Property.getValueOrUndefined(entity._positions, time);
        show = defined(positions);
    }
    if (!show) {
        cleanEntity(entity, featureGroup);
        return;
    }

    var carts = Ellipsoid.WGS84.cartesianArrayToCartographicArray(positions);
    var latlngs = [];
    for (var i = 0; i < carts.length; i++) {
        latlngs.push(L.latLng( CesiumMath.toDegrees(carts[i].latitude), CesiumMath.toDegrees(cart[i].longitude)));
    }
    var color = Property.getValueOrDefault(polygonGraphics._material.color, time, defaultColor);
    var fill = Property.getValueOrDefault(polygonGraphics._width, time, true);
    var outline = Property.getValueOrDefault(polygonGraphics._outline, time, true);

    var polygonOptions = {
        fillColor: color.toCssColorString(),
        fill: fill,
        weight: outline ? 1.0 : 0.0,
    };

    if (!defined(geomLayer)) {
        var polygon = L.polygon(latlngs, polygonOptions);
        featureGroup.addLayer(polygon);
        entity._geomLayer = polygon;
    } else {
        var polygon = geomLayer;
        var curLatLngs = polygon.getLatLngs;
        for (var i = 0; i < curLatLngs.length; i++) {
            if (!curLatLngs[i].equals(latlng[i])) {
                polygon.setLatLngs(latlngs);
                break;
            }
        }
        for (var prop in polygonOptions) {
            if (polygonOptions[prop] !== polygon.options[prop]) {
                polygon.setStyle(polygonOptions);
                break;
            }
        }
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
            this.updatePoint(entity, time);
        }
        else if (defined(entity._polyline)) {
            this.updatePolyline(entity, time);
        }
        else if (defined(entity._polygon)) {
            this.updatePolygon(entity, time);
        }
    }
    return true;
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
        entities[i]._geomLayer = undefined;
    }
    this._entityCollection.collectionChanged.removeEventListener(LeafletGeomVisualizer.prototype._onCollectionChanged, this);
    this._map.removeLayer(this._featureGroup);
    return destroyObject(this);
};

/////////////////////////////////////////////////////////

var LeafletVisualizer = function() {
};

LeafletVisualizer.prototype.visualizersCallback = function(map, dataSource) {
    var entities = dataSource.entities;
    return [new LeafletGeomVisualizer(map, entities)];
};

module.exports = LeafletVisualizer;
