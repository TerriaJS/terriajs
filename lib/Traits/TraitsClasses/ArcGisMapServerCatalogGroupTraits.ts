import CatalogMemberTraits from "./CatalogMemberTraits";
import GroupTraits from "./GroupTraits";
import mixTraits from "../mixTraits";
import UrlTraits from "./UrlTraits";
import MappableTraits from "./MappableTraits";
import FeatureInfoTraits from "./FeatureInfoTraits";

export default class ArcGisMapServerCatalogGroupTraits extends mixTraits(
  GroupTraits,
  UrlTraits,
  CatalogMemberTraits,
  MappableTraits,
  FeatureInfoTraits
) {}
