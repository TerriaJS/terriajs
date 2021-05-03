import MappableMixin, { MapItem } from "../../lib/ModelMixins/MappableMixin";
import CreateModel from "../../lib/Models/CreateModel";
import MappableTraits from "../../lib/Traits/MappableTraits";
import mixTraits from "../../lib/Traits/mixTraits";
import ShowableTraits from "../../lib/Traits/ShowableTraits";
import UrlTraits from "../../lib/Traits/UrlTraits";

export default class SimpleCatalogItem extends MappableMixin(
  CreateModel(mixTraits(UrlTraits, ShowableTraits, MappableTraits))
) {
  protected forceLoadMapItems(): Promise<void> {
    return Promise.resolve();
  }
  mapItems: MapItem[] = [];
}
