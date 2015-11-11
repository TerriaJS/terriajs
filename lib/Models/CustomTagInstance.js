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
     * Gets or sets the id attribute of the replacement DOM element used as a container.
     * This must be set manually.
     * We do not store the container itself here, because the container is often not going into the DOM.
     * Eg. if innerHTML is injected into a template rather adding the container the DOM directly.
     * @type {String}
     */
    this.containerId = undefined;

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
