/*global require*/
"use strict";
var defined = require('terriajs-cesium/Source/Core/defined');
var Cartesian3 = require('terriajs-cesium/Source/Core/Cartesian3');

var LeafletDragPoints = function(terria) {
    this._terria = terria;
    this._draggableObjects = [];

    this._dragInProgress = false;
    // This is for determining whether a drag has just occurred, to avoid deleting a point at the end of the drag.
    this.dragCount = 0;
};

LeafletDragPoints.prototype.setUp = function() {
    this._terria.leaflet.map.on('mousemove', this._onMouseMove, this);
    this._terria.leaflet.map.on('mouseup', this._onMouseUp, this);
    this._terria.leaflet.scene.featureMousedown.addEventListener(this._onMouseDown, this);
};

LeafletDragPoints.prototype._onMouseDown = function(entity) {
    var dragEntity = this._draggableObjects.find(function(dragObjEntity) { return dragObjEntity.id === entity.id });
    if (defined(dragEntity)) {
        this._dragInProgress = true;
        this._entityDragged = dragEntity;

        this._terria.leaflet.map.dragging.disable();
    }
};

LeafletDragPoints.prototype._onMouseMove = function(move) {
    if (!this._dragInProgress) {
        return;
    }
    this.dragCount = this.dragCount + 1;
    if (defined(this._entityDragged)) {
        this._entityDragged.position = Cartesian3.fromDegrees(move.latlng.lng, move.latlng.lat);
    }
};

LeafletDragPoints.prototype._onMouseUp = function(e) {
    this._dragInProgress = false;
    this._terria.leaflet.map.dragging.enable();
    this._terria.leaflet.map.off('mousedown', this._onMouseDown);
    this._terria.leaflet.map.off('mousemove', this._onMouseMove);
    this._terria.leaflet.map.off('mousedown', this._onMouseUp);
};

LeafletDragPoints.prototype.updateDraggableObjects = function(entities) {
    this._draggableObjects = entities;
};

module.exports = LeafletDragPoints;
