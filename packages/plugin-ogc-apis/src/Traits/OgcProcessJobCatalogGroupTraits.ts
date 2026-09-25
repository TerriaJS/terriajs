import {
  anyTrait,
  CatalogMemberTraits,
  mixTraits,
  primitiveTrait
} from "terriajs-plugin-api";
import { JsonObject } from "terriajs/lib/Core/Json";
import GroupTraits from "terriajs/lib/Traits/TraitsClasses/GroupTraits";
import UrlTraits from "terriajs/lib/Traits/TraitsClasses/UrlTraits";

export default class OgcProcessJobCatalogGroupTraits extends mixTraits(
  GroupTraits,
  CatalogMemberTraits,
  UrlTraits
) {
  @primitiveTrait({
    type: "string",
    name: "Process group ID",
    description:
      "Optional ID of the ogc-process-group to use as a source of URL and namespace for job IDs in this group."
  })
  processGroupId?: string;

  @primitiveTrait({
    type: "string",
    name: "Group by type",
    description:
      "Group by some type - currently 'process' | 'status' | 'flat' is supported. When not set, this group will show the jobs as a flat list."
  })
  groupByType?: string = "flat";

  @anyTrait({
    name: "Query parameters",
    description: "Additional query parameters to send to server"
  })
  queryParameters?: JsonObject;
}
