import MappableMixin, { MapItem } from "../../lib/ModelMixins/MappableMixin";
import CreateModel from "../../lib/Models/Definition/CreateModel";
import MappableTraits from "../../lib/Traits/TraitsClasses/MappableTraits";
import mixTraits from "../../lib/Traits/mixTraits";
import UrlTraits from "../../lib/Traits/TraitsClasses/UrlTraits";

export default class SimpleCatalogItem extends MappableMixin(
  CreateModel(mixTraits(UrlTraits, MappableTraits))
) {
  protected forceLoadMapItems(): Promise<void> {
    return Promise.resolve();
  }
  mapItems: MapItem[] = [];
}
