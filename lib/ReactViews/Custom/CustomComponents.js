"use strict";

import React from "react";

import AssociativeArray from "terriajs-cesium/Source/Core/AssociativeArray";

import arraysAreEqual from "../../Core/arraysAreEqual";

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
    return types.values.map(customComponentType => customComponentType.name);
  },

  isRegistered: function(name) {
    return this.names().indexOf(name) >= 0;
  },

  attributes: function() {
    const nestedArrays = types.values.map(
      customComponentType => customComponentType.attributes
    );
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
   * @return {Object[]} An array of the custom components as objects {type: CustomComponentType, reactComponent: ReactComponent}.
   */
  find: findCustomComponentsInTree,

  /**
   * Select the relevant updateCounter from the updateCounters object, by matching against the reactComponent type and key props.
   * Used by potentially self-updating components.
   * updateCounters is passed as context to CustomComponentType's processChartNode function.
   * @param {Object} context.updateCounters Used for self-updating components. An object whose keys are timeoutIds, and whose values are
   *                 {reactComponent: ReactComponent, counter: Integer}. reactComponent is selected by this.isCorresponding.
   * @param  {ReactComponent} reactComponentType Eg. The constructor of Chart.jsx.
   * @param  {Object} keyProps If the values of these props match those of the updateCounters' reactComponent, we declare a match.
   * @return {Integer} The updateCounter for this reactComponent, or undefined if none.
   */
  getUpdateCounter: getUpdateCounter
};

/**
 * @private
 */
function findCustomComponentsInTree(tree) {
  // Similar to logic in React-shallow-test-utils.
  if (!tree) {
    return [];
  }
  let found = [];
  types.values.forEach(customComponentType => {
    if (customComponentType.isCorresponding(tree)) {
      found = found.concat({ type: customComponentType, reactComponent: tree });
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

/**
 * @private
 */
function getUpdateCounter(updateCounters, reactComponentType, keyProps) {
  /**
   * @private
   */
  function haveTheKeyProps(theseProps) {
    for (const key in keyProps) {
      if (keyProps.hasOwnProperty(key)) {
        if (Array.isArray(keyProps[key])) {
          if (!arraysAreEqual(theseProps[key], keyProps[key])) {
            return false;
          }
        } else if (theseProps[key] !== keyProps[key]) {
          return false;
        }
      }
    }
    return true;
  }

  if (!updateCounters) {
    return;
  }
  for (const key in updateCounters) {
    if (updateCounters.hasOwnProperty(key)) {
      const updateObject = updateCounters[key];
      const reactComponent = updateObject.reactComponent;
      if (reactComponent.type === reactComponentType) {
        if (haveTheKeyProps(reactComponent.props)) {
          return updateObject.counter;
        }
      }
    }
  }
}

module.exports = CustomComponents;
