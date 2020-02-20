import { BaseModel } from "../Models/Model";

export const USER_ADDED_CATEGORY_ID = "__User-Added_Data__";

export default function addedByUser(catalogMember: BaseModel): boolean {
  const sourceReference =
    catalogMember.sourceReference !== undefined
      ? catalogMember.sourceReference
      : catalogMember;
  return sourceReference.knownContainerUniqueIds.some(containerId => {
    return (
      containerId === USER_ADDED_CATEGORY_ID ||
      addedByUser(
        <BaseModel>catalogMember.terria.getModelById(BaseModel, containerId)
      )
    );
  });
}
