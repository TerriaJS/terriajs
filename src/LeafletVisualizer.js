
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
 

var defaultColor = Color.WHITE;
var defaultOutlineColor = Color.BLACK;
var defaultOutlineWidth = 0.0;
var defaultPixelSize = 1.0;

var color = new Color();
var position = new Cartesian3();
var outlineColor = new Color();
var scaleByDistance = new NearFarScalar();

/**
 * A {@link Visualizer} which maps {@link Entity#point} to a {@link Billboard}.
 * @alias LeafletPointVisualizer
 * @constructor
 *
 * @param {Scene} map The map the primitives will be rendered in.
 * @param {EntityCollection} entityCollection The entityCollection to visualize.
 */
var LeafletPointVisualizer = function(scene, entityCollection) {
    //>>includeStart('debug', pragmas.debug);
    if (!defined(scene)) {
        throw new DeveloperError('scene is required.');
    }
    if (!defined(entityCollection)) {
        throw new DeveloperError('entityCollection is required.');
    }
    //>>includeEnd('debug');

    var billboardCollection = new BillboardCollection();
    scene.primitives.add(billboardCollection);
    entityCollection.collectionChanged.addEventListener(LeafletPointVisualizer.prototype._onCollectionChanged, this);

    this._scene = scene;
    this._unusedIndexes = [];
    this._entityCollection = entityCollection;
    this._billboardCollection = billboardCollection;
    this._entitiesToVisualize = new AssociativeArray();

    this._onCollectionChanged(entityCollection, entityCollection.entities, [], []);
};

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
    var billboardCollection = this._billboardCollection;
    var unusedIndexes = this._unusedIndexes;
    for (var i = 0, len = entities.length; i < len; i++) {
        var entity = entities[i];
        var pointGraphics = entity._point;
        var billboard;
        var pointVisualizerIndex = entity._pointVisualizerIndex;
        var show = entity.isAvailable(time) && Property.getValueOrDefault(pointGraphics._show, time, true);
        if (show) {
            position = Property.getValueOrUndefined(entity._position, time, position);
            show = defined(position);
        }
        if (!show) {
            cleanEntity(entity, billboardCollection, unusedIndexes);
            continue;
        }

        var needRedraw = false;
        if (!defined(pointVisualizerIndex)) {
            var length = unusedIndexes.length;
            if (length > 0) {
                pointVisualizerIndex = unusedIndexes.pop();
                billboard = billboardCollection.get(pointVisualizerIndex);
            } else {
                pointVisualizerIndex = billboardCollection.length;
                billboard = billboardCollection.add();
            }
            entity._pointVisualizerIndex = pointVisualizerIndex;
            billboard.id = entity;

            billboard._visualizerColor = Color.clone(Color.WHITE, billboard._visualizerColor);
            billboard._visualizerOutlineColor = Color.clone(Color.BLACK, billboard._visualizerOutlineColor);
            billboard._visualizerOutlineWidth = 0;
            billboard._visualizerPixelSize = 1;
            needRedraw = true;
        } else {
            billboard = billboardCollection.get(pointVisualizerIndex);
        }

        billboard.show = true;
        billboard.position = position;
        billboard.scaleByDistance = Property.getValueOrUndefined(pointGraphics._scaleByDistance, time, scaleByDistance);

        var newColor = Property.getValueOrDefault(pointGraphics._color, time, defaultColor, color);
        var newOutlineColor = Property.getValueOrDefault(pointGraphics._outlineColor, time, defaultOutlineColor, outlineColor);
        var newOutlineWidth = Property.getValueOrDefault(pointGraphics._outlineWidth, time, defaultOutlineWidth);
        var newPixelSize = Property.getValueOrDefault(pointGraphics._pixelSize, time, defaultPixelSize);

        needRedraw = needRedraw || //
        newOutlineWidth !== billboard._visualizerOutlineWidth || //
        newPixelSize !== billboard._visualizerPixelSize || //
        !Color.equals(newColor, billboard._visualizerColor) || //
        !Color.equals(newOutlineColor, billboard._visualizerOutlineColor);

        if (needRedraw) {
            billboard._visualizerColor = Color.clone(newColor, billboard._visualizerColor);
            billboard._visualizerOutlineColor = Color.clone(newOutlineColor, billboard._visualizerOutlineColor);
            billboard._visualizerPixelSize = newPixelSize;
            billboard._visualizerOutlineWidth = newOutlineWidth;

            var centerAlpha = newColor.alpha;
            var cssColor = newColor.toCssColorString();
            var cssOutlineColor = newOutlineColor.toCssColorString();
            var cssOutlineWidth = newOutlineWidth;
            var textureId = JSON.stringify([cssColor, newPixelSize, cssOutlineColor, cssOutlineWidth]);

            billboard.setImage(textureId, createCallback(centerAlpha, cssColor, cssOutlineColor, cssOutlineWidth, newPixelSize));
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
        entities[i]._pointVisualizerIndex = undefined;
    }
    this._entityCollection.collectionChanged.removeEventListener(LeafletPointVisualizer.prototype._onCollectionChanged, this);
    this._scene.primitives.remove(this._billboardCollection);
    return destroyObject(this);
};

LeafletPointVisualizer.prototype._onCollectionChanged = function(entityCollection, added, removed, changed) {
    var i;
    var entity;
    var billboardCollection = this._billboardCollection;
    var unusedIndexes = this._unusedIndexes;
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
            cleanEntity(entity, billboardCollection, unusedIndexes);
            entities.remove(entity.id);
        }
    }

    for (i = removed.length - 1; i > -1; i--) {
        entity = removed[i];
        cleanEntity(entity, billboardCollection, unusedIndexes);
        entities.remove(entity.id);
    }
};

function cleanEntity(entity, collection, unusedIndexes) {
    var pointVisualizerIndex = entity._pointVisualizerIndex;
    if (defined(pointVisualizerIndex)) {
        var billboard = collection.get(pointVisualizerIndex);
        billboard.show = false;
        entity._pointVisualizerIndex = undefined;
        unusedIndexes.push(pointVisualizerIndex);
    }
}


var pointVisualizer = function (map, entities) {
    this._map = map;
    this._entities = entities;
    console.log(map, entities);
};

pointVisualizer.prototype.update = function(time) {
//    console.log(time);
};

pointVisualizer.prototype.destroy = function() {
    return destroyObject(this);
};

/////////////////////////////////////////////////////////

var LeafletVisualizer = function() {
};

LeafletVisualizer.prototype.visualizersCallback = function(map, dataSource) {
    var entities = dataSource.entities;
    return [new pointVisualizer(map, entities)];
};

module.exports = LeafletVisualizer;
