'use strict';

/*global require*/

var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');

var flattenNested = require('../Core/flattenNested');
var inherit = require('../Core/inherit');
var DisplayVariablesConcept = require('./DisplayVariablesConcept');

/**
 * Represents the top-level node of a tree which should be displayed using
 * a different UX to the more usual DisplayVariablesConcept.
 * Intended for use when the tree is huge, and would take up too much space in the UI.
 * Contains an items array of Concepts.
 *
 * @alias SummaryConcept
 * @constructor
 * @extends DisplayVariablesConcept
 * @param {String} [name='Conditions'] Display name of this concept.
 * @param {Object} [options] Options, as per DisplayVariablesConcept.
 */
var SummaryConcept = function(name, options) {
    name = defaultValue(name, 'Conditions');

    options = defaultValue(options, defaultValue.EMPTY_OBJECT);
    DisplayVariablesConcept.call(this, name, options);
};

inherit(DisplayVariablesConcept, SummaryConcept);

/**
 * Sets isOpen = false on all descendants.
 */
SummaryConcept.prototype.closeDescendants = function() {
    closeDescendants(this);
};

/**
 * @returns {Boolean} Returns true if isOpen=true on either this concept or any of its descendants, NOT INCLUDING the final parent level.
 * This sounds odd, but the UI for a SummaryConcept is to show only the active nodes under it,
 * PLUS any open parent nodes.
 * So this gets the second set, minus any that were already covered in the first set.
 */
SummaryConcept.prototype.getOpenParentsWithoutParentsOfActive = function() {
    return flattenNested(getNestedOpenParentsWithoutParentsOfActive(this));
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

function isParentOfActive(concept) {
    return concept.items && concept.items.some(child => child.isActive);
}

function getNestedOpenParentsWithoutParentsOfActive(concept) {
    if (!concept.items || isParentOfActive(concept)) {
        return [];
    }
    if (concept.isOpen) {
        return [concept];
    }
    return concept.items.map(child => getNestedOpenParentsWithoutParentsOfActive(child));
}


module.exports = SummaryConcept;
