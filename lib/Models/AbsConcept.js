"use strict";

/*global require*/

var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');

var inherit = require('../Core/inherit');
var Concept = require('./Concept');
/**
 * Represents an ABS concept associated with a AbsDataset.
 * An AbsConcept contains an array one of more AbsCodes.
 *
 * @alias AbsConcept
 * @constructor
 * @extends Concept
 */
var AbsConcept = function(code, name) {

    Concept.call(this, name || code);

    /**
     * Gets or sets the name of the concept item.  This property is observable.
     * @type {String}
     */
    this.code = code;

    /**
     * Gets the list of absCodes contained in this group.  This property is observable.
     * @type {AbsConcept[]}
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
     * Flag to say if this if this concept only allows one active child.
     * This property is observable.
     * @type {Boolean}
     */
    this.isUnique = false;

    knockout.track(this, ['code', 'items', 'isOpen', 'isUnique']);  // name, isSelectable already tracked by Concept
};

inherit(Concept, AbsConcept);

defineProperties(AbsConcept.prototype, {
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
 * Toggles the {@link AbsConcept#isOpen} property.  If this item's list of children is open,
 * calling this method will close it.  If the list is closed, calling this method will open it.
 */
AbsConcept.prototype.toggleOpen = function() {
    this.isOpen = !this.isOpen;
};

module.exports = AbsConcept;
