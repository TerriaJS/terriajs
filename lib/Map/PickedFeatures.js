'use strict';

/*global require*/
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');

/**
 * Holds the vector and raster features that the user picked by clicking the mouse on the map.
 */
var PickedFeatures = function() {
    /**
     * Gets or sets a promise that indicates, when it resolves, that all picked features are available in the
     * {@see PickedFeatures#features} array.
     * @type {Promise}
     */
    this.allFeaturesAvailablePromise = undefined;

    /**
     * Gets or sets a value indicating whether the list of picked features is still loading.
     * @type {Boolean}
     */
    this.isLoading = true;

    /**
     * Gets or sets the ground position that was picked, if any.
     * @type {Cartesian3}
     */
    this.pickPosition = undefined;

    /**
     * Gets or sets the array of picked features.  The array is observable and may be updated up until the point that
     * {@see PickedFeatures#allFeaturesAvailablePromise} resolves.
     * @type {Entity[]}
     */
    this.features = [];

    /**
     * Gets or sets a message describing an error that occurred while picking features.
     * If this property is undefined, no error occurred.
     * @type {String}
     */
    this.error = undefined;

    knockout.track(this, ['isLoading', 'features', 'error']);
};

module.exports = PickedFeatures;
