import { JsonObject } from "../../Core/Json";
import anyTrait from "../Decorators/anyTrait";
import ModelTraits from "../ModelTraits";
import primitiveTrait from "../Decorators/primitiveTrait";

export default class CkanResourceFormatTraits extends ModelTraits {
  @primitiveTrait({
    name: "ID",
    description: "The ID of this distribution format.",
    type: "string"
  })
  id?: string;

  @primitiveTrait({
    name: "Format Regular Expression",
    description:
      "A regular expression that is matched against the distribution's format. This must be defined for this format to be used",
    type: "string"
  })
  formatRegex?: string;

  @primitiveTrait({
    name: "URL Regular Expression",
    description:
      "A regular expression that is matched against the url, this will only be used if `formatRegex` matches.",
    type: "string"
  })
  urlRegex?: string;

  @primitiveTrait({
    name: "Maximum file size (MB)",
    description:
      "The maximum allowed file size for this format (in megabytes).",
    type: "number"
  })
  maxFileSize?: number;

  @primitiveTrait({
    type: "boolean",
    name: "Only use if sole resource",
    description: `This resource will only match if no other resource types match for a given dataset. Like a "last-resort" resource. This will be ignored if \`useSingleResource\` is used`
  })
  onlyUseIfSoleResource?: boolean = false;

  @primitiveTrait({
    type: "boolean",
    name: "First match per resource",
    description: `Only use the first match per resource. If true, and a dataset has mupltiple resources which match this format, then the newest resource will be used (according to created property)`
  })
  firstMatchPerResource?: boolean = true;

  @anyTrait({
    name: "Definition",
    description:
      "The catalog member definition to use when the URL and Format regular expressions match. The `URL` property will also be set."
  })
  definition?: JsonObject | null;

  static isRemoval(format: CkanResourceFormatTraits) {
    return format.definition === null;
  }
}
