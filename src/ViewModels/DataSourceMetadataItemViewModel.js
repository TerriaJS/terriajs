"use strict";

/*global require*/

var defineProperties = require('../../third_party/cesium/Source/Core/defineProperties');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');

var DataSourceMetadataItemViewModel = function(name, value) {
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
     * @type {DataSourceMetadataItemViewModel[]}
     */
    this.items = [];

    /**
     * Gets or sets a value indicating whether this metadata item is currently open.  When an
     * item is open, its child items (if any) are visible.  This property is observable.
     * @type {Boolean}
     */
    this.isOpen = true;

    knockout.track(this, ['name', 'value', 'items']);
};

defineProperties(DataSourceMetadataItemViewModel, {
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

module.exports = DataSourceMetadataItemViewModel;
