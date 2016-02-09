'use strict';

var defined = require('terriajs-cesium/Source/Core/defined');

/**
 * Represents a custom component element.
 *
 * @alias CustomComponentElement
 * @constructor
 */
var CustomComponentElement = function(customComponentType, originalElement, owner, index) {
    /**
     * Gets or sets the type.
     * @type {CustomComponentType}
     */
    this.type = customComponentType;

    /**
     * Gets or sets the attributes of this tag, using camelCase for the properties
     * (eg. so an html attribute of "src-preview" has the key srcPreview).
     * @type {Object}
     */
    this.attributes = attributesFromOriginalElement(originalElement);

    /**
     * Gets or sets the id attribute of the replacement DOM element used as a container.
     * This must be set manually.
     * We do not store the container itself here, because the container is often not going into the DOM.
     * Eg. if innerHTML is injected into a template rather adding the container the DOM directly.
     * @type {String}
     */
    this.containerId = undefined;

    /**
     * Gets or sets the original DOM element that this custom component came from.
     * @type {Element}
     */
    this.originalElement = originalElement;

    /**
     * Gets or sets the view model which instantiated this custom component element.
     * @type {Object}
     */
    this.owner = owner;

    /**
     * Gets or sets the an index identifier.
     * @type {Integer}
     */
    this.index = index;

    if (defined(customComponentType.customSetup)) {
        customComponentType.customSetup(this);
    }
};


function attributesFromOriginalElement(element) {
    // Risk - if the user puts in attributes that are javascript reserved words, this will cause an error
    var rawAttributes = element.attributes;
    var attributesObject = {};
    var camelName;
    for (var i = rawAttributes.length - 1; i >= 0; i--) {
        camelName = rawAttributes[i].name.replace(/-([a-z])/gi, function(g) { return g[1].toUpperCase(); });
        attributesObject[camelName] = rawAttributes[i].value;
    }
    return attributesObject;
}


module.exports = CustomComponentElement;
