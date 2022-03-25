import CustomDataSource from "terriajs-cesium/Source/DataSources/CustomDataSource";
import Terria from "../Models/Terria";
import ViewerMode from "../Models/ViewerMode";
import CesiumDragPoints from "./CesiumDragPoints";
import LeafletDragPoints from "./LeafletDragPoints";

/**
 * For letting user drag existing points, altering their position without creating or destroying them. Works for all
 *
 * @alias DragPoints
 * @constructor
 *
 * ViewerModes.
 * @param {Terria} terria The Terria instance.
 * @param {PointMovedCallback} pointMovedCallback A function that is called when a point is moved.
 */
class DragPoints {
  private _terria: Terria;
  private _dragPointsHelper: LeafletDragPoints | CesiumDragPoints | undefined;
  private _entities?: CustomDataSource;
  constructor(
    terria: Terria,
    pointMovedCallback: (points: CustomDataSource) => void
  ) {
    this._terria = terria;
    this._createDragPointsHelper(pointMovedCallback);

    var that = this;
    // It's possible to change viewerMode while mid-drawing, but in that case
    // we need to change the dragPoints helper.
    this._terria.mainViewer.afterViewerChanged.addEventListener(function() {
      that._createDragPointsHelper(pointMovedCallback);
      that.setUp();
    });
  }

  /**
   * Set up the drag point helper. Note that this might happen when a drawing
   * exists if the user has changed viewerMode.
   */
  setUp() {
    if (this._dragPointsHelper && this._entities) {
      this._dragPointsHelper.setUp();
      this._dragPointsHelper.updateDraggableObjects(this._entities);
    }
  }

  /**
   * The drag count is an indication of how long the user dragged for.
   * If it's really small, perhaps the user clicked, but a mousedown/mousemove/mouseup
   * event trio was triggered anyway. It solves a problem where in leaflet
   * the click event triggers even if the point has been dragged
   * because it lets us determine whether the point was really dragged.
   */
  getDragCount() {
    return this._dragPointsHelper?.dragCount ?? 0;
  }

  /**
   * Reset drag count to 0, to indicate the user hasn't dragged.
   */
  resetDragCount() {
    if (this._dragPointsHelper) {
      this._dragPointsHelper.dragCount = 0;
    }
  }

  /**
   * Update the list of draggable objects with a new list of entities that
   * are able to be dragged. We are only interested in entities that the user has drawn.
   *
   */
  updateDraggableObjects(entities: CustomDataSource) {
    this._entities = entities;
    this._dragPointsHelper?.updateDraggableObjects(entities);
  }

  /**
   * Create the drag point helper based on which viewerMode is active.
   */
  _createDragPointsHelper(
    pointMovedCallback: (points: CustomDataSource) => void
  ) {
    if (this._dragPointsHelper) {
      this._dragPointsHelper.destroy();
    }
    if (this._terria.mainViewer.viewerMode === ViewerMode.Leaflet) {
      this._dragPointsHelper = new LeafletDragPoints(
        this._terria,
        pointMovedCallback
      );
    } else {
      this._dragPointsHelper = new CesiumDragPoints(
        this._terria,
        pointMovedCallback
      );
    }
  }
}

export default DragPoints;
