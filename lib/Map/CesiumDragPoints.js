/*global require*/
"use strict";

var defined = require('terriajs-cesium/Source/Core/defined');
var ScreenSpaceEventHandler = require('terriajs-cesium/Source/Core/ScreenSpaceEventHandler');
var ScreenSpaceEventType = require('terriajs-cesium/Source/Core/ScreenSpaceEventType');

var CesiumDragPoints = function(terria, scene, viewer) {
    this._terria = terria;
    this._scene = scene;
    this._viewer = viewer;
    this._mouseHandler = new ScreenSpaceEventHandler(scene.canvas, false);
    this._draggableObjects = [];

    this._dragInProgress = false;
};

CesiumDragPoints.prototype.setUp = function() {
    var that = this;
    this._mouseHandler.setInputAction(function(click) {
        var pickedObject = that._scene.pick(click.position);
        if (defined(pickedObject)) {
            var pickedEntity = pickedObject.id;
            var isDraggable = that._draggableObjects.find(function(dragObjEntity) { return dragObjEntity.id === pickedEntity.id });
            if (isDraggable) {
                that._dragInProgress = true;
                that._entityDragged = pickedEntity;
                that._setCameraMotion(false);
            }
        }
    }, ScreenSpaceEventType.LEFT_DOWN);

    this._mouseHandler.setInputAction(function(move) {
        if (!that._dragInProgress) {
            return;
        }
        var cartesian = that._viewer.camera.pickEllipsoid(move.endPosition, that._scene.globe.ellipsoid);
        that._entityDragged.position = cartesian;
    }, ScreenSpaceEventType.MOUSE_MOVE);

    this._mouseHandler.setInputAction(function(mouseUp) {
        that._dragInProgress = false;
        that._setCameraMotion(true);
    }, ScreenSpaceEventType.LEFT_UP);
};

CesiumDragPoints.prototype.updateDraggableObjects = function(entities) {
    this._draggableObjects = entities;
};

/**
 * @private
 */
CesiumDragPoints.prototype.destroy = function() {
    this._mouseHandler.destroy();
    this._scene = undefined;
};

/**
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
