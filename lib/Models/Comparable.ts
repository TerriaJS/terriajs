import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import MappableMixin from "../ModelMixins/MappableMixin";
import CatalogMemberTraits from "../Traits/CatalogMemberTraits";
import MappableTraits from "../Traits/MappableTraits";
import SplitterTraits from "../Traits/SplitterTraits";
import hasTraits from "./hasTraits";
import Model from "./Model";

export type Comparable = Model<
  SplitterTraits & CatalogMemberTraits & MappableTraits
> &
  MappableMixin.MappableMixin &
  CatalogMemberMixin.CatalogMemberMixin;

export function isComparableItem(item: any): item is Comparable {
  const isComparable =
    item &&
    MappableMixin.isMixedInto(item) &&
    CatalogMemberMixin.isMixedInto(item) &&
    (item as any).supportsSplitting &&
    hasTraits(item, MappableTraits, "show") &&
    hasTraits(item, CatalogMemberTraits, "name") &&
    hasTraits(item, SplitterTraits, "splitDirection");
  return isComparable;
}
