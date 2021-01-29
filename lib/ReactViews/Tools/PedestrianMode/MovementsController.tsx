import Cartesian2 from "terriajs-cesium/Source/Core/Cartesian2";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import sampleTerrainMostDetailed from "terriajs-cesium/Source/Core/sampleTerrainMostDetailed";
import ScreenSpaceEventHandler from "terriajs-cesium/Source/Core/ScreenSpaceEventHandler";
import ScreenSpaceEventType from "terriajs-cesium/Source/Core/ScreenSpaceEventType";
import Cesium from "../../../Models/Cesium";

type Movements =
  | "forward"
  | "backward"
  | "left"
  | "right"
  | "up"
  | "down"
  | "look";

const KeyMap: Record<KeyboardEvent["code"], Movements> = {
  KeyW: "forward",
  KeyA: "left",
  KeyS: "backward",
  KeyD: "right",
  Space: "up",
  ShiftLeft: "down",
  ShiftRight: "down"
};

export default class MovementsController {
  private destroyEventHandlers?: () => void;
  private activeMovements = new Set<Movements>();

  private startMousePosition?: Cartesian2;
  private currentMousePosition?: Cartesian2;

  constructor(readonly cesium: Cesium, readonly onMove: () => void) {}

  get scene() {
    return this.cesium.scene;
  }

  get moveRate() {
    const height = this.scene.camera.positionCartographic.height;
    const moveRate = Math.max(0.1, height / 30);
    return moveRate;
  }

  moveForward() {
    const camera = this.scene.camera;
    const direction = projectVectorToSurface(
      camera.direction,
      camera.position,
      this.scene.globe.ellipsoid
    );
    camera.move(direction, this.moveRate);
  }

  moveBackward() {
    const camera = this.scene.camera;
    const direction = projectVectorToSurface(
      camera.direction,
      camera.position,
      this.scene.globe.ellipsoid
    );
    camera.move(direction, -this.moveRate);
  }

  moveLeft() {
    const camera = this.scene.camera;
    const direction = projectVectorToSurface(
      camera.right,
      camera.position,
      this.scene.globe.ellipsoid
    );
    camera.move(direction, -this.moveRate / 2);
  }

  moveRight() {
    const camera = this.scene.camera;
    const direction = projectVectorToSurface(
      camera.right,
      camera.position,
      this.scene.globe.ellipsoid
    );
    camera.move(direction, this.moveRate / 2);
  }

  moveUp() {
    const camera = this.scene.camera;
    camera.moveUp(this.moveRate);
  }

  moveDown() {
    const camera = this.scene.camera;
    camera.moveDown(this.moveRate);
  }

  look() {
    if (
      this.startMousePosition === undefined ||
      this.currentMousePosition === undefined
    )
      return;

    const startMousePosition = this.startMousePosition;
    const currentMousePosition = this.currentMousePosition;

    const camera = this.scene.camera;
    const canvas = this.scene.canvas;
    const width = canvas.width;
    const height = canvas.height;
    const x = (currentMousePosition.x - startMousePosition.x) / width;
    const y = (currentMousePosition.y - startMousePosition.y) / height;
    const lookFactor = 0.1;

    const ellipsoid = this.scene.globe.ellipsoid;
    const surfaceNormal = ellipsoid.geodeticSurfaceNormal(
      camera.position,
      new Cartesian3()
    );

    const right = projectVectorToSurface(
      camera.right,
      camera.position,
      this.scene.globe.ellipsoid
    );

    camera.look(surfaceNormal, x * lookFactor);
    camera.look(right, y * lookFactor);
  }

  /**
   * Try to resurface if the camera goes underground.
   */
  resurfaceIfUnderground() {
    const camera = this.scene.camera;
    sampleTerrainMostDetailed(this.scene.terrainProvider, [
      camera.positionCartographic.clone()
    ]).then(([terrainPosition]) => {
      const heightFromTerrain =
        camera.positionCartographic.height - terrainPosition.height;
      if (heightFromTerrain < 1) {
        const surfaceOffset = Cartesian3.multiplyByScalar(
          camera.up,
          1 - heightFromTerrain,
          new Cartesian3()
        );
        Cartesian3.add(camera.position, surfaceOffset, camera.position);
      }
    });
  }

  animate() {
    this.activeMovements.forEach(m => {
      switch (m) {
        case "forward":
          this.moveForward();
          break;
        case "backward":
          this.moveBackward();
          break;
        case "left":
          this.moveLeft();
          break;
        case "right":
          this.moveRight();
          break;
        case "up":
          this.moveUp();
          break;
        case "down":
          this.moveDown();
          break;
        case "look":
          this.look();
          break;
        default:
          return;
      }
      this.onMove();
      this.resurfaceIfUnderground();
    });
  }

  setupKeyMap() {
    const onKeyDown = (ev: KeyboardEvent) => {
      if (
        // do not match if any modifiers are pressed so that we do not hijack window shortcuts.
        ev.ctrlKey === false &&
        ev.altKey === false &&
        KeyMap[ev.code] !== undefined
      )
        this.activeMovements.add(KeyMap[ev.code]);
    };

    const onKeyUp = (ev: KeyboardEvent) => {
      if (KeyMap[ev.code] !== undefined)
        this.activeMovements.delete(KeyMap[ev.code]);
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);

    const keyMapDestroyer = () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
    };

    return keyMapDestroyer;
  }

  setupMouseMap() {
    const eventHandler = new ScreenSpaceEventHandler(this.scene.canvas);

    eventHandler.setInputAction(click => {
      this.currentMousePosition = this.startMousePosition = click.position.clone();
      this.activeMovements.add("look");
    }, ScreenSpaceEventType.LEFT_DOWN);

    eventHandler.setInputAction(movement => {
      this.currentMousePosition = movement.endPosition.clone();
    }, ScreenSpaceEventType.MOUSE_MOVE);

    eventHandler.setInputAction(() => {
      this.activeMovements.delete("look");
      this.currentMousePosition = this.startMousePosition = undefined;
    }, ScreenSpaceEventType.LEFT_UP);

    const mouseMapDestroyer = () => eventHandler.destroy();
    return mouseMapDestroyer;
  }

  attach() {
    // Disable other map controls
    this.scene.screenSpaceCameraController.enableTranslate = false;
    this.scene.screenSpaceCameraController.enableRotate = false;
    this.scene.screenSpaceCameraController.enableLook = false;
    this.scene.screenSpaceCameraController.enableTilt = false;
    this.scene.screenSpaceCameraController.enableZoom = false;

    const destroyKeyMap = this.setupKeyMap();
    const destroyMouseMap = this.setupMouseMap();
    const destroyAnimation = this.cesium.cesiumWidget.clock.onTick.addEventListener(
      this.animate.bind(this)
    );

    this.destroyEventHandlers = () => {
      destroyKeyMap();
      destroyMouseMap();
      destroyAnimation();
    };
  }

  detach() {
    this.destroyEventHandlers?.();
    const screenSpaceCameraController = this.scene.screenSpaceCameraController;
    // screenSpaceCameraController will be undefined if the cesium map is already destroyed
    if (screenSpaceCameraController !== undefined) {
      screenSpaceCameraController.enableTranslate = true;
      screenSpaceCameraController.enableRotate = true;
      screenSpaceCameraController.enableLook = true;
      screenSpaceCameraController.enableTilt = true;
      screenSpaceCameraController.enableZoom = true;
    }
  }
}

/**
 * Projects the {@vector} to the surface plane containing {@position}
 *
 * @param vector The input vector to project
 * @param position The position used to determine the surface plane
 * @param ellipsoid The ellipsoid used to compute the surface plane
 * @returns The projection of {@vector} on the surface plane at the given {@position}
 */
function projectVectorToSurface(
  vector: Cartesian3,
  position: Cartesian3,
  ellipsoid: Ellipsoid
) {
  const surfaceNormal = ellipsoid.geodeticSurfaceNormal(
    position,
    new Cartesian3()
  );
  const magnitudeOfProjectionOnSurfaceNormal = Cartesian3.dot(
    vector,
    surfaceNormal
  );
  const projectionOnSurfaceNormal = Cartesian3.multiplyByScalar(
    surfaceNormal,
    magnitudeOfProjectionOnSurfaceNormal,
    new Cartesian3()
  );
  const projectionOnSurface = Cartesian3.subtract(
    vector,
    projectionOnSurfaceNormal,
    new Cartesian3()
  );
  return projectionOnSurface;
}
