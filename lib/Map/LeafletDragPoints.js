/*global require*/
"use strict";
var defined = require('terriajs-cesium/Source/Core/defined');
var Cartesian3 = require('terriajs-cesium/Source/Core/Cartesian3');

/**
 * @alias LeafletDragPoints
 * @constructor
 *
 * For letting user drag existing points in Leaflet ViewerMode only.
 * @param {Terria} terria The Terria instance.
 */
var LeafletDragPoints = function(terria) {
    this._terria = terria;

    /**
     * List of entities that can be dragged, which is populated with user-created points only.
     * @type {Entity[]}
     */
    this._draggableObjects = [];

    /**
     * Whether user is currently dragging point.
     * @type {Bool}
     */
    this._dragInProgress = false;

    /**
     * For determining whether a drag has just occurred, to avoid deleting a point at the end of the drag.
     * @type {Number}
     */
    this.dragCount = 0;
};

/**
 * Set up the drag point helper so that attempting to drag a point will move the point.
 */
LeafletDragPoints.prototype.setUp = function() {
    this._terria.leaflet.map.on('mousemove', this._onMouseMove, this);
    this._terria.leaflet.map.on('mouseup', this._onMouseUp, this);
    this._terria.leaflet.scene.featureMousedown.addEventListener(this._onMouseDownOnPoint, this);
};

/**
 * Function that is called when the user clicks and holds on a point that was previously drawn.
 *
 * @param {Entity} entity The entity that user mouse downs on.
 */
LeafletDragPoints.prototype._onMouseDownOnPoint = function(entity) {
    var dragEntity = this._draggableObjects.find(function(dragObjEntity) {
        // Not necessarily same entity, but will have same id.
        return dragObjEntity.id === entity.id;
    });
    if (defined(dragEntity)) {
        this._dragInProgress = true;
        this._entityDragged = dragEntity;

        this._terria.leaflet.map.dragging.disable();
    }
};

/**
 * Function that is called when the mouse moves.
 *
 * @param {Leaflet.MouseEvent} move Information about the move such as the final position of the mouse.
 */
LeafletDragPoints.prototype._onMouseMove = function(move) {
    if (!this._dragInProgress) {
        return;
    }
    this.dragCount = this.dragCount + 1;
    if (defined(this._entityDragged)) {
        this._entityDragged.position = Cartesian3.fromDegrees(move.latlng.lng, move.latlng.lat);
    }
};

/**
 * Function that is called when the user releases the mousedown click.
 *
 * @param {Leaflet.MouseEvent} e Information about where the event occurred.
 */
LeafletDragPoints.prototype._onMouseUp = function(e) {
    this._dragInProgress = false;
    this._terria.leaflet.map.dragging.enable();
    this._terria.leaflet.map.off('mousedown', this._onMouseDownOnPoint);
    this._terria.leaflet.map.off('mousemove', this._onMouseMove);
    this._terria.leaflet.map.off('mousedown', this._onMouseUp);
};

/**
 * Update the list of draggable objects with a new list of entities that are able to be dragged. We are only interested
 * in entities that the user has drawn.
 *
 * @param {Entity[]} entities Entities that user has drawn on the map.
 */
LeafletDragPoints.prototype.updateDraggableObjects = function(entities) {
    this._draggableObjects = entities;
};

/**
 * A clean up function to call when destroying the object.
 */
LeafletDragPoints.prototype.destroy = function() {
    // Pass, since leaflet events are unregistered in onMouseUp.
};

module.exports = LeafletDragPoints;
