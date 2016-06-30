'use strict';
import defined from 'terriajs-cesium/Source/Core/defined';

function addedByUser(item) {
    while(defined(item.parent)){
        if (item.parent.name === 'User-Added Data'){
            return true;
        }
        item = item.parent;
    }
    return false;
}
module.exports = addedByUser;


