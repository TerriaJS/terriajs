import throttle from "lodash-es/throttle";
import { observable, onBecomeObserved, onBecomeUnobserved } from "mobx";
import ArcType from "terriajs-cesium/Source/Core/ArcType";
import Cartesian2 from "terriajs-cesium/Source/Core/Cartesian2";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import Color from "terriajs-cesium/Source/Core/Color";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import Matrix4 from "terriajs-cesium/Source/Core/Matrix4";
import Plane from "terriajs-cesium/Source/Core/Plane";
import Ray from "terriajs-cesium/Source/Core/Ray";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import ScreenSpaceEventHandler from "terriajs-cesium/Source/Core/ScreenSpaceEventHandler";
import ScreenSpaceEventType from "terriajs-cesium/Source/Core/ScreenSpaceEventType";
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
    plane: PlaneGraphics;
    isFacingCamera: boolean;
    highlight: () => void;
    unHighlight: () => void;
  };

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
  | { is: "picked"; entity: Entity & Interactable }
  | { is: "hovering"; entity: Entity & Interactable };

// The 6 box sides defined as planes in local coordinate space.
const SIDE_PLANES: Plane[] = [
  new Plane(new Cartesian3(0, 0, 1), 0.5),
  new Plane(new Cartesian3(0, 0, -1), 0.5),
  new Plane(new Cartesian3(0, 1, 0), 0.5),
  new Plane(new Cartesian3(0, -1, 0), 0.5),
  new Plane(new Cartesian3(1, 0, 0), 0.5),
  new Plane(new Cartesian3(-1, 0, 0), 0.5)
];

// The box has 8 corner points and 6 face points that act as scaling grips.
// Here we represent them as 7 vectors in local coordinates space.
// Each vector represents a point and its opposite points can be easily derived from it.
const SCALE_POINT_VECTORS = [
  new Cartesian3(0.5, 0.5, 0.5),
  new Cartesian3(0.5, -0.5, 0.5),
  new Cartesian3(-0.5, 0.5, 0.5),
  new Cartesian3(-0.5, -0.5, 0.5),
  new Cartesian3(0.5, 0.0, 0.0),
  new Cartesian3(0.0, 0.5, 0.0),
  new Cartesian3(0.0, 0.0, 0.5)
];

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

export default class BoxDrawing {
  static localSidePlanes = SIDE_PLANES;

  // Observable because we want to start/stop interactions when the datasource
  // gets used/removed.
  @observable dataSource: CustomDataSource;

  // An external transform to convert the box in local coordinates to world coordinates
  private readonly worldTransform: Matrix4 = Matrix4.IDENTITY.clone();

  // Inverse of world transform
  private readonly inverseWorldTransform: Matrix4 = Matrix4.IDENTITY.clone();

  // Transformations in local coordinates. All box transformations are made in
  // the local space.
  private readonly localTransform: Matrix4 = Matrix4.IDENTITY.clone();

  // The final transform that combines the local changes and the world transform.
  private readonly modelMatrix: Matrix4 = Matrix4.IDENTITY.clone();

  // Current box position in the world coordinates derived from modelMatrix
  private readonly boxPosition: Cartesian3 = new Cartesian3();

  private scene: Scene;

  // A disposer function to destroy all event handlers
  private interactionsDisposer?: () => void;

  // Sides of the box defined as cesium entities with additional properties
  private readonly sides: Side[] = [];

  // Scale points on the box defined as cesium entities with additional properties
  private readonly scalePoints: ScalePoint[] = [];

  /**
   * @param cesium A Cesium instance
   * @param transform A transformation that converts the box to world space.
   * @param onChange An optional event notifier callback that gets called when the box is transformed.
   */
  constructor(
    readonly cesium: Cesium,
    transform: Matrix4,
    readonly onChange?: (params: {
      modelMatrix: Matrix4;
      isFinished: boolean;
    }) => void
  ) {
    this.scene = cesium.scene;
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

    onBecomeObserved(this, "dataSource", () => this.startInteractions());
    onBecomeUnobserved(this, "dataSource", () => this.stopInteractions());
  }

  /**
   * A method to udpate the world transform.
   */
  public setTransform(transform: Matrix4) {
    Matrix4.clone(transform, this.worldTransform);
    Matrix4.inverse(this.worldTransform, this.inverseWorldTransform);
    Matrix4.clone(Matrix4.IDENTITY, this.localTransform);
    this.updateBox();
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
      if (this.isBoxInCameraView()) {
        startMapInteractions();
        this.sides.forEach(side => side.updateOnCameraChange());
        this.scalePoints.forEach(scalePoint =>
          scalePoint.updateOnCameraChange()
        );
      } else {
        // Disable map interactions when the box goes out of camera view.
        stopMapInteractions();
      }
    };

    // Camera event disposer
    const disposeCameraEvent = this.scene.camera.changed.addEventListener(
      onCameraChange
    );

    // Disposer for map interactions & camera events
    this.interactionsDisposer = () => {
      stopMapInteractions();
      disposeCameraEvent();
      this.interactionsDisposer = undefined;
    };

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
    Matrix4.multiply(
      this.worldTransform,
      this.localTransform,
      this.modelMatrix
    );
    Matrix4.getTranslation(this.modelMatrix, this.boxPosition);

    this.dataSource.entities.values.forEach(entity => {
      if (isUpdatable(entity)) entity.update();
    });
  }

  /**
   * Returns true if the box is in camera view.
   */
  private isBoxInCameraView() {
    const viewRectangle = this.scene.camera.computeViewRectangle(
      undefined,
      new Rectangle()
    );

    return viewRectangle
      ? Rectangle.contains(
          viewRectangle,
          Cartographic.fromCartesian(this.boxPosition)
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

      this.cesium.isFeaturePickingPaused = true;
      scene.screenSpaceCameraController.enableInputs = false;
      if (state.is === "hovering") {
        state.entity.onMouseOut({
          startPosition: click.position,
          endPosition: click.position
        });
      }
      state = { is: "picked", entity };
      entity.onPick(click);
    };

    const handleRelease = (click: MouseClick) => {
      if (state.is === "picked") {
        this.cesium.isFeaturePickingPaused = false;
        scene.screenSpaceCameraController.enableInputs = true;
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
    this.drawScalePoints();
  }

  /**
   * Draw sides of the box.
   */
  private drawSides() {
    SIDE_PLANES.forEach(sideLocal => {
      const side = this.createSide(sideLocal);
      this.dataSource.entities.add(side);
      this.sides.push(side);
    });
  }

  /**
   * Draw the scale grip points.
   */
  private drawScalePoints() {
    SCALE_POINT_VECTORS.forEach(vector => {
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
    const position = new Cartesian3();
    const plane = new Plane(new Cartesian3(), 0);
    const planeDimensions = new Cartesian3();
    const boxDimensions = new Cartesian3();
    const scaleMatrix = new Matrix4();
    const normalAxis = planeLocal.normal.x
      ? Axis.X
      : planeLocal.normal.y
      ? Axis.Y
      : Axis.Z;
    const style: Readonly<SideStyle> = {
      fillColor: Color.WHITE.withAlpha(0.1),
      outlineColor: Color.WHITE,
      highlightFillColor: Color.CYAN.withAlpha(0.1),
      highlightOutlineColor: Color.WHITE
    };
    let isHighlighted = false;

    const update = () => {
      Matrix4.getTranslation(this.modelMatrix, position);
      Matrix4.getScale(this.modelMatrix, boxDimensions);
      Matrix4.fromScale(boxDimensions, scaleMatrix);
      Plane.transform(planeLocal, scaleMatrix, plane);
      setPlaneDimensions(boxDimensions, normalAxis, planeDimensions);
    };
    const side: Side = new Entity({
      position: new CallbackProperty(() => position, false) as any,
      plane: {
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
    const scratchMoveVectorWc = new Cartesian3();
    const scratchMoveVectorLc = new Cartesian3();
    const scratchPreviousPosition = new Cartesian3();
    const scratchEndPosition = new Cartesian3();
    const scratchTranslation = new Cartesian3();
    const scratchTranslationMatrix = new Matrix4();

    /**
     * Moves the box when dragging a side.
     *  - When dragging the top or bottom sides, we move the box up or down along the z-axis.
     *  - When dragging any other sides we move the box along the globe surface.
     */
    const moveBoxOnDragSide = (mouseMove: MouseMove) => {
      const moveUpDown = axis === Axis.Z;
      let translation = scratchTranslation;

      // Get the move direction in world coordinates
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
          position,
          direction,
          mouseMove
        );
        // Get the direction and magnitude of the move in world-coordinates
        const moveVectorWc = Cartesian3.multiplyByScalar(
          direction,
          moveAmount,
          scratchMoveVectorWc
        );
        // Get the direction and magnitude of the move in local-coordinates
        const moveVectorLc = Matrix4.multiplyByPointAsVector(
          this.inverseWorldTransform,
          moveVectorWc,
          scratchMoveVectorLc
        );

        translation = Cartesian3.clone(moveVectorLc, translation);
      } else {
        //Move along the globe surface when dragging any other side
        const previousPosition = screenToGlobePosition(
          scene,
          mouseMove.startPosition,
          scratchPreviousPosition
        );
        const endPosition = screenToGlobePosition(
          scene,
          mouseMove.endPosition,
          scratchEndPosition
        );
        if (!previousPosition || !endPosition) {
          return;
        }
        // Previous position in local coordinates
        const previousLc = Matrix4.multiplyByPoint(
          this.inverseWorldTransform,
          previousPosition,
          scratchPreviousPosition
        );
        // End position in local coordinates
        const endLc = Matrix4.multiplyByPoint(
          this.inverseWorldTransform,
          endPosition,
          scratchEndPosition
        );
        translation = Cartesian3.subtract(endLc, previousLc, translation);
        // Zero height movement
        translation.z = 0;
      }

      // Update box position and fire change event
      Matrix4.multiply(
        Matrix4.fromTranslation(translation, scratchTranslationMatrix),
        this.localTransform,
        this.localTransform
      );
      this.updateBox();
      this.onChange?.({
        isFinished: false,
        modelMatrix: this.modelMatrix
      });
    };

    const highlightSide = () => {
      isHighlighted = true;
    };

    const unHighlightSide = () => {
      isHighlighted = false;
    };

    const highlightAllSides = () =>
      this.sides.forEach(side => side.highlight());
    const unHighlightAllSides = () =>
      this.sides.forEach(side => side.unHighlight());

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
      unHighlightAllSides();
      setCanvasCursor(scene, "auto");
      this.onChange?.({ modelMatrix: this.modelMatrix, isFinished: true });
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
    update();
    return side;
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

    const scalePoint: ScalePoint = new Entity({
      position: new CallbackProperty(() => position, false) as any,
      model: {
        uri: require("file-loader!../../wwwroot/models/Box.glb"),
        minimumPixelSize: 12,
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
      this.onChange?.({ modelMatrix: this.modelMatrix, isFinished: true });
      setCanvasCursor(scene, "auto");
    };

    const onMouseOut = () => {
      scalePoint.axisLine.show = false;
      unHighlightScalePoint();
      setCanvasCursor(scene, "auto");
    };

    const scratchOppositePosition = new Cartesian3();
    const scratchAxisVectorWc = new Cartesian3();
    const scratchMoveDirection = new Cartesian3();
    const scratchScaleVectorWc = new Cartesian3();
    const scratchScaleVectorLc = new Cartesian3();
    const scratchScaleStep = new Cartesian3();
    const scratchCurrentScale = new Cartesian3();
    const scratchNewScale = new Cartesian3();
    const scratchTranslationStep = new Cartesian3();
    const scratchTranslationMatrix = new Matrix4();

    /**
     * Scales the box proportional to the mouse move when dragging the scale point.
     * Scaling occurs along the axis connecting the opposite scaling point.
     * Additionally we make sure:
     *   - That scaling also keeps opposite side of the box stationary.
     *   - The box does not get smaller than 20px on any side at the current zoom level.
     */
    const scaleOnDrag = (mouseMove: MouseMove) => {
      // Find the direction to scale in
      const oppositePosition = scalePoint.oppositeScalePoint.position.getValue(
        JulianDate.now(),
        scratchOppositePosition
      );
      const axisVectorWc = Cartesian3.subtract(
        position,
        oppositePosition,
        scratchAxisVectorWc
      );
      const length = Cartesian3.magnitude(axisVectorWc);
      const scaleDirection = Cartesian3.normalize(
        axisVectorWc,
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

      // Now we need to convert the scaleAmount in world space to a scale step
      // along xyz in local space (not sure if there is an easier way of doing this.)

      // 1. Multiply by axis to get a scale vector in world space
      const scaleVectorWc = Cartesian3.multiplyByScalar(
        axisVectorWc,
        scaleAmount,
        scratchScaleVectorWc
      );

      // 2. The same scale vector in local space
      const scaleVectorLc = Matrix4.multiplyByPointAsVector(
        this.inverseWorldTransform,
        scaleVectorWc,
        scratchScaleVectorLc
      );

      // 3. scaleStep should be independent of the axis direction.
      //    It should be positive when scaling up and negative when scaling down
      //    To get rid of the axis direction, we multiply it by the sign of the vector.
      const scaleStep = Cartesian3.multiplyComponents(
        scaleVectorLc,
        new Cartesian3(
          Math.sign(axisLocal.x),
          Math.sign(axisLocal.y),
          Math.sign(axisLocal.z)
        ),
        scratchScaleStep
      );

      // Now add the scale step to the current scale
      const currentScale = Matrix4.getScale(
        this.localTransform,
        scratchCurrentScale
      );
      const newScale = Cartesian3.add(scaleStep, currentScale, scratchNewScale);

      // Update box scale
      Matrix4.setScale(this.localTransform, newScale, this.localTransform);

      // Because want the opposite side of the box to remain stationary, we
      // push the box in the scaled direction by the half the scale amount.
      const translationStep = Cartesian3.multiplyByScalar(
        scaleVectorLc,
        1 / 2,
        scratchTranslationStep
      );

      // Update box position
      Matrix4.multiply(
        Matrix4.fromTranslation(translationStep, scratchTranslationMatrix),
        this.localTransform,
        this.localTransform
      );

      this.updateBox();
      this.onChange?.({ isFinished: false, modelMatrix: this.modelMatrix });
    };

    const adjacentSides = this.sides.filter(side => {
      const plane = side.plane.plane?.getValue(JulianDate.now());
      const isAdjacent = Cartesian3.dot(plane.normal, axisLocal) < 0;
      return isAdjacent;
    });

    const updateOnCameraChange = () => {
      isFacingCamera = adjacentSides.some(side => side.isFacingCamera);
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

    const update = () => {
      Matrix4.multiplyByPoint(this.modelMatrix, pointLocal, position);
    };

    scalePoint.onPick = onPick;
    scalePoint.onRelease = onRelease;
    scalePoint.onMouseOver = onMouseOver;
    scalePoint.onMouseOut = onMouseOut;
    scalePoint.onDrag = scaleOnDrag;
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
export function screenToGlobePosition(
  scene: Scene,
  position: Cartesian2,
  result: Cartesian3
): Cartesian3 | undefined {
  const pickRay = scene.camera.getPickRay(position);
  const globePosition = scene.globe.pick(pickRay, scene, result);
  return globePosition;
}

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

function setCanvasCursor(scene: Scene, cursorType: string) {
  scene.canvas.style.cursor = cursorType;
}
