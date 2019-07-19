"use strict";

/**
 * A single sequence of HelpScreens, to help the user understand one concept.
 *
 * @alias HelpSequence
 * @constructor
 * @param {HelpScreen[]} options.screens Ordered list of HelpScreens that define the HelpSequence.
 * @param {String} options.title Title for this sequence of screens.
 **/
function HelpSequence(options) {
  /**
   * Ordered list of HelpScreens that define the HelpSequence.
   * @type {HelpScreen[]}
   */
  this.screens = options.screens;

  /**
   * Title for this sequence of screens.
   * @type {String}
   */
  this.title = options.title;
}

module.exports = HelpSequence;
