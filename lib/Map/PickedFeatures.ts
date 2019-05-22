import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Entity from "terriajs-cesium/Source/DataSources/Entity";
import { observable } from "mobx";

export type ProviderCoords = { x: number; y: number; level: number };
export type ProviderCoordsMap = { [url: string]: ProviderCoords };

/**
 * Holds the vector and raster features that the user picked by clicking the mouse on the map.
 */
export default class PickedFeatures {
  /**
   * Gets or sets a promise that indicates, when it resolves, that all picked features are available in the
   * {@see PickedFeatures#features} array.
   */
  allFeaturesAvailablePromise: Promise<void> | undefined;

  /**
   * Gets or sets a value indicating whether the list of picked features is still loading.
   */
  @observable isLoading: boolean = true;

  /**
   * Gets or sets the ground position that was picked, if any.
   */
  pickPosition: Cartesian3 | undefined;

  /**
   * Gets or sets the array of picked features.  The array is observable and may be updated up until the point that
   * {@see PickedFeatures#allFeaturesAvailablePromise} resolves.
   */
  @observable features: Entity[] = [];

  /**
   * Gets or sets a message describing an error that occurred while picking features.
   * If this property is undefined, no error occurred.
   * @type {String}
   */
  @observable error: string | undefined;

  providerCoords: ProviderCoordsMap | undefined;
}
