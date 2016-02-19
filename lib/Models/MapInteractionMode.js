'use strict';

/*global require*/
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');

function MapInteractionMode(options) {
    /**
     * Gets or sets a callback that is invoked when the user cancels the interaction mode.  If this property is undefined,
     * the interaction mode cannot be canceled.
     * @type {Function}
     */
    this.onCancel = options.onCancel;

    /**
     * Gets or sets the message displayed on the map when in this mode.
     * @type {[type]}
     */
    this.message = options.message;

    /**
     * Gets or sets the features that are currently picked.
     * @type {PickedFeatures}
     */
    this.pickedFeatures = undefined;

    knockout.track(this, ['message', 'pickedFeatures']);
}

module.exports = MapInteractionMode;
