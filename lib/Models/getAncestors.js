"use strict";

var defined = require("terriajs-cesium/Source/Core/defined").default;

/**
 * Return the ancestors in the data catalog of the given catalog member, recursively using "member.parent".
 * The "Root Group" is not included.
 *
 * @param  {CatalogMember} member The catalog member.
 * @return {CatalogMember[]} The members' ancestors in its parent tree, starting at the top, not including this member.
 */
function getAncestors(member) {
  var parent = member.parent;
  var ancestors = [];
  while (defined(parent) && defined(parent.parent)) {
    ancestors = [parent].concat(ancestors);
    parent = parent.parent;
  }
  return ancestors;
}

module.exports = getAncestors;
