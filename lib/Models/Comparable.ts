import MappableMixin from "../ModelMixins/MappableMixin";
import CatalogMemberTraits from "../Traits/CatalogMemberTraits";
import MappableTraits from "../Traits/MappableTraits";
import SplitterTraits from "../Traits/SplitterTraits";
import hasTraits from "./hasTraits";
import Model, { BaseModel } from "./Model";

export type Comparable = Model<
  SplitterTraits & CatalogMemberTraits & MappableTraits
> &
  MappableMixin.MappableMixin;

export function isComparableItem(item: any): item is Comparable {
  const isComparable =
    item &&
    MappableMixin.isMixedInto(item) &&
    (item as any).supportsSplitting &&
    hasTraits(item, MappableTraits, "show") &&
    hasTraits(item, CatalogMemberTraits, "name") &&
    hasTraits(item, SplitterTraits, "splitDirection");
  return isComparable;
}
