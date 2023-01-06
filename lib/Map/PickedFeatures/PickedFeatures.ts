import { observable } from "mobx";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import MappableMixin, { ImageryParts } from "../../ModelMixins/MappableMixin";
import { BaseModel } from "../../Models/Definition/Model";
import TerriaFeature from "../../Models/Feature/Feature";

export type ProviderCoords = { x: number; y: number; level: number };
export type ProviderCoordsMap = { [url: string]: ProviderCoords };

export function isProviderCoords(obj: any): obj is ProviderCoords {
  if (obj) {
    return (
      Number.isFinite(obj.x) &&
      Number.isFinite(obj.y) &&
      Number.isFinite(obj.level)
    );
  } else return false;
}

export function isProviderCoordsMap(obj: any): obj is ProviderCoordsMap {
  return Object.keys(obj).every((url) => isProviderCoords(obj[url]));
}

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
  @observable features: TerriaFeature[] = [];

  /**
   * Gets or sets a message describing an error that occurred while picking features.
   * If this property is undefined, no error occurred.
   * @type {String}
   */
  @observable error: string | undefined;

  providerCoords: ProviderCoordsMap | undefined;
}

export function featureBelongsToCatalogItem(
  feature: TerriaFeature,
  catalogItem: BaseModel
) {
  if (feature._catalogItem === catalogItem) return true;

  if (!MappableMixin.isMixedInto(catalogItem)) return;

  const dataSource = feature.entityCollection?.owner;
  const imageryProvider = feature.imageryLayer?.imageryProvider;

  // Test whether the catalog item has a matching dataSource or an imageryProvider
  const match = catalogItem.mapItems.some((mapItem) => {
    if (dataSource && mapItem === dataSource) {
      return true;
    }
    if (
      imageryProvider &&
      ImageryParts.is(mapItem) &&
      mapItem.imageryProvider === imageryProvider
    ) {
      return true;
    }
    return false;
  });

  return match;
}
