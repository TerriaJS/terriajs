import mixTraits from "./mixTraits";
import CatalogMemberTraits from "./CatalogMemberTraits";
import UrlTraits from "./UrlTraits";
import MappableTraits from "./MappableTraits";
import RasterLayerTraits from "./RasterLayerTraits";
import primitiveTrait from "./primitiveTrait";
import primitiveArrayTrait from "./primitiveArrayTrait";

export default class OpenStreetMapCatalogItemTraits extends mixTraits(
  RasterLayerTraits,
  UrlTraits,
  MappableTraits,
  CatalogMemberTraits
) {
  @primitiveTrait({
    name: "File extension",
    description: "The file extension used to retrieve Open Street Map data",
    type: "string"
  })
  fileExtension = "png";

  @primitiveArrayTrait({
    name: "Subdomains",
    description:
      "Array of subdomains, one of which will be prepended to each tile URL. This is useful for overcoming browser limit on the number of simultaneous requests per host.",
    type: "string"
  })
  subdomains: string[] = [];

  @primitiveTrait({
    name: "Attribution",
    description: "The attribution to display with the data.",
    type: "string"
  })
  attribution?: string;

  @primitiveTrait({
    name: "Maximum Level",
    description: "The maximum level of details to fetch",
    type: "number"
  })
  maximumLevel = 25;
}
