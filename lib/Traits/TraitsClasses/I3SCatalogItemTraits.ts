import { traitClass } from "../Trait";
import mixTraits from "../mixTraits";
import CatalogMemberTraits from "./CatalogMemberTraits";
import I3STraits from "./I3STraits";
import FeatureInfoUrlTemplateTraits from "./FeatureInfoTraits";
import MappableTraits from "./MappableTraits";
import PlaceEditorTraits from "./PlaceEditorTraits";
import SearchableItemTraits from "./SearchableItemTraits";
import ShadowTraits from "./ShadowTraits";
import TransformationTraits from "./TransformationTraits";
import UrlTraits from "./UrlTraits";

@traitClass({
  description: `Creates an I3S item in the catalog from an slpk.`,
  example: {
    type: "I3S",
    name: "CoM Melbourne 3D Photo Mesh",
    id: "some-unique-id"
  }
})
export default class I3SCatalogItemTraits extends mixTraits(
  SearchableItemTraits,
  PlaceEditorTraits,
  TransformationTraits,
  FeatureInfoUrlTemplateTraits,
  MappableTraits,
  UrlTraits,
  CatalogMemberTraits,
  ShadowTraits,
  I3STraits
) {}
