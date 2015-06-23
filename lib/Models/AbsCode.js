"use strict";

/*global require*/

var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var defined = require('terriajs-cesium/Source/Core/defined');

/**
 * Represents an ABS code associated with a AbsConcept.
 * An AbsCode may contains an array one of more child AbsCodes.
 *
 * @alias AbsCode
 * @constructor
 */
var AbsCode = function(code, name) {
    /**
     * Gets or sets the value of the abs code.
     * @type {String}
     */
    this.code = code;

    /**
     * Gets or sets the name of the abs code.  This property is observable.
     * @type {String}
     */
    this.name = name;

    /**
     * Gets the list of abs codes contained in this group.  This property is observable.
     * @type {AbsCode[]}
     */
    this.items = [];

    /**
     * Gets or sets the parent for a code.  This property is observable.
     * @type {AbsCode[]}
     */
    this.parent = undefined;

    /**
     * Gets or sets a value indicating whether this abs code is currently open.  When an
     * item is open, its child items (if any) are visible.  This property is observable.
     * @type {Boolean}
     */
    this.isOpen = false;

    /**
     * Gets or sets a value indicating whether this abs code is currently active.  When a
     * code is active, it is included in the abs data query.  This property is observable.
     * @type {Boolean}
     */
    this.isActive = false;

    /**
     * Flag to say if this is selectable.  This property is observable.
     * @type {Boolean}
     */
    this.isSelectable = true;  //for ko

    /**
     * Function to call if isActive state is changed.
     * This property is observable.
     * @type {Function}
     */
    this.updateFunction = undefined;

    knockout.track(this, ['name', 'code', 'items', 'isOpen', 'isActive', 'isSelectable', 'updateFunction', 'parent']);
};

defineProperties(AbsCode.prototype, {
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
 * Toggles the {@link AbsCode#isOpen} property.  If this item's list of children is open,
 * calling this method will close it.  If the list is closed, calling this method will open it.
 */
AbsCode.prototype.toggleOpen = function() {
    this.isOpen = !this.isOpen;
};

/**
 * Toggles the {@link AbsCode#isActive} property.
 */
AbsCode.prototype.toggleActive = function(test) {
    this.isActive = !this.isActive;
    function clearParents(code) {
        if (defined(code.parent)) {
            code.parent.isActive = false;
            clearParents(code.parent);
        }
    }
    function clearChildren(code) {
        code.items.forEach( function(item) {
            item.isActive = false;
            clearChildren(item);
        });
    }
    if (this.isActive) {
        clearParents(this);
        clearChildren(this);
    }
    if (defined(this.updateFunction)) {
        this.updateFunction();
    }
};

module.exports = AbsCode;
