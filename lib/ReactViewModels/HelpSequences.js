'use strict';

/*global require*/
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');

// Position of HelpScreen relative to highlighted element.
var RelativePosition = {RECT_LEFT: 0, RECT_RIGHT: 1, RECT_TOP: 2, RECT_BOTTOM: 3};

/**
 * Collections of sequences of help screens. For example, one sequence might show how to add data. Another shows how to
 * change the map settings.
 *
 * @alias HelpSequences
 * @constructor
 * @param {String} [options.menuTitle='Help'] Title for collection of help sequences.
 **/
var HelpSequences = function(options) {
    /**
     * Title in the help dropdown.
     */
    this.menuTitle = defaultValue(options.menuTitle, 'Help');

    /*
     * Collection of HelpSequences.
     * @type {HelpSequence []}
     */
    this.sequences = [];

    /**
     * Which screen is currently displayed.
     * @type {HelpScreen}
     */
    this.currentScreen = undefined;

    /**
     * Whether to cancel help mode.
     */
    this.cancel = false;

    /**
     * Whether to go to next screen in help mode.
     */
    this.advance = false;

    knockout.track(this, ['currentScreen']);
};

HelpSequences.RelativePosition = RelativePosition;
module.exports = HelpSequences;
