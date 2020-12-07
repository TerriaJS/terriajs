import CreateModel from "../../lib/Models/CreateModel";
import { MapItem } from "../../lib/Models/Mappable";
import mixTraits from "../../lib/Traits/mixTraits";
import ShowableTraits from "../../lib/Traits/ShowableTraits";
import UrlTraits from "../../lib/Traits/UrlTraits";

export default class SimpleCatalogItem extends CreateModel(
  mixTraits(UrlTraits, ShowableTraits)
) {
  mapItems: MapItem[] = [];

  loadMapItems() {}
}
