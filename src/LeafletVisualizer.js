
"use strict";

/*global require,L,URI,$,Document,alert,console*/
var AssociativeArray = require('../third_party/cesium/Source/Core/AssociativeArray');
var Cartesian3 = require('../third_party/cesium/Source/Core/Cartesian3');
var Color = require('../third_party/cesium/Source/Core/Color');
var defined = require('../third_party/cesium/Source/Core/defined');
var destroyObject = require('../third_party/cesium/Source/Core/destroyObject');
var DeveloperError = require('../third_party/cesium/Source/Core/DeveloperError');
var NearFarScalar = require('../third_party/cesium/Source/Core/NearFarScalar');
var BillboardCollection = require('../third_party/cesium/Source/Scene/BillboardCollection');
var Property = require('../third_party/cesium/Source/DataSources/Property');
var Ellipsoid = require('../third_party/cesium/Source/Core/Ellipsoid');
var CesiumMath = require('../third_party/cesium/Source/Core/Math');
 

var defaultColor = Color.WHITE;
var defaultOutlineColor = Color.BLACK;
var defaultOutlineWidth = 1.0;
var defaultPixelSize = 5.0;


/**
 * A {@link Visualizer} which maps {@link Entity#point} to a {@link Billboard}.
 * @alias LeafletPointVisualizer
 * @constructor
 *
 * @param {Scene} map The map the primitives will be rendered in.
 * @param {EntityCollection} entityCollection The entityCollection to visualize.
 */
var LeafletPointVisualizer = function(map, entityCollection) {
    //>>includeStart('debug', pragmas.debug);
    if (!defined(map)) {
        throw new DeveloperError('map is required.');
    }
    if (!defined(entityCollection)) {
        throw new DeveloperError('entityCollection is required.');
    }
    //>>includeEnd('debug');

    var featureGroup = L.featureGroup().addTo(map);
    entityCollection.collectionChanged.addEventListener(LeafletPointVisualizer.prototype._onCollectionChanged, this);

    this._map = map;
    this._featureGroup = featureGroup;
    this._entityCollection = entityCollection;
    this._entitiesToVisualize = new AssociativeArray();

    this._onCollectionChanged(entityCollection, entityCollection.entities, [], []);
};


LeafletPointVisualizer.prototype._onCollectionChanged = function(entityCollection, added, removed, changed) {
    var i;
    var entity;
    var featureGroup = this._featureGroup;
    var entities = this._entitiesToVisualize;

    for (i = added.length - 1; i > -1; i--) {
        entity = added[i];
        if (defined(entity._point) && defined(entity._position)) {
            entities.set(entity.id, entity);
        }
    }

    for (i = changed.length - 1; i > -1; i--) {
        entity = changed[i];
        if (defined(entity._point) && defined(entity._position)) {
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


/**
 * Updates the primitives created by this visualizer to match their
 * Entity counterpart at the given time.
 *
 * @param {JulianDate} time The time to update to.
 * @returns {Boolean} This function always returns true.
 */
LeafletPointVisualizer.prototype.update = function(time) {
    //>>includeStart('debug', pragmas.debug);
    if (!defined(time)) {
        throw new DeveloperError('time is required.');
    }
    //>>includeEnd('debug');

    var entities = this._entitiesToVisualize.values;
    var featureGroup = this._featureGroup;
     for (var i = 0, len = entities.length; i < len; i++) {
        var entity = entities[i];
        var pointGraphics = entity._point;
        var position;
        var geomLayer = entity._geomLayer;
        var show = entity.isAvailable(time) && Property.getValueOrDefault(pointGraphics._show, time, true);
        if (show) {
            position = Property.getValueOrUndefined(entity._position, time, tmpPosition);
            show = defined(position);
        }
        if (!show) {
            cleanEntity(entity, featureGroup);
            continue;
        }

        var cart = Ellipsoid.WGS84.cartesianToCartographic(position);
        var latlng = L.latLng( CesiumMath.toDegrees(cart.latitude), CesiumMath.toDegrees(cart.longitude) );
        var color = Property.getValueOrDefault(pointGraphics._color, time, defaultColor);
        var outlineColor = Property.getValueOrDefault(pointGraphics._outlineColor, time, defaultOutlineColor);
        var outlineWidth = Property.getValueOrDefault(pointGraphics._outlineWidth, time, defaultOutlineWidth);
        var pixelSize = Property.getValueOrDefault(pointGraphics._pixelSize, time, defaultPixelSize);

        var markerOptions = {
            radius: pixelSize / 2.0,
            fillColor: color.toCssColorString(),
            fillOpacity: 0.9,
            color: outlineColor.toCssColorString(),
            weight: outlineWidth,
            opacity: 0.9
        };

        if (!defined(geomLayer)) {
            var point = L.circleMarker(latlng, markerOptions);
            featureGroup.addLayer(point);
            entity._geomLayer = point;
        } else {
            var point = geomLayer;
            if (!point._latlng.equals(latlng)) {
                point.setLatLng(latlng);
            }
            for (var prop in markerOptions) {
                if (markerOptions[prop] !== point.options[prop]) {
                    point.setStyle(markerOptions);
                    break;
                }
            }
        }
    }
    return true;
};

/**
 * Returns true if this object was destroyed; otherwise, false.
 *
 * @returns {Boolean} True if this object was destroyed; otherwise, false.
 */
LeafletPointVisualizer.prototype.isDestroyed = function() {
    return false;
};

/**
 * Removes and destroys all primitives created by this instance.
 */
LeafletPointVisualizer.prototype.destroy = function() {
    var entities = this._entitiesToVisualize.values;
    for (var i = entities.length - 1; i > -1; i--) {
        entities[i]._geomLayer = undefined;
    }
    this._entityCollection.collectionChanged.removeEventListener(LeafletPointVisualizer.prototype._onCollectionChanged, this);
    this._map.removeLayer(this._featureGroup);
    return destroyObject(this);
};

/////////////////////////////////////////////////////////

var LeafletVisualizer = function() {
};

LeafletVisualizer.prototype.visualizersCallback = function(map, dataSource) {
    var entities = dataSource.entities;
    return [new LeafletPointVisualizer(map, entities)];
};

module.exports = LeafletVisualizer;
