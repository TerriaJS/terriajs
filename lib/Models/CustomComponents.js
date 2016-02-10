'use strict';

import AssociativeArray from 'terriajs-cesium/Source/Core/AssociativeArray';

const types = new AssociativeArray();

/**
 * A store of registered custom component types, eg. <chart>.
 */
const CustomComponents = {

    register: function(customComponentType) {
        types.set(customComponentType.name, customComponentType);
    },

    // isCustomComponent: function(componentName) {
    //     return (types.contains(componentName.toLowerCase()));
    // },

    names: function() {
        return types.values.map(customComponentType=>customComponentType.name);
    },

    values: function() {
        return types.values;
    }

};

module.exports = CustomComponents;
