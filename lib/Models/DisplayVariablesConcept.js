"use strict";

/*global require*/

var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');

var inherit = require('../Core/inherit');
var Concept = require('./Concept');
var VariableConcept = require('./VariableConcept');

/**
 * Represents a concept which contains a list of variables which can be used to change the appearance of data.
 * A DisplayVariablesConcept contains an items array of VariableConcepts.
 *
 * @alias DisplayVariablesConcept
 * @constructor
 * @extends Concept
 */
var DisplayVariablesConcept = function() {
    var name = 'Display Variable';
    Concept.call(this, name);

    /**
     * Gets the list of VariableConcepts contained in this group.  This property is observable.
     * @type {VariableConcept[]}
     */
    this.items = [];

    /**
     * Gets or sets a value indicating whether this concept item is currently open.  When an
     * item is open, its child items (if any) are visible.  This property is observable.
     * @type {Boolean}
     */
    this.isOpen = true;

    /**
     * Flag to say if this if this node is selectable.  This property is observable.
     * @type {Boolean}
     */
    this.isSelectable = false;

    /**
     * Function to call if the currently active variable is changed.
     * This property is observable.
     * @type {Function}
     */
    this.updateFunction = undefined;

    knockout.track(this, ['name', 'items', 'isOpen', 'isSelectable', 'updateFunction']);
};

inherit(Concept, DisplayVariablesConcept);

defineProperties(DisplayVariablesConcept.prototype, {
    /**
     * Gets a value indicating whether this item has child items.
     * @type {Boolean}
     */
    hasChildren : {
        get : function() {
            return this.items.length > 0;
        }
    }
});

/**
 * Sets the {@link VariableConcept#isActive} property on all the items, so that only the selectedVariable is active.
 * This is called by the VariableConcept's toggleActive function.
 * @param {String} selectedVariable The name of the variable to make active.
 */
DisplayVariablesConcept.prototype.setSelected = function(selectedVariable) {
    if (defined(this.updateFunction)) {
        this.updateFunction(selectedVariable);
    }
    this.items.forEach( function(item) {
        item.isActive = (item.name === selectedVariable);
    });
};

/**
 * Adds a VariableConcept to this concept's items.
 * @param {String} varName The name of the variable to add.
 */
DisplayVariablesConcept.prototype.addVariable = function(varName) {
    this.items.push(new VariableConcept(varName, this));
};

module.exports = DisplayVariablesConcept;
