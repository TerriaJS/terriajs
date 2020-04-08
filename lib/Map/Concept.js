"use strict";

/*global require*/

var knockout = require("terriajs-cesium/Source/ThirdParty/knockout").default;

/**
 * Represents the bare minimum required to display a concept in the NowViewing tab.
 *
 * @alias Concept
 * @constructor
 */
var Concept = function(name) {
  /**
   * Gets or sets the id of the concept item. By default this is the same as the name.
   * It is allowed to be different eg. for csv files with tersely-named columns.
   * @type {String}
   */
  this.id = name;

  /**
   * Gets or sets the name of the concept item.  This property is observable.
   * @type {String}
   */
  this.name = name;

  /**
   * Flag to say if this if this node is selectable.  This property is observable.
   * If your subclass can return true, it must define an isActive property and a toggleActive function.
   * @type {Boolean}
   */
  this.isSelectable = undefined;

  /**
   * Gets or sets the items contained in this concept.  This property is observable.
   * Only used if the concept's hasChildren can return true.
   * @type {AbsConcept[]}
   */
  this.items = undefined;

  /**
   * Gets or sets a value indicating whether this concept item is currently open.  When an
   * item is open, its child items (if any) are visible.  This property is observable.
   * Only used if the concept's hasChildren can return true.
   * @type {Boolean}
   */
  this.isOpen = undefined;

  /**
   * Gets or sets a value indicating whether this concept is currently active.
   * Only used if the concept's isSelectable is true.
   * @type {Boolean}
   */
  this.isActive = undefined; // A better name would be isSelected, since it can only be true if isSelectable. But isActive is used by the knockout view.

  /**
   * Gets or sets a value indicating whether this concept is visible. Defaults to true.
   * @type {Boolean}
   */
  this.isVisible = true;

  /**
   * String describing the color of this node, if applicable.  This property is observable.
   * @type {String}
   */
  this.color = undefined;

  knockout.track(this, ["name", "isSelectable", "isVisible", "color"]);
};

Object.defineProperties(Concept.prototype, {
  /**
   * Gets a value indicating whether this item has child items.
   * If your subclass can return true, it must also define isOpen & items properties, and a toggleOpen function.
   * @type {Boolean}
   */
  hasChildren: {
    get: function() {
      return (
        this.items &&
        this.items.some(function(concept) {
          return concept.isVisible;
        })
      );
    }
  }
});

/**
 * Toggles the {@link Concept#isOpen} property.  If this item's list of children is open,
 * calling this method will close it.  If the list is closed, calling this method will open it.
 */
Concept.prototype.toggleOpen = function() {
  this.isOpen = !this.isOpen;
};

/**
 * Toggles the {@link Concept#isActive} property.
 */
Concept.prototype.toggleActive = function() {
  this.isActive = !this.isActive;
};

module.exports = Concept;
