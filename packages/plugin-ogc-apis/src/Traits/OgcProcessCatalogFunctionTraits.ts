import { mixTraits, primitiveTrait } from "terriajs-plugin-api";
import CatalogFunctionTraits from "terriajs/lib/Traits/TraitsClasses/CatalogFunctionTraits";
import UrlTraits from "terriajs/lib/Traits/TraitsClasses/UrlTraits";

export default class OgcProcessCatalogFunctionTraits extends mixTraits(
  UrlTraits,
  CatalogFunctionTraits
) {
  @primitiveTrait({
    type: "string",
    name: "Process ID",
    description: "Process ID"
  })
  processId?: string;

  @primitiveTrait({
    type: "string",
    name: "Process group ID",
    description:
      "Optional ID of the process group. If no URL is specified, then the process group's url is used to fetch the process definition."
  })
  processGroupId?: string;

  @primitiveTrait({
    type: "string",
    name: "Output group ID",
    description:
      "Optional ID of a group to place newly created jobs. Defaults to 'My data' group."
  })
  outputGroupId?: string;
}
