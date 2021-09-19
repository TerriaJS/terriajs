import primitiveTrait from "../Decorators/primitiveTrait";
import anyTrait from "../Decorators/anyTrait";
import JsonObject from "../../Core/Json";
import objectArrayTrait from "../Decorators/objectArrayTrait";
import CkanResourceFormatTraits from "./CkanResourceFormatTraits";
import mixTraits from "../mixTraits";

export default class CkanSharedTraits extends mixTraits() {
  @anyTrait({
    name: "Item Properties",
    description:
      "An object of properties that will be set on the item created from the CKAN resource."
  })
  itemProperties?: JsonObject;

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
    name:
      "Use combination of dataset and resource name where multiple resources",
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
}
