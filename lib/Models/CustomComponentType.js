'use strict';

import defined from 'terriajs-cesium/Source/Core/defined';
import DeveloperError from 'terriajs-cesium/Source/Core/DeveloperError';

/**
 * Represents a custom component type, eg. <chart>.
 *
 * @alias CustomComponentType
 * @constructor
 * @param {Object} options Options.
 * @param {String} options.name The component's name, eg. 'chart'.
 */
const CustomComponentType = function(options) {

    if (!defined(options.name)) {
        throw new DeveloperError('Custom components must have a name.');
    }

    if (!defined(options.processNode)) {
        throw new DeveloperError('Custom components must have a processNode method.');
    }

    /**
     * Gets or sets the tag name, eg. "chart". This is converted to lower case.
     * @type {String}
     */
    this.name = options.name.toLowerCase();

    /**
     * Gets or sets the custom attributes for this tag, eg. ["src-preview"].
     * Used so that when the user-supplied html is sanitized, these attributes are not stripped.
     * @type {String[]}
     */
    this.attributes = options.attributes;

    /**
     * Gets or sets a function which is called when an element of this custom component is created.
     * @type {CustomComponentType~processNode}
     */
    this.processNode = options.processNode;

    /**
     * Gets or sets an array of objects with additional processNode and shouldProcessNode functions, as defined by html-to-react.
     * @type {Object[]}
     */
    this.furtherProcessing = options.furtherProcessing;
    /**
     * A function passed to html-to-react's processingInstructions.
     *
     * @callback CustomComponentType~processNode
     * @param {Object} node A description of the node in html, eg. {type: "tag", name: "chart", attribs: {src: "filename.csv"}, children: [], next: null, parent: null, prev: null}
     * @param {Object[]} children The node's children.
     */

};

module.exports = CustomComponentType;
