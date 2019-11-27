"use strict";

/*global require*/

var MetadataItem = require("./MetadataItem");
var knockout = require("terriajs-cesium/Source/ThirdParty/knockout").default;

/**
 * Represents the metadata associated with a data source.
 *
 * @alias Metadata
 * @constructor
 */
var Metadata = function() {
  /**
   * Gets or sets the metadata group for the data source itself.
   * @type {MetadataItem}
   */
  this.dataSourceMetadata = new MetadataItem();

  /**
   * Gets or sets the metadata group for the service
   * @type {MetadataItem}
   */
  this.serviceMetadata = new MetadataItem();

  /**
   * Gets or sets a promise that, when resolved, indicates that the metadata groups are
   * fully populated.
   * @type {Promise}
   */
  this.promise = undefined;

  /**
   * Gets or sets an error message resulting from attempting to get the data source metadata, or undefined
   * if no has error occurred.
   * @type {String}
   */
  this.dataSourceErrorMessage = undefined;

  /**
   * Gets or sets an error message resulting from attempting to get the service metadata, or undefined
   * if no has error occurred.
   * @type {String}
   */
  this.serviceErrorMessage = undefined;

  /**
   * Gets or sets a value indicating whether the metadata is currently loading.
   * @type {Boolean}
   */
  this.isLoading = true;

  knockout.track(this, [
    "dataSourceMetadata",
    "serviceMetadata",
    "dataSourceErrorMessage",
    "serviceErrorMessage",
    "isLoading"
  ]);
};

module.exports = Metadata;
