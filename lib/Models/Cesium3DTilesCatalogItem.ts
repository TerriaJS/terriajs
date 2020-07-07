import i18next from "i18next";
import { action, computed, observable, runInAction, toJS } from "mobx";
import Cartesian2 from "terriajs-cesium/Source/Core/Cartesian2";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import clone from "terriajs-cesium/Source/Core/clone";
import HeadingPitchRoll from "terriajs-cesium/Source/Core/HeadingPitchRoll";
import IonResource from "terriajs-cesium/Source/Core/IonResource";
import Matrix3 from "terriajs-cesium/Source/Core/Matrix3";
import Matrix4 from "terriajs-cesium/Source/Core/Matrix4";
import Quaternion from "terriajs-cesium/Source/Core/Quaternion";
import Resource from "terriajs-cesium/Source/Core/Resource";
import Transforms from "terriajs-cesium/Source/Core/Transforms";
import Cesium3DTileColorBlendMode from "terriajs-cesium/Source/Scene/Cesium3DTileColorBlendMode";
import Cesium3DTileFeature from "terriajs-cesium/Source/Scene/Cesium3DTileFeature";
import Cesium3DTileset from "terriajs-cesium/Source/Scene/Cesium3DTileset";
import Cesium3DTileStyle from "terriajs-cesium/Source/Scene/Cesium3DTileStyle";
import ShadowMode from "terriajs-cesium/Source/Scene/ShadowMode";
import isDefined from "../Core/isDefined";
import makeRealPromise from "../Core/makeRealPromise";
import runLater from "../Core/runLater";
import AsyncMappableMixin from "../ModelMixins/AsyncMappableMixin";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import FeatureInfoMixin from "../ModelMixins/FeatureInfoMixin";
import Cesium3DTilesCatalogItemTraits, {
  OptionsTraits
} from "../Traits/Cesium3DCatalogItemTraits";
import CommonStrata from "./CommonStrata";
import CreateModel from "./CreateModel";
import createStratumInstance from "./createStratumInstance";
import Feature from "./Feature";
import Mappable from "./Mappable";
import proxyCatalogItemUrl from "./proxyCatalogItemUrl";
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
  get typeName() {
    return i18next.t("models.cesiumTerrain.name3D");
  }
}
