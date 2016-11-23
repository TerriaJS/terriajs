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

module.exports = AdditiveConditionsConcept;
