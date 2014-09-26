"use strict";

/*global require*/

var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');

var DataSourceMetadataGroupViewModel = function(name) {
    /**
     * Gets or sets the name of this group.
     * @type {String}
     */
    this.name = name;

    /**
     * Gets the list of metadata items contained in this group.  A metadata item may be another
     * {@link DataSourceMetadataGroupViewModel} or a {@link DataSourceMetadataValueViewModel}.
     * @type {Array}
     */
    this.items = [];

    knockout.track(this, ['name', 'items']);
};

module.exports = DataSourceMetadataGroupViewModel;
