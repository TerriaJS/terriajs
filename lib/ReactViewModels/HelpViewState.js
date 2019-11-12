"use strict";

/*global require*/
var knockout = require("terriajs-cesium/Source/ThirdParty/knockout").default;

// Position of HelpScreen relative to highlighted element.
var RelativePosition = {
  RECT_LEFT: 0,
  RECT_RIGHT: 1,
  RECT_TOP: 2,
  RECT_BOTTOM: 3
};

/**
 * State of the help view, such as which screen of which sequence is displayed.
 *
 * @alias HelpViewState
 * @constructor
 **/
var HelpViewState = function() {
  /**
   * Which screen is currently displayed.
   * @type {HelpScreen}
   */
  this.currentScreen = undefined;

  /**
   * Which sequence is currently displayed.
   * @type {HelpSequence}
   */
  this.currentSequence = undefined;

  /**
   * Whether to cancel help mode.
   * @type {Boolean}
   */
  this.cancel = false;

  /**
   * Whether to go to next screen in help mode.
   * @type {Boolean}
   */
  this.advance = false;

  knockout.track(this, ["currentScreen", "currentSequence"]);
};

HelpViewState.RelativePosition = RelativePosition;
module.exports = HelpViewState;
