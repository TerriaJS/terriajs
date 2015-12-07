"use strict";

/*global require*/

var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
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
 * @param {String} [name='Display Variable'] Display name of this concept.
 * @param {DisplayVariablesConcept~setSelected} [setSelectedFunction] The function to call when a variable is selected.
 * @param {Boolean} [allowMultiple=false] Set to true if more than one checkbox can be selected at a time. Not Implemented Yet.
 */
var DisplayVariablesConcept = function(name, setSelectedFunction, allowMultiple) {
    name = defaultValue(name, 'Display Variable');
    Concept.call(this, name);

    /**
     * Gets or sets the function to call when a variable is selected.
     * @type {DisplayVariablesConcept~setSelected}
     */
    this.setSelectedFunction = defaultValue(setSelectedFunction, function() {});

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
     * Gets or sets a flag to say if this if this node is selectable.  This property is observable.
     * @type {Boolean}
     */
    this.isSelectable = false;

    /**
     * Gets or sets a function to call if the currently active variable is changed.
     * This property is observable.
     * @type {Function}
     */
    this.updateFunction = undefined;

    knockout.track(this, ['name', 'items', 'isOpen', 'isSelectable', 'updateFunction']);
};

 /**
  * Function that is called when a variable is selected or unselected.
  * @callback DisplayVariablesConcept~setSelected
  * @param {String} varName The name of the selected variable.
  */

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
 * Sets the {@link VariableConcept#isActive} property on all the items, taking account of whether multiple may be active.
 * Also calls this.setSelectedFunction and the updateFunction.
 * This is called by the VariableConcept's toggleActive function.
 * @param {VariableConcept} variable The variable concept to make active/inactive.
 */
DisplayVariablesConcept.prototype.toggleSelected = function(variable) {
    // Keep the {@link DataTable} (or other owner) up-to-date.
    this.setSelectedFunction(variable);
    // Keep other dependents such as the data source (eg. {@link CsvCatalogItem}) up-to-date.
    if (defined(this.updateFunction)) {
        this.updateFunction(variable.name, !variable.isActive);
    }
};

/**
 * Sets the {@link VariableConcept#isActive} property on all the items (only).
 * This is called by the parent once all the variable concepts are created, and you wish to set.
 * @param {String[]} selectedVariables The names of the variables to make active.
 */
DisplayVariablesConcept.prototype.setSelected = function(selectedVariables) {
    this.items.forEach(function(item) {
        item.isActive = (selectedVariables.indexOf(item.name) > -1);
    });
};

/**
 * Adds a VariableConcept to this concept's items.
 * @param {String} varName The name of the variable to add.
 */
DisplayVariablesConcept.prototype.addVariable = function(varName) {
    this.items.push(new VariableConcept(varName, this));
};

/**
 * Gets the variable concept with the given name.
 * @param  {String} varName The name.
 * @return {VariableConcept}
 */
DisplayVariablesConcept.prototype.getVariableConcept = function(varName) {
    var result;
    this.items.forEach(function(item) {
        if (item.name === varName) {
            result = item;
        }
    });
    return result;
};

module.exports = DisplayVariablesConcept;
