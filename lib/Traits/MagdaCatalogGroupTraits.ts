import GroupTraits from "./GroupTraits";
import MagdaTraits from "./MagdaTraits";
import mixTraits from "./mixTraits";
import primitiveTrait from "./primitiveTrait";

export default class MagdaCatalogGroupTraits extends mixTraits(
  MagdaTraits
) {
  @primitiveTrait({
    name: "Group ID",
    description: "The ID of the MAGDA group referred to by this catalog group.",
    type: "string"
  })
  groupId?: string;
}
