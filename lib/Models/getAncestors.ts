import defined from "terriajs-cesium/Source/Core/defined";
import { BaseModel } from "./Model";
import Terria from "./Terria";

/**
 * Return the ancestors in the data catalog of the given catalog member,
 * recursively using "member.knownContainerUniqueIds". The "Root Group" is
 * not included.
 *
 * @param terria The Terria instance.
 * @param  member The catalog member.
 * @return The members' ancestors in its parent tree, starting at the top, not including this member.
 */
export default function getAncestors(
  terria: Terria,
  member: BaseModel
): BaseModel[] {
  const result: BaseModel[] = [];

  let parentId;
  let currentModel: BaseModel | undefined = member;

  while (
    (parentId = currentModel && currentModel.knownContainerUniqueIds[0]) !==
    undefined
  ) {
    currentModel = terria.getModelById(BaseModel, parentId);
    if (currentModel && currentModel.knownContainerUniqueIds.length > 0) {
      result.push(currentModel);
    }
  }

  return result;
}
