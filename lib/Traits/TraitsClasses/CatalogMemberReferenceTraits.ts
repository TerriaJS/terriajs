import ModelTraits from "../ModelTraits";
import primitiveTrait from "../Decorators/primitiveTrait";

export default class CatalogMemberReferenceTraits extends ModelTraits {
  @primitiveTrait({
    name: "Name",
    description:
      "The name to use for this catalog member before the reference is loaded.",
    type: "string"
  })
  name?: string;

  @primitiveTrait({
    name: "Data Custodian",
    type: "string",
    description:
      "Gets or sets a description of the custodian of this data item."
  })
  dataCustodian?: string;

  @primitiveTrait({
    name: "Is a Group",
    description:
      "Is the target of this reference expected to be a catalog group?",
    type: "boolean"
  })
  isGroup?: boolean;

  @primitiveTrait({
    name: "Is a Function",
    description:
      "Is the target of this reference expected to be a catalog function?",
    type: "boolean"
  })
  isFunction?: boolean;

  @primitiveTrait({
    name: "Is Mappable",
    description: "Is the target of this reference expected to have map items?",
    type: "boolean"
  })
  isMappable?: boolean;

  @primitiveTrait({
    name: "Is Chartable",
    description:
      "Is the target of this reference expected to have chart items?",
    type: "boolean"
  })
  isChartable?: boolean;
}
