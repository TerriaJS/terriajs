import i18next from "i18next";
import { action } from "mobx";
import BoundingSphere from "terriajs-cesium/Source/Core/BoundingSphere";
import Cartesian2 from "terriajs-cesium/Source/Core/Cartesian2";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import sampleTerrainMostDetailed from "terriajs-cesium/Source/Core/sampleTerrainMostDetailed";
import Cesium3DTile from "terriajs-cesium/Source/Scene/Cesium3DTile";
import Cesium3DTileFeature from "terriajs-cesium/Source/Scene/Cesium3DTileFeature";
import Cesium3DTileset from "terriajs-cesium/Source/Scene/Cesium3DTileset";
import PickedFeatures from "../../../Map/PickedFeatures/PickedFeatures";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import Cesium3dTilesMixin from "../../../ModelMixins/Cesium3dTilesMixin";
import FeatureInfoUrlTemplateMixin from "../../../ModelMixins/FeatureInfoUrlTemplateMixin";
import SearchableItemMixin, {
  ItemSelectionDisposer
} from "../../../ModelMixins/SearchableItemMixin";
import Cesium3DTilesCatalogItemTraits from "../../../Traits/TraitsClasses/Cesium3DTilesCatalogItemTraits";
import CreateModel from "../../Definition/CreateModel";
import { ItemSearchResult } from "../../ItemSearchProviders/ItemSearchProvider";

// A property name used for tagging a search result feature for highlighting/hiding.
const SEARCH_RESULT_TAG = "terriajs_search_result";

export default class Cesium3DTilesCatalogItem extends SearchableItemMixin(
  FeatureInfoUrlTemplateMixin(
    Cesium3dTilesMixin(
      CatalogMemberMixin(CreateModel(Cesium3DTilesCatalogItemTraits))
    )
  )
) {
  static readonly type = "3d-tiles";
  readonly type = Cesium3DTilesCatalogItem.type;
  get typeName() {
    return i18next.t("models.cesiumTerrain.name3D");
  }

  /**
   * Highlights all features in the item search results.
   * Required by {@SearchableItemMixin}.
   *
   * 1) Watch for newly visible features with an id property matching some entry in `results`
   * 2) Tag them feature by setting {@SEARCH_RESULT_TAG} property.
   * 3) Apply color style to the tagged features to acheive the highlighting
   * 4) If there is only 1 result, popup the feature info panel for the matching feature
   */
  @action
  highlightFeaturesFromItemSearchResults(
    results: ItemSearchResult[]
  ): ItemSelectionDisposer {
    const tileset = this.tileset;
    if (tileset === undefined || results.length === 0) {
      return () => {}; // empty disposer
    }

    const resultIds = new Set(results.map((r) => r.id));
    const idPropertyName = results[0].idPropertyName;
    const highligtedFeatures: Set<Cesium3DTileFeature> = new Set();
    let disposeFeatureInfoPanel: (() => void) | undefined;

    // Tag newly visible features with SEARCH_RESULT_TAG
    const disposeWatch = this._watchForNewTileFeatures(
      tileset,
      (feature: Cesium3DTileFeature) => {
        const featureId = feature.getProperty(idPropertyName);
        if (resultIds.has(featureId)) {
          feature.setProperty(SEARCH_RESULT_TAG, true);
          highligtedFeatures.add(feature);

          // If we only have a single result, show the feature info panel for it
          if (results.length === 1) {
            disposeFeatureInfoPanel = openInfoPanelForFeature(
              this,
              feature,
              SEARCH_RESULT_TAG
            );
          }
        }
      }
    );

    // Instead of directly setting `feature.color` to highlight the feature, we
    // apply a style rule for the tagged features.  This lets us remove the
    // highlight by simply removing the style and don't have to store the
    // previous color of each matched feature.
    const highlightColor = `color('${this.highlightColor}')`;
    const colorExpression = `\${${SEARCH_RESULT_TAG}} === true`;
    this.applyColorExpression({
      condition: colorExpression,
      value: highlightColor
    });

    const highlightDisposer = action(() => {
      disposeWatch();
      disposeFeatureInfoPanel?.();
      this.removeColorExpression(colorExpression);
      highligtedFeatures.forEach((feature) => {
        try {
          feature.setProperty(SEARCH_RESULT_TAG, undefined);
        } catch {
          // An error is thrown if the feature content is already destroyed,
          // ignore it
        }
      });
    });

    return highlightDisposer;
  }

  /**
   * Hides all features NO matching entry in `results`.
   * Required by {@SearchableItemMixin}.
   *
   * Works similar to {@highlightFeaturesFromItemSearchResults}
   */
  @action hideFeaturesNotInItemSearchResults(
    results: ItemSearchResult[]
  ): ItemSelectionDisposer {
    const tileset = this.tileset;
    if (tileset === undefined || results.length == 0) {
      return () => {}; // empty disposer
    }

    const resultIds = new Set(results.map((r) => r.id));
    const idPropertyName = results[0].idPropertyName;
    const hiddenFeatures: Set<Cesium3DTileFeature> = new Set();

    // Tag newly visible features with SEARCH_RESULT_TAG
    const disposeWatch = this._watchForNewTileFeatures(
      tileset,
      (feature: Cesium3DTileFeature) => {
        const featureId = feature.getProperty(idPropertyName);
        if (resultIds.has(featureId) === false) {
          feature.setProperty(SEARCH_RESULT_TAG, true);
          hiddenFeatures.add(feature);
        }
      }
    );

    const showExpression = `\${${SEARCH_RESULT_TAG}} === true`;
    this.applyShowExpression({
      condition: showExpression,
      show: false
    });

    const disposer = action(() => {
      disposeWatch();
      this.removeShowExpression(showExpression);
      hiddenFeatures.forEach((feature) => {
        try {
          feature.setProperty(SEARCH_RESULT_TAG, undefined);
        } catch {
          // An error is thrown if the feature content is already destroyed,
          // ignore it
        }
      });
    });

    return disposer;
  }

  /**
   * Callback the given function once for each visible feature.
   *
   * @param tileset The cesium 3d tileset
   * @param callback The function to callback receiving the feature as its parameter
   * @return A disposer function cancelling the watch
   */
  private _watchForNewTileFeatures(
    tileset: Cesium3DTileset,
    callback: (feature: Cesium3DTileFeature) => void
  ): () => void {
    const watchedTiles: Set<Cesium3DTile> = new Set();
    const watch = (tile: Cesium3DTile) => {
      if (watchedTiles.has(tile)) return;
      const content = tile.content;
      for (let i = 0; i < content.featuresLength; i++) {
        const feature = content.getFeature(i);
        callback(feature);
      }
      watchedTiles.add(tile);
    };
    const removeWatchedTile = (tile: Cesium3DTile) => watchedTiles.delete(tile);
    // Why listen on both tileLoad & tileVisible?
    // tileLoad is best for applying styles as the style takes effect
    // from the first render but in our case the tileset is already
    // loaded so we must also listen to tileVisible to style the existing tiles.
    // This is alright because we use the `watchedTiles` filter to avoid
    // processing a tile multiple times.
    tileset.tileLoad.addEventListener(watch);
    tileset.tileVisible.addEventListener(watch);
    tileset.tileUnload.addEventListener(removeWatchedTile);
    const disposer = () => {
      tileset.tileLoad.removeEventListener(watch);
      tileset.tileVisible.removeEventListener(watch);
      tileset.tileUnload.removeEventListener(removeWatchedTile);
    };
    return disposer;
  }

  /**
   * Zoom to an item search result.
   */
  zoomToItemSearchResult = action(async (result: ItemSearchResult) => {
    if (this.terria.cesium === undefined) return;

    const scene = this.terria.cesium.scene;
    const camera = scene.camera;
    const { latitudeDegrees, longitudeDegrees, featureHeight } =
      result.featureCoordinate;

    const cartographic = Cartographic.fromDegrees(
      longitudeDegrees,
      latitudeDegrees
    );
    const [terrainCartographic] = await sampleTerrainMostDetailed(
      scene.terrainProvider,
      [cartographic]
    ).catch(() => [cartographic]);

    if (featureHeight < 20) {
      // for small features we show a top-down view so that it is visible even
      // if surrounded by larger features
      const minViewDistance = 50;
      // height = terrainHeight + featureHeight + minViewDistance
      terrainCartographic.height += featureHeight + minViewDistance;
      const destination = Cartographic.toCartesian(cartographic);
      // use default orientation which is a top-down view of the feature
      camera.flyTo({ destination, orientation: undefined });
    } else {
      // for tall features we fly to the bounding sphere containing it so that
      // the whole feature is visible
      const center = Cartographic.toCartesian(terrainCartographic);
      const bs = new BoundingSphere(center, featureHeight * 2);
      camera.flyToBoundingSphere(bs);
    }
  });
}

/**
 * Open info panel for the given feature.
 *
 * @param item The catalog item instance
 * @param cesium3dtilefeature The feature for which we should open the panel
 * @param excludePropertyFromPanel A property to exclude when showing in the feature panel
 * @returns A disposer to close the feature panel
 */
const openInfoPanelForFeature = action(
  (
    item: Cesium3DTilesCatalogItem,
    cesium3DTileFeature: Cesium3DTileFeature,
    excludePropertyFromPanel: string
  ) => {
    const pickedFeatures = new PickedFeatures();
    const feature = item.getFeaturesFromPickResult(
      // The screenPosition param is not used by 3dtiles catalog item,
      // so just pass a fake value
      new Cartesian2(),
      cesium3DTileFeature
    );
    if (feature === undefined) return () => {}; // empty disposer

    const terria = item.terria;
    feature.properties?.removeProperty(excludePropertyFromPanel);
    pickedFeatures.features.push(feature);
    pickedFeatures.isLoading = false;
    pickedFeatures.allFeaturesAvailablePromise = Promise.resolve();
    terria.pickedFeatures = pickedFeatures;

    const disposer = () => {
      if (terria.pickedFeatures === pickedFeatures)
        terria.pickedFeatures = undefined;
    };
    return disposer;
  }
);
