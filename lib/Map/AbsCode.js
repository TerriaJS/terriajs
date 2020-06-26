"use strict";

/*global require*/

var knockout = require("terriajs-cesium/Source/ThirdParty/knockout").default;
var defined = require("terriajs-cesium/Source/Core/defined").default;

var inherit = require("../Core/inherit");
var Concept = require("../Map/Concept");

/**
 * Represents an ABS code associated with a AbsConcept.
 * An AbsCode may contains an array one of more child AbsCodes.
 *
 * @alias AbsCode
 * @constructor
 * @extends {Concept}
 */
var AbsCode = function(code, name, concept) {
  Concept.call(this, name);
  /**
   * Gets or sets the value of the abs code.
   * @type {String}
   */
  this.code = code;

  /**
   * Gets the list of abs codes contained in this group.  This property is observable.
   * @type {AbsCode[]}
   */
  this.items = [];

  /**
   * Gets or sets the parent for a code.  This property is observable.
   * @type {AbsCode|AbsConcept}
   */
  this.parent = undefined;

  /**
   * Gets or sets the ultimate parent concept for a code.  This property is observable.
   * @type {AbsConcept}
   */
  this.concept = concept;

  /**
   * Flag to say if this if this concept only allows more than one active child.
   * Defaults to the same as concept.
   * Only meaningful if this concept has an items array.
   * @type {Boolean}
   */
  this.allowMultiple = this.concept.allowMultiple;

  /**
   * Gets or sets a value indicating whether this abs code is currently open.  When an
   * item is open, its child items (if any) are visible.  This property is observable.
   * @type {Boolean}
   */
  this.isOpen = false;

  /**
   * Gets or sets a value indicating whether this abs code is currently active.  When a
   * code is active, it is included in the abs data query.  This property is observable.
   * @type {Boolean}
   */
  this.isActive = false;

  /**
   * Flag to say if this is selectable.  This property is observable.
   * @type {Boolean}
   */
  this.isSelectable = true; //for ko

  knockout.track(this, ["code", "items", "isOpen", "isActive"]);
};

inherit(Concept, AbsCode);

Object.defineProperties(AbsCode.prototype, {
  /**
   * Gets a value indicating whether this item has child items.
   * @type {Boolean}
   */
  hasChildren: {
    get: function() {
      return this.items.length > 0;
    }
  }
});

/**
 * Toggles the {@link AbsCode#isOpen} property.  If this item's list of children is open,
 * calling this method will close it.  If the list is closed, calling this method will open it.
 */
AbsCode.prototype.toggleOpen = function() {
  this.isOpen = !this.isOpen;
};

/**
 * Toggles the {@link AbsCode#isActive} property.
 */
AbsCode.prototype.toggleActive = function(test) {
  this.isActive = !this.isActive;
  function clearParents(code) {
    if (defined(code.parent)) {
      code.parent.isActive = false;
      clearParents(code.parent);
    }
  }
  function clearChildren(code) {
    code.items.forEach(function(item) {
      item.isActive = false;
      clearChildren(item);
    });
  }
  function clearSiblings(code) {
    if (!code.parent.allowMultiple) {
      code.parent.items.forEach(function(item) {
        if (item !== code) {
          item.isActive = false;
        }
      });
    }
  }
  if (this.isActive) {
    clearParents(this);
    clearChildren(this);
    clearSiblings(this);
  }
};

module.exports = AbsCode;
