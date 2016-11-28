"use strict";

/*global require*/

var defined = require('terriajs-cesium/Source/Core/defined');
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var deprecationWarning = require('terriajs-cesium/Source/Core/deprecationWarning');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');

var inherit = require('../Core/inherit');
var VariableConcept = require('./VariableConcept');

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
 * @param {Boolean} [options.allowMultiple=false] Set to true if more than one checkbox can be selected at a time. Also activates colors on the checkboxes.
 * @param {Function} [options.getColorCallback] A function with no arguments that returns a color for the VariableConcept. If undefined, no color is set.
 * @param {Concept[]} [options.items] The array of concepts contained in this group. Each item's parent property is overridden with `this`.
 * @param {Boolean} [options.isOpen] Whether this concept item is currently open.
 * @param {Boolean} [options.isSelectable] Whether this node is selectable.
 */
var DisplayVariablesConcept = function(name, options, getColorCallback) {
    const that = this;
    name = defaultValue(name, 'Display Variable');

    if (typeof options === 'boolean') {
        deprecationWarning('allowMultiple', 'Passing allowMultiple directly into DisplayVariablesConcept is deprecated. Please pass as {allowMultiple:...} instead.');
        options = {allowMultiple: options};
    } else {
        options = defaultValue(options, defaultValue.EMPTY_OBJECT);
    }
    VariableConcept.call(this, name, options);

    this.allowMultiple = defaultValue(options.allowMultiple, false);

    if (defined(getColorCallback)) {
        deprecationWarning('getColorCallback', 'Passing getColorCallback directly into DisplayVariablesConcept is deprecated. Please pass as {getColorCallback:...} instead.');
    }
    this.getColorCallback = defaultValue(getColorCallback, options.getColorCallback);

    /**
     * Gets or sets the array of concepts contained in this group.
     * If options.items is present, each item's parent property is overridden with `this`.
     * @type {Concept[]}
     */
    this.items = defaultValue(options.items, []);
    this.items.forEach(function(item) {item.parent = that;});

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

inherit(VariableConcept, DisplayVariablesConcept);

defineProperties(DisplayVariablesConcept.prototype, {
    /**
<<<<<<< HEAD
     * Gets a value indicating whether this item has visible child items.
     * @type {Boolean}
     */
    hasChildren : {
        get : function() {
            return this.items && this.items.some(function(concept) {return concept.isVisible;});
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
