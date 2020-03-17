"use strict";

import i18next from "i18next";
/*global require*/

var defined = require("terriajs-cesium/Source/Core/defined").default;
var defaultValue = require("terriajs-cesium/Source/Core/defaultValue").default;
var knockout = require("terriajs-cesium/Source/ThirdParty/knockout").default;

var flattenNested = require("../Core/flattenNested");
var inherit = require("../Core/inherit");
var VariableConcept = require("./VariableConcept");

/**
 * Represents a concept which contains a list of variables which can be used to change the appearance of data.
 * A DisplayVariablesConcept contains an items array of VariableConcepts.
 *
 * @alias DisplayVariablesConcept
 * @constructor
 * @extends VariableConcept
 * @param {String} [name='Display Variable'] Display name of this concept.
 * @param {Boolean|Object} [options] Options; for backwards compatibility, if a boolean is passed, it is interpreted as options.allowMultiple. Also, VariableConcept options are passed through.
 * @param {Function} [getColorCallback] For backwards compatibility, a third argument is interpreted as options.getColorCallback. Use options.getColorCallback in preference.
 * @param {Boolean} [options.allowMultiple=false] Set to true if more than one checkbox can be selected at a time.
 * @param {Boolean} [options.requireSomeActive=false] Set to true if at least one checkbox must be selected at all times.
 * @param {Function} [options.getColorCallback] A function with no arguments that returns a color for the VariableConcept. If undefined, no color is set.
 * @param {Concept[]} [options.items] The array of concepts contained in this group. Each item's parent property is overridden with `this`.
 * @param {Boolean} [options.isOpen] Whether this concept item is currently open.
 * @param {Boolean} [options.isSelectable] Whether this node is selectable.
 * @param {String[]} [options.exclusiveChildIds] A list of child ids which cannot be selected at the same time as any other child. Default [].
 */
var DisplayVariablesConcept = function(name, options) {
  const that = this;
  name = defaultValue(
    name,
    i18next.t("map.displayVariablesConcept.defaultName")
  );

  options = defaultValue(options, defaultValue.EMPTY_OBJECT);
  VariableConcept.call(this, name, options);

  /**
   * Gets or sets a flag for whether more than one checkbox can be selected at a time.
   * Default false.
   * @type {Boolean}
   */
  this.allowMultiple = defaultValue(options.allowMultiple, false);

  /**
   * Gets or sets a flag for whether at least one checkbox must be selected at all times.
   * Default false.
   * @type {Boolean}
   */
  this.requireSomeActive = defaultValue(options.requireSomeActive, false);

  /**
   * Gets or sets a function with no arguments that returns a color for the VariableConcept. If undefined, no color is set (the default).
   * @type {Function}
   */
  this.getColorCallback = options.getColorCallback;

  /**
   * Gets or sets the array of concepts contained in this group.
   * If options.items is present, each item's parent property is overridden with `this`.
   * @type {Concept[]}
   */
  this.items = defaultValue(options.items, []);
  this.items.forEach(function(item) {
    item.parent = that;
  });

  /**
   * Gets or sets a value indicating whether this concept item is currently open.  When an
   * item is open, its child items (if any) are visible. Default true.
   * @type {Boolean}
   */
  this.isOpen = defaultValue(options.isOpen, true);

  /**
   * Gets or sets a flag indicating whether this node is selectable.
   * @type {Boolean}
   */
  this.isSelectable = defaultValue(options.isSelectable, false);

  /**
   * Gets or sets a list of child ids which cannot be selected at the same time as any other child. Defaults to [].
   * Only relevant with allowMultiple = true.
   * Eg. Suppose the child concepts have ids "10" for 10 year olds, etc, plus "ALL" for all ages,
   * "U21" and "21PLUS" for under and over 21 year olds.
   * Then by specifying ["ALL", "U21", "21PLUS"], when the user selects one of these values, any other values will be unselected.
   * And when the user selects any other value (eg. "10"), if any of these values were selected, they will be unselected.
   * @type {String[]}
   */
  this.exclusiveChildIds = defaultValue(options.exclusiveChildIds, []);

  /**
   * Gets or sets a function which is called whenever a child item is successfully toggled.
   * Its sole argument is the toggled child item.
   * @type {Function}
   */
  this.toggleActiveCallback = undefined;

  knockout.track(this, [
    "items",
    "isOpen",
    "allowMultiple",
    "requireSomeActive"
  ]);

  /**
   * Gets an array of currently active/selected items.
   * @return {VariableConcept[]} Array of active/selected items.
   */
  knockout.defineProperty(this, "activeItems", {
    get: function() {
      return this.items.filter(function(item) {
        return item.isActive;
      });
    }
  });
};

/**
 * Function that is called when a variable is selected or unselected.
 * @callback DisplayVariablesConcept~setSelected
 * @param {Integer} index Index of the selected variable in the list of variables.
 * @param {String} varName The name of the selected variable.
 * @param {Boolean} makeActive Whether to make this variable active or not.
 */

inherit(VariableConcept, DisplayVariablesConcept);

/**
 * Gets a flat array of all of this concept's descendants, including itself, which meet a given condition.
 * @param {Function} condition A function of a concept, which returns a boolean.
 * @return {Concept[]}
 */
DisplayVariablesConcept.prototype.getNodes = function(condition) {
  return flattenNested(getNestedNodes(this, condition));
};

// Returns a nested array containing only the leaf concepts, at their actual depths in the tree of nodes.
function getNestedNodes(concept, condition) {
  if (condition(concept)) {
    return concept;
  }
  if (!concept.items) {
    return [];
  }
  return concept.items.map(child => getNestedNodes(child, condition));
}

/**
 * If appropriate, based on this.allowMultiple, this.requireSomeActive and this.exclusiveChildIds,
 * sets the {@link VariableConcept#isActive} property on all children, so that _only_ the provided concept is activated.
 * This is called by the VariableConcept's toggleActive function.
 * If not appropriate, simply toggles the concept without changing any others.
 * (For backwards compatibility, VariableConcept does not call this function if there's no possibility it's needed.)
 * @param {VariableConcept} concept The concept to make active/inactive.
 */
DisplayVariablesConcept.prototype.toggleActiveItem = function(concept) {
  var isActive = concept.isActive;
  // If we requireSomeActive, and we would wind up with no active items, do nothing.
  if (
    isActive &&
    this.requireSomeActive &&
    this.items.every(child =>
      child === concept ? child.isActive : !child.isActive
    )
  ) {
    return;
  }
  // If we are activating an item, but only allow one selection, we need to deselect the others.
  if (
    (!isActive && !this.allowMultiple) ||
    shouldClearActives(this, concept.id)
  ) {
    for (var i = 0; i < this.items.length; i++) {
      var target = this.items[i] === concept;
      if (this.items[i].isActive !== target) {
        this.items[i].isActive = target;
      }
    }
  } else {
    // It was not appropriate to clear all other active concepts, so just toggle this one.
    concept.isActive = !concept.isActive;
  }
  // Finally, if a callback is defined, call it.
  // Eg. This is used by charts to check if other charts with a different x column are currently displayed, and deactivate them.
  if (
    defined(
      this.toggleActiveCallback &&
        typeof this.toggleActiveCallback === "function"
    )
  ) {
    this.toggleActiveCallback(concept);
  }
};

function shouldClearActives(parent, selectedId) {
  // When we turn on an exclusive child, return true.
  if (parent.exclusiveChildIds.indexOf(selectedId) >= 0) {
    return true;
  }
  // Or, if any exclusive children are active, return true.
  var activeChildIds = parent.activeItems.map(function(child) {
    return child.id;
  });
  var activeExclusiveIds = activeChildIds.filter(function(activeId) {
    return parent.exclusiveChildIds.indexOf(activeId) >= 0;
  });
  return activeExclusiveIds.length > 0;
}

module.exports = DisplayVariablesConcept;
