import { BaseModel } from "../Models/Model";

export const USER_ADDED_CATEGORY_NAME = "User-Added Data";

export default function addedByUser(catalogMember: BaseModel): Boolean {
  return catalogMember.knownContainerUniqueIds.some(containerId => {
    return (
      containerId === USER_ADDED_CATEGORY_NAME ||
      addedByUser(<BaseModel>(
        catalogMember.terria.getModelById(BaseModel, containerId)
      ))
    );
  });
}
