"use strict";

/*global require*/

var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');

var inherit = require('../Core/inherit');
var Concept = require('./Concept');

/**
 * Represents a concept which contains a list of variables which can be used to change the appearance of data.
 * A DisplayVariablesConcept contains an items array of VariableConcepts.
 *
 * @alias DisplayVariablesConcept
 * @constructor
 * @extends Concept
 * @param {String} [name='Display Variable'] Display name of this concept.
 * @param {Boolean} [allowMultiple=false] Set to true if more than one checkbox can be selected at a time. Also activates colors on the checkboxes.
 * @param {Function} [getColorCallback] A function with no arguments that returns a color for the VariableConcept. If undefined, no color is set.
 */
var DisplayVariablesConcept = function(name, allowMultiple, getColorCallback) {
    name = defaultValue(name, 'Display Variable');
    Concept.call(this, name);

    this.allowMultiple = defaultValue(allowMultiple, false);

    this.getColorCallback = getColorCallback;

    /**
     * Gets the list of VariableConcepts contained in this group.
     * @type {VariableConcept[]}
     */
    this.items = [];

    /**
     * Gets or sets a value indicating whether this concept item is currently open.  When an
     * item is open, its child items (if any) are visible.
     * @type {Boolean}
     */
    this.isOpen = true;

    /**
     * Gets or sets a flag to say if this if this node is selectable.
     * @type {Boolean}
     */
    this.isSelectable = false;

    /**
     * Gets or sets a function to call if the currently active variable is changed.
     * @type {Function}
     */
    this.updateFunction = undefined;

    knockout.track(this, ['items', 'isOpen', 'allowMultiple']);

    /**
     * Gets an array of currently active/selected items.
     * @return {VariableConcept[]} Array of active/selected items.
     */
    knockout.defineProperty(this, 'activeItems', {
        get: function() {
            return this.items.filter(function(item) {return item.isActive;});
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

inherit(Concept, DisplayVariablesConcept);

defineProperties(DisplayVariablesConcept.prototype, {
    /**
     * Gets a value indicating whether this item has visible child items.
     * @type {Boolean}
     */
    hasChildren : {
        get : function() {
            return this.items.some(function(concept) {return concept.isVisible;});
        }
    }
});

/**
 * Sets the {@link VariableConcept#isActive} property on all the items.
 * This is called by the VariableConcept's toggleActive function, only if not displayVariableConcept.allowMultiple.
 * It makes sure only 'variable' is activated.
 * @param {VariableConcept} variable The variable concept to make active/inactive.
 */
DisplayVariablesConcept.prototype.toggleActiveItem = function(variable) {
    for (var i = 0; i < this.items.length; i++) {
        var target = (this.items[i] === variable);
        if (this.items[i].isActive !== target) {
            this.items[i].isActive = target;
        }
    }
};

module.exports = DisplayVariablesConcept;
