"use strict";

/*global require*/

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
 */
var VariableConcept = function(name, parent) {

    Concept.call(this, name);

    /**
     * Gets or sets the parent for a node.  This property is observable.
     * @type {VariableConcept[]}
     */
    this.parent = parent;

    /**
     * Gets or sets a value indicating whether this variable is currently active.  
     * This property is observable.
     * @type {Boolean}
     */
    this.isActive = false;

    /**
     * Flag to say if this if this node is selectable.  This property is observable.
     * @type {Boolean}
     */
    this.isSelectable = true;

    knockout.track(this, ['isActive', 'parent', 'hasChildren']);  // name, isSelectable already tracked by Concept
};

inherit(Concept, VariableConcept);

defineProperties(VariableConcept.prototype, {
    /**
     * Gets a value indicating whether this item has child items.
     * @type {Boolean}
     */
    hasChildren : {
        get : function() {
            return false;
        }
    }
});
/**
 * Toggles the {@link VariableConcept#isActive} property.
 */
VariableConcept.prototype.toggleActive = function(item) {
    var name = this.isActive ? undefined : item.name;
    this.parent.setSelected(name);
};

module.exports = VariableConcept;
