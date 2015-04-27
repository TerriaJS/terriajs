"use strict";

/*global require*/

var knockout = require('../../Cesium/Source/ThirdParty/knockout');

/**
 * Represents the AbsDataset associated with a data source.
 *
 * @alias AbsDataset
 * @function
 */
var AbsDataset = function() {
    /**
     * Gets or sets the AbsDataset concepts list.
     * @type {Array}
     */
    this.items = [];


    /**
     * Gets or sets a promise that, when resolved, indicates that the AbsDataset is
     * fully populated.
     * @type {Promise}
     */
    this.promise = undefined;

    /**
     * Gets or sets an error message resulting from attempting to get the AbsDataset, or undefined
     * if no has error occurred.
     * @type {String}
     */
    this.absErrorMessage = undefined;

    /**
     * Gets or sets a value indicating whether the AbsDataset is currently loading.
     * @type {Boolean}
     */
    this.isLoading = true;

    knockout.track(this, ['items', 'absErrorMessage', 'isLoading']);
};

module.exports = AbsDataset;
