import CreateModel from "../../lib/Models/CreateModel";
import { MapItem } from "../../lib/Models/Mappable";
import UrlTraits from "../../lib/Traits/UrlTraits";

export default class SimpleCatalogItem extends CreateModel(UrlTraits) {
  mapItems: MapItem[] = [];
}
