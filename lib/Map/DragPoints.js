/*global require*/
"use strict";

var defined = require('terriajs-cesium/Source/Core/defined');
var CesiumDragPoints = require('../Map/CesiumDragPoints');
var LeafletDragPoints = require('../Map/LeafletDragPoints');
var ViewerMode = require('../Models/ViewerMode');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');

/**
 * @alias DragPoints
 * @constructor
 *
 * For letting user drag existing points, altering their position without creating or destroying them. Works for all
 * ViewerModes.
 * @param {Terria} terria The Terria instance.
 */
var DragPoints = function(terria) {
    this._terria = terria;
    this._createDragPointsHelper();

    var that = this;
    // It's possible to change viewerMode while mid-drawing, but in that case we need to change the dragPoints helper.
    knockout.getObservable(this._terria, 'viewerMode').subscribe(function() {
        that._createDragPointsHelper();
        that.setUp();
    });
};

/**
 * Set up the drag point helper. Note that this might happen when a drawing exists if the user has changed viewerMode.
 */
DragPoints.prototype.setUp = function() {
    this._dragPointsHelper.setUp();
    if (defined(this._entities)) {
        this._dragPointsHelper.updateDraggableObjects(this._entities);
    }
};

/**
 * The drag count is an indication of how long the user dragged for. If it's really small, perhaps the user clicked,
 * but a mousedown/mousemove/mouseup event trio was triggered anyway. It solves a problem where in leaflet the click
 * event triggers even if the point has been dragged because it lets us determine whether the point was really dragged.
 */
DragPoints.prototype.getDragCount = function() {
    return this._dragPointsHelper.dragCount;
};

/**
 * Reset drag count to 0, to indicate the user hasn't dragged.
 */
DragPoints.prototype.resetDragCount = function() {
    this._dragPointsHelper.dragCount = 0;
};

/**
 * Update the list of draggable objects with a new list of entities that are able to be dragged. We are only interested
 * in entities that the user has drawn.
 *
 * @param {Entity[]} entities Entities that user has drawn on the map.
 */
DragPoints.prototype.updateDraggableObjects = function(entities) {
    this._entities = entities;
    this._dragPointsHelper.updateDraggableObjects(entities);
};

/**
 * Create the drag point helper based on which viewerMode is active.
 * @private
 */
DragPoints.prototype._createDragPointsHelper = function() {
    if (defined(this._dragPointsHelper)) {
        this._dragPointsHelper.destroy();
    }
    if (this._terria.viewerMode === ViewerMode.Leaflet) {
        this._dragPointsHelper = new LeafletDragPoints(this._terria);
    } else {
        this._dragPointsHelper = new CesiumDragPoints(this._terria);
    }
};

module.exports = DragPoints;
