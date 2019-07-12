import ModelTraits from "./ModelTraits";
import objectTrait from "./objectTrait";
import primitiveTrait from "./primitiveTrait";
import anyTrait from "./anyTrait";

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
}

export default class FeatureInfoTraits extends ModelTraits {
  @objectTrait({
    type: FeatureInfoTemplateTraits,
    name: "Feature info template",
    description:
      "A template object for formatting content in feature info panel"
  })
  featureInfoTemplate?: FeatureInfoTemplateTraits;
}
