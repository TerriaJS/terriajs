"use strict";

/*global require*/
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');

var inherit = require('../Core/inherit');
var Concept = require('./Concept');

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
 * @param {String} [options.color] The color of this variable, if any.
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

    knockout.track(this, ['isActive', 'parent', 'hasChildren']);  // name, isSelectable, color already tracked by Concept

};

inherit(Concept, VariableConcept);

defineProperties(VariableConcept.prototype, {
    /**
     * Gets a value indicating whether this item has child items.
     * @type {Boolean}
     */
    hasChildren: {
        get: function() {
            return false;
        }
    },

    /**
     * Gets the color of this node, assigning a new one if undefined and parent.getColorCallback exists.
     * @type {String}
     */
    assignedColor: {
        get: function() {
            if (!defined(this.color) && defined(this.parent) && defined(this.parent.getColorCallback)) {
                this.color = this.parent.getColorCallback();
            }
            return this.color;
        }
    }
});

/**
 * Toggles the {@link VariableConcept#isActive} property.
 */
VariableConcept.prototype.toggleActive = function() {
    if (defined(this.parent) && !this.parent.allowMultiple && !this.isActive) {
        // the parent needs to turn off the currently active child and activate this child.
        this.parent.toggleActiveItem(this);
    } else {
        // we can handle it
        this.isActive = !this.isActive;
    }
};

module.exports = VariableConcept;