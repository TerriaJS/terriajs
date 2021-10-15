import { GeoJsonTraits } from "./GeoJsonTraits";
import mixTraits from "../mixTraits";
import CatalogMemberTraits from "./CatalogMemberTraits";

export default class ShapefileCatalogItemTraits extends mixTraits(
  GeoJsonTraits,
  CatalogMemberTraits
) {}
