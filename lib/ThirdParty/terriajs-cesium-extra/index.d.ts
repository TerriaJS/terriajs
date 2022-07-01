declare module "terriajs-cesium/Source/Scene/TweenCollection" {
  export default class TweenCollection {
    get length(): number;
    add(options: any): any;
  }
}

declare module "terriajs-cesium/Source/DataSources/BoundingSphereState" {
  /**
   * The state of a BoundingSphere computation being performed by a {@link Visualizer}.
   * @enum {Number}
   * @private
   */
  enum BoundingSphereState {
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
  export default BoundingSphereState;
}

declare module "terriajs-cesium/Source/Widgets/getElement" {
  export default function getElement(
    element: string | HTMLElement
  ): HTMLElement | undefined;
}

declare module "terriajs-cesium/Source/Core/PolygonGeometryLibrary";

declare interface Axis {
  X: number;
  Y: number;
  Z: number;
  fromName(name: string): number;
}

declare interface FeatureDetection {
  isEdge(): boolean;
  isInternetExplorer(): boolean;
  internetExplorerVersion(): number[];
}
