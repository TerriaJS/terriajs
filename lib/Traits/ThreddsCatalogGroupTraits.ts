import { JsonObject } from "../Core/Json";
import anyTrait from "./anyTrait";
import CatalogMemberTraits from "./CatalogMemberTraits";
import ArcGisPortalSharedTraits from "./ArcGisPortalSharedTraits";
import GroupTraits from "./GroupTraits";
import mixTraits from "./mixTraits";
import primitiveArrayTrait from "./primitiveArrayTrait";
import primitiveTrait from "./primitiveTrait";
import UrlTraits from "./UrlTraits";

export default class ArcGisPortalCatalogGroupTraits extends mixTraits(
  GroupTraits,
  UrlTraits,
  CatalogMemberTraits
) {}
