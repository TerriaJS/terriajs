import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import MappableMixin from "../ModelMixins/MappableMixin";
import CatalogMemberTraits from "../Traits/TraitsClasses/CatalogMemberTraits";
import MappableTraits from "../Traits/TraitsClasses/MappableTraits";
import SplitterTraits from "../Traits/TraitsClasses/SplitterTraits";
import hasTraits from "./Definition/hasTraits";
import Model from "./Definition/Model";

export type Comparable = Model<
  SplitterTraits & CatalogMemberTraits & MappableTraits
> &
  MappableMixin.Instance &
  CatalogMemberMixin.Instance;

/**
 * Returns true if the item is Comparable.
 */
export function isComparableItem(item: any): item is Comparable {
  const isComparable =
    item &&
    MappableMixin.isMixedInto(item) &&
    CatalogMemberMixin.isMixedInto(item) &&
    hasTraits(item, MappableTraits, "show") &&
    hasTraits(item, CatalogMemberTraits, "name") &&
    hasTraits(item, SplitterTraits, "splitDirection");
  return isComparable;
}
