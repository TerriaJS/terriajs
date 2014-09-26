"use strict";

/*global require*/

var DataSourceMetadataItemViewModel = function(name, value) {
    /**
     * Gets or sets the name of the metadata item.
     * @type {String}
     */
    this.name = name;

    /**
     * Gets or sets the value of the metadata item.
     * @type {Object}
     */
    this.value = value;
};

module.exports = DataSourceMetadataItemViewModel;
