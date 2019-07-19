import { autorun, computed, runInAction } from "mobx";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Color from "terriajs-cesium/Source/Core/Color";
import createGuid from "terriajs-cesium/Source/Core/createGuid";
import defaultValue from "terriajs-cesium/Source/Core/defaultValue";
import PolygonHierarchy from "terriajs-cesium/Source/Core/PolygonHierarchy";
import CallbackProperty from "terriajs-cesium/Source/DataSources/CallbackProperty";
import CustomDataSource from "terriajs-cesium/Source/DataSources/CustomDataSource";
import DataSource from "terriajs-cesium/Source/DataSources/DataSource";
import Entity from "terriajs-cesium/Source/DataSources/Entity";
import PolylineGlowMaterialProperty from "terriajs-cesium/Source/DataSources/PolylineGlowMaterialProperty";
import isDefined from "../Core/isDefined";
import DragPoints from "../Map/DragPoints";
import ModelTraits from "../Traits/ModelTraits";
import CreateModel from "./CreateModel";
import MapInteractionMode from "./MapInteractionMode";
import Terria from "./Terria";

interface DragPoints {
  updateDraggableObjects: (dataSource: DataSource) => void;
  setUp: () => void;
  getDragCount: () => number;
  resetDragCount: () => void;
}

interface Options {
  terria: Terria;
  messageHeader?: string;
  allowPolygon?: boolean;
  onMakeDialogMessage?: () => string;
  onPointClicked?: (dataSource: DataSource) => void;
  onPointMoved?: (dataSource: DataSource) => void;
  onCleanUp?: () => void;
}

class EmptyTraits extends ModelTraits {
  static traits = {};
}

export default class UserDrawing extends CreateModel(EmptyTraits) {
  private readonly messageHeader: string;
  private readonly allowPolygon: boolean;
  private readonly onMakeDialogMessage?: () => string;
  private readonly onPointClicked?: (dataSource: CustomDataSource) => void;
  private readonly onPointMoved?: (dataSource: CustomDataSource) => void;
  private readonly onCleanUp?: () => void;
  private readonly dragHelper: DragPoints;

  pointEntities: CustomDataSource;
  otherEntities: CustomDataSource;
  polygon?: Entity;

  private inDrawMode: boolean;
  private closeLoop: boolean;

  constructor(options: Options) {
    super(createGuid(), options.terria);

    /**
     * Text that appears at the top of the dialog when drawmode is active.
     */
    this.messageHeader = defaultValue(options.messageHeader, "Draw on Map");

    /**
     * If true, user can click on first point to close the line, turning it into a polygon.
     */
    this.allowPolygon = defaultValue(options.allowPolygon, true);

    /**
     * Callback that occurs when the dialog is redrawn, to add additional information to dialog.
     */
    this.onMakeDialogMessage = options.onMakeDialogMessage;

    /**
     * Callback that occurs when point is clicked (may be added or removed). Function takes a CustomDataSource which is
     * a list of PointEntities.
     */
    this.onPointClicked = options.onPointClicked;

    /**
     * Callback that occurs when point is moved. Function takes a CustomDataSource which is a list of PointEntities.
     */
    this.onPointMoved = options.onPointMoved;

    /**
     * Callback that occurs on clean up, i.e. when drawing is done or cancelled.
     */
    this.onCleanUp = options.onCleanUp;

    /**
     * Storage for points that will be drawn
     */
    this.pointEntities = new CustomDataSource("Points");

    /**
     * Storage for line that connects the points, and polygon if the first and last point are the same
     */
    this.otherEntities = new CustomDataSource("Lines and polygons");

    /**
     * Whether to interpret user clicks as drawing
     */
    this.inDrawMode = false;

    /**
     * Whether the first and last point in the user drawing are the same
     */
    this.closeLoop = false;

    // helper for dragging points around
    this.dragHelper = new DragPoints(options.terria, customDataSource => {
      if (this.onPointMoved) {
        this.onPointMoved(customDataSource);
      }
      this.prepareToAddNewPoint();
    });
  }

  @computed get mapItems() {
    return [this.pointEntities, this.otherEntities];
  }

  @computed get svgPoint() {
    /**
     * SVG element for point drawn when user clicks.
     * http://stackoverflow.com/questions/24869733/how-to-draw-custom-dynamic-billboards-in-cesium-js
     */
    var svgDataDeclare = "data:image/svg+xml,";
    var svgPrefix =
      '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="20px" height="20px" xml:space="preserve">';
    var svgCircle =
      '<circle cx="10" cy="10" r="5" stroke="rgb(0,170,215)" stroke-width="4" fill="white" /> ';
    var svgSuffix = "</svg>";
    var svgString = svgPrefix + svgCircle + svgSuffix;

    // create the cesium entity
    return svgDataDeclare + svgString;
  }

  enterDrawMode() {
    this.dragHelper.setUp();

    // If we have finished a polygon, don't allow more points to be drawn. In future, perhaps support multiple polygons.
    if (this.inDrawMode || this.closeLoop) {
      // Do nothing
      return;
    }

    this.inDrawMode = true;

    if (isDefined(this.terria.cesium)) {
      this.terria.cesium.cesiumWidget.canvas.setAttribute(
        "style",
        "cursor: crosshair"
      );
    } else if (isDefined(this.terria.leaflet)) {
      const container = document.getElementById("cesiumContainer");
      if (container !== null) {
        container.setAttribute("style", "cursor: crosshair");
      }
    }

    // Cancel any feature picking already in progress.
    runInAction(() => {
      this.terria.pickedFeatures = undefined;
    });
    const that = this;

    // Line will show up once user has drawn some points. Vertices of line are user points.
    this.otherEntities.entities.add(<any>{
      name: "Line",
      polyline: <any>{
        positions: new CallbackProperty(function() {
          const pos = that.getPointsForShape();
          if (isDefined(pos) && that.closeLoop) {
            pos.push(pos[0]);
          }
          return pos;
        }, false),

        material: new PolylineGlowMaterialProperty(<any>{
          color: new Color(0.0, 0.0, 0.0, 0.1),
          glowPower: 0.25
        }),
        width: 20
      }
    });

    this.terria.overlays.add(this);

    // Listen for user clicks on map
    const pickPointMode = new MapInteractionMode({
      message: this.getDialogMessage(),
      buttonText: this.getButtonText(),
      onCancel: () => {
        this.terria.mapInteractionModeStack.pop();
        this.cleanUp();
      }
    });

    this.terria.mapInteractionModeStack.push(pickPointMode);
    autorun(async reaction => {
      if (isDefined(pickPointMode.pickedFeatures)) {
        const pickedFeatures = pickPointMode.pickedFeatures;
        if (isDefined(pickedFeatures.allFeaturesAvailablePromise)) {
          await pickedFeatures.allFeaturesAvailablePromise;
        }
        if (isDefined(pickedFeatures.pickPosition)) {
          const pickedPoint = pickedFeatures.pickPosition;
          this.addPointToPointEntities("First Point", pickedPoint);
          reaction.dispose();
          this.prepareToAddNewPoint();
        }
      }
    });
  }

  /**
   * Add new point to list of pointEntities
   */
  private addPointToPointEntities(name: string, position: Cartesian3) {
    var pointEntity = new Entity({
      name: name,
      position: position,
      billboard: <any>{
        image: this.svgPoint,
        eyeOffset: new Cartesian3(0.0, 0.0, -50.0)
      }
    });
    this.pointEntities.entities.add(pointEntity);
    this.dragHelper.updateDraggableObjects(this.pointEntities);
    if (isDefined(this.onPointClicked)) {
      this.onPointClicked(this.pointEntities);
    }
  }

  /**
   * Called after a point has been added, this updates the MapInteractionModeStack with a listener for another point.
   */
  private mapInteractionModeUpdate() {
    this.terria.mapInteractionModeStack.pop();
    const that = this;
    const pickPointMode = new MapInteractionMode({
      message: this.getDialogMessage(),
      buttonText: this.getButtonText(),
      onCancel: function() {
        that.terria.mapInteractionModeStack.pop();
        that.cleanUp();
      }
    });
    this.terria.mapInteractionModeStack.push(pickPointMode);
    return pickPointMode;
  }

  /**
   * Called after a point has been added, prepares to add and draw another point, as well as updating the dialog.
   */
  private prepareToAddNewPoint() {
    const pickPointMode = this.mapInteractionModeUpdate();

    autorun(async reaction => {
      if (isDefined(pickPointMode.pickedFeatures)) {
        const pickedFeatures = pickPointMode.pickedFeatures;
        if (isDefined(pickedFeatures.allFeaturesAvailablePromise)) {
          await pickedFeatures.allFeaturesAvailablePromise;
        }
        if (isDefined(pickedFeatures.pickPosition)) {
          const pickedPoint = pickedFeatures.pickPosition;
          // If existing point was picked, _clickedExistingPoint handles that, and returns true.
          // getDragCount helps us determine if the point was actually dragged rather than clicked. If it was
          // dragged, we shouldn't treat it as a clicked-existing-point scenario.
          if (
            this.dragHelper.getDragCount() < 10 &&
            !this.clickedExistingPoint(pickedFeatures.features)
          ) {
            // No existing point was picked, so add a new point
            this.addPointToPointEntities("Another Point", pickedPoint);
          } else {
            this.dragHelper.resetDragCount();
          }
          reaction.dispose();
          this.prepareToAddNewPoint();
        }
      }
    });
  }

  /**
   * Find out if user clicked an existing point and handle appropriately.
   */
  private clickedExistingPoint(features: Entity[]) {
    let userClickedExistingPoint = false;

    if (features.length < 1) {
      return userClickedExistingPoint;
    }

    const that = this;

    features.forEach(feature => {
      let index = -1;
      for (let i = 0; i < this.pointEntities.entities.values.length; i++) {
        const pointFeature = this.pointEntities.entities.values[i];
        if (pointFeature.id === feature.id) {
          index = i;
          break;
        }
      }

      if (index === -1) {
        // Probably a layer or feature that has nothing to do with what we're drawing.
        return;
      } else if (index === 0 && !this.closeLoop && this.allowPolygon) {
        // Index is zero if it's the first point, meaning we have a closed shape
        this.polygon = <Entity>this.otherEntities.entities.add(<any>{
          name: "User polygon",
          polygon: <any>{
            hierarchy: new CallbackProperty(function() {
              return new PolygonHierarchy(that.getPointsForShape());
            }, false),
            material: new Color(0.0, 0.666, 0.843, 0.25),
            outlineColor: new Color(1.0, 1.0, 1.0, 1.0),
            perPositionHeight: <any>true
          }
        });
        this.closeLoop = true;
        // A point has not been added, but conceptually it has because the first point is now also the last point.
        if (typeof that.onPointClicked === "function") {
          that.onPointClicked(that.pointEntities);
        }
        userClickedExistingPoint = true;
        return;
      } else {
        // User clicked on a point that's not the end of the loop. Remove it.
        this.pointEntities.entities.removeById(feature.id);
        // If it gets down to 2 points, it should stop acting like a polygon.
        if (this.pointEntities.entities.values.length < 2 && this.closeLoop) {
          this.closeLoop = false;
          this.polygon && this.otherEntities.entities.remove(this.polygon);
        }
        // Also let client of UserDrawing know if a point has been removed.
        if (typeof that.onPointClicked === "function") {
          that.onPointClicked(that.pointEntities);
        }
        userClickedExistingPoint = true;
        return;
      }
    });
    return userClickedExistingPoint;
  }

  /**
   * User has finished or cancelled; restore initial state.
   */
  private cleanUp() {
    this.terria.overlays.remove(this);
    this.pointEntities = new CustomDataSource("Points");
    this.otherEntities = new CustomDataSource("Lines and polygons");

    this.inDrawMode = false;
    this.closeLoop = false;

    // Return cursor to original state
    if (isDefined(this.terria.cesium)) {
      this.terria.cesium.cesiumWidget.canvas.setAttribute(
        "style",
        "cursor: auto"
      );
    } else if (isDefined(this.terria.leaflet)) {
      const container = document.getElementById("cesiumContainer");
      if (container !== null) {
        container.setAttribute("style", "cursor: auto");
      }
    }

    // Allow client to clean up too
    if (typeof this.onCleanUp === "function") {
      this.onCleanUp();
    }
  }

  /**
   * Create the HTML message in the dialog box.
   * Example:
   *
   *     Measuring Tool
   *     373.45 km
   *     Click to add another point
   */
  getDialogMessage() {
    let message = "<strong>" + this.messageHeader + "</strong></br>";
    let innerMessage = isDefined(this.onMakeDialogMessage)
      ? this.onMakeDialogMessage()
      : "";

    if (innerMessage !== "") {
      message += innerMessage + "</br>";
    }

    var word = "a";
    if (this.pointEntities.entities.values.length > 0) {
      word = "another";
    }
    message += "<i>Click to add " + word + " point</i>";
    // htmlToReactParser will fail if html doesn't have only one root element.
    return "<div>" + message + "</div>";
  }

  /**
   * Figure out the text for the dialog button.
   */
  getButtonText() {
    return this.pointEntities.entities.values.length >= 2 ? "Done" : "Cancel";
  }

  /**
   * Return a list of the coords for the user drawing
   */
  getPointsForShape() {
    if (isDefined(this.pointEntities.entities)) {
      const pos = [];
      for (var i = 0; i < this.pointEntities.entities.values.length; i++) {
        const obj = this.pointEntities.entities.values[i];
        if (isDefined(obj.position)) {
          const position = obj.position.getValue(
            this.terria.timelineClock.currentTime
          );
          pos.push(position);
        }
      }
      return pos;
    }
  }
}
