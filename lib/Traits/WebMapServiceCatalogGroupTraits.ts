import CatalogMemberTraits from "./CatalogMemberTraits";
import GetCapabilitiesTraits from "./GetCapabilitiesTraits";
import GroupTraits from "./GroupTraits";
import mixTraits from "./mixTraits";
import primitiveTrait from "./primitiveTrait";
import UrlTraits from "./UrlTraits";

export default class WebMapServiceCatalogGroupTraits extends mixTraits(
  GetCapabilitiesTraits,
  GroupTraits,
  UrlTraits,
  CatalogMemberTraits
) {
  @primitiveTrait({
    type: "boolean",
    name: "Flatten",
    description:
      "True to flatten the layers into a single list; false to use the layer hierarchy."
  })
  flatten?: boolean;
}
