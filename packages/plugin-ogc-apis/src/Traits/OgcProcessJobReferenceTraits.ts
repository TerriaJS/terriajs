import { mixTraits, primitiveTrait } from "terriajs-plugin-api";
import CatalogMemberReferenceTraits from "terriajs/lib/Traits/TraitsClasses/CatalogMemberReferenceTraits";

export default class OgcProcessJobReferenceTraits extends mixTraits(
  CatalogMemberReferenceTraits
) {
  @primitiveTrait({
    type: "string",
    name: "Process group ID",
    description:
      "The ID of ogc-process-group to use as URL source. This is to avoid directly adding API URLs to share strata and prevent breaking share links if the API URL changes."
  })
  processGroupId?: string;

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
    name: "Is a Group",
    description:
      "Is the target of this reference expected to be a catalog group?",
    type: "boolean"
  })
  isGroup = true;
}
