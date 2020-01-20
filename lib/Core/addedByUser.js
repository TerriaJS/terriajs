import defined from "terriajs-cesium/Source/Core/defined";

const USER_ADDED_CATEGORY_ID = "__User-Added_Data__";

// Not yet ported
function addedByUser(catalogMember) {
  while (defined(catalogMember.parent)) {
    if (catalogMember.parent.uniqueId === USER_ADDED_CATEGORY_ID) {
      return true;
    }
    catalogMember = catalogMember.parent;
  }
  return false;
}

export default addedByUser;
export { USER_ADDED_CATEGORY_ID };
