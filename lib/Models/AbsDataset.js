"use strict";

/*global require*/

var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');

/**
 * Represents the ABS Dataset associated with a ABS ITT API data source.
 * An AbsDataset contains an array one of more AbsConcepts.
 *
 * @alias AbsDataset
 * @constructor
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
