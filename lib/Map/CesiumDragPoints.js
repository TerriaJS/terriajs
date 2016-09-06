/*global require*/
"use strict";

var defined = require('terriajs-cesium/Source/Core/defined');
var ScreenSpaceEventHandler = require('terriajs-cesium/Source/Core/ScreenSpaceEventHandler');
var ScreenSpaceEventType = require('terriajs-cesium/Source/Core/ScreenSpaceEventType');

/**
 * @alias CesiumDragPoints
 * @constructor
 *
 * For letting user drag existing points in Cesium ViewerModes only.
 * @param {Terria} terria The Terria instance.
 */
var CesiumDragPoints = function(terria) {
    this._terria = terria;
    this.type = "Cesium";

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
     * However, unlike Leaflet, Cesium doesn't fire a clicked event after a drag, so it's not needed for this class.
     * @type {Number}
     */
    this.dragCount = 0;
};

/**
 * Set up the drag point helper so that attempting to drag a point will move the point.
 */
CesiumDragPoints.prototype.setUp = function() {
    if (!defined(this._terria.cesium) || !defined(this._terria.cesium.scene) || !defined(this._terria.cesium.viewer)) {
        // Test context or something has gone *so* badly wrong
        return;
    }
    this._scene = this._terria.cesium.scene;
    this._viewer = this._terria.cesium.viewer;
    this._mouseHandler = new ScreenSpaceEventHandler(this._scene.canvas, false);

    var that = this;

    // Mousedown event. This is called for all mousedown events, not just mousedown on entity events like the Leaflet
    // equivalent.
    this._mouseHandler.setInputAction(function(click) {
        var pickedObject = that._scene.pick(click.position);
        if (defined(pickedObject)) {
            var pickedEntity = pickedObject.id;
            var isDraggable = that._draggableObjects.find(function(dragObjEntity) {
                return dragObjEntity.id === pickedEntity.id;
            });
            if (isDraggable) {
                that._dragInProgress = true;
                that._entityDragged = pickedEntity;
                that._setCameraMotion(false);
            }
        }
    }, ScreenSpaceEventType.LEFT_DOWN);

    // Mouse move event.
    this._mouseHandler.setInputAction(function(move) {
        if (!that._dragInProgress) {
            return;
        }
        var cartesian = that._viewer.camera.pickEllipsoid(move.endPosition, that._scene.globe.ellipsoid);
        that._entityDragged.position = cartesian;
    }, ScreenSpaceEventType.MOUSE_MOVE);

    // Mouse release event.
    this._mouseHandler.setInputAction(function(mouseUp) {
        that._dragInProgress = false;
        that._setCameraMotion(true);
    }, ScreenSpaceEventType.LEFT_UP);
};

/**
 * Update the list of draggable objects with a new list of entities that are able to be dragged. We are only interested
 * in entities that the user has drawn.
 *
 * @param {Entity[]} entities Entities that user has drawn on the map.
 */
CesiumDragPoints.prototype.updateDraggableObjects = function(entities) {
    this._draggableObjects = entities;
};

/**
 * A clean up function to call when destroying the object.
 */
CesiumDragPoints.prototype.destroy = function() {
    if (defined(this._mouseHandler)) {
        this._mouseHandler.destroy();
    }
};

/**
 * Enable or disable camera motion, so that the user can drag a point rather than dragging the map.
 * @param {Bool} state True to enable and false to disable camera motion.
 * @private
 */
CesiumDragPoints.prototype._setCameraMotion = function(state) {
    this._scene.screenSpaceCameraController.enableRotate = state;
    this._scene.screenSpaceCameraController.enableZoom = state;
    this._scene.screenSpaceCameraController.enableLook = state;
    this._scene.screenSpaceCameraController.enableTilt = state;
    this._scene.screenSpaceCameraController.enableTranslate = state;
};

module.exports = CesiumDragPoints;
