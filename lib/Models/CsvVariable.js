"use strict";

/*global require*/

var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');

/**
 * Represents a variable associated with CsvDataset.
 *
 * @alias CsvVariable
 * @constructor
 */
var CsvVariable = function(name, parent) {

    /**
     * Gets or sets the name of the variable.  This property is observable.
     * @type {String}
     */
    this.name = name;

    /**
     * Gets or sets the parent for a node.  This property is observable.
     * @type {CsvVariable[]}
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
    this.isSelectable = true;  //for ko

    /**
     * Flag to say if this if this node has children.  This property is observable.
     * @type {Boolean}
     */
    this.hasChildren = false;

    knockout.track(this, ['name', 'isActive', 'isSelectable', 'parent', 'hasChildren']);
};


/**
 * Toggles the {@link CsvVariable#isActive} property.
 */
CsvVariable.prototype.toggleActive = function(item) {
    this.parent.setSelected(item.name);
};

module.exports = CsvVariable;
