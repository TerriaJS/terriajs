import i18next from "i18next";
import {
  computed,
  makeObservable,
  observable,
  override,
  runInAction,
  toJS
} from "mobx";
import ArcGISTiledElevationTerrainProvider from "terriajs-cesium/Source/Core/ArcGISTiledElevationTerrainProvider";
import BoundingSphere from "terriajs-cesium/Source/Core/BoundingSphere";
import Cartesian2 from "terriajs-cesium/Source/Core/Cartesian2";
import Resource from "terriajs-cesium/Source/Core/Resource";
import Cesium3DTileColorBlendMode from "terriajs-cesium/Source/Scene/Cesium3DTileColorBlendMode";
import I3SDataProvider from "terriajs-cesium/Source/Scene/I3SDataProvider";
import I3SNode from "terriajs-cesium/Source/Scene/I3SNode";
import isDefined from "../../../Core/isDefined";
import CatalogMemberMixin, {
  getName
} from "../../../ModelMixins/CatalogMemberMixin";
import Cesium3dTilesStyleMixin from "../../../ModelMixins/Cesium3dTilesStyleMixin";
import FeatureInfoUrlTemplateMixin from "../../../ModelMixins/FeatureInfoUrlTemplateMixin";
import MappableMixin from "../../../ModelMixins/MappableMixin";
import ShadowMixin from "../../../ModelMixins/ShadowMixin";
import UrlMixin from "../../../ModelMixins/UrlMixin";
import I3SCatalogItemTraits from "../../../Traits/TraitsClasses/I3SCatalogItemTraits";
import CreateModel from "../../Definition/CreateModel";
import { ModelConstructorParameters } from "../../Definition/Model";
import TerriaFeature from "../../Feature/Feature";

export default class I3SCatalogItem extends Cesium3dTilesStyleMixin(
  FeatureInfoUrlTemplateMixin(
    ShadowMixin(
      MappableMixin(
        UrlMixin(CatalogMemberMixin(CreateModel(I3SCatalogItemTraits)))
      )
    )
  )
) {
  static readonly type = "i3s";
  readonly type = I3SCatalogItem.type;

  @observable
  private dataProvider?: I3SDataProvider;

  constructor(...args: ModelConstructorParameters) {
    super(...args);
    makeObservable(this);
  }

  @computed
  get boundingSphere() {
    if (this.dataProvider?.layers) {
      return BoundingSphere.fromBoundingSpheres(
        this.dataProvider.layers
          .map((layer) => layer.tileset?.boundingSphere)
          .filter(isDefined)
      );
    }
  }

  async forceLoadMapItems() {
    if (!isDefined(this.url)) {
      throw `\`url\` is not defined for ${getName(this)}`;
    }

    const resource = new Resource(this.url);
    if (this.token) {
      resource.appendQueryParameters({
        token: this.token
      });
    }

    const i3sProvider = await I3SDataProvider.fromUrl(resource, {
      showFeatures: this.allowFeaturePicking,
      geoidTiledTerrainProvider: this.terrainURL
        ? await ArcGISTiledElevationTerrainProvider.fromUrl(this.terrainURL)
        : undefined
    });

    runInAction(() => {
      this.dataProvider = i3sProvider;
    });
  }

  /**
   * This function should return null if allowFeaturePicking = false
   * @param _screenPosition
   * @param pickResult
   */
  buildFeatureFromPickResult(
    _screenPosition: Cartesian2 | undefined,
    pickResult: any
  ) {
    if (
      this.allowFeaturePicking &&
      isDefined(pickResult.content) &&
      isDefined(pickResult.content.tile.i3sNode) &&
      isDefined(pickResult.featureId) &&
      _screenPosition
    ) {
      const i3sNode: I3SNode = pickResult.content.tile.i3sNode;
      return i3sNode.loadFields().then(() => {
        const fields = i3sNode.getFieldsForFeature(pickResult.featureId);
        const result = new TerriaFeature({
          properties: fields
        });
        result._cesium3DTileFeature = pickResult;
        return result;
      });
    }
    return undefined;
  }

  @computed
  get mapItems() {
    if (this.isLoadingMapItems || !isDefined(this.dataProvider)) {
      return [];
    }
    if (this.dataProvider.isDestroyed()) {
      this.forceLoadMapItems();
    }
    if (this.dataProvider) {
      this.dataProvider.show = this.show;

      this.dataProvider.layers.forEach((layer) => {
        const tileset = layer.tileset;

        if (tileset) {
          tileset.style = toJS(this.cesiumTileStyle);
          tileset.shadows = this.cesiumShadows;
          // @ts-expect-error - Attach terria catalog item to tileset
          tileset._catalogItem = this;
          if (this.lightingFactor && tileset.imageBasedLighting) {
            tileset.imageBasedLighting.imageBasedLightingFactor =
              new Cartesian2(...this.lightingFactor);
          }

          const key = this
            .colorBlendMode as keyof typeof Cesium3DTileColorBlendMode;
          const colorBlendMode = Cesium3DTileColorBlendMode[key];
          if (colorBlendMode !== undefined)
            tileset.colorBlendMode = colorBlendMode;
          tileset.colorBlendAmount = this.colorBlendAmount;
        }
      });
    }
    return [this.dataProvider];
  }

  @override
  get shortReport(): string | undefined {
    if (this.terria.currentViewer.type === "Leaflet") {
      return i18next.t("models.commonModelErrors.3dTypeIn2dMode", this);
    }
    return super.shortReport;
  }

  get typeName() {
    return i18next.t("core.dataType.i3s");
  }
}
