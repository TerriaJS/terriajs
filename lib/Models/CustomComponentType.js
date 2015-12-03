"use strict";

var createGuid = require('terriajs-cesium/Source/Core/createGuid');
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defined = require('terriajs-cesium/Source/Core/defined');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');

/**
 * Represents a custom component type, eg. <chart>.
 *
 * @alias CustomComponentType
 * @constructor
 */
var CustomComponentType = function(options) {

    var that = this;
    /**
     * A function that creates a replacement DOM element. 
     * The default creates a span element with a unique id and class of <this.containerClassName>.
     * @callback CustomComponentType~createContainer
     * @param {String} [id] The element's id attribute, if known. If not provided, a GUID is generated.
     * @returns {Element} The DOM element.
     */
     function defaultCreateContainer(id) {
         var replacement = document.createElement('span');
         replacement.id = defaultValue(id, createGuid());
         replacement.className = that.containerClassName;
         return replacement;
     }

    if (!defined(options.name)) {
        throw new DeveloperError('Custom components must have a tag name.');
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
     * @type {CustomComponentType~createContainer}
     */
    this.createContainer = defaultValue(options.createContainer, defaultCreateContainer);

    /**
     * Gets or sets a function which is called when an element of this custom component is created.
     * @type {CustomComponentType~render}
     */
    this.render = defaultValue(options.render, function() {});

    /**
     * Gets or sets a function which is called when an element of this custom component is created.
     * @type {CustomComponentType~customSetup}
     */
    this.customSetup = defaultValue(options.customSetup, function() {});

    /**
     * A function that is called to render this custom component.
     * @callback CustomComponentType~render
     * @param CustomComponentElement The custom component element being rendered.
     */

    /**
     * A function that is called when an element of this custom component is created.
     * @callback CustomComponentType~customSetup
     * @param CustomComponentElement The custom component element being set up.
     */

};

module.exports = CustomComponentType;
