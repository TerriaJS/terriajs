import i18next from "i18next";
import { action } from "mobx";
import Cartesian2 from "terriajs-cesium/Source/Core/Cartesian2";
import timeout from "../Core/timeout";
import PickedFeatures from "../Map/PickedFeatures";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import Cesium3dTilesMixin from "../ModelMixins/Cesium3dTilesMixin";
import FeatureInfoMixin from "../ModelMixins/FeatureInfoMixin";
import SearchableItemMixin from "../ModelMixins/SearchableItemMixin";
import Cesium3DTilesCatalogItemTraits from "../Traits/Cesium3DCatalogItemTraits";
import CreateModel from "./CreateModel";
import { ItemSearchResult } from "./ItemSearchProvider";
import Mappable from "./Mappable";

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
   * Required for {@SearchableItemMixin}
   *
   * We want to do two things here, popup the feature info panel with the
   * properties for the selected feature and highlight the selected feature in a
   * stable manner. We watch for a tile feature with matching id to become visible and use
   * it to populate the panel. Although feature picking also handles highlighting,
   * we cannot rely on it because Cesium might decide to load a feature with different
   * resolution and we might loose the highlight. For the highlighting to be sticky,
   * we use style expressions instead.
   */
  @action
  selectItemSearchResult(result: ItemSearchResult) {
    const pickedFeatures = new PickedFeatures();
    const properties = { [result.idPropertyName]: result.id };

    // There is a small chance that we might miss the tileVisible event for the
    // feature, so timeout after 60 secs
    pickedFeatures.allFeaturesAvailablePromise = Promise.race([
      timeout(60000),
      this.watchForFeatureWithProperties(properties)
    ]).then(
      action(cesium3DTileFeature => {
        if (cesium3DTileFeature) {
          const feature = this.getFeaturesFromPickResult(
            // The screenPosition param is not used by 3dtiles catalog item, so just pass a fake value
            new Cartesian2(),
            cesium3DTileFeature
          );
          if (feature) pickedFeatures.features.push(feature);
        }
        pickedFeatures.isLoading = false;
      })
    );
    this.terria.pickedFeatures = pickedFeatures;
    const highlightColor = this.highlightColor;
    const idPropertyName = result.idPropertyName;
    this.addColorExpression([
      `\${${idPropertyName}} === ${result.id}`,
      `color('${highlightColor}')`
    ]);
  }

  /**
   * Required for {@SearchableItemMixin}
   */
  @action
  unselectItemSearchResult({ id, idPropertyName }: ItemSearchResult) {
    this.removeColorExpression(`\${${idPropertyName}} === ${id}`);
  }
}
