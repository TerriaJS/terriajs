/**
 * Remove a user added data item or group
 * @param {terria}
 * @param {target} the target to remove
 */
var removeUserAddedData = function(terria, target) {
    const itemIndex = terria.catalog.userAddedDataGroup.items.indexOf(target);
    if (itemIndex >= 0) {
        terria.catalog.userAddedDataGroup.items.splice(itemIndex, 1);
    }
};

module.exports = removeUserAddedData;
