"use strict";

import i18next from "i18next";
/*global require*/

var defaultValue = require("terriajs-cesium/Source/Core/defaultValue").default;

/**
 * Represents an error that occurred in a TerriaJS module, especially an asynchronous one that cannot be raised
 * by throwing an exception because no one would be able to catch it.
 *
 * @alias TerriaError
 * @constructor
 *
 * @param {Object} options Object with the following properties:
 * @param {Object} [options.sender] The object raising the error.
 * @param {String} [options.title='An error occurred'] A short title describing the error.
 * @param {String} options.message A detailed message describing the error.  This message may be HTML and it should be sanitized before display to the user.
 */
var TerriaError = function(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  /**
   * Gets or sets the object that raised the error.
   * @type {Object}
   */
  this.sender = options.sender;

  /**
   * Gets or sets a short title describing the error.
   * @type {String}
   */
  this.title = defaultValue(
    options.title,
    i18next.t("core.terriaError.defaultValue")
  );

  /**
   * Gets or sets a metailed message describing the error.  This message may be HTML and it should be sanitized before display to the user.
   * @type {String}
   */
  this.message = options.message;

  /**
   * True if the user has seen this error; otherwise, false.
   * @type {Boolean}
   * @default false
   */
  this.raisedToUser = false;
};

module.exports = TerriaError;
