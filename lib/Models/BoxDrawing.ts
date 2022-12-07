import throttle from "lodash-es/throttle";
import { observable, onBecomeObserved, onBecomeUnobserved } from "mobx";
import ArcType from "terriajs-cesium/Source/Core/ArcType";
import Cartesian2 from "terriajs-cesium/Source/Core/Cartesian2";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import Color from "terriajs-cesium/Source/Core/Color";
import EllipsoidTerrainProvider from "terriajs-cesium/Source/Core/EllipsoidTerrainProvider";
import HeadingPitchRoll from "terriajs-cesium/Source/Core/HeadingPitchRoll";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import Matrix3 from "terriajs-cesium/Source/Core/Matrix3";
import Matrix4 from "terriajs-cesium/Source/Core/Matrix4";
import Plane from "terriajs-cesium/Source/Core/Plane";
import Quaternion from "terriajs-cesium/Source/Core/Quaternion";
import Ray from "terriajs-cesium/Source/Core/Ray";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import sampleTerrainMostDetailed from "terriajs-cesium/Source/Core/sampleTerrainMostDetailed";
import ScreenSpaceEventHandler from "terriajs-cesium/Source/Core/ScreenSpaceEventHandler";
import ScreenSpaceEventType from "terriajs-cesium/Source/Core/ScreenSpaceEventType";
import TranslationRotationScale from "terriajs-cesium/Source/Core/TranslationRotationScale";
import CallbackProperty from "terriajs-cesium/Source/DataSources/CallbackProperty";
import ColorMaterialProperty from "terriajs-cesium/Source/DataSources/ColorMaterialProperty";
import CustomDataSource from "terriajs-cesium/Source/DataSources/CustomDataSource";
import Entity from "terriajs-cesium/Source/DataSources/Entity";
import ModelGraphics from "terriajs-cesium/Source/DataSources/ModelGraphics";
import PlaneGraphics from "terriajs-cesium/Source/DataSources/PlaneGraphics";
import PolylineDashMaterialProperty from "terriajs-cesium/Source/DataSources/PolylineDashMaterialProperty";
import PositionProperty from "terriajs-cesium/Source/DataSources/PositionProperty";
import Axis from "terriajs-cesium/Source/Scene/Axis";
import ColorBlendMode from "terriajs-cesium/Source/Scene/ColorBlendMode";
import Scene from "terriajs-cesium/Source/Scene/Scene";
import ShadowMode from "terriajs-cesium/Source/Scene/ShadowMode";
import isDefined from "../Core/isDefined";
import Cesium from "./Cesium";

export type ChangeEvent = {
  isFinished: boolean;
  modelMatrix: Matrix4;
};

export type ChangeEventHandler = (event: ChangeEvent) => void;

type MouseClick = { position: Cartesian2 };

type MouseMove = { startPosition: Cartesian2; endPosition: Cartesian2 };

/**
 * An object that responds to box parameter updates.
 */
type Updatable = { update: () => void };

/**
 * A user interactable object
 */
type Interactable = {
  onMouseOver: (mouseMove: MouseMove) => void;
  onMouseOut: (mouseMove: MouseMove) => void;
  onPick: (click: MouseClick) => void;
  onRelease: (click: MouseClick) => void;
  onDrag: (mouseMove: MouseMove) => void;
};

/**
 * An object that responds to camera changes
 */
type CameraAware = {
  updateOnCameraChange: () => void;
};

/**
 * A box side
 */
type Side = Entity &
  Updatable &
  Interactable &
  CameraAware & {
    isSide: true;
    plane: PlaneGraphics;
    isFacingCamera: boolean;
    highlight: () => void;
    unHighlight: () => void;
  };

/**
 * A box edge
 */
type Edge = Entity & Updatable & Interactable;

/**
 * Style for a box side
 */
type SideStyle = {
  fillColor: Color;
  outlineColor: Color;
  highlightFillColor: Color;
  highlightOutlineColor: Color;
};

/**
 * A scale grip point
 */
type ScalePoint = Entity &
  Updatable &
  Interactable &
  CameraAware & {
    position: PositionProperty;
    model: ModelGraphics;
    oppositeScalePoint: ScalePoint;
    axisLine: Entity;
  };

/**
 * Style for a scale point
 */
type ScalePointStyle = {
  cornerPointColor: Color;
  facePointColor: Color;
  dimPointColor: Color;
};

/**
 * The current interaction state of the box
 */
type InteractionState =
  | { is: "none" }
  | {
      is: "picked";
      entity: Entity & Interactable;
      beforePickState: {
        isFeaturePickingPaused: boolean;
        enableInputs: boolean;
      };
    }
  | { is: "hovering"; entity: Entity & Interactable };

export type BoxDrawingChangeParams = {
  /**
   * The modelMatrix of the box
   */
  modelMatrix: Matrix4;

  /**
   * The translation rotation scale of the box
   */
  translationRotationScale: TranslationRotationScale;

  /**
   * True if the change is finished or false if it is ongoing
   */
  isFinished: boolean;
};

type BoxDrawingOptions = {
  /**
   * When true, prevents the box from going underground. Note that we only use
   * the center of the bottom face to detect if the box is underground. For
   * large boxes, this center point can be above ground while the corners are
   * underground.
   */
  keepBoxAboveGround?: boolean;

  /**
   * A callback method to call when box parameters change.
   */
  onChange?: (params: BoxDrawingChangeParams) => void;

  /**
   * When set to `false`, do not draw the scale grips on the box faces, used for non-uniform scaling.
   * Defaults to `true`, i.e draws the non-uniform scaling grips.
   */
  drawNonUniformScaleGrips?: boolean;
};

// The 6 box sides defined as planes in local coordinate space.
const SIDE_PLANES: Plane[] = [
  new Plane(new Cartesian3(0, 0, 1), 0.5),
  new Plane(new Cartesian3(0, 0, -1), 0.5),
  new Plane(new Cartesian3(0, 1, 0), 0.5),
  new Plane(new Cartesian3(0, -1, 0), 0.5),
  new Plane(new Cartesian3(1, 0, 0), 0.5),
  new Plane(new Cartesian3(-1, 0, 0), 0.5)
];

const CORNER_POINT_VECTORS = [
  new Cartesian3(0.5, 0.5, 0.5),
  new Cartesian3(0.5, -0.5, 0.5),
  new Cartesian3(-0.5, -0.5, 0.5),
  new Cartesian3(-0.5, 0.5, 0.5)
];

const FACE_POINT_VECTORS = [
  new Cartesian3(0.5, 0.0, 0.0),
  new Cartesian3(0.0, 0.5, 0.0),
  new Cartesian3(0.0, 0.0, 0.5)
];

// The box has 8 corner points and 6 face points that act as scaling grips.
// Here we represent them as 7 vectors in local coordinates space.
// Each vector represents a point and its opposite points can be easily derived from it.
const SCALE_POINT_VECTORS = [...CORNER_POINT_VECTORS, ...FACE_POINT_VECTORS];

/**
 * Checks whether the given entity is updatable (i.e repsonds to box parameter changes).
 */
function isUpdatable(entity: Entity): entity is Entity & Updatable {
  return typeof (entity as any).update === "function";
}

/**
 * Checks whether the given entity is interactable.
 */
function isInteractable(entity: Entity): entity is Entity & Interactable {
  return (
    typeof (entity as any).onPick === "function" &&
    typeof (entity as any).onRelease === "function" &&
    typeof (entity as any).onMouseOver === "function" &&
    typeof (entity as any).onMouseOut === "function"
  );
}

export function isSideEntity(entity: Entity): entity is Side {
  return (entity as any).isSide;
}

export default class BoxDrawing {
  static localSidePlanes = SIDE_PLANES;

  // Observable because we want to start/stop interactions when the datasource
  // gets used/removed.
  @observable
  public dataSource: CustomDataSource;

  public keepBoxAboveGround: boolean;

  private drawNonUniformScaleGrips: boolean;

  public onChange?: (params: BoxDrawingChangeParams) => void;

  // An external transform to convert the box in local coordinates to world coordinates
  private readonly worldTransform: Matrix4 = Matrix4.IDENTITY.clone();

  // The translation, rotation & scale (i.e position, orientation, dimensions) of the box
  private readonly trs = new TranslationRotationScale();

  // A matrix representation of trs
  private readonly modelMatrix: Matrix4 = Matrix4.IDENTITY.clone();

  private scene: Scene;

  // A disposer function to destroy all event handlers
  private interactionsDisposer?: () => void;

  // Sides of the box defined as cesium entities with additional properties
  private readonly sides: Side[] = [];

  // Scale points on the box defined as cesium entities with additional properties
  private readonly scalePoints: ScalePoint[] = [];

  private isHeightUpdateInProgress: boolean = false;
  private terrainHeightEstimate: number = 0;

  /**
   * A private constructor. Use {@link BoxDrawing.fromTransform} or {@link BoxDrawing.fromTranslationRotationScale} to create instances.
   */
  private constructor(
    readonly cesium: Cesium,
    transform: Matrix4,
    options: BoxDrawingOptions
  ) {
    this.scene = cesium.scene;
    this.keepBoxAboveGround = options.keepBoxAboveGround ?? false;
    this.drawNonUniformScaleGrips = options.drawNonUniformScaleGrips ?? true;
    this.onChange = options.onChange;
    this.dataSource = new Proxy(new CustomDataSource(), {
      set: (target, prop, value) => {
        if (prop === "show") {
          value === true ? this.startInteractions() : this.stopInteractions();
        }
        return Reflect.set(target, prop, value);
      }
    });
    this.setTransform(transform);
    this.drawBox();
    this.setBoxAboveGround();

    onBecomeObserved(this, "dataSource", () => this.startInteractions());
    onBecomeUnobserved(this, "dataSource", () => this.stopInteractions());
  }

  /**
   * Construct `BoxDrawing` from a transformation matrix.
   *
   * @param cesium - A Cesium instance
   * @param transform - A transformation that positions the box in the world.
   * @param options - {@link BoxDrawingOptions}
   * @returns A `BoxDrawing` instance
   */
  static fromTransform(
    cesium: Cesium,
    transform: Matrix4,
    options?: BoxDrawingOptions
  ): BoxDrawing {
    return new BoxDrawing(cesium, transform, options ?? {});
  }

  /**
   * Construct `BoxDrawing` from a {@link TranslationRotationScale} object.
   *
   * @param cesium - A Cesium instance
   * @param trs - Translation, rotation and scale of the object.
   * @param options - {@link BoxDrawingOptions}
   * @returns A `BoxDrawing` instance
   */
  static fromTranslationRotationScale(
    cesium: Cesium,
    trs: TranslationRotationScale,
    options?: BoxDrawingOptions
  ): BoxDrawing {
    const boxDrawing = new BoxDrawing(
      cesium,
      Matrix4.fromTranslationRotationScale(trs),
      options ?? {}
    );

    return boxDrawing;
  }

  public setTranslationRotationScale(trs: TranslationRotationScale) {
    Cartesian3.clone(trs.translation, this.trs.translation);
    Quaternion.clone(trs.rotation, this.trs.rotation);
    Cartesian3.clone(trs.scale, this.trs.scale);
    this.updateBox();
  }

  /**
   * A method to udpate the world transform.
   */
  public setTransform(transform: Matrix4) {
    Matrix4.clone(transform, this.worldTransform);
    Matrix4.getTranslation(this.worldTransform, this.trs.translation);
    Matrix4.getScale(this.worldTransform, this.trs.scale);
    Quaternion.fromRotationMatrix(
      Matrix3.getRotation(
        Matrix4.getMatrix3(this.worldTransform, new Matrix3()),
        new Matrix3()
      ),
      this.trs.rotation
    );
    this.updateBox();
  }

  /**
   * Moves the box by the provided moveStep with optional clamping applied so that the
   * box does not go underground.
   *
   * @param moveStep The amount by which to move the box
   */
  private moveBoxWithClamping = (() => {
    const scratchNewPosition = new Cartesian3();
    const scratchCartographic = new Cartographic();

    return (moveStep: Cartesian3) => {
      const nextPosition = Cartesian3.add(
        this.trs.translation,
        moveStep,
        scratchNewPosition
      );
      if (this.keepBoxAboveGround) {
        const cartographic = Cartographic.fromCartesian(
          nextPosition,
          undefined,
          scratchCartographic
        );
        const boxBottomHeight = cartographic.height - this.trs.scale.z / 2;
        const floorHeight: number = this.terrainHeightEstimate;
        if (boxBottomHeight < floorHeight) {
          cartographic.height += floorHeight - boxBottomHeight;
          Cartographic.toCartesian(cartographic, undefined, nextPosition);
        }
      }
      Cartesian3.clone(nextPosition, this.trs.translation);
    };
  })();

  /**
   * Update the terrain height estimate at the current box position.
   *
   * If the terrainProvider is the `EllipsoidTerrainProvider` this simply sets
   * the estimate to 0.  Otherwise we request the terrain provider for the most
   * detailed height estimate.  To avoid concurrent attempts we skip the call
   * if any other request is active. `forceUpdate` can be used to force an
   * update even when an earlier request is active.
   */
  private updateTerrainHeightEstimate = (() => {
    const scratchBoxCenter = new Cartographic();
    const scratchFloor = new Cartographic();

    return async (forceUpdate = false) => {
      if (!this.keepBoxAboveGround) {
        return;
      }

      if (this.isHeightUpdateInProgress && !forceUpdate) {
        return;
      }

      const terrainProvider = this.scene.terrainProvider;
      if (terrainProvider instanceof EllipsoidTerrainProvider) {
        this.terrainHeightEstimate = 0;
        return;
      }

      this.isHeightUpdateInProgress = true;
      const boxCenter = Cartographic.fromCartesian(
        this.trs.translation,
        undefined,
        scratchBoxCenter
      );
      try {
        const [floor] = await sampleTerrainMostDetailed(terrainProvider, [
          Cartographic.clone(boxCenter, scratchFloor)
        ]);
        if (floor.height !== undefined) {
          this.terrainHeightEstimate = floor.height;
        }
      } finally {
        this.isHeightUpdateInProgress = false;
      }
    };
  })();

  setBoxAboveGround() {
    if (!this.keepBoxAboveGround) {
      return;
    }

    // Get the latest terrain height estimate and update the box position
    this.updateTerrainHeightEstimate(true).then(() => {
      this.moveBoxWithClamping(Cartesian3.ZERO);
      this.updateBox();
    });
  }

  /**
   * Sets up event handlers if not already done.
   */
  private startInteractions() {
    if (this.interactionsDisposer) {
      // already started
      return;
    }

    let eventHandler: { destroy: () => void } | undefined;

    // Start event handling if not already started
    const startMapInteractions = () => {
      if (!eventHandler) {
        eventHandler = this.createEventHandler();
      }
    };

    // Stop event handling
    const stopMapInteractions = () => {
      eventHandler?.destroy();
      eventHandler = undefined;
    };

    // Watch camera changes to update entities and to enable/disable
    // interactions when the box comes in and out of view.
    const onCameraChange = () => {
      this.updateEntitiesOnOrientationChange();
    };

    // Camera event disposer
    const disposeCameraEvent =
      this.scene.camera.changed.addEventListener(onCameraChange);

    // Disposer for map interactions & camera events
    this.interactionsDisposer = () => {
      stopMapInteractions();
      disposeCameraEvent();
      this.interactionsDisposer = undefined;
    };

    startMapInteractions();
    // Call once to initialize
    onCameraChange();
  }

  private stopInteractions() {
    this.interactionsDisposer?.();
  }

  /**
   * Updates all box parameters from changes to the localTransform.
   */
  private updateBox() {
    Matrix4.fromTranslationRotationScale(this.trs, this.modelMatrix);
    this.dataSource.entities.values.forEach((entity) => {
      if (isUpdatable(entity)) entity.update();
    });
  }

  private updateEntitiesOnOrientationChange() {
    this.sides.forEach((side) => side.updateOnCameraChange());
    this.scalePoints.forEach((scalePoint) => scalePoint.updateOnCameraChange());
  }

  /**
   * Returns true if the box is in camera view.
   */
  private isBoxInCameraView() {
    // This method is unused until we figure out a better way to implement it.
    // The view rectangle is a rectangle on the ellipsoid so
    // intersecting with it wont work correctly for oblique camera angles.
    // We might have to intersect with the camera frustum volume
    // like here: https://stackoverflow.com/questions/58207413/how-to-check-if-a-cesium-entity-is-visible-occluded
    const viewRectangle = computeViewRectangle(this.scene);
    return viewRectangle
      ? Rectangle.contains(
          viewRectangle,
          Cartographic.fromCartesian(this.trs.translation)
        )
      : false;
  }

  /**
   * Create event handlers for interacting with the box.
   */
  private createEventHandler() {
    const scene = this.scene;
    let state: InteractionState = { is: "none" };
    const handlePick = (click: MouseClick) => {
      const pick = scene.pick(click.position);
      const entity = pick?.id;
      if (entity === undefined || !isInteractable(entity)) {
        return;
      }

      if (state.is === "hovering") {
        state.entity.onMouseOut({
          startPosition: click.position,
          endPosition: click.position
        });
      }
      state = {
        is: "picked",
        entity,
        beforePickState: {
          isFeaturePickingPaused: this.cesium.isFeaturePickingPaused,
          enableInputs: scene.screenSpaceCameraController.enableInputs
        }
      };
      this.cesium.isFeaturePickingPaused = true;
      scene.screenSpaceCameraController.enableInputs = false;
      entity.onPick(click);
    };

    const handleRelease = (click: MouseClick) => {
      if (state.is === "picked") {
        this.cesium.isFeaturePickingPaused =
          state.beforePickState.isFeaturePickingPaused;
        scene.screenSpaceCameraController.enableInputs =
          state.beforePickState.enableInputs;
        state.entity.onRelease(click);
        state = { is: "none" };
      }
    };

    const detectHover = throttle((mouseMove: MouseMove) => {
      const pick = scene.pick(mouseMove.endPosition);
      const entity = pick?.id;
      if (entity === undefined || !isInteractable(entity)) {
        return;
      }

      state = { is: "hovering", entity };
      entity.onMouseOver(mouseMove);
    }, 200);

    const handleMouseMove = (mouseMove: MouseMove) => {
      if (state.is === "none") {
        detectHover(mouseMove);
      } else if (state.is === "hovering") {
        const pick = scene.pick(mouseMove.endPosition);
        const entity = pick?.id;
        if (entity !== state.entity) {
          state.entity.onMouseOut(mouseMove);
          if (entity && isInteractable(entity)) {
            state = { is: "hovering", entity };
            entity.onMouseOver(mouseMove);
          } else {
            state = { is: "none" };
          }
        }
      } else if (state.is === "picked") {
        state.entity.onDrag(mouseMove);
      }
    };

    const eventHandler = new ScreenSpaceEventHandler(this.scene.canvas);
    eventHandler.setInputAction(handlePick, ScreenSpaceEventType.LEFT_DOWN);
    eventHandler.setInputAction(handleRelease, ScreenSpaceEventType.LEFT_UP);
    eventHandler.setInputAction(
      handleMouseMove,
      ScreenSpaceEventType.MOUSE_MOVE
    );

    const onMouseOutCanvas = (e: MouseEvent) => {
      if (state.is === "hovering") {
        const { x, y } = e;
        state.entity.onMouseOut({
          startPosition: new Cartesian2(x, y),
          endPosition: new Cartesian2(x, y)
        });
        state = { is: "none" };
      }
    };
    scene.canvas.addEventListener("mouseout", onMouseOutCanvas);

    const handler = {
      destroy: () => {
        eventHandler.destroy();
        scene.canvas.removeEventListener("mouseout", onMouseOutCanvas);
      }
    };
    return handler;
  }

  /**
   * Draw the box.
   */
  private drawBox() {
    this.drawSides();
    this.drawEdges();
    this.drawScalePoints();
  }

  /**
   * Draw sides of the box.
   */
  private drawSides() {
    SIDE_PLANES.forEach((sideLocal) => {
      const side = this.createSide(sideLocal);
      this.dataSource.entities.add(side);
      this.sides.push(side);
    });
  }

  private drawEdges() {
    const localEdges: [Cartesian3, Cartesian3][] = [];
    CORNER_POINT_VECTORS.map((vector, i) => {
      const upPoint = vector;
      const downPoint = Cartesian3.clone(upPoint, new Cartesian3());
      downPoint.z *= -1;

      const nextUpPoint = CORNER_POINT_VECTORS[(i + 1) % 4];
      const nextDownPoint = Cartesian3.clone(nextUpPoint, new Cartesian3());
      nextDownPoint.z *= -1;

      const verticalEdge: [Cartesian3, Cartesian3] = [upPoint, downPoint];
      const topEdge: [Cartesian3, Cartesian3] = [nextUpPoint, upPoint];
      const bottomEdge: [Cartesian3, Cartesian3] = [nextDownPoint, downPoint];
      localEdges.push(verticalEdge, topEdge, bottomEdge);
    });

    localEdges.forEach((localEdge) => {
      const edge = this.createEdge(localEdge);
      this.dataSource.entities.add(edge);
      //this.edges.push(edge);
    });
  }

  /**
   * Draw the scale grip points.
   */
  private drawScalePoints() {
    const scalePointVectors = [
      ...CORNER_POINT_VECTORS,
      ...(this.drawNonUniformScaleGrips ? FACE_POINT_VECTORS : [])
    ];

    scalePointVectors.forEach((vector) => {
      const pointLocal1 = vector;
      const pointLocal2 = Cartesian3.multiplyByScalar(
        vector,
        -1,
        new Cartesian3()
      );
      const scalePoint1 = this.createScalePoint(pointLocal1);
      const scalePoint2 = this.createScalePoint(pointLocal2);
      scalePoint1.oppositeScalePoint = scalePoint2;
      scalePoint2.oppositeScalePoint = scalePoint1;
      const axisLine = this.createScaleAxisLine(scalePoint1, scalePoint2);
      scalePoint1.axisLine = axisLine;
      scalePoint2.axisLine = axisLine;

      this.dataSource.entities.add(scalePoint1);
      this.dataSource.entities.add(scalePoint2);
      this.dataSource.entities.add(axisLine);
      this.scalePoints.push(scalePoint1, scalePoint2);
    });
  }

  /**
   * Create a box side drawing.
   *
   * @param planeLocal A plane representing the side in local coordinates.
   * @returns side A cesium entity for the box side.
   */
  private createSide(planeLocal: Plane): Side {
    const scene = this.scene;
    const plane = new Plane(new Cartesian3(), 0);
    const planeDimensions = new Cartesian3();
    const normalAxis = planeLocal.normal.x
      ? Axis.X
      : planeLocal.normal.y
      ? Axis.Y
      : Axis.Z;
    const style: Readonly<SideStyle> = {
      fillColor: Color.WHITE.withAlpha(0.1),
      outlineColor: Color.WHITE,
      highlightFillColor: Color.WHITE.withAlpha(0.1),
      highlightOutlineColor: Color.CYAN
    };
    let isHighlighted = false;

    const scratchScaleMatrix = new Matrix4();
    const update = () => {
      // From xyz scale set the scale for this plane based on the plane axis
      setPlaneDimensions(this.trs.scale, normalAxis, planeDimensions);

      // Transform the plane using scale matrix so that the plane distance is set correctly
      // Orientation and position are specified as entity parameters.
      const scaleMatrix = Matrix4.fromScale(this.trs.scale, scratchScaleMatrix);
      Plane.transform(planeLocal, scaleMatrix, plane);
    };

    const side: Side = new Entity({
      position: new CallbackProperty(() => this.trs.translation, false) as any,
      orientation: new CallbackProperty(() => this.trs.rotation, false) as any,
      plane: {
        show: true,
        plane: new CallbackProperty(() => plane, false),
        dimensions: new CallbackProperty(() => planeDimensions, false),
        fill: true,
        material: new ColorMaterialProperty(
          new CallbackProperty(
            () => (isHighlighted ? style.highlightFillColor : style.fillColor),
            false
          )
        ),
        outline: true,
        outlineColor: new CallbackProperty(
          () =>
            (isHighlighted
              ? style.highlightOutlineColor
              : style.outlineColor
            ).withAlpha(side.isFacingCamera ? 1 : 0.2),
          false
        ),
        outlineWidth: 1
      }
    }) as Side;

    const axis = planeLocal.normal.x
      ? Axis.X
      : planeLocal.normal.y
      ? Axis.Y
      : Axis.Z;

    const scratchDirection = new Cartesian3();
    const scratchMoveVector = new Cartesian3();
    const scratchPreviousPosition = new Cartesian3();
    const scratchEndPosition = new Cartesian3();
    const scratchMoveStep = new Cartesian3();
    const scratchSurfacePoint = new Cartesian3();
    const scratchSurfacePoint2d = new Cartesian2();

    /**
     * Moves the box when dragging a side.
     *  - When dragging the top or bottom sides, move the box up or down along the z-axis.
     *  - When dragging any other sides move the box along the globe surface.
     */
    const moveBoxOnDragSide = (mouseMove: MouseMove) => {
      const moveUpDown = axis === Axis.Z;
      let moveStep = scratchMoveStep;

      // Get the move direction
      const direction = Cartesian3.normalize(
        Matrix4.multiplyByPointAsVector(
          this.modelMatrix,
          plane.normal,
          scratchDirection
        ),
        scratchDirection
      );

      if (moveUpDown) {
        // Move up or down when dragged on the top or bottom faces
        // moveAmount is proportional to the mouse movement along the provided direction
        const moveAmount = computeMoveAmount(
          scene,
          this.trs.translation,
          direction,
          mouseMove
        );
        // Get the move vector
        const moveVector = Cartesian3.multiplyByScalar(
          direction,
          moveAmount,
          scratchMoveVector
        );

        moveStep = moveVector;
      } else {
        // Move along the globe surface when dragging any other side. To do this
        // we find the ellipsoidal points for the previous mouse position and
        // current mouse position and translate the box position by the difference amount.
        //
        // When the box is tall and the horizon is in view, using the mouse
        // coordinates to derive the pick ray results in a pick ray almost
        // tangential to the ellipsoid, giving an ellipsoidal point that is very
        // far away. This causes large jumps in box position. To avoid this we
        // angle the pick ray to the ellipsoid surface by first projecting the mouse
        // points to the ellipsoid surface.

        // The box origin
        const origin = this.trs.translation;

        // Box origin projected on the ellipsoid surface.
        const surfacePoint = projectPointToSurface(origin, scratchSurfacePoint);
        // Surface point in screen coordinates
        const surfacePoint2d = scene.cartesianToCanvasCoordinates(
          surfacePoint,
          scratchSurfacePoint2d
        );

        if (!surfacePoint2d) {
          // cartesianToCanvasCoordinates can unexpectedly return undefined.
          return;
        }

        // Floor the startPosition and endPosition above the ellipsoid.
        const yDiff = mouseMove.endPosition.y - mouseMove.startPosition.y;
        mouseMove.startPosition.y = surfacePoint2d.y;
        mouseMove.endPosition.y = surfacePoint2d.y + yDiff;

        // Fallback to simple ellipsoid pick when globe pick returns undefined
        // (i.e there is no intersection of camera ray with globe tiles). This
        // probably works only because ellipsoid might below the terrain so
        // there is an intersection between the camera ray and ellipsoid.
        // Although it could work, it doesn't truly fix the camera ray parallel
        // to surface issue.
        const previousPosition =
          screenToGlobePosition(
            scene,
            mouseMove.startPosition,
            scratchPreviousPosition
          ) ??
          scene.camera.pickEllipsoid(
            mouseMove.startPosition,
            undefined,
            scratchPreviousPosition
          );

        const endPosition =
          screenToGlobePosition(
            scene,
            mouseMove.endPosition,
            scratchEndPosition
          ) ??
          scene.camera.pickEllipsoid(
            mouseMove.endPosition,
            undefined,
            scratchEndPosition
          );

        if (!previousPosition || !endPosition) {
          return;
        }
        moveStep = Cartesian3.subtract(endPosition, previousPosition, moveStep);
      }

      // Update box position and fire change event
      this.updateTerrainHeightEstimate();
      this.moveBoxWithClamping(moveStep);
      this.updateBox();
      this.onChange?.({
        isFinished: false,
        modelMatrix: this.modelMatrix,
        translationRotationScale: this.trs
      });
    };

    const highlightSide = () => {
      isHighlighted = true;
    };

    const unHighlightSide = () => {
      isHighlighted = false;
    };

    const highlightAllSides = () =>
      this.sides.forEach((side) => side.highlight());
    const unHighlightAllSides = () =>
      this.sides.forEach((side) => side.unHighlight());

    const onMouseOver = () => {
      highlightAllSides();
      setCanvasCursor(scene, "grab");
    };

    const onMouseOut = () => {
      unHighlightAllSides();
      setCanvasCursor(scene, "auto");
    };

    const onPick = () => {
      highlightAllSides();
      setCanvasCursor(scene, "grabbing");
    };

    const onRelease = () => {
      this.setBoxAboveGround();
      unHighlightAllSides();
      setCanvasCursor(scene, "auto");
      this.onChange?.({
        modelMatrix: this.modelMatrix,
        translationRotationScale: this.trs,
        isFinished: true
      });
    };

    const scratchNormal = new Cartesian3();
    const updateOnCameraChange = () => {
      const normalWc = Cartesian3.normalize(
        Matrix4.multiplyByPointAsVector(
          this.modelMatrix,
          plane.normal,
          scratchNormal
        ),
        scratchNormal
      );
      // The side normals point inwards, so when facing the camera the camera
      // vector also points inwards which gives a positive dot product.
      side.isFacingCamera =
        Cartesian3.dot(normalWc, scene.camera.direction) >= 0;
    };

    side.onMouseOver = onMouseOver;
    side.onMouseOut = onMouseOut;
    side.onPick = onPick;
    side.onDrag = moveBoxOnDragSide;
    side.onRelease = onRelease;
    side.highlight = highlightSide;
    side.unHighlight = unHighlightSide;
    side.isFacingCamera = false;
    side.updateOnCameraChange = updateOnCameraChange;
    side.update = update;
    side.isSide = true;
    update();
    return side;
  }

  /**
   * Creates edges for the side specified as plane in local coordinates.
   */
  private createEdge(localEdge: [Cartesian3, Cartesian3]): Edge {
    const scene = this.scene;
    const style = {
      color: Color.WHITE.withAlpha(0.1),
      highlightColor: Color.CYAN.withAlpha(0.7)
    };
    const position1 = new Cartesian3();
    const position2 = new Cartesian3();
    const positions = [position1, position2];

    // Only vertical edges are draggable
    const isDraggableEdge = localEdge[1].z - localEdge[0].z !== 0;

    const update = () => {
      Matrix4.multiplyByPoint(this.modelMatrix, localEdge[0], position1);
      Matrix4.multiplyByPoint(this.modelMatrix, localEdge[1], position2);
    };

    let isHighlighted = false;
    const edge = new Entity({
      polyline: {
        show: true,
        positions: new CallbackProperty(() => positions, false),
        width: new CallbackProperty(() => (isDraggableEdge ? 10 : 0), false),
        material: new ColorMaterialProperty(
          new CallbackProperty(
            () => (isHighlighted ? style.highlightColor : style.color),
            false
          )
        ) as any,
        arcType: ArcType.NONE
      }
    }) as Edge;

    const onMouseOver = () => {
      if (isDraggableEdge) {
        isHighlighted = true;
        setCanvasCursor(scene, "pointer");
      }
    };

    const onMouseOut = () => {
      if (isDraggableEdge) {
        isHighlighted = false;
        setCanvasCursor(scene, "auto");
      }
    };

    const onPick = () => {
      if (isDraggableEdge) {
        isHighlighted = true;
        setCanvasCursor(scene, "pointer");
      }
    };

    const onRelease = () => {
      if (isDraggableEdge) {
        isHighlighted = false;
        setCanvasCursor(scene, "auto");
        this.onChange?.({
          isFinished: true,
          modelMatrix: this.modelMatrix,
          translationRotationScale: this.trs
        });
      }
    };

    const scratchHpr = new HeadingPitchRoll(0, 0, 0);

    const rotateBoxOnDrag = (mouseMove: MouseMove) => {
      if (!isDraggableEdge) {
        return;
      }

      const dx = mouseMove.endPosition.x - mouseMove.startPosition.x;
      const sensitivity = 0.05;
      const hpr = scratchHpr;
      // -dx because the screen coordinates is opposite to local coordinates space.
      hpr.heading = -dx * sensitivity;
      hpr.pitch = 0;
      hpr.roll = 0;

      Quaternion.multiply(
        this.trs.rotation,
        Quaternion.fromHeadingPitchRoll(hpr),
        this.trs.rotation
      );

      this.updateBox();
      this.updateEntitiesOnOrientationChange();
      this.onChange?.({
        isFinished: false,
        modelMatrix: this.modelMatrix,
        translationRotationScale: this.trs
      });
    };

    edge.update = update;
    edge.onMouseOver = onMouseOver;
    edge.onMouseOut = onMouseOut;
    edge.onPick = onPick;
    edge.onRelease = onRelease;
    edge.onDrag = rotateBoxOnDrag;
    update();
    return edge;
  }

  /**
   * Creates a scale point drawing
   *
   * @param pointLocal The scale point in local coordinates.
   * @returns ScalePoint A cesium entity representing the scale point.
   */
  private createScalePoint(pointLocal: Cartesian3): ScalePoint {
    const scene = this.scene;
    const position = new Cartesian3();
    const style: Readonly<ScalePointStyle> = {
      cornerPointColor: Color.RED,
      facePointColor: Color.BLUE,
      dimPointColor: Color.GREY.withAlpha(0.2)
    };
    let isFacingCamera = false;

    const getColor = () => {
      return isFacingCamera
        ? isCornerPoint
          ? style.cornerPointColor
          : style.facePointColor
        : style.dimPointColor;
    };

    const update = () => {
      Matrix4.multiplyByPoint(this.modelMatrix, pointLocal, position);
    };

    const scalePoint: ScalePoint = new Entity({
      position: new CallbackProperty(() => position, false) as any,
      orientation: new CallbackProperty(
        () => Quaternion.IDENTITY,
        false
      ) as any,
      model: {
        uri: require("file-loader!../../wwwroot/models/Box.glb"),
        minimumPixelSize: 12,
        maximumScale: new CallbackProperty(
          // Clamp the maximum size of the scale grip to the 0.15 times the
          // size of the minimum side
          () => 0.15 * Cartesian3.minimumComponent(this.trs.scale),
          false
        ),
        shadows: ShadowMode.DISABLED,
        color: new CallbackProperty(() => getColor(), false),
        // Forces the above color ignoring the color specified in gltf material
        colorBlendMode: ColorBlendMode.REPLACE
      }
    }) as ScalePoint;

    // Calculate dot product with x, y & z axes
    const axisLocal = Cartesian3.normalize(pointLocal, new Cartesian3());
    const xDot = Math.abs(Cartesian3.dot(new Cartesian3(1, 0, 0), axisLocal));
    const yDot = Math.abs(Cartesian3.dot(new Cartesian3(0, 1, 0), axisLocal));
    const zDot = Math.abs(Cartesian3.dot(new Cartesian3(0, 0, 1), axisLocal));
    const cursorDirection =
      xDot === 1 || yDot === 1
        ? "ew-resize"
        : zDot === 1
        ? "ns-resize"
        : "nesw-resize";

    const isCornerPoint = xDot && yDot && zDot;
    const isProportionalScaling = isCornerPoint;

    const onMouseOver = () => {
      scalePoint.axisLine.show = true;
      highlightScalePoint();
      setCanvasCursor(scene, cursorDirection);
    };

    const onPick = () => {
      scalePoint.axisLine.show = true;
      highlightScalePoint();
      setCanvasCursor(scene, cursorDirection);
    };

    const onRelease = () => {
      scalePoint.axisLine.show = false;
      unHighlightScalePoint();
      this.onChange?.({
        modelMatrix: this.modelMatrix,
        translationRotationScale: this.trs,
        isFinished: true
      });
      setCanvasCursor(scene, "auto");
    };

    const onMouseOut = () => {
      scalePoint.axisLine.show = false;
      unHighlightScalePoint();
      setCanvasCursor(scene, "auto");
    };

    // Axis for proportional scaling
    const proportionalScalingAxis = new Cartesian3(1, 1, 1);

    const scratchOppositePosition = new Cartesian3();
    const scratchAxisVector = new Cartesian3();
    const scratchMoveDirection = new Cartesian3();
    const scratchMultiply = new Cartesian3();
    const scratchAbs = new Cartesian3();
    const scratchScaleStep = new Cartesian3();
    const scratchMoveStep = new Cartesian3();
    const scratchCartographic = new Cartographic();

    /**
     * Scales the box proportional to the mouse move when dragging the scale point.
     * Scaling occurs along the axis connecting the opposite scaling point.
     * Additionally we make sure:
     *   - That scaling also keeps opposite side of the box stationary.
     *   - The box does not get smaller than 20px on any side at the current zoom level.
     */
    const scaleBoxOnDrag = (mouseMove: MouseMove) => {
      // Find the direction to scale in
      const oppositePosition = scalePoint.oppositeScalePoint.position.getValue(
        JulianDate.now(),
        scratchOppositePosition
      );
      const axisVector = Cartesian3.subtract(
        position,
        oppositePosition,
        scratchAxisVector
      );
      const length = Cartesian3.magnitude(axisVector);
      const scaleDirection = Cartesian3.normalize(
        axisVector,
        scratchMoveDirection
      );

      // scaleAmount is a measure of how much to scale in the given direction
      // for the given mouse movement.
      const { scaleAmount, pixelLengthAfterScaling } = computeScaleAmount(
        this.scene,
        position,
        scaleDirection,
        length,
        mouseMove
      );

      // When downscaling, stop at 20px length.
      if (scaleAmount < 0) {
        const isDiagonal = axisLocal.x && axisLocal.y && axisLocal.y;
        const pixelSideLengthAfterScaling = isDiagonal
          ? pixelLengthAfterScaling / Math.sqrt(2)
          : pixelLengthAfterScaling;
        if (pixelSideLengthAfterScaling < 20) {
          // Do nothing if scaling down will make the box smaller than 20px
          return;
        }
      }

      // Compute scale components along xyz
      const scaleStep = Cartesian3.multiplyByScalar(
        // Taking abs because scaling step is independent of axis direction
        // Scaling step is negative when scaling down and positive when scaling up
        Cartesian3.abs(
          // Extract scale components along the axis
          Cartesian3.multiplyComponents(
            this.trs.scale,
            // For proportional scaling we scale equally along xyz
            isProportionalScaling ? proportionalScalingAxis : axisLocal,
            scratchMultiply
          ),
          scratchAbs
        ),
        scaleAmount,
        scratchScaleStep
      );

      // Move the box by half the scale amount in the direction of scaling so
      // that the opposite end remains stationary.
      const moveStep = Cartesian3.multiplyByScalar(
        axisVector,
        scaleAmount / 2,
        scratchMoveStep
      );

      // Prevent scaling in Z axis if it will result in the box going underground.
      const isDraggingBottomScalePoint = axisLocal.z < 0;
      const isUpscaling = scaleAmount > 0;
      if (
        this.keepBoxAboveGround &&
        isUpscaling &&
        isDraggingBottomScalePoint
      ) {
        const boxCenterHeight = Cartographic.fromCartesian(
          this.trs.translation,
          undefined,
          scratchCartographic
        ).height;
        const bottomHeight = boxCenterHeight - this.trs.scale.z / 2;
        const bottomHeightAfterScaling = bottomHeight - Math.abs(moveStep.z);
        if (bottomHeightAfterScaling < 0) {
          scaleStep.z = 0;
        }
      }

      // Apply scale
      Cartesian3.add(this.trs.scale, scaleStep, this.trs.scale);

      // Move the box
      this.moveBoxWithClamping(moveStep);

      this.updateBox();
      this.onChange?.({
        isFinished: false,
        modelMatrix: this.modelMatrix,
        translationRotationScale: this.trs
      });
    };

    const adjacentSides = this.sides.filter((side) => {
      const plane = side.plane.plane?.getValue(JulianDate.now());
      const isAdjacent = Cartesian3.dot(plane.normal, axisLocal) < 0;
      return isAdjacent;
    });

    const updateOnCameraChange = () => {
      isFacingCamera = adjacentSides.some((side) => side.isFacingCamera);
    };

    const highlightScalePoint = () => {
      const model = scalePoint.model;
      model.silhouetteColor = Color.YELLOW as any;
      model.silhouetteSize = 1 as any;
    };

    const unHighlightScalePoint = () => {
      const model = scalePoint.model;
      model.silhouetteColor = undefined;
      model.silhouetteSize = 0 as any;
    };

    scalePoint.onPick = onPick;
    scalePoint.onRelease = onRelease;
    scalePoint.onMouseOver = onMouseOver;
    scalePoint.onMouseOut = onMouseOut;
    scalePoint.onDrag = scaleBoxOnDrag;
    scalePoint.update = update;
    scalePoint.updateOnCameraChange = updateOnCameraChange;
    update();
    return scalePoint;
  }

  /**
   * Create an axis line drawing between two scale points.
   */
  private createScaleAxisLine(
    scalePoint1: ScalePoint,
    scalePoint2: ScalePoint
  ): Entity {
    const position1 = scalePoint1.position?.getValue(JulianDate.now())!;
    const position2 = scalePoint2.position?.getValue(JulianDate.now())!;
    const scaleAxis = new Entity({
      show: false,
      polyline: {
        positions: new CallbackProperty(
          () => [position1, position2],
          false
        ) as any,
        material: new PolylineDashMaterialProperty({
          color: Color.CYAN,
          dashLength: 8
        }),
        arcType: ArcType.NONE
      }
    });
    return scaleAxis;
  }
}

const scratchMouseVector2d = new Cartesian2();
const scratchScreenVector2d = new Cartesian2();
const scratchScreenNormal2d = new Cartesian2();

/**
 * Computes the amount by which to move a vector proportional to the provided
 * mouse movement.
 *
 * @param position The world position at which move starts
 * @param direction The direction in which to move
 * @param mouseMove The mouse movement
 * @returns moveAmount The amount by which to move the vector
 */
function computeMoveAmount(
  scene: Scene,
  position: Cartesian3,
  direction: Cartesian3,
  mouseMove: MouseMove
): number {
  const mouseVector2d = Cartesian2.subtract(
    mouseMove.endPosition,
    mouseMove.startPosition,
    scratchMouseVector2d
  );

  const screenVector2d = screenProjectVector(
    scene,
    position,
    direction,
    1,
    scratchScreenVector2d
  );

  const screenNormal2d = Cartesian2.normalize(
    screenVector2d,
    scratchScreenNormal2d
  );
  const moveAmountPixels = Cartesian2.dot(mouseVector2d, screenNormal2d);
  const pixelsPerStep = Cartesian2.magnitude(screenVector2d);
  const moveAmount = moveAmountPixels / pixelsPerStep;
  return moveAmount;
}

/**
 * Computes amount by which to scale a vector proportional to the provided mouse movement.
 *
 * @param scene
 * @param position Position in world coordinates where the move starts
 * @param direction Direction of the move vector
 * @param length Length of the move vector
 * @param mouseMove Mouse movement
 * @returns Amount by which to scale the vector and the estimated length in pixels after scaling
 */
function computeScaleAmount(
  scene: Scene,
  position: Cartesian3,
  direction: Cartesian3,
  length: number,
  mouseMove: MouseMove
) {
  const mouseVector2d = Cartesian2.subtract(
    mouseMove.endPosition,
    mouseMove.startPosition,
    scratchMouseVector2d
  );

  // Project the vector of unit length to the screen
  const screenVector2d = screenProjectVector(
    scene,
    position,
    direction,
    1,
    scratchScreenVector2d
  );
  const screenNormal2d = Cartesian2.normalize(
    screenVector2d,
    scratchScreenNormal2d
  );

  const pixelsPerStep = Cartesian2.magnitude(screenVector2d);
  const moveAmountPixels = Cartesian2.dot(mouseVector2d, screenNormal2d);
  const moveAmount = moveAmountPixels / pixelsPerStep;
  const scaleAmount = moveAmount / length;
  const pixelLengthAfterScaling =
    pixelsPerStep * length + pixelsPerStep * length * scaleAmount;
  return { scaleAmount, pixelLengthAfterScaling };
}

const scratchNearPoint2d = new Cartesian2();
const scratchFarPoint2d = new Cartesian2();
const scratchRay = new Ray();
function screenProjectVector(
  scene: Scene,
  position: Cartesian3,
  direction: Cartesian3,
  length: number,
  result: Cartesian2
): Cartesian2 {
  const ray = scratchRay;
  ray.origin = position;
  ray.direction = direction;
  const nearPoint2d = scene.cartesianToCanvasCoordinates(
    Ray.getPoint(ray, 0),
    scratchNearPoint2d
  );

  const farPoint2d = scene.cartesianToCanvasCoordinates(
    Ray.getPoint(ray, length),
    scratchFarPoint2d
  );
  const screenVector2d = Cartesian2.subtract(farPoint2d, nearPoint2d, result);
  return screenVector2d;
}

/**
 * Converts given xy screen coordinate to a position on the globe surface.
 *
 * @param scene
 * @param position The xy screen coordinate
 * @param result Cartesian3 object to store the result
 * @returns The result object set to the converted position on the globe surface
            or undefined if a globe position could not be found.
*/
const scratchPickRay = new Ray();
export function screenToGlobePosition(
  scene: Scene,
  position: Cartesian2,
  result: Cartesian3
): Cartesian3 | undefined {
  const pickRay = scene.camera.getPickRay(position, scratchPickRay);
  if (!isDefined(pickRay)) {
    return undefined;
  }

  const globePosition = scene.globe.pick(pickRay, scene, result);
  return globePosition;
}

/**
 * Project the given point to the ellipsoid surface.
 */
function projectPointToSurface(
  position: Cartesian3,
  result: Cartesian3
): Cartesian3 {
  const cartographic = Cartographic.fromCartesian(
    position,
    undefined,
    scratchCartographic
  );
  cartographic.height = 0;
  return Cartographic.toCartesian(cartographic, undefined, result);
}
const scratchCartographic = new Cartographic();

function setPlaneDimensions(
  boxDimensions: Cartesian3,
  planeNormalAxis: Axis,
  planeDimensions: Cartesian2
) {
  if (planeNormalAxis === Axis.X) {
    planeDimensions.x = boxDimensions.y;
    planeDimensions.y = boxDimensions.z;
  } else if (planeNormalAxis === Axis.Y) {
    planeDimensions.x = boxDimensions.x;
    planeDimensions.y = boxDimensions.z;
  } else if (planeNormalAxis === Axis.Z) {
    planeDimensions.x = boxDimensions.x;
    planeDimensions.y = boxDimensions.y;
  }
}

const scratchViewRectangle = new Rectangle();
function computeViewRectangle(scene: Scene) {
  return scene.camera.computeViewRectangle(undefined, scratchViewRectangle);
}

function setCanvasCursor(scene: Scene, cursorType: string) {
  scene.canvas.style.cursor = cursorType;
}
