import L from "leaflet";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import Leaflet from "../../Models/Leaflet";
import { ZoomTarget } from "../ZoomTarget";
import compute2dZoomView from "./compute2dZoomView";

/**
 * Implements zoom behaviour for Leaflet viewer.
 *
 * @private
 */
export default class Zooming {
  constructor(readonly leaflet: Leaflet) {}

  /**
   * Zoom Leaflet map so that the given target is in view.
   *
   * @param target The target to zoom to
   * @param flightDurationSeconds The time in seconds to complete the animation.
   * @returns Promise that is fulfilled when the zoom is completed.
   */
  async zoomTo(
    target: ZoomTarget,
    flightDurationSeconds: number
  ): Promise<void> {
    const bounds = await compute2dZoomView(target, this.leaflet);
    return bounds
      ? this.zoomToBounds(bounds, flightDurationSeconds)
      : Promise.resolve();
  }

  private zoomToBounds(
    bounds: L.LatLngBounds,
    flightDurationSeconds: number
  ): Promise<void> {
    return new Promise((resolve, _reject) => {
      // Watch for `moveend` event to resolve the promise. One problem is that
      // `moveend` can be triggered by changes to the map other than our call
      // to flyToBounds below. If that happens we might resolve before the zoom
      // animation finishes. Another leaflet event is the `zoomend` event - but
      // it is fired only if the zoom level has changed. So it is not really an
      // option.
      this.leaflet.map.once("moveend", () => resolve());
      this.leaflet.map.flyToBounds(bounds, {
        // animate should always be true to avoid triggering a buggy behaviour
        // that breaks our specs.
        animate: true,
        duration:
          // Leaflet treats duration=0 equivalent to not-set, so
          // instead set it to a very low value close to 0. We can't use
          // animate=false for the reason stated above.
          flightDurationSeconds === 0
            ? CesiumMath.EPSILON21
            : flightDurationSeconds
      });
    });
  }
}
