import mixTraits from "./mixTraits";
import UrlTraits from "./UrlTraits";
import CatalogFunctionJobTraits from "./CatalogFunctionJobTraits";
import primitiveTrait from "./primitiveTrait";

export default class YDYRCatalogFunctionJobTraits extends mixTraits(
  UrlTraits,
  CatalogFunctionJobTraits
) {
  @primitiveTrait({
    type: "string",
    name: "Job ID",
    description: "Job ID for YDYR API."
  })
  jobId?: string;
}
