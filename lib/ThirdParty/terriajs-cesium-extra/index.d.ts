declare module "terriajs-cesium/Source/ThirdParty/when";

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

declare module "terriajs-cesium/Source/Core/Event" {
  export default class CesiumEvent<T = any> {
    constructor();
    /**
     * The number of listeners currently subscribed to the event.
     */
    readonly numberOfListeners: number;
    /**
     * Registers a callback function to be executed whenever the event is raised.
     * An optional scope can be provided to serve as the <code>this</code> pointer
     * in which the function will execute.
     * @param listener - The function to be executed when the event is raised.
     * @param [scope] - An optional object scope to serve as the <code>this</code>
     *        pointer in which the listener function will execute.
     * @returns A function that will remove this event listener when invoked.
     */
    addEventListener(
      listener: (event: T, ...param: any[]) => any,
      scope?: any
    ): CesiumEvent.RemoveCallback;
    /**
     * Unregisters a previously registered callback.
     * @param listener - The function to be unregistered.
     * @param [scope] - The scope that was originally passed to addEventListener.
     * @returns <code>true</code> if the listener was removed; <code>false</code> if the listener and scope are not registered with the event.
     */
    removeEventListener(
      listener: (event: T, ...param: any[]) => any,
      scope?: any
    ): boolean;
    /**
     * Raises the event by calling each registered listener with all supplied arguments.
     * @param arguments - This method takes any number of parameters and passes them through to the listener functions.
     */
    raiseEvent(event: T, ...param: any[]): void;
  }

  export namespace CesiumEvent {
    /**
     * A function that removes a listener.
     */
    type RemoveCallback = () => void;
  }
}
