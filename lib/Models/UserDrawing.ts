import i18next from "i18next";
import {
  computed,
  IReactionDisposer,
  makeObservable,
  observable,
  override,
  reaction,
  runInAction
} from "mobx";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import Color from "terriajs-cesium/Source/Core/Color";
import createGuid from "terriajs-cesium/Source/Core/createGuid";
import defaultValue from "terriajs-cesium/Source/Core/defaultValue";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import PolygonHierarchy from "terriajs-cesium/Source/Core/PolygonHierarchy";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import CallbackProperty from "terriajs-cesium/Source/DataSources/CallbackProperty";
import ConstantPositionProperty from "terriajs-cesium/Source/DataSources/ConstantPositionProperty";
import CustomDataSource from "terriajs-cesium/Source/DataSources/CustomDataSource";
import DataSource from "terriajs-cesium/Source/DataSources/DataSource";
import Entity from "terriajs-cesium/Source/DataSources/Entity";
import PolylineGlowMaterialProperty from "terriajs-cesium/Source/DataSources/PolylineGlowMaterialProperty";
import filterOutUndefined from "../Core/filterOutUndefined";
import isDefined from "../Core/isDefined";
import DragPoints from "../Map/DragPoints/DragPoints";
import MappableMixin from "../ModelMixins/MappableMixin";
import ViewState from "../ReactViewModels/ViewState";
import MappableTraits from "../Traits/TraitsClasses/MappableTraits";
import CreateModel from "./Definition/CreateModel";
import MapInteractionMode from "./MapInteractionMode";
import Terria from "./Terria";
import ConstantProperty from "terriajs-cesium/Source/DataSources/ConstantProperty";
import HeightReference from "terriajs-cesium/Source/Scene/HeightReference";
import { clone } from "terriajs-cesium";
import * as turf from "@turf/turf";

interface OnDrawingCompleteParams {
  points: Cartesian3[];
  rectangle?: Rectangle;
}

interface Options {
  terria: Terria;
  messageHeader?: string | (() => string);
  allowPolygon?: boolean;
  autoClosePolygon?: boolean;
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
  private readonly messageHeader: string | (() => string);
  private readonly allowPolygon: boolean;
  private readonly autoClosePolygon: boolean;
  private readonly onMakeDialogMessage?: () => string;
  private readonly buttonText?: string;
  private readonly onPointClicked?: (dataSource: CustomDataSource) => void;
  private readonly onPointMoved?: (dataSource: CustomDataSource) => void;
  private readonly onDrawingComplete?: (
    params: OnDrawingCompleteParams
  ) => void;
  private readonly onCleanUp?: () => void;
  private readonly invisible?: boolean;

  // helper for dragging points around
  private dragHelper?: DragPoints;

  pointEntities: CustomDataSource;
  otherEntities: CustomDataSource;
  polygon?: Entity;

  @observable
  private inDrawMode: boolean;
  closeLoop: boolean;
  private disposePickedFeatureSubscription?: () => void;
  private drawRectangle: boolean;

  private mousePointEntity?: Entity;

  private disposeClampMeasureLineToGround?: IReactionDisposer;

  constructor(options: Options) {
    super(createGuid(), options.terria);

    makeObservable(this);

    /**
     * Text that appears at the top of the dialog when drawmode is active.
     */
    this.messageHeader = defaultValue(
      options.messageHeader,
      i18next.t("models.userDrawing.messageHeader")
    );

    /**
     * If true, user can click on first point to close the line, turning it into a polygon.
     */
    this.allowPolygon = defaultValue(options.allowPolygon, true);

    /**
     * If true, always close polygon adding the first point also as last point.
     */
    this.autoClosePolygon = defaultValue(options.autoClosePolygon, false);

    /**
     * Callback that occurs when the dialog is redrawn, to add additional information to dialog.
     */
    this.onMakeDialogMessage = options.onMakeDialogMessage;

    this.buttonText = options.buttonText;

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
     * Callback that occurs when a drawing is complete. This is called when the
     * user has clicked done button and the shape has at least 1 point.
     * The callback function will receive the points in the shape and a rectangle
     * if `drawRectangle` was set to `true`.
     */
    this.onDrawingComplete = options.onDrawingComplete;

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

    this.disposeClampMeasureLineToGround = reaction(
      () => this.terria?.clampMeasureLineToGround,
      (clampMeasureLineToGround) => {
        if (
          this.otherEntities.entities.values.length > 0 &&
          this.otherEntities.entities.values[0]?.polyline
        ) {
          this.otherEntities.entities.values[0].polyline.clampToGround =
            new ConstantProperty(clampMeasureLineToGround);
          this.terria.currentViewer.notifyRepaintRequired();
        }
      }
    );

    this.drawRectangle = defaultValue(options.drawRectangle, false);

    this.invisible = options.invisible;
  }

  protected forceLoadMapItems(): Promise<void> {
    return Promise.resolve();
  }

  @computed get mapItems() {
    // Don't show points if drawing rectangle
    return this.drawRectangle
      ? [this.otherEntities]
      : [this.pointEntities, this.otherEntities];
  }

  get svgPoint() {
    /**
     * SVG element for point drawn when user clicks.
     * http://stackoverflow.com/questions/24869733/how-to-draw-custom-dynamic-billboards-in-cesium-js
     */
    const svgDataDeclare = "data:image/svg+xml,";
    const svgPrefix =
      '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="20px" height="20px" xml:space="preserve">';
    const svgCircle =
      '<circle cx="10" cy="10" r="5" stroke="rgb(0,170,215)" stroke-width="4" fill="white" /> ';
    const svgSuffix = "</svg>";
    const svgString = svgPrefix + svgCircle + svgSuffix;

    // create the cesium entity
    return svgDataDeclare + svgString;
  }

  @override
  get cesiumRectangle(): Rectangle | undefined {
    return this.getRectangleForShape();
  }

  enterDrawMode() {
    // Create and setup a new dragHelper
    this.dragHelper = new DragPoints(this.terria, (customDataSource) => {
      if (typeof this.onPointMoved === "function") {
        this.onPointMoved(customDataSource);
      }
      this.prepareToAddNewPoint();
    });
    this.dragHelper.setUp();

    // If we have finished a polygon, don't allow more points to be drawn. In future, perhaps support multiple polygons.
    if (this.inDrawMode || this.closeLoop) {
      // Do nothing
      return;
    }

    runInAction(() => {
      this.inDrawMode = true;
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
    if (this.drawRectangle) {
      this.mousePointEntity = new Entity({
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
                this.mousePointEntity?.position?.getValue(time);

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

      this.otherEntities.entities.add(rectangle as any);
    } else {
      // Line will show up once user has drawn some points. Vertices of line are user points.
      this.otherEntities.entities.add({
        name: "Line",
        polyline: {
          positions: new CallbackProperty(function () {
            const pos = that.getPointsForShape();
            if (isDefined(pos) && that.closeLoop) {
              pos.push(pos[0]);
            }
            return pos;
          }, false),

          // Clamp to ground lines of Measure Tool
          clampToGround: !!this.terria?.clampMeasureLineToGround,

          material: new PolylineGlowMaterialProperty({
            color: new Color(0.0, 0.0, 0.0, 0.1),
            glowPower: 0.25
          } as any),
          width: 20
        } as any
      } as any);
    }

    this.terria.overlays.add(this);

    // Listen for user clicks on map
    const pickPointMode = this.addMapInteractionMode();
    this.disposePickedFeatureSubscription = reaction(
      () => pickPointMode.pickedFeatures,
      async (pickedFeatures, _previousValue, reaction) => {
        if (isDefined(pickedFeatures)) {
          if (isDefined(pickedFeatures.allFeaturesAvailablePromise)) {
            await pickedFeatures.allFeaturesAvailablePromise;
          }
          if (isDefined(pickedFeatures.pickPosition)) {
            const pickedPoint = pickedFeatures.pickPosition;
            this.addPointToPointEntities("First Point", pickedPoint);
            if (this.autoClosePolygon) {
              this.clickedExistingPoint(this.pointEntities.entities.values);
            }
            reaction.dispose();
            this.prepareToAddNewPoint();
          }
        }
      }
    );
  }

  /**
   * Add new point to list of pointEntities
   */
  private addPointToPointEntities(name: string, position: Cartesian3) {
    const pointEntity = new Entity({
      name: name,
      position: new ConstantPositionProperty(position),
      billboard: {
        image: this.svgPoint,
        heightReference: HeightReference.CLAMP_TO_GROUND,
        eyeOffset: new Cartesian3(0.0, 0.0, -50.0)
      } as any
    });
    // Remove the existing points if we are in drawRectangle mode and the user
    // has picked a 3rd point. This lets the user draw new rectangle that
    // replaces the current one.
    if (this.drawRectangle && this.pointEntities.entities.values.length === 2) {
      this.pointEntities.entities.removeAll();
    }
    this.pointEntities.entities.add(pointEntity);
    this.dragHelper?.updateDraggableObjects(this.pointEntities);
    if (isDefined(this.onPointClicked)) {
      this.onPointClicked(this.pointEntities);
    }
  }

  private insertPointToPointEntities(
    name: string,
    position: Cartesian3,
    index: number
  ) {
    const pointEntity = new Entity({
      name: name,
      position: new ConstantPositionProperty(position),
      billboard: <any>{
        image: this.svgPoint,
        heightReference: HeightReference.CLAMP_TO_GROUND,
        eyeOffset: new Cartesian3(0.0, 0.0, -50.0)
      }
    });
    this.pointEntities.entities.suspendEvents();
    const points: Entity[] = clone(this.pointEntities.entities.values, false);

    this.pointEntities.entities.removeAll();
    for (let i = 0; i < index && i < points.length; ++i) {
      this.pointEntities.entities.add(points[i]);
    }
    this.pointEntities.entities.add(pointEntity);
    for (let i = index; i < points.length; ++i) {
      this.pointEntities.entities.add(points[i]);
    }
    this.pointEntities.entities.resumeEvents();

    this.dragHelper?.updateDraggableObjects(this.pointEntities);
    if (isDefined(this.onPointClicked)) {
      this.onPointClicked(this.pointEntities);
    }
  }

  endDrawing() {
    this.dragHelper?.destroy();
    if (this.disposePickedFeatureSubscription) {
      this.disposePickedFeatureSubscription();
    }
    runInAction(() => {
      this.terria.mapInteractionModeStack.pop();
      this.cleanUp();
    });
  }

  /**
   * Updates the MapInteractionModeStack with a listener for a new point.
   */
  private addMapInteractionMode() {
    const pickPointMode = new MapInteractionMode({
      message: this.getDialogMessage(),
      buttonText: this.getButtonText(),
      onCancel: () => {
        runInAction(() => {
          if (this.onDrawingComplete) {
            const isDrawingComplete =
              this.pointEntities.entities.values.length >= 2;
            const points = this.getPointsForShape();

            if (isDrawingComplete && points) {
              this.onDrawingComplete({
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

        if (this.drawRectangle && this.mousePointEntity) {
          const scratchPosition = new Cartesian3();
          this.mousePointEntity.position = new CallbackProperty(() => {
            const cartographicMouseCoords =
              this.terria.currentViewer.mouseCoords.cartographic;
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
      invisible: this.invisible
    });
    runInAction(() => {
      this.terria.mapInteractionModeStack.push(pickPointMode);
    });
    return pickPointMode;
  }

  /**
   * Called after a point has been added, prepares to add and draw another point, as well as updating the dialog.
   */
  private prepareToAddNewPoint() {
    runInAction(() => {
      this.terria.mapInteractionModeStack.pop();
    });

    const pickPointMode = this.addMapInteractionMode();
    this.disposePickedFeatureSubscription = reaction(
      () => pickPointMode.pickedFeatures,
      async (pickedFeatures, _previousValue, reaction) => {
        if (isDefined(pickedFeatures)) {
          if (isDefined(pickedFeatures.allFeaturesAvailablePromise)) {
            await pickedFeatures.allFeaturesAvailablePromise;
          }
          if (isDefined(pickedFeatures.pickPosition)) {
            const pickedPoint = pickedFeatures.pickPosition;
            const pickedCarto = Cartographic.fromCartesian(pickedPoint);

            let changeOrder: number = -1;
            for (
              let i: number = 1;
              i < this.pointEntities.entities.values.length;
              ++i
            ) {
              const pos0 = this.pointEntities.entities.values[
                i - 1
              ].position?.getValue(this.terria.timelineClock.currentTime);
              const pos1 = this.pointEntities.entities.values[
                i
              ].position?.getValue(this.terria.timelineClock.currentTime);
              if (pos0 && pos1) {
                const carto0 = Cartographic.fromCartesian(pos0);
                const carto1 = Cartographic.fromCartesian(pos1);
                const pt = turf.point([
                  pickedCarto.longitude,
                  pickedCarto.latitude
                ]);
                const line = turf.lineString([
                  [carto1.longitude, carto1.latitude],
                  [carto0.longitude, carto0.latitude]
                ]);
                const distance = turf.pointToLineDistance(pt, line, {
                  units: "meters"
                });
                if (distance < Cartesian3.distance(pos1, pos0) * 0.001) {
                  changeOrder = i;
                  break;
                }
              }
            }

            // If existing point was picked, _clickedExistingPoint handles that, and returns true.
            // getDragCount helps us determine if the point was actually dragged rather than clicked. If it was
            // dragged, we shouldn't treat it as a clicked-existing-point scenario.
            if (
              this.dragHelper &&
              this.dragHelper.getDragCount() < 10 &&
              !this.clickedExistingPoint(pickedFeatures.features)
            ) {
              // No existing point was picked, so add a new point
              if (changeOrder >= 0) {
                // Add the new point between 2 existing points
                this.insertPointToPointEntities(
                  "Another Point",
                  pickedPoint,
                  changeOrder
                );
              } else {
                this.addPointToPointEntities("Another Point", pickedPoint);
              }
            } else {
              this.dragHelper?.resetDragCount();
            }
            reaction.dispose();

            if (this.inDrawMode) {
              this.prepareToAddNewPoint();
            }
          }
        }
      }
    );
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
      } else if (index === 0 && !this.closeLoop && this.allowPolygon) {
        // Index is zero if it's the first point, meaning we have a closed shape
        this.polygon = this.otherEntities.entities.add({
          name: "User polygon",
          polygon: {
            hierarchy: new CallbackProperty(function () {
              return new PolygonHierarchy(that.getPointsForShape());
            }, false),
            material: this.autoClosePolygon
              ? new Color(0.0, 0.666, 0.843, 0.25)
              : new Color(0.0, 0.666, 0.843, 0),
            outlineColor: new Color(1.0, 1.0, 1.0, 1.0),
            // Clamp to ground polygons of Measure Tool
            heightReference: new ConstantProperty(
              HeightReference.CLAMP_TO_GROUND
            ),
            perPositionHeight: false as any
          } as any
        } as any) as Entity;
        this.closeLoop = true;
        // A point has not been added, but conceptually it has because the first point is now also the last point.
        if (typeof that.onPointClicked === "function") {
          that.onPointClicked(that.pointEntities);
        }
        userClickedExistingPoint = true;
        return;
      } else if (
        index === 0 &&
        this.closeLoop &&
        this.allowPolygon &&
        !this.autoClosePolygon
      ) {
        this.closeLoop = false;
        this.polygon = undefined;

        // Also let client of UserDrawing know if a point has been removed.
        if (typeof that.onPointClicked === "function") {
          that.onPointClicked(that.pointEntities);
        }
        userClickedExistingPoint = true;
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
  cleanUp() {
    this.terria.overlays.remove(this);
    this.pointEntities.entities.removeAll();
    this.otherEntities.entities.removeAll();

    this.terria.allowFeatureInfoRequests = true;

    runInAction(() => {
      this.inDrawMode = false;
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

    if (isDefined(this.disposeClampMeasureLineToGround)) {
      this.disposeClampMeasureLineToGround();
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
    let message =
      "<strong>" +
      (typeof this.messageHeader === "function"
        ? this.messageHeader()
        : this.messageHeader) +
      "</strong></br>";
    const innerMessage = isDefined(this.onMakeDialogMessage)
      ? this.onMakeDialogMessage()
      : "";

    if (innerMessage !== "") {
      message += innerMessage + "</br>";
    }

    if (this.drawRectangle && this.pointEntities.entities.values.length >= 2) {
      message +=
        "<i>" + i18next.t("models.userDrawing.clickToRedrawRectangle") + "</i>";
    } /*else if (this.pointEntities.entities.values.length > 0) {
      message +=
        "<i>" + i18next.t("models.userDrawing.clickToAddAnotherPoint") + "</i>";
    } else {
      message +=
        "<i>" + i18next.t("models.userDrawing.clickToAddFirstPoint") + "</i>";
    }*/
    // htmlToReactParser will fail if html doesn't have only one root element.
    return "<div>" + message + "</div>";
  }

  /**
   * Figure out the text for the dialog button.
   */
  getButtonText() {
    return defaultValue(
      this.buttonText,
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
      for (let i = 0; i < this.pointEntities.entities.values.length; i++) {
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
    if (!this.drawRectangle) {
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
