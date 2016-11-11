'use strict';

var defined = require('terriajs-cesium/Source/Core/defined');

/**
 * Return the ancestors in the data catalog of the given catalog member, recursively using "member.parent".
 * The "Root Group" is not included.
 *
 * @param  {CatalogMember} member The catalog member.
 * @return {CatalogMember[]} The members' ancestors in its parent tree, starting at the top, not including this member.
 */
function getAncestors(member) {
    if (defined(member.parent) && defined(member.parent.parent)) {
        return getAncestors(member.parent).concat([member.parent]);
    }
    return [];
}

module.exports = getAncestors;
