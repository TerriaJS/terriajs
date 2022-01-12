import primitiveArrayTrait from "../Decorators/primitiveArrayTrait";
import mixTraits from "../mixTraits";
import CatalogMemberReferenceTraits from "./CatalogMemberReferenceTraits";
import UrlTraits from "./UrlTraits";
import primitiveTrait from "../Decorators/primitiveTrait";

export default class TerriaReferenceTraits extends mixTraits(
  UrlTraits,
  CatalogMemberReferenceTraits
) {
  @primitiveTrait({
    name: "Is Open",
    description:
      "True if this group is open and its contents are visible; otherwise, false. (This only applies if `isGroup = true`)",
    type: "boolean"
  })
  isOpen?: boolean;

  @primitiveArrayTrait({
    type: "string",
    name: "Path",
    description:
      "The path to the catalog item or group in the target catalog file given as a list of IDs. If not given, Terria will create a pseudo-group with all the catalog items in the catalog file as its members."
  })
  path?: string[];
}
