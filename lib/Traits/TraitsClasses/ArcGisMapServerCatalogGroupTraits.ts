import CatalogMemberTraits from "./CatalogMemberTraits";
import GroupTraits from "./GroupTraits";
import mixTraits from "../mixTraits";
import UrlTraits from "./UrlTraits";
import anyTrait from "../Decorators/anyTrait";
import { JsonObject } from "../../Core/Json";

export default class ArcGisMapServerCatalogGroupTraits extends mixTraits(
  GroupTraits,
  UrlTraits,
  CatalogMemberTraits
) {
  @anyTrait({
    name: "Item Properties",
    description: "Sets traits on child ArcGisMapServerCatalogItem's"
  })
  itemProperties?: JsonObject;
}
