'use strict';

/*global require*/
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');

function MapInteractionMode(message) {
    /**
     * Gets or sets the message displayed on the map when in this mode.
     * @type {[type]}
     */
    this.message = message;

    /**
     * Gets or sets the features that are currently picked.
     * @type {PickedFeatures}
     */
    this.pickedFeatures = undefined;

    knockout.track(this, ['message', 'pickedFeatures']);
}

module.exports = MapInteractionMode;
