import objectTrait from "../Decorators/objectTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import mixTraits from "../mixTraits";
import ModelTraits from "../ModelTraits";
import AutoRefreshingTraits from "./AutoRefreshingTraits";
import TableTraits from "./Table/TableTraits";
import UrlTraits from "./UrlTraits";

class PollingTraits extends ModelTraits {
  @primitiveTrait({
    name: "Seconds",
    description: "Time in seconds to wait before polling for new data.",
    type: "number"
  })
  seconds?: number;

  @primitiveTrait({
    name: "url",
    description:
      "The URL to poll for new data. If undefined, uses the catalog item `url` if there is one.",
    type: "string"
  })
  url?: string;

  @primitiveTrait({
    name: "shouldReplaceData",
    description:
      "If true, the new data replaces the existing data, otherwise the new data will be appended to the old data.",
    type: "boolean"
  })
  shouldReplaceData = true;
}

export default class CsvCatalogItemTraits extends mixTraits(
  AutoRefreshingTraits,
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

  @primitiveTrait({
    name: "Ignore rows starting with comment",
    description:
      "Any rows of a CSV starting with '#' or '//' will be ignored. A value of `undefined` will be treated the same as `false`.",
    type: "boolean"
  })
  ignoreRowsStartingWithComment?: boolean;

  @objectTrait({
    name: "Polling",
    description: "Polling configuration",
    type: PollingTraits
  })
  polling?: PollingTraits;
}
