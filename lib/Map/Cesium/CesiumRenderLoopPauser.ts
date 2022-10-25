import defined from "terriajs-cesium/Source/Core/defined";
import destroyObject from "terriajs-cesium/Source/Core/destroyObject";
import CesiumEvent from "terriajs-cesium/Source/Core/Event";
import getTimestamp from "terriajs-cesium/Source/Core/getTimestamp";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import Matrix4 from "terriajs-cesium/Source/Core/Matrix4";
import TaskProcessor from "terriajs-cesium/Source/Core/TaskProcessor";
import CesiumWidget from "terriajs-cesium/Source/Widgets/CesiumWidget/CesiumWidget";
import loadWithXhr from "../../Core/loadWithXhr";

export default class CesiumRenderLoopPauser {
  /**
   * Gets or sets whether to output info to the console when starting and stopping rendering loop.
   * @type {boolean}
   */
  verboseRendering = false;

  /**
   * Gets or sets whether the render loop is currently paused.
   * @type {boolean}
   */
  get renderingIsPaused(): boolean {
    return !this.cesiumWidget.useDefaultRenderLoop;
  }
  set renderingIsPaused(value: boolean) {
    this.cesiumWidget.useDefaultRenderLoop = !value;
  }

  private _boundNotifyRepaintRequired: (() => void) | undefined;
  private _wheelEvent: string | undefined;
  private _removePostRenderListener: CesiumEvent.RemoveCallback | undefined;
  private _lastCameraViewMatrix = new Matrix4();
  private _lastCameraMoveTime: number = -Number.MAX_VALUE;

  private _originalLoadWithXhr: any;
  private _originalScheduleTask: any;

  constructor(
    readonly cesiumWidget: CesiumWidget,
    readonly postRenderCallback: () => void
  ) {
    const scene = this.cesiumWidget.scene;
    this._removePostRenderListener = scene.postRender.addEventListener(
      this.postRender.bind(this)
    );

    this._boundNotifyRepaintRequired = this.notifyRepaintRequired.bind(this);
    var canvas = this.cesiumWidget.canvas;
    canvas.addEventListener(
      "mousemove",
      this._boundNotifyRepaintRequired,
      false
    );
    canvas.addEventListener(
      "mousedown",
      this._boundNotifyRepaintRequired,
      false
    );
    canvas.addEventListener("mouseup", this._boundNotifyRepaintRequired, false);
    canvas.addEventListener(
      "touchstart",
      this._boundNotifyRepaintRequired,
      false
    );
    canvas.addEventListener(
      "touchend",
      this._boundNotifyRepaintRequired,
      false
    );
    canvas.addEventListener(
      "touchmove",
      this._boundNotifyRepaintRequired,
      false
    );

    if (defined(globalThis.PointerEvent)) {
      canvas.addEventListener(
        "pointerdown",
        this._boundNotifyRepaintRequired,
        false
      );
      canvas.addEventListener(
        "pointerup",
        this._boundNotifyRepaintRequired,
        false
      );
      canvas.addEventListener(
        "pointermove",
        this._boundNotifyRepaintRequired,
        false
      );
    }

    // Detect available wheel event
    this._wheelEvent = undefined;
    if ("onwheel" in canvas) {
      // spec event type
      this._wheelEvent = "wheel";
    } else if (defined(globalThis.onmousewheel)) {
      // legacy event type
      this._wheelEvent = "mousewheel";
    } else {
      // older Firefox
      this._wheelEvent = "DOMMouseScroll";
    }

    canvas.addEventListener(
      this._wheelEvent,
      this._boundNotifyRepaintRequired,
      false
    );

    window.addEventListener("resize", this._boundNotifyRepaintRequired, false);

    // keyup & keydown events are used by the pedestrian mode
    document.addEventListener(
      "keydown",
      this._boundNotifyRepaintRequired,
      false
    );
    document.addEventListener("keyup", this._boundNotifyRepaintRequired, false);

    // // Hacky way to force a repaint when an async load request completes
    const anyLoadWithXhr: any = loadWithXhr;
    this._originalLoadWithXhr = anyLoadWithXhr.load;
    anyLoadWithXhr.load = (
      url: any,
      responseType: any,
      method: any,
      data: any,
      headers: any,
      deferred: any,
      overrideMimeType: any,
      timeout: any,
      returnType: any
    ) => {
      deferred.promise.finally(this._boundNotifyRepaintRequired);
      return this._originalLoadWithXhr(
        url,
        responseType,
        method,
        data,
        headers,
        deferred,
        overrideMimeType,
        timeout,
        returnType
      );
    };

    // // Hacky way to force a repaint when a web worker sends something back.
    this._originalScheduleTask = TaskProcessor.prototype.scheduleTask;
    const that = this;
    TaskProcessor.prototype.scheduleTask = function (
      this: any,
      parameters,
      transferableObjects
    ) {
      var result = that._originalScheduleTask.call(
        this,
        parameters,
        transferableObjects
      );

      if (!defined(this._originalWorkerMessageSinkRepaint)) {
        this._originalWorkerMessageSinkRepaint = this._worker.onmessage;

        var taskProcessor = this;
        this._worker.onmessage = function (event: any) {
          taskProcessor._originalWorkerMessageSinkRepaint(event);

          if (that.isDestroyed()) {
            taskProcessor._worker.onmessage =
              taskProcessor._originalWorkerMessageSinkRepaint;
            taskProcessor._originalWorkerMessageSinkRepaint = undefined;
          } else {
            that.notifyRepaintRequired();
          }
        };
      }

      return result;
    };
  }

  destroy() {
    if (this._removePostRenderListener) {
      this._removePostRenderListener();
    }

    if (this._boundNotifyRepaintRequired) {
      this.cesiumWidget.canvas.removeEventListener(
        "mousemove",
        this._boundNotifyRepaintRequired,
        false
      );
      this.cesiumWidget.canvas.removeEventListener(
        "mousedown",
        this._boundNotifyRepaintRequired,
        false
      );
      this.cesiumWidget.canvas.removeEventListener(
        "mouseup",
        this._boundNotifyRepaintRequired,
        false
      );
      this.cesiumWidget.canvas.removeEventListener(
        "touchstart",
        this._boundNotifyRepaintRequired,
        false
      );
      this.cesiumWidget.canvas.removeEventListener(
        "touchend",
        this._boundNotifyRepaintRequired,
        false
      );
      this.cesiumWidget.canvas.removeEventListener(
        "touchmove",
        this._boundNotifyRepaintRequired,
        false
      );

      if (defined(globalThis.PointerEvent)) {
        this.cesiumWidget.canvas.removeEventListener(
          "pointerdown",
          this._boundNotifyRepaintRequired,
          false
        );
        this.cesiumWidget.canvas.removeEventListener(
          "pointerup",
          this._boundNotifyRepaintRequired,
          false
        );
        this.cesiumWidget.canvas.removeEventListener(
          "pointermove",
          this._boundNotifyRepaintRequired,
          false
        );
      }

      if (this._wheelEvent) {
        this.cesiumWidget.canvas.removeEventListener(
          this._wheelEvent,
          this._boundNotifyRepaintRequired,
          false
        );
      }

      window.removeEventListener(
        "resize",
        this._boundNotifyRepaintRequired,
        false
      );

      document.removeEventListener(
        "keyup",
        this._boundNotifyRepaintRequired,
        false
      );
      document.removeEventListener(
        "keydown",
        this._boundNotifyRepaintRequired,
        false
      );
    }

    (loadWithXhr as any).load = this._originalLoadWithXhr;
    TaskProcessor.prototype.scheduleTask = this._originalScheduleTask;

    return destroyObject(this);
  }

  isDestroyed() {
    return false;
  }

  notifyRepaintRequired() {
    if (this.verboseRendering && !this.cesiumWidget.useDefaultRenderLoop) {
      console.log("starting rendering @ " + getTimestamp());
    }
    this._lastCameraMoveTime = getTimestamp();
    this.renderingIsPaused = false;
  }

  private postRender(date: JulianDate) {
    // We can safely stop rendering when:
    //  - the camera position hasn't changed in over a second,
    //  - there are no tiles waiting to load, and
    //  - the clock is not animating
    //  - there are no tweens in progress

    const now = getTimestamp();

    const scene = this.cesiumWidget.scene;

    if (
      !Matrix4.equalsEpsilon(
        this._lastCameraViewMatrix,
        scene.camera.viewMatrix,
        1e-5
      )
    ) {
      this._lastCameraMoveTime = now;
    }

    const cameraMovedInLastSecond = now - this._lastCameraMoveTime < 1000;

    const surface = (<any>scene.globe)._surface;
    const terrainTilesWaiting =
      !surface._tileProvider.ready ||
      surface._tileLoadQueueHigh.length > 0 ||
      surface._tileLoadQueueMedium.length > 0 ||
      surface._tileLoadQueueLow.length > 0 ||
      surface._debug.tilesWaitingForChildren > 0;
    const tweens = (<any>scene).tweens;

    if (
      !cameraMovedInLastSecond &&
      !terrainTilesWaiting &&
      !this.cesiumWidget.clock.shouldAnimate &&
      tweens.length === 0
    ) {
      if (this.verboseRendering) {
        console.log("stopping rendering @ " + getTimestamp());
      }
      this.renderingIsPaused = true;
    }

    Matrix4.clone(scene.camera.viewMatrix, this._lastCameraViewMatrix);
    this.postRenderCallback();
  }
}
