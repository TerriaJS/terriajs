import i18next from "i18next";
import { computed, makeObservable, observable, override, toJS } from "mobx";
import BoundingSphere from "terriajs-cesium/Source/Core/BoundingSphere";
import Cartesian2 from "terriajs-cesium/Source/Core/Cartesian2";
import isDefined from "../../../Core/isDefined";
import I3SCatalogItemTraits from "../../../Traits/TraitsClasses/I3SCatalogItemTraits";
import CreateModel from "../../Definition/CreateModel";
import { ModelConstructorParameters } from "../../Definition/Model";
import MappableMixin from "../../../ModelMixins/MappableMixin";
import UrlMixin from "../../../ModelMixins/UrlMixin";
import I3SDataProvider from "terriajs-cesium/Source/Scene/I3SDataProvider";
import CatalogMemberMixin, {
  getName
} from "../../../ModelMixins/CatalogMemberMixin";
import ArcGISTiledElevationTerrainProvider from "terriajs-cesium/Source/Core/ArcGISTiledElevationTerrainProvider";
import Cesium3dTilesStyleMixin from "../../../ModelMixins/Cesium3dTilesStyleMixin";
import ShadowMixin from "../../../ModelMixins/ShadowMixin";
import Cesium3DTileColorBlendMode from "terriajs-cesium/Source/Scene/Cesium3DTileColorBlendMode";

export default class I3SCatalogItem extends Cesium3dTilesStyleMixin(
  ShadowMixin(
    MappableMixin(
      UrlMixin(CatalogMemberMixin(CreateModel(I3SCatalogItemTraits)))
    )
  )
) {
  static readonly type = "I3S";
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
    this.dataProvider = await I3SDataProvider.fromUrl(this.url, {
      geoidTiledTerrainProvider: this.terrainURL
        ? await ArcGISTiledElevationTerrainProvider.fromUrl(this.terrainURL)
        : undefined
    });
  }

  @computed
  get mapItems() {
    if (this.isLoadingMapItems || !isDefined(this.dataProvider)) {
      return [];
    }
    if (this.dataProvider) {
      this.dataProvider.show = this.show;

      this.dataProvider.layers.forEach((layer) => {
        const tileset = layer.tileset;

        if (tileset) {
          tileset.style = toJS(this.cesiumTileStyle);
          tileset.shadows = this.cesiumShadows;
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
