"use strict";

/**
 * Represents an instance of a custom tag.
 *
 * @alias CustomTagInstance
 * @constructor
 */
var CustomTagInstance = function(customTagType, element, parentViewModel) {
    /**
     * Gets or sets the tag type.
     * @type {CustomTagType}
     */
    this.tagType = customTagType;

    /**
     * Gets or sets the attributes of this tag, using camelCase for the properties
     * (eg. so an html attribute of "src-preview" has the key srcPreview).
     * @type {Object}
     */
    this.attributes = attributesFromCustomTagElement(element);

    /**
     * Gets or sets the replacement DOM element to use as a container.
     * @type {Element}
     */
    this.container = customTagType.createContainer();

    /**
     * Gets or sets the original DOM element that this custom tag came from.
     * @type {Element}
     */
    this.element = element;

    /**
     * Gets or sets the view model which instantiated this custom tag instance.
     * @type {Object}
     */
    this.parentViewModel = parentViewModel;

    customTagType.customSetup(this);
};

/**
 * Gets the container DOM element - guaranteed to be in the DOM.
 * @returns {Element} The DOM element
 */
CustomTagInstance.prototype.getContainerFromDOM = function() {
    return document.getElementById(this.container.id);
};



function attributesFromCustomTagElement(element) {
    // Risk - if the user puts in attributes that are javascript reserved words, this will cause an error
    var rawAttributes = element.attributes;
    var attributesObject = {};
    var camelName;
    for (var i = rawAttributes.length - 1; i >= 0; i--) {
        camelName = rawAttributes[i].name.replace(/-([a-z])/gi, function (g) { return g[1].toUpperCase(); });
        attributesObject[camelName] = rawAttributes[i].value;
    }
    return attributesObject;
}


module.exports = CustomTagInstance;
