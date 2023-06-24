import { number } from "prop-types";

declare module "cesium" {
  export interface Tween {
    cancelTween(): void;
  }

  export class TweenCollection {
    get length(): number;
    add(options: any): Tween;
    update(): void;
  }

  export interface Scene {
    tweens: TweenCollection;
    frameState: {
      creditDisplay: CreditDisplay;
    };
  }

  export interface ImageryLayerFeatureInfo {
    properties: any;
  }

  // This is a workaround for Cesium's incorrect type declaration for raiseEvent.
  export interface Event {
    raiseEvent(...arguments: any[]): void;
  }

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

  export namespace Axis {
    function fromName(name: string): Axis;
  }

  export namespace CameraFlightPath {
    function createTween(
      scene: Scene,
      options: {
        destination: Cartesian3;
        direction: Cartesian3;
        up: Cartesian3;
        duration: number;
      }
    ): Tween;
  }

  export namespace PolygonGeometryLibrary {
    function polygonsFromHierarchy(
      polygonHierarchy: PolygonHierarchy,
      keepDuplicates: boolean,
      pojectPointsTo2D: (
        cartesians: Cartesian3[],
        result?: Cartesian2[]
      ) => Cartesian2[],
      scaleToEllipsoidSurface: boolean,
      ellipsoid: Ellipsoid
    ): {
      polygons: PolygonGeometry[];
    };

    function createGeometryFromPositions(
      ellipsoid: Ellipsoid,
      polygon: PolygonGeometry,
      textureCoordinates: any | undefined,
      granularity: number,
      perPositionHeight: boolean,
      vertexFormat: VertexFormat,
      arcType: ArcType
    ): Geometry;
  }
}

// declare module "terriajs-cesium/Source/DataSources/BoundingSphereState" {
//   /**
//    * The state of a BoundingSphere computation being performed by a {@link Visualizer}.
//    * @enum {Number}
//    * @private
//    */
//   enum BoundingSphereState {
//     /**
//      * The BoundingSphere has been computed.
//      * @type BoundingSphereState
//      * @constant
//      */
//     DONE = 0,
//     /**
//      * The BoundingSphere is still being computed.
//      * @type BoundingSphereState
//      * @constant
//      */
//     PENDING = 1,
//     /**
//      * The BoundingSphere does not exist.
//      * @type BoundingSphereState
//      * @constant
//      */
//     FAILED = 2
//   }
//   export default BoundingSphereState;
// }

// declare module "terriajs-cesium/Source/Widgets/getElement" {
//   export default function getElement(
//     element: string | HTMLElement
//   ): HTMLElement | undefined;
// }

// declare module "terriajs-cesium/Source/Core/PolygonGeometryLibrary";

// declare interface Axis {
//   X: number;
//   Y: number;
//   Z: number;
//   fromName(name: string): number;
// }

// declare interface FeatureDetection {
//   isEdge(): boolean;
//   isInternetExplorer(): boolean;
//   internetExplorerVersion(): number[];
// }
