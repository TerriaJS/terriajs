import objectTrait from "../Decorators/objectTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import mixTraits from "../mixTraits";
import ModelTraits from "../ModelTraits";
import ExportableTraits from "./ExportableTraits";

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
