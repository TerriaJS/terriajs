import mixTraits from "./mixTraits";
import primitiveTrait from "./primitiveTrait";
import TableTraits from "./TableTraits";
import UrlTraits from "./UrlTraits";
import FeatureInfoTraits from "./FeatureInfoTraits";
import DiscretelyTimeVaryingTraits from "./DiscretelyTimeVaryingTraits";

export default class CsvCatalogItemTraits extends mixTraits(
  FeatureInfoTraits,
  UrlTraits,
  DiscretelyTimeVaryingTraits,
  TableTraits
) {
  @primitiveTrait({
    name: "Character Set",
    description:
      "The character set of the CSV data, overriding the information provided by the server, if any.",
    type: "string"
  })
  characterSet?: string;

  @primitiveTrait({
    name: "CSV Data",
    description: "The actual CSV data, represented as a string.",
    type: "string"
  })
  csvString?: string;

  // TODO: move this to a common trait
  @primitiveTrait({
    type: "string",
    name: "URL Cache Duration",
    description:
      "The amount of time to cache the contents of the URL when it is accessed via the proxy."
  })
  cacheDuration?: string;
}
