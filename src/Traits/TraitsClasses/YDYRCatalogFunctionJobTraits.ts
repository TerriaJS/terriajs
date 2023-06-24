import mixTraits from "../mixTraits";
import UrlTraits from "./UrlTraits";
import CatalogFunctionJobTraits from "./CatalogFunctionJobTraits";
import primitiveTrait from "../Decorators/primitiveTrait";

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

  @primitiveTrait({
    type: "string",
    name: "Result ID",
    description: "Result ID for YDYR API."
  })
  resultId?: string;
}
