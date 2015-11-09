"use strict";

var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defined = require('terriajs-cesium/Source/Core/defined');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var createGuid = require('terriajs-cesium/Source/Core/createGuid');

/**
 * Represents a custom tag type, eg. <chart>.
 *
 * @alias CustomTagType
 * @constructor
 */
var CustomTagType = function(options) {

    var that = this;
    /**
     * A function that creates a replacement DOM element.
     * @callback CustomTagType~createContainer
     * @returns {Element} The DOM element.
     */
     function defaultCreateContainer() {
         var replacement = document.createElement('span');
         replacement.id = createGuid();
         replacement.className = that.containerClassName;
         return replacement;
     }

    if (!defined(options.name)) {
        throw new DeveloperError('Custom tags must have a tag name.');
    }

    /**
     * Gets or sets the tag name, eg. "chart". This is converted to lower case.
     * @type {String}
     */
    this.name = options.name.toLowerCase();

    /**
     * Gets or sets the container class name for this type. Used by the default createContainer() function.
     * Defaults to <tagName>-wrapper, eg. "chart-wrapper".
     * @type {Object}
     */
    this.containerClassName = defaultValue(options.containerClassName, this.name + '-wrapper');

    /**
     * Gets or sets the function which creates the replacement DOM element.
     * @type {CustomTagType~createContainer}
     */
    this.createContainer = defaultValue(options.createContainer, defaultCreateContainer);

    /**
     * Gets or sets a function which is called when an instance of this custom tag is created.
     * @type {CustomTagType~render}
     */
    this.render = defaultValue(options.render, function() {});

    /**
     * Gets or sets a function which is called when an instance of this custom tag is created.
     * @type {CustomTagType~customSetup}
     */
    this.customSetup = defaultValue(options.customSetup, function() {});

    /**
     * A function that is called to render this custom tag.
     * @callback CustomTagType~render
     * @param CustomTagInstance The custom tag instance being rendered.
     */

    /**
     * A function that is called when an instance of this custom tag is created.
     * @callback CustomTagType~customSetup
     * @param CustomTagInstance The custom tag instance being set up.
     */

};

module.exports = CustomTagType;
