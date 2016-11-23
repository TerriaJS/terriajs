'use strict';

/*global require*/

var defined = require('terriajs-cesium/Source/Core/defined');
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');

var flattenNested = require('../Core/flattenNested');
var inherit = require('../Core/inherit');
var DisplayVariablesConcept = require('./DisplayVariablesConcept');

/**
 * Represents a concept which contains a list of variables which can be used to change the appearance of data.
 * A DisplayVariablesConcept contains an items array of VariableConcepts.
 *
 * @alias AdditiveConditionsConcept
 * @constructor
 * @extends DisplayVariablesConcept
 * @param {String} [name='Conditions'] Display name of this concept.
 * @param {Object} [options] Options. DisplayVariablesConcept options are passed through.
 */
var AdditiveConditionsConcept = function(name, options) {
    name = defaultValue(name, 'Conditions');

    options = defaultValue(options, defaultValue.EMPTY_OBJECT);
    DisplayVariablesConcept.call(this, name, options);
};

inherit(DisplayVariablesConcept, AdditiveConditionsConcept);

defineProperties(AdditiveConditionsConcept.prototype, {
    /**
     * Gets a flat array of all the leaf nodes under this concept.
     * Leaf nodes are those with items either undefined or of 0 length.
     * @type {Object}
     */
    leafNodes : {
        get : function() {
            return flattenNested(nestedLeafNodes(this));
        }
    }
});

/**
 * Gets a recursive tree representation of this concept, {concept: , children: [...]}.
 * Leaf nodes do not have a 'children' property.
 * @type {Object}
 * @private
 */
// function asTree(concept) {
//     if (!defined(concept.items) || concept.items.length === 0) {
//         return {concept: concept};
//     }
//     return {concept: concept, children: concept.items.forEach(child => asTree(child))};
// }

function nestedLeafNodes(concept) {
    if (!defined(concept.items) || concept.items.length === 0) {
        return concept;
    }
    return concept.items.map(child => nestedLeafNodes(child));
}

/**
 * Sets the {@link VariableConcept#isActive} property on all the items.
 * This is called by the VariableConcept's toggleActive function, only if not displayVariableConcept.allowMultiple.
 * It makes sure only 'variable' is activated.
 * @param {VariableConcept} variable The variable concept to make active/inactive.
 */
AdditiveConditionsConcept.prototype.toggleActiveItem = function(variable) {
    for (var i = 0; i < this.items.length; i++) {
        var target = (this.items[i] === variable);
        if (this.items[i].isActive !== target) {
            this.items[i].isActive = target;
        }
    }
};

module.exports = AdditiveConditionsConcept;
