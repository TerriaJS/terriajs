'use strict';

/*global require*/

var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');

var inherit = require('../Core/inherit');
var DisplayVariablesConcept = require('./DisplayVariablesConcept');

/**
 * Represents a concept which contains a list of variables which can be used to change the appearance of data.
 * An AdditiveConditionsConcept has a different UX to a regular DisplayVariablesConcept.
 * Contains an items array of VariableConcepts.
 *
 * @alias AdditiveConditionsConcept
 * @constructor
 * @extends DisplayVariablesConcept
 * @param {String} [name='Conditions'] Display name of this concept.
 * @param {Object} [options] Options, as per DisplayVariablesConcept.
 */
var AdditiveConditionsConcept = function(name, options) {
    name = defaultValue(name, 'Conditions');

    options = defaultValue(options, defaultValue.EMPTY_OBJECT);
    DisplayVariablesConcept.call(this, name, options);
};

inherit(DisplayVariablesConcept, AdditiveConditionsConcept);

/**
 * Sets isOpen = false on all descendants.
 */
AdditiveConditionsConcept.prototype.closeDescendants = function() {
    closeDescendants(this);
};

/**
 * @returns {Boolean} Returns true if isOpen=true on either this concept or any of its descendants, NOT INCLUDING the final parent level.
 */
AdditiveConditionsConcept.prototype.isAnyOpenBeforeLastParents = function() {
    return isAnyOpenBeforeLastParents(this);
};

// Traverses the concepts' descendants, setting isOpen = false as it goes.
function closeDescendants(concept) {
    concept.isOpen = false;
    concept.items.forEach(child => {
        if (child.items) {
            closeDescendants(child);
        }
    });
}

function isLastParent(concept) {
    return concept.items && concept.items.every(child => (!child.items || child.items.length === 0));
}

function isAnyOpenBeforeLastParents(concept) {
    if (!concept.items || isLastParent(concept)) {
        return false;
    }
    if (concept.isOpen) {
        return true;
    }
    return concept.items.some(child => isAnyOpenBeforeLastParents(child));
}


module.exports = AdditiveConditionsConcept;
