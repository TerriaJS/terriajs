import CatalogMemberTraits from "./CatalogMemberTraits";
import anyTrait from "../Decorators/anyTrait";
import { JsonObject } from "../../Core/Json";
import mixTraits from "../mixTraits";

export default class CatalogFunctionTraits extends mixTraits(
  CatalogMemberTraits
) {
  @anyTrait({
    name: "Parameters",
    description: "Function parameters (only contains key-value pairs)."
  })
  parameters?: JsonObject;
}
