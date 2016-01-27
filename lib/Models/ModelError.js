'use strict';

/*global require*/

var TerriaError = require('../Core/TerriaError');

/**
 * Represents an error that occurred in a model, especially an asynchronous one that cannot be raised
 * by throwing an exception because no one would be able to catch it.
 *
 * @alias ModelError
 * @constructor
 *
 * @param {Object} options Object with the following properties:
 * @param {Object} [options.sender] The object raising the error.
 * @param {String} [options.title='An error occurred'] A short title describing the error.
 * @param {String} options.message A detailed message describing the error.  This message may be HTML and it should be sanitized before display to the user.
 */
var ModelError = TerriaError;

module.exports = ModelError;
