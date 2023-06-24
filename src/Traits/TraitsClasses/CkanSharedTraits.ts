import JsonObject from "../../Core/Json";
import anyTrait from "../Decorators/anyTrait";
import objectArrayTrait from "../Decorators/objectArrayTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import mixTraits from "../mixTraits";
import CkanResourceFormatTraits from "./CkanResourceFormatTraits";
import ReferenceTraits from "./ReferenceTraits";

export default class CkanSharedTraits extends mixTraits(ReferenceTraits) {
  @primitiveTrait({
    type: "boolean",
    name: "Use resource name",
    description: `True to use the name of the resource for the name of the catalog item; false to use the name of the dataset.`
  })
  useResourceName: boolean = false;

  @primitiveTrait({
    type: "boolean",
    name: "Use combination name where multiple resources",
    description: `Use a combination of the name and the resource format and dataset where there are multiple resources for a single dataset.`
  })
  useDatasetNameAndFormatWhereMultipleResources: boolean = true;

  @primitiveTrait({
    type: "boolean",
    name: "Use combination of dataset and resource name where multiple resources",
    description: `Use a combination of the name and the resource and dataset name where there are multiple resources for a single dataset.`
  })
  useCombinationNameWhereMultipleResources: boolean = false;

  @objectArrayTrait({
    name: "Supported Resource Formats",
    description:
      "The supported distribution formats and their mapping to Terria types. " +
      "These are listed in order of preference.",
    type: CkanResourceFormatTraits,
    idProperty: "id"
  })
  supportedResourceFormats?: CkanResourceFormatTraits[];

  @primitiveTrait({
    type: "boolean",
    name: "Use single resource",
    description: `Only use a single resource for each dataset. If multiple resources exist, the highest match from \`supportedResourceFormats\` will be used. If this is true, then \`useDatasetNameAndFormatWhereMultipleResources\` and \`useCombinationNameWhereMultipleResources\` will be ignored`
  })
  useSingleResource: boolean = false;
}
