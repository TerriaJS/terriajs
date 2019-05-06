"use strict";

import defined from "terriajs-cesium/Source/Core/defined";
import DeveloperError from "terriajs-cesium/Source/Core/DeveloperError";

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
    throw new DeveloperError("Custom components must have a name.");
  }

  if (!defined(options.processNode)) {
    throw new DeveloperError(
      "Custom components must have a processNode method."
    );
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
   * Gets or sets an array of objects with additional processNode and shouldProcessNode functions, as above.
   * @type {Object[]}
   */
  this.furtherProcessing = options.furtherProcessing;

  /**
   * Gets or sets a function which checks a ReactComponent and returns a Boolean indicating if that react component
   * corresponds to this type.
   * "Correspondence" is whatever the component wants it to be. It is used by CustomComponents.find.
   * CustomComponents.find is used by the feature info template to find if any custom components self-update.
   * @type {CustomComponentType~isCorresponding}
   */
  this.isCorresponding =
    options.isCorresponding || (reactComponent => undefined);

  /**
   * Gets or sets a function which checks a ReactComponent and returns an integer if it both
   * contains this custom component type, and that component would self-update (eg. from a "poll-seconds" attribute).
   * @type {CustomComponentType~selfUpdateSeconds}
   */
  this.selfUpdateSeconds =
    options.selfUpdateSeconds || (reactComponent => undefined);

  /**
   * A function passed to html-to-react's processingInstructions.
   *
   * @callback CustomComponentType~processNode
   * @param {Object} context Context for the custom component.
   * @param {CatalogMember} [context.catalogItem] The catalog item for which this chart is being requested.
   * @param {Feature} [context.feature] The feature for which this chart is being requested.
   * @param {Object} [context.updateCounters] Used for self-updating components. An object whose keys are timeoutIds, and whose values are
   *                   {reactComponent: ReactComponent, counter: Integer}. reactComponent is selected by this.isCorresponding.
   * @param {Object} node A description of the node in html, eg. {type: "tag", name: "chart", attribs: {src: "filename.csv"}, children: [], next: null, parent: null, prev: null}
   * @param {Object[]} children The node's children.
   */

  /**
   * Gets or sets a function which checks a ReactComponent and returns a Boolean indicating if that react component
   * corresponds to this type.
   *
   * @callback CustomComponentType~isCorresponding
   * @param {ReactComponent} reactComponent This react component.
   * @returns {Boolean} Does the given react component correspond to this custom component type?
   */

  /**
   * A function which checks a ReactComponent and returns an integer if it both
   * contains this custom component type, and that component would self-update (eg. from a "poll-seconds" attribute).
   *
   * @callback CustomComponentType~selfUpdateSeconds
   * @param {ReactComponent} reactComponent This react component.
   * @returns {Integer} The number of seconds between updates of this component, or undefined.
   */
};

module.exports = CustomComponentType;
