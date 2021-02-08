import i18next from "i18next";
import { action } from "mobx";
import { Cesium3DTileFeature } from "terriajs-cesium";
import BoundingSphere from "terriajs-cesium/Source/Core/BoundingSphere";
import Cartesian2 from "terriajs-cesium/Source/Core/Cartesian2";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import sampleTerrainMostDetailed from "terriajs-cesium/Source/Core/sampleTerrainMostDetailed";
import Cesium3DTile from "terriajs-cesium/Source/Scene/Cesium3DTile";
import timeout from "../Core/timeout";
import PickedFeatures from "../Map/PickedFeatures";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import Cesium3dTilesMixin from "../ModelMixins/Cesium3dTilesMixin";
import FeatureInfoMixin from "../ModelMixins/FeatureInfoMixin";
import SearchableItemMixin, {
  ItemSelectionDisposer
} from "../ModelMixins/SearchableItemMixin";
import Cesium3DTilesCatalogItemTraits from "../Traits/Cesium3DCatalogItemTraits";
import CreateModel from "./CreateModel";
import { ItemSearchResult } from "./ItemSearchProvider";
import Mappable from "./Mappable";

// A property name used for marking a search result feature for highlighting/hiding.
const SEARCH_RESULT_TAG = "search_result";

export default class Cesium3DTilesCatalogItem
  extends SearchableItemMixin(
    FeatureInfoMixin(
      Cesium3dTilesMixin(
        CatalogMemberMixin(CreateModel(Cesium3DTilesCatalogItemTraits))
      )
    )
  )
  implements Mappable {
  static readonly type = "3d-tiles";
  readonly type = Cesium3DTilesCatalogItem.type;
  get typeName() {
    return i18next.t("models.cesiumTerrain.name3D");
  }

  /**
   * Highlights all item search results. See {@SearchableItemMixin}.
   *
   * We listen to the `tileVisible  event for the tileset and set
   * and mark all the features with matching IDs using the marker tag SEARCH_RESULT_TAG.
   * We then apply the styling to higlight all features with SEARCH_RESULT_TAG set to `true`.
   * In the disposer function we remove the marker tag and the styling rules.
   */
  @action
  highlightItemSearchResults(
    results: ItemSearchResult[]
  ): ItemSelectionDisposer {
    const tileset = this.tileset;
    if (tileset === undefined || results.length == 0) {
      return () => {}; // empty disposer
    }

    const resultIds = new Set(results.map(r => r.id));
    const idPropertyName = results[0].idPropertyName;
    const highligtedFeatures: Set<Cesium3DTileFeature> = new Set();
    const highlightColor = `color('${this.highlightColor}')`;
    const colorExpression = `\${${SEARCH_RESULT_TAG}} === true`;

    if (results.length === 1)
      this.popupInfoPanelForFeature(
        { [idPropertyName]: results[0].id },
        SEARCH_RESULT_TAG,
        60000
      );

    const watch = (tile: Cesium3DTile) => {
      const content = tile.content;
      for (let i = 0; i < content.featuresLength; i++) {
        const feature = content.getFeature(i);
        const featureId = feature.getProperty(idPropertyName);
        if (resultIds.has(featureId)) {
          feature.setProperty(SEARCH_RESULT_TAG, true);
          highligtedFeatures.add(feature);
        }
      }
    };
    tileset.tileVisible.addEventListener(watch);

    this.applyColorExpression({
      condition: colorExpression,
      value: highlightColor
    });

    const highlightDisposer = () => {
      tileset.tileVisible.removeEventListener(watch);
      highligtedFeatures.forEach(feature =>
        feature.setProperty(SEARCH_RESULT_TAG, undefined)
      );
      this.removeColorExpression(colorExpression);
    };

    return highlightDisposer;
  }

  /**
   * Hide all item search results. See {@SearchableItemMixin}.
   *
   * Works similar to {@highlightItemSearchResults}
   */
  @action hideItemSearchResults(results: ItemSearchResult[]) {
    const tileset = this.tileset;
    if (tileset === undefined || results.length == 0) {
      return () => {}; // empty disposer
    }

    const resultIds = new Set(results.map(r => r.id));
    const idPropertyName = results[0].idPropertyName;
    const hiddenFeatures: Set<Cesium3DTileFeature> = new Set();
    const showExpression = `\${${SEARCH_RESULT_TAG}} === true`;

    if (results.length === 1)
      this.popupInfoPanelForFeature(
        { [idPropertyName]: results[0].id },
        SEARCH_RESULT_TAG,
        60000
      );

    const watch = (tile: Cesium3DTile) => {
      const content = tile.content;
      for (let i = 0; i < content.featuresLength; i++) {
        const feature = content.getFeature(i);
        const featureId = feature.getProperty(idPropertyName);
        if (resultIds.has(featureId)) {
          feature.setProperty(SEARCH_RESULT_TAG, true);
          hiddenFeatures.add(feature);
        }
      }
    };
    tileset.tileVisible.addEventListener(watch);

    this.applyShowExpression({
      condition: showExpression,
      show: false
    });

    const disposer = () => {
      tileset.tileVisible.removeEventListener(watch);
      hiddenFeatures.forEach(feature =>
        feature.setProperty(SEARCH_RESULT_TAG, undefined)
      );
      this.removeShowExpression(showExpression);
    };

    return disposer;
  }

  /**
   * Popup feature info panel for the feature with the given properties
   */
  popupInfoPanelForFeature(
    featureProperties: Record<string, string | number>,
    excludePropertyFromPanel: string,
    timeoutMsecs: number
  ): Promise<void> {
    const pickedFeatures = new PickedFeatures();
    this.terria.pickedFeatures;

    // There is a small chance that we might miss the tileVisible event for the
    // feature, so timeout after 60 secs
    pickedFeatures.allFeaturesAvailablePromise = Promise.race([
      timeout(timeoutMsecs),
      this.watchForFeatureWithProperties(featureProperties)
    ]).then(
      action(cesium3DTileFeature => {
        if (cesium3DTileFeature) {
          const feature = this.getFeaturesFromPickResult(
            // The screenPosition param is not used by 3dtiles catalog item, so just pass a fake value
            new Cartesian2(),
            cesium3DTileFeature
          );
          feature?.properties?.removeProperty(excludePropertyFromPanel);
          if (feature) pickedFeatures.features.push(feature);
        }
        pickedFeatures.isLoading = false;
      })
    );
    this.terria.pickedFeatures = pickedFeatures;
    return pickedFeatures.allFeaturesAvailablePromise;
  }

  /**
   * Zoom to an item search result.
   */
  zoomToItemSearchResult = action((result: ItemSearchResult) => {
    if (this.terria.cesium === undefined) return;

    const scene = this.terria.cesium.scene;
    const camera = scene.camera;
    const zoomTarget = result.zoomToTarget;
    if (zoomTarget instanceof BoundingSphere) {
      camera.flyToBoundingSphere(zoomTarget);
    } else {
      const { latitude, longitude, featureHeight } = zoomTarget;
      if (featureHeight < 20) {
        // If feature height is small, we try to zoom to a view from a top
        // angle. We also try to be a bit more precise so that the camera does
        // not go underground.
        sampleTerrainMostDetailed(scene.terrainProvider, [
          Cartographic.fromDegrees(longitude, latitude)
        ]).then(([terrainCartographic]) => {
          terrainCartographic.height += featureHeight + 10;
          const destination = Ellipsoid.WGS84.cartographicToCartesian(
            terrainCartographic
          );
          camera.flyTo({ destination });
        });
      } else {
        const cartographic = Cartographic.fromDegrees(longitude, latitude);
        const center = Ellipsoid.WGS84.cartographicToCartesian(cartographic);
        const boundingSphere = new BoundingSphere(center, featureHeight * 2);
        camera.flyToBoundingSphere(boundingSphere);
      }
    }
  });
}
