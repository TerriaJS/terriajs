'use strict';

import React from 'react';

import AssociativeArray from 'terriajs-cesium/Source/Core/AssociativeArray';

import CustomComponentType from './CustomComponentType';

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

    attributes: function() {
        const nestedArrays = types.values.map(customComponentType=>customComponentType.attributes);
        // Flatten the array.
        return nestedArrays.reduce(function(a, b) {
            return a.concat(b);
        }, []);
    },

    values: function() {
        return types.values;
    },

    /**
     * Traverses a tree of react components and returns all custom components, based on their "isCorresponding" function.
     * @param  {ReactComponent} tree The tree of react components to traverse.
     * @return {Object[]} An array of the custom components as objects {type: CustomComponentType, component: ReactComponent}.
     */
    find: findCustomComponentsInTree

};

function findCustomComponentsInTree(tree) {
    // Similar to logic in React-shallow-test-utils.
    if (!tree) {
        return [];
    }
    let found = [];
    types.values.forEach(customComponentType=>{
        if (customComponentType.isCorresponding(tree)) {
            found = found.concat({type: customComponentType, component: tree});
        }
    });
    if (React.isValidElement(tree)) {
        if (React.Children.count(tree.props.children) > 0) {
            React.Children.forEach(tree.props.children, function(child) {
                found = found.concat(findCustomComponentsInTree(child));
            });
        }
    }
    return found;
}


module.exports = CustomComponents;
