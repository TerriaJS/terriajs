import { JsonObject } from "../../Core/Json";
import anyTrait from "../Decorators/anyTrait";
import mixTraits from "../mixTraits";
import CatalogMemberTraits from "./CatalogMemberTraits";
import LegendOwnerTraits from "./LegendOwnerTraits";

export default class CatalogFunctionTraits extends mixTraits(
  CatalogMemberTraits,
  LegendOwnerTraits
) {
  @anyTrait({
    name: "Parameters",
    description: "Function parameters (only contains key-value pairs)."
  })
  parameters?: JsonObject;
}
