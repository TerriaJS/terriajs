import ModelTraits from "./ModelTraits";
import primitiveTrait from "./primitiveTrait";

export default class LoadFeatureInfoTraits extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "Feature Info Url template",
    description:
      "A template URL string for fetching feature info. Template values of the form {x} will be replaced with corresponding property values from the picked feature."
  })
  featureInfoUrlTemplate?: string;
}
