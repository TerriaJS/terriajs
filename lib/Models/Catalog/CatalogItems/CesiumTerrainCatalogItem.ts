import { computed } from "mobx";
import CesiumTerrainProvider from "terriajs-cesium/Source/Core/CesiumTerrainProvider";
import IonResource from "terriajs-cesium/Source/Core/IonResource";
import MappableMixin from "../../../ModelMixins/MappableMixin";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import UrlMixin from "../../../ModelMixins/UrlMixin";
import CesiumTerrainCatalogItemTraits from "../../../Traits/TraitsClasses/CesiumTerrainCatalogItemTraits";
import CreateModel from "../../Definition/CreateModel";

export default class CesiumTerrainCatalogItem extends UrlMixin(
  MappableMixin(CatalogMemberMixin(CreateModel(CesiumTerrainCatalogItemTraits)))
) {
  static type = "cesium-terrain";

  get type() {
    return CesiumTerrainCatalogItem.type;
  }

  protected forceLoadMapItems(): Promise<void> {
    return Promise.resolve();
  }

  @computed
  get mapItems() {
    let resource: string | Promise<IonResource> = this.url!;
    if (this.ionAssetId !== undefined) {
      resource = IonResource.fromAssetId(this.ionAssetId, {
        accessToken:
          this.ionAccessToken ||
          this.terria.configParameters.cesiumIonAccessToken,
        server: this.ionServer
      });
      // Deal with errors from this better
    }

    return [
      new CesiumTerrainProvider({
        url: resource,
        credit: this.attribution
      })
    ];
  }
}
