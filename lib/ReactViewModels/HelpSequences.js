"use strict";

/*global require*/
var defaultValue = require("terriajs-cesium/Source/Core/defaultValue").default;

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
  this.menuTitle = defaultValue(options.menuTitle, "Help");

  /*
   * Collection of HelpSequences.
   * @type {HelpSequence []}
   */
  this.sequences = [];
};

module.exports = HelpSequences;
