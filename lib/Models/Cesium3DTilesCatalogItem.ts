import { computed, observable } from "mobx";
import IonResource from "terriajs-cesium/Source/Core/IonResource";
import Cesium3DTileset from "terriajs-cesium/Source/Scene/Cesium3DTileset";
import ShadowMode from "terriajs-cesium/Source/Scene/ShadowMode";
import isDefined from "../Core/isDefined";
import AsyncMappableMixin from "../ModelMixins/AsyncMappableMixin";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import Cesium3DTilesCatalogItemTraits, {
  OptionsTraits
} from "../Traits/Cesium3DCatalogItemTraits";
import CreateModel from "./CreateModel";
import Mappable from "./Mappable";
import raiseErrorToUser from "./raiseErrorToUser";

class ObservableCesium3DTileset extends Cesium3DTileset {
  @observable destroyed = false;

  destroy() {
    super.destroy();
    this.destroyed = true;
  }
}

// TODO: Styles & features.
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

  private _resource?: string | IonResource;

  get isMappable() {
    return true;
  }

  get resource() {
    return this._resource;
  }

  protected forceLoadMetadata() {
    return Promise.resolve();
  }

  protected get loadMapItemsPromise() {
    return (async () => {
      if (!isDefined(this.url)) {
        return;
      }

      let resource: string | IonResource = this.url;
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
      }

      this._resource = resource;
      return;
    })();
  }

  @computed get cesiumShadows() {
    switch (this.shadows && this.shadows.toLowerCase()) {
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

  // mapItems are recomputed when the current tileset is destroyed
  @computed get mapItems() {
    if (this.isLoadingMapItems) {
      return [];
    }

    const tileset = this.createNewTileset();
    return isDefined(tileset) && !tileset.destroyed ? [tileset] : [];
  }

  private createNewTileset() {
    if (!isDefined(this._resource)) {
      return;
    }

    let options: any = {};
    if (isDefined(this.options)) {
      Object.keys(OptionsTraits.traits).forEach(name => {
        options[name] = (<any>this).options[name];
      });
    }
    return new ObservableCesium3DTileset({
      ...options,
      url: this._resource,
      show: this.show,
      shadows: this.cesiumShadows
    });
  }
}
