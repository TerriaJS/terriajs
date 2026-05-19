import i18next, { i18n } from "i18next";
import { applyTranslationIfExists } from "../Language/languageHelpers";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import getAncestors from "../Models/getAncestors";
import { BaseModel } from "../Models/Definition/Model";
import getDereferencedIfExists from "./getDereferencedIfExists";
import isDefined from "./isDefined";

// Pass the reactive i18n from useTranslation() in React components so the result
// updates when the user switches language. The global i18next fallback is fine for
// analytics/non-UI code where re-rendering is irrelevant.
export default function getPath(
  item: BaseModel,
  separator?: string,
  i18nInstance: i18n = i18next
) {
  const sep = isDefined(separator) ? separator : "/";
  return getParentGroups(item, i18nInstance).join(sep);
}

export function getParentGroups(item: BaseModel, i18nInstance: i18n = i18next) {
  const dereferenced = getDereferencedIfExists(item);
  return [
    ...getAncestors(dereferenced).map(getDereferencedIfExists),
    dereferenced
  ].map((ancestor) => {
    if (CatalogMemberMixin.isMixedInto(ancestor)) {
      const name = ancestor.nameInCatalog || "";
      return (
        (i18nInstance && applyTranslationIfExists(name, i18nInstance)) ||
        name ||
        ancestor.uniqueId
      );
    }
    return ancestor.uniqueId;
  });
}
