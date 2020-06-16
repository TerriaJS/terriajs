import mixTraits from "./mixTraits";
import UrlTraits from "./UrlTraits";
import primitiveTrait from "./primitiveTrait";
import CatalogFunctionTraits from "./CatalogFunctionTraits";

export default class WebProcessingServiceCatalogFunctionTraits extends mixTraits(
  CatalogFunctionTraits,
  UrlTraits
) {
  @primitiveTrait({
    type: "string",
    name: "Identifier",
    description: "The identifier for the process"
  })
  identifier?: string;

  @primitiveTrait({
    type: "boolean",
    name: "Execute with HTTP GET",
    description:
      "If true, sends a `GET` request to the Execute endpoint instead of the default `POST` request."
  })
  executeWithHttpGet = false;

  @primitiveTrait({
    type: "string",
    name: "WPS Response URL",
    description: "An optional URL to fetch the WPS response"
  })
  wpsResponseUrl?: string;
}
