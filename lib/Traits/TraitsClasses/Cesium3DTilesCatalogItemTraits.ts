import mixTraits from "../mixTraits";
import CatalogMemberTraits from "./CatalogMemberTraits";
import Cesium3DTilesTraits from "./Cesium3dTilesTraits";
import FeatureInfoUrlTemplateTraits from "./FeatureInfoTraits";
import MappableTraits from "./MappableTraits";
import PlaceEditorTraits from "./PlaceEditorTraits";
import SearchableItemTraits from "./SearchableItemTraits";
import ShadowTraits from "./ShadowTraits";
import TransformationTraits from "./TransformationTraits";
import UrlTraits from "./UrlTraits";

/**
 * This is a description of the 3D Tiles Catalog Item
 * @example
 * {
 *   "type": "3d-tiles",
 *   "ionAssetId": "1234",
 *   "name": "My 3D-Tiles dataset"
 * }
 */
export default class Cesium3DTilesCatalogItemTraits extends mixTraits(
  SearchableItemTraits,
  PlaceEditorTraits,
  TransformationTraits,
  FeatureInfoUrlTemplateTraits,
  MappableTraits,
  UrlTraits,
  CatalogMemberTraits,
  ShadowTraits,
  Cesium3DTilesTraits
) {}
