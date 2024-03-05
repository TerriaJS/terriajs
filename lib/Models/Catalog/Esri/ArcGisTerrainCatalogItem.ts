import { computed, makeObservable, observable } from "mobx";
import ArcGISTiledElevationTerrainProvider from "terriajs-cesium/Source/Core/ArcGISTiledElevationTerrainProvider";
import Credit from "terriajs-cesium/Source/Core/Credit";
import MappableMixin from "../../../ModelMixins/MappableMixin";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import UrlMixin from "../../../ModelMixins/UrlMixin";
import ArcGisTerrainCatalogItemTraits from "../../../Traits/TraitsClasses/ArcGisTerrainCatalogItemTraits";
import { ModelConstructorParameters } from "../../Definition/Model";
import CreateModel from "../../Definition/CreateModel";

export default class ArcGisTerrainCatalogItem extends UrlMixin(
  MappableMixin(CatalogMemberMixin(CreateModel(ArcGisTerrainCatalogItemTraits)))
) {
  static type = "arcgis-terrain";

  @observable _private_terrainProvider:
    | ArcGISTiledElevationTerrainProvider
    | undefined = undefined;

  constructor(...args: ModelConstructorParameters) {
    super(...args);
    makeObservable(this);
  }

  get type() {
    return ArcGisTerrainCatalogItem.type;
  }

  @computed
  get mapItems() {
    const provider = this._private_terrainProvider;
    if (provider) {
      // ArcGISTiledElevationTerrainProvider has no official way to override the
      // credit, so we write directly to the private field here.
      if (this.attribution)
        (provider as any)._credit = new Credit(this.attribution);
      return [provider];
    } else {
      return [];
    }
  }

  protected forceLoadMapItems(): Promise<void> {
    if (this.url === undefined) return Promise.resolve();
    return ArcGISTiledElevationTerrainProvider.fromUrl(this.url).then(
      (terrainProvider) => {
        this._private_terrainProvider = terrainProvider;
      }
    );
  }
}
