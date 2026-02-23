declare module "terriajs-cesium" {
  export class TweenCollection {
    get length(): number;
    add(options: any): any;
    update(time?: number): void;
  }
}

declare module "terriajs-cesium" {
  /**
   * The state of a BoundingSphere computation being performed by a {@link Visualizer}.
   * @enum {Number}
   * @private
   */
  export enum BoundingSphereState {
    /**
     * The BoundingSphere has been computed.
     * @type BoundingSphereState
     * @constant
     */
    DONE = 0,
    /**
     * The BoundingSphere is still being computed.
     * @type BoundingSphereState
     * @constant
     */
    PENDING = 1,
    /**
     * The BoundingSphere does not exist.
     * @type BoundingSphereState
     * @constant
     */
    FAILED = 2
  }
}

declare module "terriajs-cesium" {
  export function getElement(
    element: string | HTMLElement
  ): HTMLElement | undefined;
}

declare module "terriajs-cesium" {
  export const PolygonGeometryLibrary: any;
  export const CameraFlightPath: any;
}

// This is a workaround for Cesium's incorrect type declaration for raiseEvent.
declare module "terriajs-cesium" {
  export interface Event {
    raiseEvent(...arguments: any[]): void;
  }

  namespace FeatureDetection {
    function isChrome(): boolean;
    function isEdge(): boolean;
    function isInternetExplorer(): boolean;
    function isFirefox(): boolean;
    function internetExplorerVersion(): number[];
    function chromeVersion(): number[];
  }

  namespace Axis {
    function fromName(name: string): number;
  }
}
