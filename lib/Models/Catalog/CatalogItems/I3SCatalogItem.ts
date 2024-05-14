import i18next from "i18next";
import {
  action,
  computed,
  makeObservable,
  observable,
  override,
  runInAction,
  toJS
} from "mobx";
import BoundingSphere from "terriajs-cesium/Source/Core/BoundingSphere";
import Cartesian2 from "terriajs-cesium/Source/Core/Cartesian2";
import isDefined from "../../../Core/isDefined";
import I3SCatalogItemTraits from "../../../Traits/TraitsClasses/I3SCatalogItemTraits";
import CreateModel from "../../Definition/CreateModel";
import { ModelConstructorParameters } from "../../Definition/Model";
import { ItemSearchResult } from "../../ItemSearchProviders/ItemSearchProvider";
import Cesium3DTilesCatalogItem from "./Cesium3DTilesCatalogItem";
import { CatalogMemberMixin, MappableMixin } from "terriajs-plugin-api";
import UrlMixin from "../../../ModelMixins/UrlMixin";
import I3SDataProvider from "terriajs-cesium/Source/Scene/I3SDataProvider";
import { getName } from "../../../ModelMixins/CatalogMemberMixin";
import Cesium3DTileStyle from "terriajs-cesium/Source/Scene/Cesium3DTileStyle";
import { clone, Color } from "terriajs-cesium";
import ShadowMode from "terriajs-cesium/Source/Scene/ShadowMode";
import ArcGISTiledElevationTerrainProvider from "terriajs-cesium/Source/Core/ArcGISTiledElevationTerrainProvider";

export default class I3SCatalogItem extends MappableMixin(
  UrlMixin(CatalogMemberMixin(CreateModel(I3SCatalogItemTraits)))
) {
  static readonly type = "I3S";
  readonly type = I3SCatalogItem.type;

  @observable
  private dataProvider?: I3SDataProvider;
  public boundingSphere: BoundingSphere | undefined;

  constructor(...args: ModelConstructorParameters) {
    super(...args);
    makeObservable(this);
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
    console.log(this);
    this.boundingSphere = BoundingSphere.fromBoundingSpheres(
      this.dataProvider.layers
        .map((layer) => layer.tileset?.boundingSphere)
        .filter(isDefined)
    );
    this.dataProvider.layers.forEach(({ tileset }) => {
      if (!tileset) {
        return;
      }
      /* Control "lightness" of textures */
      if (this.lightingFactor) {
        tileset.imageBasedLighting.imageBasedLightingFactor = new Cartesian2(
          ...this.lightingFactor
        );
      }
      tileset.shadows = ShadowMode.DISABLED;
      tileset.style = this.cesiumTileStyle;
    });
  }

  @computed get cesiumTileStyle() {
    if (
      !isDefined(this.style) &&
      (!isDefined(this.opacity) || this.opacity === 1) // &&
      // !isDefined(this.showExpressionFromFilters)
    ) {
      return;
    }
    // console.log(this.opacity);
    console.log("cts", this.opacity);

    const style = clone(toJS(this.style) || {});
    const opacity = clone(toJS(this.opacity));

    if (!isDefined(style.defines)) {
      style.defines = { opacity };
    } else {
      style.defines = Object.assign(style.defines, { opacity });
    }

    // Rewrite color expression to also use the models opacity setting
    if (!isDefined(style.color)) {
      // Some tilesets (eg. point clouds) have a ${COLOR} variable which
      // stores the current color of a feature, so if we have that, we should
      // use it, and only change the opacity.  We have to do it
      // component-wise because `undefined` is mapped to a large float value
      // (czm_infinity) in glsl in Cesium and so can only be compared with
      // another float value.
      //
      // There is also a subtle bug which prevents us from using an
      // expression in the alpha part of the rgba().  eg, using the
      // expression '${COLOR}.a === undefined ? ${opacity} : ${COLOR}.a * ${opacity}'
      // to generate an opacity value will cause Cesium to generate wrong
      // translucency values making the tileset translucent even when the
      // computed opacity is 1.0. It also makes the whole of the point cloud
      // appear white when zoomed out to some distance.  So for now, the only
      // solution is to discard the opacity from the tileset and only use the
      // value from the opacity trait.
      style.color =
        "(rgba(" +
        "(${COLOR}.r === undefined ? 1 : ${COLOR}.r) * 255," +
        "(${COLOR}.g === undefined ? 1 : ${COLOR}.g) * 255," +
        "(${COLOR}.b === undefined ? 1 : ${COLOR}.b) * 255," +
        "${opacity}" +
        "))";
    } else if (typeof style.color === "string") {
      // Check if the color specified is just a css color
      const cssColor = Color.fromCssColorString(style.color);
      if (isDefined(cssColor)) {
        style.color = `color('${style.color}', \${opacity})`;
      }
    }

    // if (isDefined(this.showExpressionFromFilters)) {
    //   style.show = toJS(this.showExpressionFromFilters);
    // }

    return new Cesium3DTileStyle(style);
  }

  get mapItems() {
    console.log("get map items");
    if (this.isLoadingMapItems || !isDefined(this.dataProvider)) {
      return [];
    }
    this.dataProvider.layers.forEach((layer) => {
      layer.tileset!.style = toJS(this.cesiumTileStyle);
      if (this.lightingFactor && layer.tileset) {
        layer.tileset.imageBasedLighting.imageBasedLightingFactor =
          new Cartesian2(...this.lightingFactor);
        console.log(
          "using lighting factor",
          layer.tileset.imageBasedLighting.imageBasedLightingFactor
        );
      }
    });
    return [this.dataProvider];
  }

  get typeName() {
    return i18next.t("models.cesiumTerrain.name3D");
  }
}
