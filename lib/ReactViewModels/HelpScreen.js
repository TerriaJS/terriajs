"use strict";

/*global require*/
var defaultValue = require("terriajs-cesium/Source/Core/defaultValue").default;
var knockout = require("terriajs-cesium/Source/ThirdParty/knockout").default;

/**
 * Callback before screen is displayed.
 * @callback PreDisplayHookCallback
 * @param {Object} viewState ViewState.
 */

/**
 * Callback after screen is displayed.
 * @callback PostDisplayHookCallback
 * @param {Object} viewState ViewState.
 */

/**
 * A single help screen, which is expected to be used in a sequence of screens (HelpSequence). It is positioned near
 * the element it's explaining, usually pointing to it, and gives an indication of how far along in the HelpSequence
 * this screen is.
 *
 * @alias HelpScreen
 * @constructor
 *
 * @param {Object} [options] Object with the following properties:
 * @param {Function} options.onNext The function to invoke when the user wants to go to next screen.
 * @param {String} options.message Gets or sets the html formatted message displayed on the help screen.
 * @param {String} options.highlightedComponentId Class name of component that should be highlighted.
 * @param {Object} [options.rectangle] DOMRect rectangle for element help is describing.
 * @param {PreDisplayHookCallback} [options.preDisplayHook] Gets or sets a callback that is invoked before the screen is displayed.
 * @param {PostDisplayHookCallback} [options.postDisplayHook] Gets or sets a callback that is invoked after the screen is displayed.
 * @param {Number} [options.currentScreenNumber=0] The screen that this represents, e.g. the second in a series (zero indexed).
 * @param {Number} [options.totalNumberOfScreens=0] Number of screens in this help series.
 * @param {RelativePosition} [options.positionLeft=0] Left position relative to rectangle.
 * @param {RelativePosition} [options.positionTop=0] Top position relative to rectangle.
 * @param {Number} [options.offsetLeft=0] How many pixels from left position relative to rectangle to shift help screen.
 * @param {Number} [options.offsetTop=0] How many pixels from top position relative to rectangle to shift help screen.
 * @param {Number} [options.width=300] Width of help screen in pixels.
 * @param {Number} [options.caretTop=-5] Top position of the caret in pixels.
 * @param {Number} [options.caretLeft=-5] Left position of the caret in pixels.
 **/
function HelpScreen(options) {
  /**
   * Gets or sets a callback that is invoked when the user goes to the next screen.
   * @type {Function}
   */
  this.onNext = options.onNext;

  /**
   * Gets or sets the html formatted message displayed on the help screen.
   * @type {Function}
   */
  this.message = function() {
    return options.message;
  };

  /**
   * Class name of component that should be highlighted.
   * @type {String}
   */
  this.highlightedComponentId = options.highlightedComponentId;

  /**
   * Bounding rectangle for element help is describing
   * @type {Object}
   */
  this.rectangle = options.rectangle;

  /**
   * Gets or sets a callback that is invoked before the screen is displayed.
   * @type {PreDisplayHookCallback}
   */
  this.preDisplayHook = options.preDisplayHook;

  /**
   * Gets or sets a callback that is invoked after the screen is displayed.
   * @type {PostDisplayHookCallback}
   */
  this.postDisplayHook = options.postDisplayHook;

  /**
   * Which is the current screen the user is on?
   * @type {Number}
   */
  this.currentScreenNumber = defaultValue(options.currentScreenNumber, 0);

  /**
   * How many screens in this series?
   * @type {Number}
   */
  this.totalNumberOfScreens = defaultValue(options.totalNumberOfScreens, 0);

  /**
   * Left position relative to rectangle
   * @type {RelativePosition}
   */
  this.positionLeft = defaultValue(options.positionLeft, 0);

  /**
   * Top position relative to rectangle
   * @type {RelativePosition}
   */
  this.positionTop = defaultValue(options.positionTop, 0);

  /**
   * Left offset in pixels, relative to positionLeft
   * @type {Number}
   */
  this.offsetLeft = defaultValue(options.offsetLeft, 0);

  /**
   * Top offset in pixels, relative to positionTop
   * @type {Number}
   */
  this.offsetTop = defaultValue(options.offsetTop, 0);

  /**
   * Width of help screen in pixels.
   * @type {Number}
   * @default 300
   */
  this.width = defaultValue(options.width, 300);

  /**
   * Top position of the caret in pixels
   * @type {Number}
   */
  this.caretTop = defaultValue(options.caretTop, -5);

  /**
   * Left position of the caret in pixels
   * @type {Number}
   */
  this.caretLeft = defaultValue(options.caretLeft, -5);

  knockout.track(this, ["message"]);
}

module.exports = HelpScreen;
