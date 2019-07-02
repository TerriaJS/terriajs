import { computed } from "mobx";
import Cartesian2 from "terriajs-cesium/Source/Core/Cartesian2";
import clone from "terriajs-cesium/Source/Core/clone";
import IonResource from "terriajs-cesium/Source/Core/IonResource";
import Resource from "terriajs-cesium/Source/Core/Resource";
import Cesium3DTileFeature from "terriajs-cesium/Source/Scene/Cesium3DTileFeature";
import Cesium3DTileset from "terriajs-cesium/Source/Scene/Cesium3DTileset";
import Cesium3DTileStyle from "terriajs-cesium/Source/Scene/Cesium3DTileStyle";
import ShadowMode from "terriajs-cesium/Source/Scene/ShadowMode";
import isDefined from "../Core/isDefined";
import loadJson from "../Core/loadJson";
import AsyncMappableMixin from "../ModelMixins/AsyncMappableMixin";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import Cesium3DTilesCatalogItemTraits, {
  OptionsTraits
} from "../Traits/Cesium3DCatalogItemTraits";
import CreateModel from "./CreateModel";
import Feature from "./Feature";
import Mappable from "./Mappable";
import proxyCatalogItemUrl from "./proxyCatalogItemUrl";
import raiseErrorToUser from "./raiseErrorToUser";

class ExtendedCesium3DTileset extends Cesium3DTileset {
  _catalogItem?: Cesium3DTilesCatalogItem;
}

export default class Cesium3DTilesCatalogItem
  extends AsyncMappableMixin(
    CatalogMemberMixin(CreateModel(Cesium3DTilesCatalogItemTraits))
  )
  implements Mappable {
  static readonly type = "3d-tiles";
  readonly type = Cesium3DTilesCatalogItem.type;
  readonly typeName = "Cesium 3D Tiles";

  readonly canZoomTo = true;
  readonly showsInfo = true;

  private tileset?: ObservableCesium3DTileset;

  get isMappable() {
    return true;
  }

  protected forceLoadMetadata() {
    return Promise.resolve();
  }

  protected get loadMapItemsPromise() {
    return (async () => {
      if (!isDefined(this.url) && !isDefined(this.ionAssetId)) {
        return;
      }

      let resource: IonResource | Resource | undefined;
      if (isDefined(this.ionAssetId)) {
        try {
          resource = await IonResource.fromAssetId(this.ionAssetId, {
            accessToken:
              this.ionAccessToken ||
              this.terria.configParameters.cesiumIonAccessToken,
            server: this.ionServer
          });
        } catch (e) {
          raiseErrorToUser(this.terria, e);
        }
      } else if (isDefined(this.url)) {
        resource = new Resource({ url: this.url });
      }

      if (!isDefined(resource)) {
        return;
      }

      let options: any = {};
      if (isDefined(this.options)) {
        Object.keys(OptionsTraits.traits).forEach(name => {
          options[name] = (<any>this).options[name];
        });
      }

      this.tileset = new ExtendedCesium3DTileset({
        ...options,
        url: resource
      });
      this.tileset._catalogItem = this;
    })();
  }

  @computed get showExpressionFromFilters() {
    if (!isDefined(this.filters)) {
      return;
    }
    const terms = this.filters.map(filter => {
      if (!isDefined(filter.property)) {
        return "";
      }

      const property =
        "${feature['" + filter.property.replace(/'/g, "\\'") + "']}";
      const min =
        isDefined(filter.minimumValue) &&
        isDefined(filter.minimumShown) &&
        filter.minimumShown > filter.minimumValue
          ? property + " >= " + filter.minimumShown
          : "";
      const max =
        isDefined(filter.maximumValue) &&
        isDefined(filter.maximumShown) &&
        filter.maximumShown < filter.maximumValue
          ? property + " <= " + filter.maximumShown
          : "";
      return [min, max].filter(x => x.length > 0).join(" && ");
    });

    const showExpression = terms.join("&&");
    if (showExpression.length > 0) {
      return showExpression;
    }
  }

  @computed get cesiumTileStyle() {
    if (!isDefined(this.style) && !isDefined(this.showExpressionFromFilters)) {
      return;
    }
    const style = clone(this.style || {});
    if (isDefined(this.showExpressionFromFilters)) {
      style.show = this.showExpressionFromFilters;
    }
    return new Cesium3DTileStyle(style);
  }

  @computed get cesiumShadows() {
    switch (this.shadows.toLowerCase()) {
      case "none":
        return ShadowMode.DISABLED;
      case "both":
        return ShadowMode.ENABLED;
      case "cast":
        return ShadowMode.CAST_ONLY;
      case "receive":
        return ShadowMode.RECEIVE_ONLY;
      default:
        return ShadowMode.DISABLED;
    }
  }

  @computed get mapItems() {
    if (this.isLoadingMapItems || !isDefined(this.tileset)) {
      return [];
    }

    this.tileset.style = this.cesiumTileStyle;
    this.tileset.shadows = this.cesiumShadows;
    this.tileset.show = this.show;
    return [this.tileset];
  }

  getFeaturesFromPickResult(_screenPosition: Cartesian2, pickResult: any) {
    if (pickResult instanceof Cesium3DTileFeature) {
      const properties: { [name: string]: unknown } = {};
      pickResult.getPropertyNames().forEach(name => {
        properties[name] = pickResult.getProperty(name);
      });

      const result = new Feature({
        properties: properties
      });

      result._catalogItem = this;
      result._cesium3DTileFeature = pickResult;

      (async () => {
        if (isDefined(this.featureInfoUrlTemplate)) {
          const resource = new Resource({
            url: proxyCatalogItemUrl(this, this.featureInfoUrlTemplate, "0d"),
            templateValues: properties
          });
          try {
            const featureInfo = await loadJson(resource);
            Object.keys(featureInfo).forEach(property => {
              result.properties.addProperty(property, featureInfo[property]);
            });
          } catch (e) {
            result.properties.addProperty(
              "Error",
              "Unable to retrieve feature details from:\n\n" + resource.url
            );
          }
        }
      })();
      return result;
    }
  }
}
