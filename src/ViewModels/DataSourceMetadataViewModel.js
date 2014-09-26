"use strict";

/*global require*/

var DataSourceMetadataGroupViewModel = require('./DataSourceMetadataGroupViewModel');

var DataSourceMetadataViewModel = function() {
    /**
     * Gets or sets the metadata group for the data source itself.
     * @type {DataSourceMetadataGroupViewModel}
     */
    this.dataSourceMetadata = new DataSourceMetadataGroupViewModel();

    /**
     * Gets or sets the metadata group for the service 
     * @type {DataSourceMetadataGroupViewModel}
     */
    this.serviceMetadata = new DataSourceMetadataGroupViewModel();

    /**
     * Gets or sets a promise that, when resolved, indicates that the metadata groups are
     * fully populated.
     * @type {Promise}
     */
    this.promise = undefined;
};

module.exports = DataSourceMetadataViewModel;
