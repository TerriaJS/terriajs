import throttle from "lodash-es/throttle";
import { observable, onBecomeObserved, onBecomeUnobserved } from "mobx";
import ArcType from "terriajs-cesium/Source/Core/ArcType";
import Cartesian2 from "terriajs-cesium/Source/Core/Cartesian2";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Color from "terriajs-cesium/Source/Core/Color";
import Event from "terriajs-cesium/Source/Core/Event";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import Matrix4 from "terriajs-cesium/Source/Core/Matrix4";
import Plane from "terriajs-cesium/Source/Core/Plane";
import Ray from "terriajs-cesium/Source/Core/Ray";
import ScreenSpaceEventHandler from "terriajs-cesium/Source/Core/ScreenSpaceEventHandler";
import ScreenSpaceEventType from "terriajs-cesium/Source/Core/ScreenSpaceEventType";
import CallbackProperty from "terriajs-cesium/Source/DataSources/CallbackProperty";
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
  eventName: "move" | "scale";
  isFinished: boolean;
  modelMatrix: Matrix4;
};

export type ChangeEventHandler = (event: ChangeEvent) => void;

type MouseClick = { position: Cartesian2 };

type MouseMove = { startPosition: Cartesian2; endPosition: Cartesian2 };

type Updatable = { update: () => void };

type Interactable = {
  onMouseOver: (mouseMove: MouseMove) => void;
  onMouseOut: (mouseMove: MouseMove) => void;
  onPick: (click: MouseClick) => void;
  onRelease: (click: MouseClick) => void;
  onDrag: (mouseMove: MouseMove) => void;
};

type CameraAware = {
  updateOnCameraChange: () => void;
};

type Side = Entity & Updatable & Interactable & { plane: PlaneGraphics };

type ScalePoint = Entity &
  Updatable &
  Interactable &
  CameraAware & {
    position: PositionProperty;
    model: ModelGraphics;
    // ellipsoid: EllipsoidGraphics;
    oppositeScalePoint: ScalePoint;
    axisLine: Entity;
  };

type InteractionState =
  | { is: "none" }
  | { is: "picked"; entity: Entity & Interactable }
  | { is: "hovering"; entity: Entity & Interactable };

const SIDE_PLANES: Plane[] = [
  new Plane(new Cartesian3(0, 0, 1), 0.5),
  new Plane(new Cartesian3(0, 0, -1), 0.5),
  new Plane(new Cartesian3(0, 1, 0), 0.5),
  new Plane(new Cartesian3(0, -1, 0), 0.5),
  new Plane(new Cartesian3(1, 0, 0), 0.5),
  new Plane(new Cartesian3(-1, 0, 0), 0.5)
];

const SCALE_POINT_VECTORS = [
  new Cartesian3(0.5, 0.5, 0.5),
  new Cartesian3(0.5, -0.5, 0.5),
  new Cartesian3(-0.5, 0.5, 0.5),
  new Cartesian3(-0.5, -0.5, 0.5),
  new Cartesian3(0.5, 0.0, 0.0),
  new Cartesian3(0.0, 0.5, 0.0),
  new Cartesian3(0.0, 0.0, 0.5)
];

function isUpdatable(entity: Entity): entity is Entity & Updatable {
  return typeof (entity as any).update === "function";
}

function isInteractable(entity: Entity): entity is Entity & Interactable {
  return (
    typeof (entity as any).onPick === "function" &&
    typeof (entity as any).onRelease === "function" &&
    typeof (entity as any).onMouseOver === "function" &&
    typeof (entity as any).onMouseOut === "function"
  );
}

function isCameraAware(entity: Entity): entity is Entity & CameraAware {
  return typeof (entity as any).updateOnCameraChange === "function";
}

export default class BoxDrawing {
  static localSidePlanes = SIDE_PLANES;

  @observable dataSource: CustomDataSource;

  private readonly modelMatrix: Matrix4 = Matrix4.IDENTITY.clone();
  private readonly localTransform: Matrix4 = Matrix4.IDENTITY.clone();
  private readonly transform: Matrix4 = Matrix4.IDENTITY.clone();
  private readonly inverseTransform: Matrix4 = Matrix4.IDENTITY.clone();

  private scene: Scene;
  private cameraEventDisposer?: Event.RemoveCallback;
  private eventHandlerDisposer?: () => void;

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
          value === true
            ? this.startBoxInteraction()
            : this.stopBoxInteraction();
        }
        return Reflect.set(target, prop, value);
      }
    });

    this.setTransform(transform);
    this.drawBox(this.dataSource);

    onBecomeObserved(this, "dataSource", () => this.startBoxInteraction());
    onBecomeUnobserved(this, "dataSource", () => this.stopBoxInteraction());
  }

  startBoxInteraction() {
    if (this.eventHandlerDisposer) {
      return;
    }

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

    this.eventHandlerDisposer = () => {
      eventHandler.destroy();
      scene.canvas.removeEventListener("mouseout", onMouseOutCanvas);
    };

    // const onCameraChange = () => {
    //   this.dataSource.entities.values.forEach(entity => {
    //     if (isCameraAware(entity)) {
    //       entity.updateOnCameraChange();
    //     }
    //   });
    // };

    // this.cameraEventDisposer?.();
    // this.cameraEventDisposer = scene.camera.changed.addEventListener(
    //   onCameraChange
    // );
  }

  stopBoxInteraction() {
    this.eventHandlerDisposer?.();
    this.eventHandlerDisposer = undefined;
  }

  setTransform(transform: Matrix4) {
    Matrix4.clone(transform, this.transform);
    Matrix4.inverse(this.transform, this.inverseTransform);
    Matrix4.clone(Matrix4.IDENTITY, this.localTransform);
    this.updateBox();
  }

  updateBox() {
    Matrix4.multiply(
      // box gap?
      // Matrix4.multiply(
      //   this.transform,
      //   Matrix4.fromScale(new Cartesian3(1.5, 1.5, 1.5)),
      //   new Matrix4()
      // ),
      this.transform,
      this.localTransform,
      this.modelMatrix
    );

    this.dataSource.entities.values.forEach(entity => {
      if (isUpdatable(entity)) entity.update();
    });
  }

  drawBox(dataSource: CustomDataSource) {
    this.drawSides(dataSource);
    this.drawScalePoints(dataSource);
  }

  drawSides(dataSource: CustomDataSource) {
    const scene = this.scene;
    const sides: Side[] = [];

    const highlightSide = (side: Side) => {
      side.plane.fill = true as any;
      side.plane.material = Color.CYAN.withAlpha(0.1) as any;
      side.plane.outline = true as any;
      side.plane.outlineColor = Color.WHITE as any;
      side.plane.outlineWidth = 1 as any;
    };
    const highlightAllSides = () => sides.forEach(highlightSide);

    const unHighlightSide = (side: Side) => {
      side.plane.fill = true as any;
      side.plane.material = Color.WHITE.withAlpha(0.1) as any;
      side.plane.outline = true as any;
      side.plane.outlineColor = Color.WHITE as any;
      side.plane.outlineWidth = 1 as any;
    };
    const unHighlightAllSides = () => sides.forEach(unHighlightSide);

    const onMouseOver = (side: Side, mouseMove: MouseMove) => {
      highlightAllSides();
      setCanvasCursor(scene, "grab");
    };

    const onMouseOut = (side: Side, mouseMove: MouseMove) => {
      unHighlightAllSides();
      setCanvasCursor(scene, "auto");
    };

    const onPick = (side: Side, click: MouseClick) => {
      highlightAllSides();
      setCanvasCursor(scene, "grabbing");
    };

    const onRelease = (side: Side, click: MouseClick) => {
      unHighlightAllSides();
      setCanvasCursor(scene, "auto");
      this.onChange?.({ modelMatrix: this.modelMatrix, isFinished: true });
    };

    const addPlane = (localPlane: Plane) => {
      const position = new Cartesian3();
      const plane = new Plane(new Cartesian3(), 0);
      const planeDimensions = new Cartesian3();
      const boxDimensions = new Cartesian3();
      const scaleMatrix = new Matrix4();
      const normalAxis = localPlane.normal.x
        ? Axis.X
        : localPlane.normal.y
        ? Axis.Y
        : Axis.Z;

      const update = () => {
        Matrix4.getTranslation(this.modelMatrix, position);
        Matrix4.getScale(this.modelMatrix, boxDimensions);
        Matrix4.fromScale(boxDimensions, scaleMatrix);
        Plane.transform(localPlane, scaleMatrix, plane);
        setPlaneDimensions(boxDimensions, normalAxis, planeDimensions);
      };
      const side: Side = dataSource.entities.add({
        position: new CallbackProperty(() => position, false) as any,
        plane: {
          plane: new CallbackProperty(() => plane, false),
          dimensions: new CallbackProperty(() => planeDimensions, false),
          fill: true,
          material: Color.WHITE.withAlpha(0.1),
          // material: new StripeMaterialProperty({
          //   //evenColor: Color.WHITE.withAlpha(0.2),
          //   evenColor: Color.fromCssColorString("#f2eae3").withAlpha(0.2),
          //   oddColor: Color.BLACK.withAlpha(0.2),
          //   repeat: 10
          // }),
          outline: true,
          outlineColor: Color.WHITE,
          outlineWidth: 1
        }
      }) as Side;

      const axis = localPlane.normal.x
        ? Axis.X
        : localPlane.normal.y
        ? Axis.Y
        : Axis.Z;

      const onDragSide = (mouseMove: MouseMove) => {
        const moveUpDown = axis === Axis.Z;
        let translation = Cartesian3.ZERO.clone();
        const direction = Cartesian3.normalize(
          Matrix4.multiplyByPointAsVector(
            this.modelMatrix,
            plane.normal,
            new Cartesian3()
          ),
          new Cartesian3()
        );

        if (moveUpDown) {
          const { moveAmount: pixelMoveAmount } = computeMoveAmount(
            scene,
            position,
            direction,
            1,
            mouseMove
          );
          const moveVectorWc = Cartesian3.multiplyByScalar(
            direction,
            pixelMoveAmount,
            new Cartesian3()
          );
          const moveVectorLc = Matrix4.multiplyByPointAsVector(
            this.inverseTransform,
            moveVectorWc,
            new Cartesian3()
          );

          translation = Cartesian3.clone(moveVectorLc, translation);
        } else {
          // const axisName = axis === Axis.X ? "x" : "y";
          // const crossAxisName = axis === Axis.X ? "y" : "x";
          // const { moveAmount } = computeMoveAmount(
          //   scene,
          //   position,
          //   direction,
          //   1,
          //   mouseMove
          // );
          // const moveVectorWc = Cartesian3.multiplyByScalar(
          //   direction,
          //   moveAmount,
          //   new Cartesian3()
          // );
          // const moveVectorLc = Matrix4.multiplyByPointAsVector(
          //   this.inverseTransform,
          //   moveVectorWc,
          //   new Cartesian3()
          // );
          // Cartesian3.add(translation, moveVectorLc, translation);
          // const axis = side.plane.plane?.getValue(JulianDate.now()).normal;
          // const crossSide = sides.find(
          //   side =>
          //     Cartesian3.cross(
          //       axis,
          //       side.plane.plane?.getValue(JulianDate.now()).normal,
          //       new Cartesian3()
          //     ).z !== 0
          // );
          // if (crossSide) {
          //   const crossPlane = crossSide.plane.plane?.getValue(
          //     JulianDate.now()
          //   );
          //   const crossPosition = side.position?.getValue(JulianDate.now());
          //   const crossDirection = Cartesian3.normalize(
          //     Matrix4.multiplyByPointAsVector(
          //       this.modelMatrix,
          //       crossPlane.normal,
          //       new Cartesian3()
          //     ),
          //     new Cartesian3()
          //   );
          //   const { moveAmount: crossMoveAmount } = computeMoveAmount(
          //     scene,
          //     crossPosition!,
          //     crossDirection,
          //     1,
          //     mouseMove
          //   );
          //   const crossMoveVectorWc = Cartesian3.multiplyByScalar(
          //     crossDirection,
          //     crossMoveAmount,
          //     new Cartesian3()
          //   );
          //   const crossMoveVectorLc = Matrix4.multiplyByPointAsVector(
          //     this.inverseTransform,
          //     crossMoveVectorWc,
          //     new Cartesian3()
          //   );
          //   Cartesian3.add(translation, crossMoveVectorLc, translation);
          // }
          //Move along the globe surface when dragging any other side
          const previousPosition = screenToGlobePosition(
            scene,
            mouseMove.startPosition,
            new Cartesian3()
          );
          const endPosition = screenToGlobePosition(
            scene,
            mouseMove.endPosition,
            new Cartesian3()
          );
          if (!previousPosition || !endPosition) {
            return;
          }
          // Previous position in local coordinates
          const previousLc = Matrix4.multiplyByPoint(
            this.inverseTransform,
            previousPosition,
            new Cartesian3()
          );
          // End position in local coordinates
          const endLc = Matrix4.multiplyByPoint(
            this.inverseTransform,
            endPosition,
            new Cartesian3()
          );
          translation = Cartesian3.subtract(
            endLc,
            previousLc,
            new Cartesian3()
          );
          translation.z = 0;
        }

        Matrix4.multiply(
          Matrix4.fromTranslation(translation, new Matrix4()),
          this.localTransform,
          this.localTransform
        );
        this.updateBox();
        this.onChange?.({
          isFinished: false,
          modelMatrix: this.modelMatrix
        });
      };

      side.onMouseOver = mouseMove => onMouseOver(side, mouseMove);
      side.onMouseOut = mouseMove => onMouseOut(side, mouseMove);
      side.onPick = mouseClick => onPick(side, mouseClick);
      side.onDrag = mouseMove => onDragSide(mouseMove);
      side.onRelease = mouseClick => onRelease(side, mouseClick);
      side.update = update;
      update();
      sides.push(side);
    };

    SIDE_PLANES.map(addPlane);
  }

  drawScalePoints(dataSource: CustomDataSource) {
    const scene = this.scene;
    let isPointPickable = true;

    const highlightScalePoint = (scalePoint: ScalePoint) => {
      const model = scalePoint.model;
      model.silhouetteColor = Color.YELLOW as any;
      model.silhouetteSize = 1 as any;
    };

    const unHighlightScalePoint = (scalePoint: ScalePoint) => {
      const model = scalePoint.model;
      model.silhouetteColor = undefined;
      model.silhouetteSize = 0 as any;
    };

    const dimScalePoint = (scalePoint: ScalePoint) => {
      const model = scalePoint.model;
      model.colorBlendMode = ColorBlendMode.MIX as any;
    };

    const brightenScalePoint = (scalePoint: ScalePoint) => {
      const model = scalePoint.model;
      model.colorBlendMode = ColorBlendMode.HIGHLIGHT as any;
    };

    const addScalePoint = (localPoint: Cartesian3) => {
      const position = new Cartesian3();
      const update = () => {
        Matrix4.multiplyByPoint(this.modelMatrix, localPoint, position);
      };
      const scalePoint: ScalePoint = dataSource.entities.add({
        position: new CallbackProperty(() => position, false) as any,
        // point: {
        //   show: false,
        //   color: Color.YELLOW,
        //   Size: 10
        // },
        // ellipsoid: {
        //   show: false,
        //   radii: new Cartesian3(5, 5, 5),
        //   fill: true,
        //   material: Color.LIME
        // },
        model: {
          uri: require("file-loader!../../wwwroot/models/Box.glb"),
          minimumPixelSize: 12,
          shadows: ShadowMode.DISABLED
        }
      }) as ScalePoint;

      const axisLocal = Cartesian3.normalize(localPoint, new Cartesian3());
      const xDot = Math.abs(Cartesian3.dot(new Cartesian3(1, 0, 0), axisLocal));
      const yDot = Math.abs(Cartesian3.dot(new Cartesian3(0, 1, 0), axisLocal));
      const zDot = Math.abs(Cartesian3.dot(new Cartesian3(0, 0, 1), axisLocal));
      const cursorDirection =
        xDot === 1 || yDot === 1
          ? "ew-resize"
          : zDot === 1
          ? "ns-resize"
          : "nesw-resize";

      const onMouseOver = (mouseMove: MouseMove) => {
        scalePoint.axisLine.show = true;
        highlightScalePoint(scalePoint);
        setCanvasCursor(scene, cursorDirection);
      };

      const onPick = (click: MouseClick) => {
        scalePoint.axisLine.show = true;
        highlightScalePoint(scalePoint);
        setCanvasCursor(scene, cursorDirection);
      };

      const onRelease = (click: MouseClick) => {
        scalePoint.axisLine.show = false;
        unHighlightScalePoint(scalePoint);
        this.onChange?.({ modelMatrix: this.modelMatrix, isFinished: true });
        setCanvasCursor(scene, "auto");
      };

      const onMouseOut = (mouseMove: MouseMove) => {
        scalePoint.axisLine.show = false;
        unHighlightScalePoint(scalePoint);
        setCanvasCursor(scene, "auto");
      };

      const onDrag = (mouseMove: MouseMove) => {
        // TODO: Try to get position from closure
        const position = scalePoint.position.getValue(JulianDate.now());
        const oppositePosition = scalePoint.oppositeScalePoint.position.getValue(
          JulianDate.now()
        );
        const axisVector = Cartesian3.subtract(
          position,
          oppositePosition,
          new Cartesian3()
        );
        const length = Cartesian3.magnitude(axisVector);
        const moveAxis = Cartesian3.normalize(axisVector, new Cartesian3());

        // computeMoveAmount gives the pixels moved in the direction of the vector
        // it is negative when moving oppposite to the vector
        const { moveAmount, depthPixels } = computeMoveAmount(
          this.scene,
          position,
          moveAxis,
          1, //depth
          mouseMove
        );

        const scaleAmount = moveAmount / length;

        if (scaleAmount < 0) {
          const pixelLengthAfterScaling =
            depthPixels * length + depthPixels * length * scaleAmount;
          const isDiagonal = axisLocal.x && axisLocal.y && axisLocal.y;
          const pixelSideLengthAfterScaling = isDiagonal
            ? pixelLengthAfterScaling / Math.sqrt(2)
            : pixelLengthAfterScaling;
          if (pixelSideLengthAfterScaling < 20) {
            return;
          }
        }

        // Multiply by vector to convert to move amount in world space
        // This takes the direction of the vector
        const scaleVectorWc = Cartesian3.multiplyByScalar(
          axisVector,
          scaleAmount,
          new Cartesian3()
        );

        const scaleVectorLc = Matrix4.multiplyByPointAsVector(
          this.inverseTransform,
          scaleVectorWc,
          new Cartesian3()
        );

        // This step removes the direction of the vector from the scale step
        const scaleStep = Cartesian3.multiplyComponents(
          scaleVectorLc,
          // just the sign because we don't the values to be different from move step
          new Cartesian3(
            Math.sign(axisLocal.x),
            Math.sign(axisLocal.y),
            Math.sign(axisLocal.z)
          ),
          //axisLocal,
          new Cartesian3()
        );

        const currentScale = Matrix4.getScale(
          this.localTransform,
          new Cartesian3()
        );
        const newScale = Cartesian3.add(
          scaleStep,
          currentScale,
          new Cartesian3()
        );

        Matrix4.setScale(this.localTransform, newScale, this.localTransform);

        const translationStep = Cartesian3.multiplyByScalar(
          scaleVectorLc,
          1 / 2,
          new Cartesian3()
        );

        Matrix4.multiply(
          Matrix4.fromTranslation(translationStep, new Matrix4()),
          this.localTransform,
          this.localTransform
        );

        this.updateBox();
        this.onChange?.({ isFinished: false, modelMatrix: this.modelMatrix });
      };

      const updateOnCameraChange = () => {
        const screenPosition = scene.cartesianToCanvasCoordinates(
          position,
          new Cartesian2()
        );
        const pick = scene.pick(screenPosition);
        const isPointPickableNow = pick?.id === scalePoint;
        if (isPointPickableNow !== isPointPickable) {
          isPointPickable
            ? brightenScalePoint(scalePoint)
            : dimScalePoint(scalePoint);
        }
        isPointPickable = isPointPickableNow;
        if (axisLocal.y === 1) {
          console.log(
            "**cam**",
            axisLocal,
            isPointPickable,
            position,
            screenPosition,
            pick?.id
          );
        }
      };

      scalePoint.onPick = onPick;
      scalePoint.onRelease = onRelease;
      scalePoint.onMouseOver = onMouseOver;
      scalePoint.onMouseOut = onMouseOut;
      scalePoint.onDrag = onDrag;
      scalePoint.update = update;
      //scalePoint.updateOnCameraChange = debounce(updateOnCameraChange, 100);
      update();
      return scalePoint;
    };

    const addScaleAxis = (scalePoint1: ScalePoint, scalePoint2: ScalePoint) => {
      const position1 = scalePoint1.position?.getValue(JulianDate.now())!;
      const position2 = scalePoint2.position?.getValue(JulianDate.now())!;
      const scaleAxis = dataSource.entities.add({
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
    };

    SCALE_POINT_VECTORS.forEach(vector => {
      const localPoint1 = vector;
      const localPoint2 = Cartesian3.multiplyByScalar(
        vector,
        -1,
        new Cartesian3()
      );
      const scalePoint1 = addScalePoint(localPoint1);
      const scalePoint2 = addScalePoint(localPoint2);
      scalePoint1.oppositeScalePoint = scalePoint2;
      scalePoint2.oppositeScalePoint = scalePoint1;
      const axisLine = addScaleAxis(scalePoint1, scalePoint2);
      scalePoint1.axisLine = axisLine;
      scalePoint2.axisLine = axisLine;
    });
  }
}

function computeMoveAmount(
  scene: Scene,
  position: Cartesian3,
  direction: Cartesian3,
  depth: number,
  movement: MouseMove
) {
  const mouseVector2d = Cartesian2.subtract(
    movement.endPosition,
    movement.startPosition,
    new Cartesian2()
  );

  const ray = new Ray(position, direction);
  const nearPoint2d = scene.cartesianToCanvasCoordinates(
    Ray.getPoint(ray, 0),
    new Cartesian2()
  );

  const farPoint2d = scene.cartesianToCanvasCoordinates(
    Ray.getPoint(ray, depth),
    new Cartesian2()
  );
  const screenVector2d = Cartesian2.subtract(
    farPoint2d,
    nearPoint2d,
    new Cartesian2()
  );

  const screenNormal2d = Cartesian2.normalize(screenVector2d, new Cartesian2());
  const moveAmountPixels = Cartesian2.dot(mouseVector2d, screenNormal2d);
  const depthPixels = Cartesian2.magnitude(screenVector2d);
  const moveAmount = moveAmountPixels / depthPixels;
  return { moveAmount, depthPixels };
}

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
