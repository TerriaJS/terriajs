import { BaseModel } from "./Model";

/**
 * Return the ancestors in the data catalog of the given catalog member,
 * recursively using "member.knownContainerUniqueIds". The "Root Group" is
 * not included.
 *
 * @param  member The catalog member.
 * @return The members' ancestors in its parent tree, starting at the top, not including this member.
 */
export default function getAncestors(member: BaseModel): BaseModel[] {
  const result: BaseModel[] = [];
  let currentModel: BaseModel | undefined = member;
  for (;;) {
    const parentId: string | undefined =
      currentModel && currentModel.knownContainerUniqueIds.length > 0
        ? currentModel.knownContainerUniqueIds[0]
        : undefined;
    if (parentId === undefined) break;
    currentModel = member.terria.getModelById(BaseModel, parentId);
    if (currentModel && currentModel.knownContainerUniqueIds.length > 0) {
      result.splice(0, 0, currentModel);
    }
  }
  return result;
}
