"use strict";

/*global require*/
var AssociativeArray = require('terriajs-cesium/Source/Core/AssociativeArray');
var defined = require('terriajs-cesium/Source/Core/defined');

var CustomComponentInstance = require('./CustomComponentInstance');

var types = new AssociativeArray();
var instances = [];

/**
 * A store of registered custom component types, eg. <chart>,
 * and instances of custom components.
 */

var customComponents = {};

customComponents.register = function(customComponentType) {
    types.set(customComponentType.name, customComponentType);
};

customComponents.isCustomComponent = function(tagName) {
    return (types.contains(tagName.toLowerCase()));
};


customComponents.resetInstances = function() {
    instances = [];
};

customComponents.removeInstance = function(tag) {
    // TODO
};

customComponents.addInstance = function(tagInstance) {
    instances.push(tagInstance);
};

customComponents.addFromAndUpdateHtml = function(html, viewModel) {
    function walkAndReplaceCustomComponents(element) {
        var nextNode;
        if (customComponents.isCustomComponent(element.tagName)) {
            var customComponentType = types.get(element.tagName.toLowerCase());
            var customComponentInstance = new CustomComponentInstance(customComponentType, element, viewModel);
            var container = customComponentType.createContainer();
            container.innerHTML = element.innerHTML;
            customComponentInstance.containerId = container.id;
            customComponents.addInstance(customComponentInstance);
            element.parentElement.replaceChild(container, element);
            element = container;
        }
        for (var node = element.firstChild; node; node = nextNode) {
            nextNode = node.nextSibling;
            if (node.nodeType === 1) {
                walkAndReplaceCustomComponents(node);
            }
        }
    }

    var wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    walkAndReplaceCustomComponents(wrapper);
    // note that because we return the innerHTML, 
    // customComponentInstance.containerClone !== document.getElementById(customComponentInstance.containerClone.id)
    // (which is why it called containerClone, not just container, to discourage its direct use)
    return wrapper.innerHTML;
};

customComponents.render = function(viewModel) {
    // render all the custom component instances associated with this viewModel
    for (var i = instances.length - 1; i >= 0; i--) {
        var thisInstance = instances[i];
        if (thisInstance.parentViewModel === viewModel) {
            if (defined(thisInstance.tagType.render)) {
                thisInstance.tagType.render(thisInstance);
            }
        }
    }
};

module.exports = customComponents;
