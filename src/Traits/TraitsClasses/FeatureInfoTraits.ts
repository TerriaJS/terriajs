import anyTrait from "../Decorators/anyTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import ModelTraits from "../ModelTraits";

/** Note these shouldn't be Traits as they are used in `@anyTrait FeatureInfoTemplateTraits.formats` */
export interface FeatureInfoFormat {
  /** To reduce the number of decimal places to a maximum of X digits. */
  maximumFractionDigits?: number;

  /** To increase the number of decimal places to a minimum of X digits. */
  minimumFractionDigits?: number;

  /** To show thousands separators */
  useGrouping?: boolean;

  /** Set to 'datetime' if you want to format as a date time */
  type?: string;

  /** A date format style using the npm dateformat package, e.g. 'dd-mm-yyyy HH:MM:ss' or 'isoDateTime' */
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

  @primitiveTrait({
    type: "boolean",
    name: "Show feature info download",
    description:
      "Show feature info download **if** a `template` has been provided. If no `template` is provided, then download will always show.",
    isNullable: false
  })
  showFeatureInfoDownloadWithTemplate: boolean = false;

  @anyTrait({
    name: "Partials",
    description:
      "An object, mapping partial names to a template string. Defines the partials used in Template."
  })
  partials?: Record<string, string>;

  @anyTrait({
    name: "Formats",
    description: "An object, mapping field names to formatting options."
  })
  formats?: Record<string, FeatureInfoFormat>;
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

  @primitiveTrait({
    type: "number",
    name: "Max feature request",
    description:
      "Max number of feature info requests to send to API url. Keep this number small to avoid sending to many requests to server (default 10)."
  })
  maxRequests: number = 10;
}
