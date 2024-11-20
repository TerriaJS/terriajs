import { action, makeObservable } from "mobx";
import ScreenSpaceEventHandler from "terriajs-cesium/Source/Core/ScreenSpaceEventHandler";
import Cesium from "../../../Models/Cesium";

type Movement =
  | "forward"
  | "backward"
  | "left"
  | "right"
  | "up"
  | "down"
  | "lookUp"
  | "lookDown"
  | "lookLeft"
  | "lookRight";

const KeyMap: Record<KeyboardEvent["code"], Movement> = {
  KeyW: "forward",
  KeyA: "left",
  KeyS: "backward",
  KeyD: "right",
  KeyZ: "up",
  KeyX: "down",
  KeyQ: "lookLeft",
  KeyE: "lookRight",
  KeyR: "lookUp",
  KeyF: "lookDown"
};

export default class MovementsController {
  // Current active movements
  activeMovements: Set<Movement> = new Set();

  constructor(readonly cesium: Cesium) {
    makeObservable(this);
  }

  get scene() {
    return this.cesium.scene;
  }

  get camera() {
    return this.scene.camera;
  }

  /**
   * moveAmount decides the motion speed.
   */
  get moveAmount() {
    const cameraHeight = this.camera.positionCartographic.height;
    const moveRate = cameraHeight / 100.0;
    return moveRate;
  }

  /**
   * Perform a move step
   */
  move(movement: Movement) {
    switch (movement) {
      case "forward":
        this.camera.moveForward(this.moveAmount);
        break;
      case "backward":
        this.camera.moveBackward(this.moveAmount);
        break;
      case "left":
        this.camera.moveLeft(this.moveAmount);
        break;
      case "right":
        this.camera.moveRight(this.moveAmount);
        break;
      case "up":
        this.camera.moveUp(this.moveAmount);
        break;
      case "down":
        this.camera.moveDown(this.moveAmount);
        break;
      case "lookUp":
        this.camera.lookUp();
        break;
      case "lookDown":
        this.camera.lookDown();
        break;
      case "lookLeft":
        this.camera.lookLeft();
        break;
      case "lookRight":
        this.camera.lookRight();
        break;
    }
  }

  animate() {
    if (this.activeMovements.size > 0) {
      [...this.activeMovements].forEach((movement) => this.move(movement));
    }
  }

  /**
   * Map keyboard events to movements
   */
  setupKeyMap(): () => void {
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

    document.addEventListener("keydown", excludeInputEvents(onKeyDown), true);
    document.addEventListener("keyup", excludeInputEvents(onKeyUp), true);

    const keyMapDestroyer = () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
    };

    return keyMapDestroyer;
  }

  /**
   * Map mouse events to movements
   */
  setupMouseMap(): () => void {
    const eventHandler = new ScreenSpaceEventHandler(this.scene.canvas);

    const mouseMapDestroyer = () => eventHandler.destroy();
    return mouseMapDestroyer;
  }

  /**
   * Animate on each clock tick
   */
  startAnimating() {
    const stopAnimating =
      this.cesium.cesiumWidget.clock.onTick.addEventListener(
        this.animate.bind(this)
      );
    return stopAnimating;
  }

  /**
   * Activates MovementsController
   *
   * 1. Disables default map interactions.
   * 2. Sets up keyboard, mouse & animation event handlers.
   *
   * @returns A function to de-activate the movements controller
   */
  @action
  activate(): () => void {
    // Disable other map controls
    this.scene.screenSpaceCameraController.enableTranslate = false;
    this.scene.screenSpaceCameraController.enableRotate = false;
    this.scene.screenSpaceCameraController.enableLook = false;
    this.scene.screenSpaceCameraController.enableTilt = false;
    this.scene.screenSpaceCameraController.enableZoom = false;
    this.cesium.isFeaturePickingPaused = true;

    const destroyKeyMap = this.setupKeyMap();
    const destroyMouseMap = this.setupMouseMap();
    const stopAnimating = this.startAnimating();

    const deactivate = action(() => {
      destroyKeyMap();
      destroyMouseMap();
      stopAnimating();

      const screenSpaceCameraController =
        this.scene.screenSpaceCameraController;
      // screenSpaceCameraController will be undefined if the cesium map is already destroyed
      if (screenSpaceCameraController !== undefined) {
        screenSpaceCameraController.enableTranslate = true;
        screenSpaceCameraController.enableRotate = true;
        screenSpaceCameraController.enableLook = true;
        screenSpaceCameraController.enableTilt = true;
        screenSpaceCameraController.enableZoom = true;
      }
      this.cesium.isFeaturePickingPaused = false;
    });

    return deactivate;
  }
}

// A regex matching input tag names
const inputNodeRe = /input|textarea|select/i;

function excludeInputEvents(
  handler: (ev: KeyboardEvent) => void
): (ev: KeyboardEvent) => void {
  return (ev) => {
    const target = ev.target;
    if (target !== null) {
      const nodeName = (target as any).nodeName;
      const isContentEditable = (target as any).getAttribute?.(
        "contenteditable"
      );
      if (isContentEditable || inputNodeRe.test(nodeName)) {
        return;
      }
    }
    handler(ev);
  };
}
