import CatalogMemberTraits from "./CatalogMemberTraits";
import anyTrait from "../Decorators/anyTrait";
import { JsonObject } from "../../Core/Json";

export default class CatalogFunctionTraits extends CatalogMemberTraits {
  @anyTrait({
    name: "Parameters",
    description: "Function parameters (only contains key-value pairs)."
  })
  parameters?: JsonObject;
}
