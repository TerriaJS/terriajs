import mixTraits from "./mixTraits";
import primitiveTrait from "./primitiveTrait";
import TableTraits from "./TableTraits";
import UrlTraits from "./UrlTraits";
import FeatureInfoTraits from "./FeatureInfoTraits";

export default class CsvCatalogItemTraits extends mixTraits(
  FeatureInfoTraits,
  UrlTraits,
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
}
