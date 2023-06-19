import i18next from "i18next";
import {
  computed,
  makeObservable,
  observable,
  override,
  reaction,
  runInAction
} from "mobx";
import { Cartesian3 } from "cesium";
import { Cartographic } from "cesium";
import { Color } from "cesium";
import { createGuid } from "cesium";
import { defaultValue } from "cesium";
import { Ellipsoid } from "cesium";
import { JulianDate } from "cesium";
import { PolygonHierarchy } from "cesium";
import { Rectangle } from "cesium";
import { CallbackProperty } from "cesium";
import { ConstantPositionProperty } from "cesium";
import { CustomDataSource } from "cesium";
import { DataSource } from "cesium";
import { Entity } from "cesium";
import { PolylineGlowMaterialProperty } from "cesium";
import isDefined from "../Core/isDefined";
import DragPoints from "../Map/DragPoints/DragPoints";
import MappableMixin from "../ModelMixins/MappableMixin";
import ViewState from "../ReactViewModels/ViewState";
import MappableTraits from "../Traits/TraitsClasses/MappableTraits";
import CreateModel from "./Definition/CreateModel";
import MapInteractionMode from "./MapInteractionMode";
import Terria from "./Terria";
import filterOutUndefined from "../Core/filterOutUndefined";

interface OnDrawingCompleteParams {
  points: Cartesian3[];
  rectangle?: Rectangle;
}

interface Options {
  terria: Terria;
  messageHeader?: string | (() => string);
  allowPolygon?: boolean;
  drawRectangle?: boolean;
  onMakeDialogMessage?: () => string;
  buttonText?: string;
  onPointClicked?: (dataSource: DataSource) => void;
  onPointMoved?: (dataSource: DataSource) => void;
  onDrawingComplete?: (params: OnDrawingCompleteParams) => void;
  onCleanUp?: () => void;
  invisible?: boolean;
}

export default class UserDrawing extends MappableMixin(
  CreateModel(MappableTraits)
) {
  readonly _private_messageHeader: string | (() => string);
  readonly _private_allowPolygon: boolean;
  readonly _private_onMakeDialogMessage?: () => string;
  readonly _private_buttonText?: string;
  readonly _private_onPointClicked?: (dataSource: CustomDataSource) => void;
  readonly _private_onPointMoved?: (dataSource: CustomDataSource) => void;
  readonly _private_onDrawingComplete?: (
    params: OnDrawingCompleteParams
  ) => void;
  readonly _private_onCleanUp?: () => void;
  readonly _private_invisible?: boolean;
  readonly _private_dragHelper: DragPoints;

  pointEntities: CustomDataSource;
  otherEntities: CustomDataSource;
  polygon?: Entity;

  @observable
  _private_inDrawMode: boolean;
  closeLoop: boolean;
  _private_disposePickedFeatureSubscription?: () => void;
  _private_drawRectangle: boolean;

  _private_mousePointEntity?: Entity;

  constructor(options: Options) {
    super(createGuid(), options.terria);

    makeObservable(this);

    /**
     * Text that appears at the top of the dialog when drawmode is active.
     */
    this._private_messageHeader = defaultValue(
      options.messageHeader,
      i18next.t("models.userDrawing.messageHeader")
    );

    /**
     * If true, user can click on first point to close the line, turning it into a polygon.
     */
    this._private_allowPolygon = defaultValue(options.allowPolygon, true);

    /**
     * Callback that occurs when the dialog is redrawn, to add additional information to dialog.
     */
    this._private_onMakeDialogMessage = options.onMakeDialogMessage;

    this._private_buttonText = options.buttonText;

    /**
     * Callback that occurs when point is clicked (may be added or removed). Function takes a CustomDataSource which is
     * a list of PointEntities.
     */
    this._private_onPointClicked = options.onPointClicked;

    /**
     * Callback that occurs when point is moved. Function takes a CustomDataSource which is a list of PointEntities.
     */
    this._private_onPointMoved = options.onPointMoved;

    /**
     * Callback that occurs when a drawing is complete. This is called when the
     * user has clicked done button and the shape has at least 1 point.
     * The callback function will receive the points in the shape and a rectangle
     * if `drawRectangle` was set to `true`.
     */
    this._private_onDrawingComplete = options.onDrawingComplete;

    /**
     * Callback that occurs on clean up, i.e. when drawing is done or cancelled.
     */
    this._private_onCleanUp = options.onCleanUp;

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
    this._private_inDrawMode = false;

    /**
     * Whether the first and last point in the user drawing are the same
     */
    this.closeLoop = false;

    this._private_drawRectangle = defaultValue(options.drawRectangle, false);

    this._private_invisible = options.invisible;

    // helper for dragging points around
    this._private_dragHelper = new DragPoints(
      options.terria,
      (customDataSource: CustomDataSource) => {
        if (typeof this._private_onPointMoved === "function") {
          this._private_onPointMoved(customDataSource);
        }
        this._private_prepareToAddNewPoint();
      }
    );
  }

  override _protected_forceLoadMapItems(): Promise<void> {
    return Promise.resolve();
  }

  @computed get mapItems() {
    // Don't show points if drawing rectangle
    return this._private_drawRectangle
      ? [this.otherEntities]
      : [this.pointEntities, this.otherEntities];
  }

  get svgPoint() {
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

  @override
  override get cesiumRectangle(): Rectangle | undefined {
    return this.getRectangleForShape();
  }

  enterDrawMode() {
    this._private_dragHelper.setUp();

    // If we have finished a polygon, don't allow more points to be drawn. In future, perhaps support multiple polygons.
    if (this._private_inDrawMode || this.closeLoop) {
      // Do nothing
      return;
    }

    runInAction(() => {
      this._private_inDrawMode = true;
    });

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

    // Cancel any feature picking already in progress and disable feature info requests.
    runInAction(() => {
      this.terria.pickedFeatures = undefined;
      this.terria.allowFeatureInfoRequests = false;
    });
    const that = this;

    // Rectangle will show up once user has a point.
    if (this._private_drawRectangle) {
      this._private_mousePointEntity = new Entity({
        id: "mousePoint",
        position: undefined
      });

      const rectangle = {
        name: "Rectangle",
        id: "rectangle",
        rectangle: {
          coordinates: new CallbackProperty(
            ((time: JulianDate | undefined) => {
              if (
                !isDefined(time) ||
                this.pointEntities.entities.values.length < 1
              )
                return;
              const point1 =
                this.pointEntities.entities.values[0].position &&
                (this.pointEntities.entities.values[0].position.getValue(
                  time
                ) as Cartesian3);

              if (!point1) {
                return;
              }

              const point2 =
                (this.pointEntities.entities.values?.[1]?.position?.getValue(
                  time
                ) as Cartesian3) ||
                this._private_mousePointEntity?.position?.getValue(time);

              return (
                point1 &&
                point2 &&
                Rectangle.fromCartographicArray([
                  Cartographic.fromCartesian(point1),
                  Cartographic.fromCartesian(point2)
                ])
              );
            }).bind(this),
            false
          ),
          material: new Color(1.0, 1.0, 1.0, 0.5)
        }
      };

      this.otherEntities.entities.add(<any>rectangle);
    } else {
      // Line will show up once user has drawn some points. Vertices of line are user points.
      this.otherEntities.entities.add(<any>{
        name: "Line",
        polyline: <any>{
          positions: new CallbackProperty(function () {
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
    }

    this.terria.overlays.add(this);

    // Listen for user clicks on map
    const pickPointMode = this._private_addMapInteractionMode();
    this._private_disposePickedFeatureSubscription = reaction(
      () => pickPointMode.pickedFeatures,
      async (pickedFeatures, _previousValue, reaction) => {
        if (isDefined(pickedFeatures)) {
          if (isDefined(pickedFeatures.allFeaturesAvailablePromise)) {
            await pickedFeatures.allFeaturesAvailablePromise;
          }
          if (isDefined(pickedFeatures.pickPosition)) {
            const pickedPoint = pickedFeatures.pickPosition;
            this._private_addPointToPointEntities("First Point", pickedPoint);
            reaction.dispose();
            this._private_prepareToAddNewPoint();
          }
        }
      }
    );
  }

  /**
   * Add new point to list of pointEntities
   */
  _private_addPointToPointEntities(name: string, position: Cartesian3) {
    var pointEntity = new Entity({
      name: name,
      position: new ConstantPositionProperty(position),
      billboard: <any>{
        image: this.svgPoint,
        eyeOffset: new Cartesian3(0.0, 0.0, -50.0)
      }
    });
    // Remove the existing points if we are in drawRectangle mode and the user
    // has picked a 3rd point. This lets the user draw new rectangle that
    // replaces the current one.
    if (
      this._private_drawRectangle &&
      this.pointEntities.entities.values.length === 2
    ) {
      this.pointEntities.entities.removeAll();
    }
    this.pointEntities.entities.add(pointEntity);
    this._private_dragHelper.updateDraggableObjects(this.pointEntities);
    if (isDefined(this._private_onPointClicked)) {
      this._private_onPointClicked(this.pointEntities);
    }
  }

  endDrawing() {
    if (this._private_disposePickedFeatureSubscription) {
      this._private_disposePickedFeatureSubscription();
    }
    runInAction(() => {
      this.terria.mapInteractionModeStack.pop();
      this.cleanUp();
    });
  }

  /**
   * Updates the MapInteractionModeStack with a listener for a new point.
   */
  _private_addMapInteractionMode() {
    const pickPointMode = new MapInteractionMode({
      message: this.getDialogMessage(),
      buttonText: this.getButtonText(),
      onCancel: () => {
        runInAction(() => {
          if (this._private_onDrawingComplete) {
            const isDrawingComplete =
              this.pointEntities.entities.values.length >= 2;
            const points = this.getPointsForShape();

            if (isDrawingComplete && points) {
              this._private_onDrawingComplete({
                points: filterOutUndefined(points),
                rectangle: this.getRectangleForShape()
              });
            }
          }
        });
        this.endDrawing();
      },
      onEnable: (viewState: ViewState) => {
        runInAction(() => (viewState.explorerPanelIsVisible = false));

        if (this._private_drawRectangle && this._private_mousePointEntity) {
          const scratchPosition = new Cartesian3();
          this._private_mousePointEntity.position = new CallbackProperty(() => {
            const cartographicMouseCoords =
              this.terria.currentViewer.terria.currentViewer.mouseCoords
                .cartographic;
            let mousePosition = undefined;
            if (cartographicMouseCoords) {
              mousePosition = Ellipsoid.WGS84.cartographicToCartesian(
                cartographicMouseCoords,
                scratchPosition
              );
            }
            return mousePosition;
          }, false) as any;
        }
      },
      invisible: this._private_invisible
    });
    runInAction(() => {
      this.terria.mapInteractionModeStack.push(pickPointMode);
    });
    return pickPointMode;
  }

  /**
   * Called after a point has been added, prepares to add and draw another point, as well as updating the dialog.
   */
  _private_prepareToAddNewPoint() {
    runInAction(() => {
      this.terria.mapInteractionModeStack.pop();
    });

    const pickPointMode = this._private_addMapInteractionMode();
    this._private_disposePickedFeatureSubscription = reaction(
      () => pickPointMode.pickedFeatures,
      async (pickedFeatures, _previousValue, reaction) => {
        if (isDefined(pickedFeatures)) {
          if (isDefined(pickedFeatures.allFeaturesAvailablePromise)) {
            await pickedFeatures.allFeaturesAvailablePromise;
          }
          if (isDefined(pickedFeatures.pickPosition)) {
            const pickedPoint = pickedFeatures.pickPosition;
            // If existing point was picked, _clickedExistingPoint handles that, and returns true.
            // getDragCount helps us determine if the point was actually dragged rather than clicked. If it was
            // dragged, we shouldn't treat it as a clicked-existing-point scenario.
            if (
              this._private_dragHelper.getDragCount() < 10 &&
              !this._private_clickedExistingPoint(pickedFeatures.features)
            ) {
              // No existing point was picked, so add a new point
              this._private_addPointToPointEntities(
                "Another Point",
                pickedPoint
              );
            } else {
              this._private_dragHelper.resetDragCount();
            }
            reaction.dispose();

            if (this._private_inDrawMode) {
              this._private_prepareToAddNewPoint();
            }
          }
        }
      }
    );
  }

  /**
   * Find out if user clicked an existing point and handle appropriately.
   */
  _private_clickedExistingPoint(features: Entity[]) {
    let userClickedExistingPoint = false;

    if (features.length < 1) {
      return userClickedExistingPoint;
    }

    const that = this;

    features.forEach((feature) => {
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
      } else if (index === 0 && !this.closeLoop && this._private_allowPolygon) {
        // Index is zero if it's the first point, meaning we have a closed shape
        this.polygon = <Entity>this.otherEntities.entities.add(<any>{
          name: "User polygon",
          polygon: <any>{
            hierarchy: new CallbackProperty(function () {
              return new PolygonHierarchy(that.getPointsForShape());
            }, false),
            material: new Color(0.0, 0.666, 0.843, 0.25),
            outlineColor: new Color(1.0, 1.0, 1.0, 1.0),
            perPositionHeight: <any>true
          }
        });
        this.closeLoop = true;
        // A point has not been added, but conceptually it has because the first point is now also the last point.
        if (typeof that._private_onPointClicked === "function") {
          that._private_onPointClicked(that.pointEntities);
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
        if (typeof that._private_onPointClicked === "function") {
          that._private_onPointClicked(that.pointEntities);
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
  cleanUp() {
    this.terria.overlays.remove(this);
    this.pointEntities = new CustomDataSource("Points");
    this.otherEntities = new CustomDataSource("Lines and polygons");

    this.terria.allowFeatureInfoRequests = true;

    runInAction(() => {
      this._private_inDrawMode = false;
    });
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
    if (typeof this._private_onCleanUp === "function") {
      this._private_onCleanUp();
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
    let message =
      "<strong>" +
      (typeof this._private_messageHeader === "function"
        ? this._private_messageHeader()
        : this._private_messageHeader) +
      "</strong></br>";
    let innerMessage = isDefined(this._private_onMakeDialogMessage)
      ? this._private_onMakeDialogMessage()
      : "";

    if (innerMessage !== "") {
      message += innerMessage + "</br>";
    }

    if (
      this._private_drawRectangle &&
      this.pointEntities.entities.values.length >= 2
    ) {
      message +=
        "<i>" + i18next.t("models.userDrawing.clickToRedrawRectangle") + "</i>";
    } else if (this.pointEntities.entities.values.length > 0) {
      message +=
        "<i>" + i18next.t("models.userDrawing.clickToAddAnotherPoint") + "</i>";
    } else {
      message +=
        "<i>" + i18next.t("models.userDrawing.clickToAddFirstPoint") + "</i>";
    }
    // htmlToReactParser will fail if html doesn't have only one root element.
    return "<div>" + message + "</div>";
  }

  /**
   * Figure out the text for the dialog button.
   */
  getButtonText() {
    return defaultValue(
      this._private_buttonText,
      this.pointEntities.entities.values.length >= 2
        ? i18next.t("models.userDrawing.btnDone")
        : i18next.t("models.userDrawing.btnCancel")
    );
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
          if (position !== undefined) {
            pos.push(position);
          }
        }
      }
      return pos;
    }
  }

  getRectangleForShape(): Rectangle | undefined {
    if (!this._private_drawRectangle) {
      return undefined;
    }

    if (this.pointEntities.entities.values.length < 2) {
      return undefined;
    }

    const rectangle = this.otherEntities.entities
      .getById("rectangle")
      ?.rectangle?.coordinates?.getValue(this.terria.timelineClock.currentTime);
    return rectangle;
  }
}
