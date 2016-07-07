'use strict';

/*global require*/
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');

/**
 * A mode for interacting with the map.
 *
 * @alias MapInteractionMode
 * @constructor
 *
 * @param {Object} [options] Object with the following properties:
 * @param {Function} [options.onCancel] The function to invoke if the user cancels the interaction mode.  The cancel button will
 *                                      only appear if this property is specified.
 * @param {String} [options.message] The message to display over the map while the interaction mode is active.
 **/
function MapInteractionMode(options) {
    /**
     * Gets or sets a callback that is invoked when the user cancels the interaction mode.  If this property is undefined,
     * the interaction mode cannot be canceled.
     * @type {Function}
     */
    this.onCancel = options.onCancel;

    /**
     * Gets or sets the html formatted message displayed on the map when in this mode.
     * @type {Function}
     */
    this.message = function() { return options.message; };

    /**
     * Set the text of the button for the dialog the message is displayed on.
     * @type {String}
     */
    this.buttonText = defaultValue(options.buttonText, "Cancel");

    /**
     * Gets or sets the features that are currently picked.
     * @type {PickedFeatures}
     */
    this.pickedFeatures = undefined;

    /**
     * Determines whether a rectangle will be requested from the user rather than a set of pickedFeatures.
     * @type {Boolean}
     */
    this.drawRectangle = defaultValue(options.drawRectangle, false);

    knockout.track(this, ['message', 'pickedFeatures']);
}

module.exports = MapInteractionMode;
