import CatalogMemberTraits from "./CatalogMemberTraits";
import FeatureInfoTraits from "./FeatureInfoTraits";
import MappableTraits from "./MappableTraits";
import ShadowTraits from "./ShadowTraits";
import mixTraits from "../mixTraits";
import UrlTraits from "./UrlTraits";
import TransformationTraits from "./TransformationTraits";
import PlaceEditorTraits from "./PlaceEditorTraits";
import Cesium3DTilesTraits from "./Cesium3dTilesTraits";
import SearchableItemTraits from "./SearchableItemTraits";

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
  FeatureInfoTraits,
  MappableTraits,
  UrlTraits,
  CatalogMemberTraits,
  ShadowTraits,
  Cesium3DTilesTraits
) {}
