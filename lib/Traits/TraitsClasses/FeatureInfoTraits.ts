import ModelTraits from "../ModelTraits";
import objectTrait from "../Decorators/objectTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import anyTrait from "../Decorators/anyTrait";
import mixTraits from "../mixTraits";
import CatalogMemberTraits from "./CatalogMemberTraits";
import MappableTraits from "./MappableTraits";

class FeatureInfoFormatTraits extends ModelTraits {
  @primitiveTrait({
    type: "number",
    name: "Maximum Fraction Digits",
    description:
      "To reduce the number of decimal places to a maximum of X digits."
  })
  maximumFractionDigits: number = 20;

  @primitiveTrait({
    type: "number",
    name: "Minimum Fraction Digits",
    description:
      "To increase the number of decimal places to a minimum of X digits."
  })
  minimumFractionDigits: number = 0;

  @primitiveTrait({
    type: "boolean",
    name: "Use grouping",
    description: "To show thousands separators"
  })
  useGrouping: boolean = true;

  @primitiveTrait({
    type: "string",
    name: "Type",
    description: "Set to 'datetime' if you want to format as a date time"
  })
  type?: string;

  @primitiveTrait({
    type: "string",
    name: "Datetime format",
    description:
      "A date format style using the npm dateformat package, e.g. 'dd-mm-yyyy HH:MM:ss' or 'isoDateTime'"
  })
  format?: string;
}

export class FeatureInfoTemplateTraits extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "Name template",
    description: "A mustache template string for formatting name"
  })
  name?: string;

  @primitiveTrait({
    type: "string",
    name: "Template",
    description: "A Mustache template string for formatting description",
    isNullable: false
  })
  template?: string;

  @anyTrait({
    name: "Partials",
    description:
      "An object, mapping partial names to a template string. Defines the partials used in Template."
  })
  partials?: { [partial_name: string]: string };

  @anyTrait({
    name: "Formats",
    description: "An object, mapping field names to formatting options."
  })
  formats?: { [key_name: string]: FeatureInfoFormatTraits };
}

/** Note: MappableTraits has the following:
 * - featureInfoTemplate
 * - showStringIfPropertyValueIsNull
 *
 * FeatureInfoUrlTemplateTraits is used by FeatureInfoUrlTemplateMixin
 */
export default class FeatureInfoUrlTemplateTraits extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "Feature Info Url template",
    description:
      "A template URL string for fetching feature info. Template values of the form {x} will be replaced with corresponding property values from the picked feature."
  })
  featureInfoUrlTemplate?: string;
}
