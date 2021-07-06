import CatalogMemberReferenceTraits from "./CatalogMemberReferenceTraits";
import mixTraits from "../mixTraits";
import primitiveTrait from "../Decorators/primitiveTrait";
import UrlTraits from "./UrlTraits";

export default class UrlReferenceTraits extends mixTraits(
  CatalogMemberReferenceTraits,
  UrlTraits
) {
  @primitiveTrait({
    name: "Allow Load",
    description:
      "Whether it's ok to attempt to load the URL and detect failures.",
    type: "boolean"
  })
  allowLoad?: boolean = true;
}
