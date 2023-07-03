import BoundingSphere from "terriajs-cesium/Source/Core/BoundingSphere";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import CameraView from "../../Models/CameraView";
import Cesium from "../../Models/Cesium";
import { ZoomTarget } from "../ZoomTarget";
import compute3dZoomView from "./compute3dZoomView";

/**
 * Implements the zooming behaviour for Cesium viewer.
 *
 * @private
 */
export default class Zooming {
  private currentZoomTarget?: ZoomTarget;

  constructor(readonly cesium: Cesium) {}

  private get scene() {
    return this.cesium.scene;
  }

  /**
   * Zoom Cesium map so that the given target is in view.
   *
   * @param target The target to zoom to
   * @param flightDurationSeconds The length of the zoom animation in seconds
   * @returns a promise that is fulfilled when the zoom animation is complete
   */
  async zoomTo(
    target: ZoomTarget,
    flightDurationSeconds: number
  ): Promise<void> {
    // Wake up renderer, this is required so that the map is updated and we can
    // compute the most recent view
    this.cesium.notifyRepaintRequired();
    this.currentZoomTarget = target;
    const view = await compute3dZoomView(target, this.cesium);
    if (this.currentZoomTarget !== target || !view) {
      return;
    }
    // Wake up renderer again, in case we `await`ed too long and it dozed
    // again. Otherwise animations won't run.
    this.cesium.notifyRepaintRequired();
    if (view instanceof BoundingSphere) {
      return this.zoomToBoundingSphere(view, flightDurationSeconds);
    } else if (view instanceof Cartesian3) {
      return this.zoomToPosition(view, flightDurationSeconds);
    } else if (view instanceof CameraView) {
      return this.zoomToCameraView(view, flightDurationSeconds);
    }
  }

  private async zoomToPosition(
    position: Cartesian3,
    flightDurationSeconds: number
  ): Promise<void> {
    return new Promise((complete, cancel) => {
      this.scene.camera.flyTo({
        destination: position,
        duration: flightDurationSeconds,
        complete,
        cancel
      });
    });
  }

  private async zoomToCameraView(
    cameraView: CameraView,
    flightDurationSeconds: number
  ): Promise<void> {
    return new Promise((complete, cancel) => {
      const destination = cameraView.position ?? cameraView.rectangle;
      const orientation =
        cameraView.direction || cameraView.up
          ? {
              direction: cameraView.direction,
              up: cameraView.up
            }
          : undefined;
      this.scene.camera.flyTo({
        destination,
        orientation,
        duration: flightDurationSeconds,
        complete,
        cancel
      });
    });
  }

  private async zoomToBoundingSphere(
    boundingSphere: BoundingSphere,
    flightDurationSeconds: number
  ): Promise<void> {
    return new Promise((complete, cancel) => {
      this.scene.camera.flyToBoundingSphere(boundingSphere, {
        duration: flightDurationSeconds,
        complete,
        cancel
      });
    });
  }
}
