import { traitClass } from "../Trait";
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

@traitClass({
  description: `Creates a 3d tiles item in the catalog from an ION Asset ID.
  <strong>Note:</strong> <i>Instead of specifying <b>ionAssetId</b> property, you can also provide a URL, for example, <code>"url": "https://storage.googleapis.com/vic-datasets-public/1ce41fe7-aed2-4ad3-be4d-c38b715ce9af/v1/tileset.json"</code>.</i>`,
  example: {
    type: "3d-tiles",
    ionAssetId: 69380,
    name: "CoM Melbourne 3D Photo Mesh",
    id: "some-unique-id"
  }
})
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
