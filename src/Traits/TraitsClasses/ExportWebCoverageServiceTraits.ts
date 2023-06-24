import objectArrayTrait from "../Decorators/objectArrayTrait";
import objectTrait from "../Decorators/objectTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import mixTraits from "../mixTraits";
import ModelTraits from "../ModelTraits";
import ExportableTraits from "./ExportableTraits";

export class KeyValueTraits extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "Key",
    description: "Key string."
  })
  key?: string;

  @primitiveTrait({
    type: "string",
    name: "Value",
    description: "Value string."
  })
  value?: string;
}

export class WebCoverageServiceParameterTraits extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "Output CRS",
    description: 'Output CRS (in EPSG format - eg "EPSG:4326").'
  })
  outputCrs?: string;

  @primitiveTrait({
    type: "string",
    name: "Output format",
    description: "File format of output (defaults to GeoTIFF)."
  })
  outputFormat: string = "image/geotiff";

  @objectArrayTrait({
    type: KeyValueTraits,
    idProperty: "key",
    name: "WCS subsets",
    description:
      'Array of key-value pairs for subsets to be included in query parameters. For example `{key: "Time", value: "2020"}` will add query parameter `subset=Time("2020")`'
  })
  subsets?: KeyValueTraits[];

  @objectArrayTrait({
    type: KeyValueTraits,
    idProperty: "key",
    name: "Duplicate subset values",
    description:
      "If multiple values have been detected for a particular subset ID (key), then we can only use the first one as WCS only supports one value per subset. Each element in this array represents the **actual** value used for a subset which has multiple values."
  })
  duplicateSubsetValues?: KeyValueTraits[];

  @objectArrayTrait({
    type: KeyValueTraits,
    idProperty: "index",
    merge: false,
    name: "Additional key-value parameters to add as URL query parameters",
    description:
      "Each key-value will be added to URL like so - `someurl.com?key=value`."
  })
  additionalParameters?: KeyValueTraits[];
}

export default class ExportWebCoverageServiceTraits extends mixTraits(
  ExportableTraits
) {
  @primitiveTrait({
    type: "string",
    name: "Linked WCS URL",
    description:
      "Gets or sets the URL of a WCS that enables clip-and-ship for this WMS item."
  })
  linkedWcsUrl?: string;

  @primitiveTrait({
    type: "string",
    name: "Linked WCS Coverage Name",
    description:
      "Gets or sets the coverage name for linked WCS for clip-and-ship."
  })
  linkedWcsCoverage?: string;

  @objectTrait({
    type: WebCoverageServiceParameterTraits,
    name: "Linked WCS Parameters",
    description:
      "WCS Parameters included in `GetCoverage` requests (for clip-and-ship)."
  })
  linkedWcsParameters?: WebCoverageServiceParameterTraits;
}
