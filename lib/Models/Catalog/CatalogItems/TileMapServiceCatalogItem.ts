import { computed, makeObservable, observable, runInAction } from "mobx";
import TileMapServiceImageryProvider from "terriajs-cesium/Source/Scene/TileMapServiceImageryProvider";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import MappableMixin, { MapItem } from "../../../ModelMixins/MappableMixin";
import TileMapServiceCatalogItemTraits from "../../../Traits/TraitsClasses/TileMapServiceCatalogItemTraits";
import CreateModel from "../../Definition/CreateModel";
import { ModelConstructorParameters } from "../../Definition/Model";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";

/**
 * A catalog item that loads a Tile Map Service imagery tileset created using
 * MapTiler or gdal2tiles.
 */
export default class TileMapServiceCatalogItem extends MappableMixin(
  CatalogMemberMixin(CreateModel(TileMapServiceCatalogItemTraits))
) {
  static readonly type = "tms";

  constructor(...args: ModelConstructorParameters) {
    super(...args);
    makeObservable(this);
  }

  @observable
  private imageryProvider: TileMapServiceImageryProvider | undefined;

  get type() {
    return TileMapServiceCatalogItem.type;
  }

  protected async forceLoadMapItems(): Promise<void> {
    let imageryProvider: TileMapServiceImageryProvider | undefined;
    if (this.url) {
      imageryProvider = await TileMapServiceImageryProvider.fromUrl(
        proxyCatalogItemUrl(this, this.url),
        {
          minimumLevel: this.minimumLevel,
          maximumLevel: this.maximumLevel,
          tileWidth: this.tileWidth,
          tileHeight: this.tileHeight,
          credit: this.attribution
        }
      );
    }

    runInAction(() => {
      this.imageryProvider = imageryProvider;
    });
  }

  @computed
  get mapItems(): MapItem[] {
    return this.imageryProvider
      ? [
          {
            imageryProvider: this.imageryProvider,
            show: this.show,
            alpha: this.opacity,
            clippingRectangle: this.clipToRectangle
              ? this.cesiumRectangle
              : undefined
          }
        ]
      : [];
  }
}
