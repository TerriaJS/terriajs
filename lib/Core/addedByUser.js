import defined from 'terriajs-cesium/Source/Core/defined';

const USER_ADDED_CATEGORY_NAME = 'User-Added Data';

function addedByUser(item) {
    while(defined(item.parent)){
        if (item.parent.name === USER_ADDED_CATEGORY_NAME) {
            return true;
        }
        item = item.parent;
    }
    return false;
}

export default addedByUser;
export {USER_ADDED_CATEGORY_NAME};


