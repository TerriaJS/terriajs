import CatalogMemberTraits from "./CatalogMemberTraits";
import mixTraits from "./mixTraits";
import UrlTraits from "./UrlTraits";
import primitiveTrait from "./primitiveTrait";

export default class WebProcessingServiceCatalogFunctionTraits extends mixTraits(
  UrlTraits,
  CatalogMemberTraits
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
}
