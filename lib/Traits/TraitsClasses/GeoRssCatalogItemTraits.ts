import primitiveTrait from "../Decorators/primitiveTrait";
import mixTraits from "../mixTraits";
import { GeoJsonTraits } from "./GeoJsonTraits";

export default class GeoRssCatalogItemTraits extends mixTraits(GeoJsonTraits) {
  @primitiveTrait({
    type: "string",
    name: "geoRssString",
    description: "A GeoRSSstring"
  })
  geoRssString?: string;
}
