"use strict";

/*global require*/
var defaultValue = require("terriajs-cesium/Source/Core/defaultValue").default;
var defined = require("terriajs-cesium/Source/Core/defined").default;
var knockout = require("terriajs-cesium/Source/ThirdParty/knockout").default;

var inherit = require("../Core/inherit");
var Concept = require("./Concept");

/**
 * Represents a variable concept associated with a DisplayVariablesConcept.
 *
 * @alias VariableConcept
 * @constructor
 * @extends Concept
 *
 * @param {String} name    The display name of this variable.
 * @param {Object} [options] Options:
 * @param {Concept} [options.parent] The parent of this variable; if not parent.allowMultiple, parent.toggleActiveItem(variable) is called when toggling on.
 * @param {Boolean} [options.active] Whether the variable should start active.
 * @param {String} [options.color] The string description of the color of this variable, if any.
 * @param {String} [options.id] The id of this variable; defaults to the name (via the parent class Concept).
 * @param {Boolean} [options.visible] Whether this variable is visible in the NowViewing tab (defaults to True).
 */
var VariableConcept = function(name, options) {
  Concept.call(this, name);

  options = defaultValue(options, defaultValue.EMPTY_OBJECT);
  /**
   * Gets or sets the parent for a node.  This property is observable.
   * @type {VariableConcept[]}
   */
  this.parent = options.parent;

  /**
   * Gets or sets a value indicating whether this variable is currently active.
   * This property is observable.
   * @type {Boolean}
   */
  this.isActive = defaultValue(options.active, false);

  /**
   * Flag to say if this if this node is selectable.  This property is observable.
   * @type {Boolean}
   */
  this.isSelectable = true;

  /**
   * String describing the color of this node, if applicable.  This property is observable.
   * @type {String}
   */
  this.color = options.color;

  if (defined(options.id)) {
    this.id = options.id;
  }

  knockout.track(this, ["isActive", "parent"]); // name, isSelectable, color already tracked by Concept

  knockout.getObservable(this, "isActive").subscribe(function(nowActive) {
    // If this concept has been activated, and its parent has a color callback, use it to set this concept's color now.
    if (
      nowActive &&
      defined(this.parent) &&
      !defined(this.color) &&
      defined(this.parent.getColorCallback)
    ) {
      this.color = this.parent.getColorCallback(
        this.parent.getColumnIndex(this.id)
      );
    }
  }, this);
};

inherit(Concept, VariableConcept);

/**
 * Toggles the {@link VariableConcept#isActive} property, by using the parent's toggleActiveItem (if defined), or else manually.
 */
VariableConcept.prototype.toggleActive = function() {
  if (defined(this.parent) && defined(this.parent.toggleActiveItem)) {
    this.parent.toggleActiveItem(this);
  } else {
    this.isActive = !this.isActive;
  }
};

module.exports = VariableConcept;
