import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import defined from "terriajs-cesium/Source/Core/defined";
import CustomDataSource from "terriajs-cesium/Source/DataSources/CustomDataSource";
import Entity from "terriajs-cesium/Source/DataSources/Entity";
import Terria from "../Models/Terria";
import { LeafletMouseEvent } from "leaflet";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";

/**
 * For letting user drag existing points in Leaflet ViewerMode only.
 *
 */
class LeafletDragPoints {
  private _terria: Terria;
  private _setUp: boolean;
  type: string;

  /**
   * Callback that occurs when point is moved. Function takes a
   * CustomDataSource which is a list of PointEntities.
   */
  private _pointMovedCallback: (points: CustomDataSource) => void;

  /**
   * List of entities that can be dragged, which is populated with user-created points only.
   */
  private _draggableObjects: CustomDataSource;

  /**
   * Whether user is currently dragging point.
   */
  private _dragInProgress: boolean;

  /**
   * For determining whether a drag has just occurred, to avoid deleting a
   * point at the end of the drag.
   */
  dragCount: number;
  private _entityDragged?: Entity;
  private _originalPosition:
    | import("terriajs-cesium").PositionProperty
    | undefined;

  constructor(
    terria: Terria,
    pointMovedCallback: (points: CustomDataSource) => void
  ) {
    this._terria = terria;
    this._setUp = false;
    this.type = "Leaflet";

    this._pointMovedCallback = pointMovedCallback;
    this._draggableObjects = new CustomDataSource();
    this._dragInProgress = false;
    this.dragCount = 0;
  }

  /**
   * Set up the drag point helper so that attempting to drag a point will move the point.
   */
  setUp() {
    if (this._setUp) {
      return;
    }
    if (this._terria.leaflet !== undefined) {
      this._terria.leaflet.scene.featureMousedown.addEventListener(
        this._onMouseDownOnPoint,
        this
      );
      this._setUp = true;
      return;
    }
  }

  /**
   * Function that is called when the user clicks and holds on a point that was previously drawn.
   */
  _onMouseDownOnPoint(entity: Entity) {
    if (
      !defined(this._draggableObjects.entities) ||
      this._draggableObjects.entities.values.length === 0
    ) {
      return;
    }

    var dragEntity = this._draggableObjects.entities.values.filter(function(
      dragObjEntity
    ) {
      // Not necessarily same entity, but will have same id.
      return dragObjEntity.id === entity.id;
    })[0];
    const leaflet = this._terria.leaflet;
    if (defined(dragEntity) && leaflet !== undefined) {
      // The touch events below don't actually work because Leaflet doesn't
      // expose these events.  See here for a possible workaround:
      // https://github.com/Leaflet/Leaflet/issues/1542
      leaflet.map.on("mousemove", this._onMouseMove, this);
      leaflet.map.on("touchmove" as any, this._onMouseMove, this);
      leaflet.map.on("mouseup", this._onMouseUp, this);
      leaflet.map.on("touchend" as any, this._onMouseUp, this);

      this._dragInProgress = true;
      this._entityDragged = dragEntity;

      this._terria.currentViewer.pauseMapInteraction();
      this._originalPosition = dragEntity.position;
    }
  }

  /**
   * Function that is called when the mouse moves.
   *
   */
  _onMouseMove(move: LeafletMouseEvent) {
    if (!this._dragInProgress) {
      return;
    }
    this.dragCount = this.dragCount + 1;
    if (this._entityDragged) {
      this._entityDragged.position = Cartesian3.fromDegrees(
        move.latlng.lng,
        move.latlng.lat
      ) as any;
    }
  }

  /**
   * Function that is called when the user releases the mousedown click.
   *
   */
  _onMouseUp(e: LeafletMouseEvent) {
    if (
      this._dragInProgress &&
      Cartesian3.fromDegrees(e.latlng.lng, e.latlng.lat) !==
        this._originalPosition?.getValue(JulianDate.now())
    ) {
      this._pointMovedCallback(this._draggableObjects);
    }
    const leaflet = this._terria.leaflet;
    if (leaflet) {
      leaflet.map.off("mousemove", this._onMouseMove, this);
      leaflet.map.off("touchmove" as any, this._onMouseMove, this);
      leaflet.map.off("mouseup", this._onMouseUp, this);
      leaflet.map.off("touchend" as any, this._onMouseUp, this);
    }
    this._dragInProgress = false;
    this._terria.currentViewer.resumeMapInteraction();
  }

  /**
   * Update the list of draggable objects with a new list of entities that are
   * able to be dragged. We are only interested in entities that the user has
   * drawn.
   *
   */
  updateDraggableObjects(entities: CustomDataSource) {
    this._draggableObjects = entities;
  }

  /**
   * A clean up function to call when destroying the object.
   */
  destroy() {
    this._setUp = false;
  }
}

export default LeafletDragPoints;
