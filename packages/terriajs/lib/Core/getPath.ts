import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import getAncestors from "../Models/getAncestors";
import { BaseModel } from "../Models/Definition/Model";
import getDereferencedIfExists from "./getDereferencedIfExists";
import isDefined from "./isDefined";

export default function getPath(item: BaseModel, separator?: string) {
  const sep = isDefined(separator) ? separator : "/";
  return getParentGroups(item).join(sep);
}

export function getParentGroups(item: BaseModel) {
  const dereferenced = getDereferencedIfExists(item);
  return [
    ...getAncestors(dereferenced).map(getDereferencedIfExists),
    dereferenced
  ].map(
    (ancestor) =>
      (CatalogMemberMixin.isMixedInto(ancestor) && ancestor.nameInCatalog) ||
      ancestor.uniqueId
  );
}
