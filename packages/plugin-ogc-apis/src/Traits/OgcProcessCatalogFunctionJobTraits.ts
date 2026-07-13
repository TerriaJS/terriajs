import { primitiveTrait } from "terriajs-plugin-api";
import mixTraits from "terriajs/lib/Traits/mixTraits";
import CatalogFunctionJobTraits from "terriajs/lib/Traits/TraitsClasses/CatalogFunctionJobTraits";
import LayerOrderingTraits from "terriajs/lib/Traits/TraitsClasses/LayerOrderingTraits";
import UrlTraits from "terriajs/lib/Traits/TraitsClasses/UrlTraits";

export default class OgcProcessCatalogFunctionJobTraits extends mixTraits(
  UrlTraits,
  CatalogFunctionJobTraits,
  LayerOrderingTraits // So that the jobs don't always stick to the top in workbench
) {
  @primitiveTrait({
    type: "string",
    name: "Job ID",
    description: "Job ID"
  })
  jobId?: string;

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
      "Optional process group id, used to show a link back to the origin process."
  })
  processGroupId?: string;
}
