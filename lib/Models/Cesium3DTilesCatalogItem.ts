import i18next from "i18next";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import FeatureInfoMixin from "../ModelMixins/FeatureInfoMixin";
import Cesium3DTilesCatalogItemTraits from "../Traits/Cesium3DCatalogItemTraits";
import CreateModel from "./CreateModel";
import Mappable from "./Mappable";
import Cesium3dTilesMixin from "../ModelMixins/Cesium3dTilesMixin";

export default class Cesium3DTilesCatalogItem
  extends FeatureInfoMixin(
    Cesium3dTilesMixin(
      CatalogMemberMixin(CreateModel(Cesium3DTilesCatalogItemTraits))
    )
  )
  implements Mappable {
  static readonly type = "3d-tiles";
  readonly type = Cesium3DTilesCatalogItem.type;
  readonly isMappable = true;
  get typeName() {
    return i18next.t("models.cesiumTerrain.name3D");
  }
}
