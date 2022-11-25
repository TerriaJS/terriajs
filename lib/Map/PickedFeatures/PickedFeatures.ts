import { action, observable, runInAction } from "mobx";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Entity from "terriajs-cesium/Source/DataSources/Entity";
import filterOutUndefined from "../../Core/filterOutUndefined";
import hashEntity from "../../Core/hashEntity";
import { isJsonObject, JsonObject } from "../../Core/Json";
import { isLatLonHeight } from "../../Core/LatLonHeight";
import MappableMixin, {
  ImageryParts,
  isDataSource
} from "../../ModelMixins/MappableMixin";
import hasTraits from "../../Models/Definition/hasTraits";
import { BaseModel } from "../../Models/Definition/Model";
import TerriaFeature from "../../Models/Feature/Feature";
import Terria from "../../Models/Terria";
import MappableTraits from "../../Traits/TraitsClasses/MappableTraits";

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

export const loadPickedFeaturesFromJson = action(
  async (terria: Terria, pickedFeatures: JsonObject): Promise<void> => {
    let vectorFeatures: TerriaFeature[] = [];
    let featureIndex: Record<number, TerriaFeature[] | undefined> = {};

    if (Array.isArray(pickedFeatures.entities)) {
      // Build index of terria features by a hash of their properties.
      const relevantItems = terria.workbench.items.filter(
        (item) =>
          hasTraits(item, MappableTraits, "show") &&
          item.show &&
          MappableMixin.isMixedInto(item)
      ) as MappableMixin.Instance[];

      relevantItems.forEach((item) => {
        const entities: Entity[] = item.mapItems
          .filter(isDataSource)
          .reduce((arr: Entity[], ds) => arr.concat(ds.entities.values), []);

        entities.forEach((entity) => {
          const feature = TerriaFeature.fromEntityCollectionOrEntity(entity);
          const hash = hashEntity(feature, terria);

          featureIndex[hash] = (featureIndex[hash] || []).concat([feature]);
        });
      });

      // Go through the features we've got from terria match them up to the id/name info we got from the
      // share link, filtering out any without a match.
      vectorFeatures = filterOutUndefined(
        pickedFeatures.entities.map((e) => {
          if (isJsonObject(e) && typeof e.hash === "number") {
            const features = featureIndex[e.hash] || [];
            const match = features.find((f) => f.name === e.name);
            return match;
          }
        })
      );
    }

    // Set the current pick location, if we have a valid coord
    const maybeCoords: any = pickedFeatures.pickCoords;
    const pickCoords = {
      latitude: maybeCoords?.lat,
      longitude: maybeCoords?.lng,
      height: maybeCoords?.height
    };
    if (
      isLatLonHeight(pickCoords) &&
      isProviderCoordsMap(pickedFeatures.providerCoords)
    ) {
      terria.currentViewer.pickFromLocation(
        pickCoords,
        pickedFeatures.providerCoords,
        vectorFeatures as TerriaFeature[]
      );
    }

    if (terria.pickedFeatures?.allFeaturesAvailablePromise) {
      // When feature picking is done, set the selected feature
      await terria.pickedFeatures?.allFeaturesAvailablePromise;
    }

    runInAction(() => {
      terria.pickedFeatures?.features.forEach((feature) => {
        const hash = hashEntity(feature, terria);
        featureIndex[hash] = (featureIndex[hash] || []).concat([feature]);
      });

      // Find picked feature by matching feature hash
      // Also try to match name if defined
      const current = pickedFeatures.current;
      if (isJsonObject(current) && typeof current.hash === "number") {
        const selectedFeature =
          (featureIndex[current.hash] || []).find(
            (feature) => feature.name === current.name
          ) ?? featureIndex[current.hash]?.[0];
        if (selectedFeature) {
          terria.selectedFeature = selectedFeature;
        }
      }
    });
  }
);
