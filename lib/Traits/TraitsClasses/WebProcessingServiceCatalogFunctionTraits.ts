import mixTraits from "../mixTraits";
import UrlTraits from "./UrlTraits";
import primitiveTrait from "../Decorators/primitiveTrait";
import CatalogFunctionTraits from "./CatalogFunctionTraits";

export default class WebProcessingServiceCatalogFunctionTraits extends mixTraits(
  CatalogFunctionTraits,
  UrlTraits
) {
  @primitiveTrait({
    type: "boolean",
    name: "Execute with HTTP GET",
    description:
      "If true, sends a `GET` request to the Execute endpoint instead of the default `POST` request."
  })
  executeWithHttpGet = false;

  @primitiveTrait({
    type: "boolean",
    name: "Store supported",
    description:
      "Indicates if the output can be stored by the WPS server and be accessed via a URL."
  })
  storeSupported?: boolean;

  @primitiveTrait({
    type: "boolean",
    name: "Status supported",
    description:
      "Indicates if Execute operation can return just the status information and perform the actual operation asynchronously."
  })
  statusSupported?: boolean;

  @primitiveTrait({
    type: "string",
    name: "Identifier",
    description: "The identifier for the process"
  })
  identifier?: string;
}
