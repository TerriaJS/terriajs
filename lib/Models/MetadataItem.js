"use strict";

/*global require*/

var knockout = require("terriajs-cesium/Source/ThirdParty/knockout").default;

/**
 * Represents a metadata item associated with Metadata
 *
 * @alias MetadataItem
 * @constructor
 */
var MetadataItem = function(name, value) {
  /**
   * Gets or sets the name of the metadata item.  This property is observable.
   * @type {String}
   */
  this.name = name;

  /**
   * Gets or sets the value of the metadata item.
   * @type {Object}
   */
  this.value = value;

  /**
   * Gets the list of metadata items contained in this group.  This property is observable.
   * @type {MetadataItem[]}
   */
  this.items = [];

  /**
   * Gets or sets a value indicating whether this metadata item is currently open.  When an
   * item is open, its child items (if any) are visible.  This property is observable.
   * @type {Boolean}
   */
  this.isOpen = true;

  knockout.track(this, ["name", "value", "items", "isOpen"]);
};

Object.defineProperties(MetadataItem.prototype, {
  /**
   * Gets a value indicating whether this item has child items.
   * @type {Boolean}
   */
  hasChildren: {
    get: function() {
      return this.items.length > 0;
    }
  },

  valueIsArray: {
    get: function() {
      return this.value instanceof Array;
    }
  }
});

/**
 * Toggles the {@link MetadataItem#isOpen} property.  If this item's list of children is open,
 * calling this method will close it.  If the list is closed, calling this method will open it.
 */
MetadataItem.prototype.toggleOpen = function() {
  this.isOpen = !this.isOpen;
};

module.exports = MetadataItem;
