import CreateModel from "../../lib/Models/CreateModel";
import Mappable, { MapItem } from "../../lib/Models/Mappable";
import mixTraits from "../../lib/Traits/mixTraits";
import ShowableTraits from "../../lib/Traits/ShowableTraits";
import UrlTraits from "../../lib/Traits/UrlTraits";
import MappableTraits from "../../lib/Traits/MappableTraits";

export default class SimpleCatalogItem
  extends CreateModel(mixTraits(UrlTraits, ShowableTraits, MappableTraits))
  implements Mappable {
  readonly isMappable = true;
  mapItems: MapItem[] = [];

  async loadMapItems() {}
}
