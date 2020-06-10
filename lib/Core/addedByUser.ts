import { BaseModel } from "../Models/Model";
import i18next from "i18next";
export const USER_ADDED_CATEGORY_ID = "__User-Added_Data__";

export default function addedByUser(
  catalogMember: BaseModel,
  options: {
    depth: number;
  } = {
    depth: 0
  }
): boolean {
  const depth = options.depth;
  if (depth > 100) {
    console.error(
      i18next.t("core.errors.tooDeepAddedByUser", {
        memberId: catalogMember.uniqueId
      })
    );
    return false;
  }
  const sourceReference =
    catalogMember.sourceReference !== undefined
      ? catalogMember.sourceReference
      : catalogMember;
  return sourceReference.knownContainerUniqueIds.some(containerId => {
    return (
      containerId === USER_ADDED_CATEGORY_ID ||
      addedByUser(
        <BaseModel>catalogMember.terria.getModelById(BaseModel, containerId),
        { depth: depth + 1 }
      )
    );
  });
}
