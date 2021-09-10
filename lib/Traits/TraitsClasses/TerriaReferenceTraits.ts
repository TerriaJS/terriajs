import primitiveArrayTrait from "../Decorators/primitiveArrayTrait";
import mixTraits from "../mixTraits";
import CatalogMemberReferenceTraits from "./CatalogMemberReferenceTraits";
import UrlTraits from "./UrlTraits";

export default class TerriaReferenceTraits extends mixTraits(
  UrlTraits,
  CatalogMemberReferenceTraits
) {
  @primitiveArrayTrait({
    type: "string",
    name: "Path",
    description:
      "The path to the catalog item or group in the target catalog file given as a list of IDs. If not given, Terria will create a pseudo-group with all the catalog items in the catalog file as its members."
  })
  path?: string[];
}
