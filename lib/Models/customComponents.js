"use strict";

/*global require*/
var AssociativeArray = require('terriajs-cesium/Source/Core/AssociativeArray');
var defined = require('terriajs-cesium/Source/Core/defined');

var CustomComponentElement = require('./CustomComponentElement');

var types = new AssociativeArray();
var elements = [];

/**
 * A store of registered custom component types, eg. <chart>,
 * and elements of custom components.
 */
var customComponents = {};

customComponents.register = function(customComponentType) {
    types.set(customComponentType.name, customComponentType);
};

customComponents.isCustomComponent = function(componentName) {
    return (types.contains(componentName.toLowerCase()));
};


customComponents.resetElements = function() {
    elements = [];
};

customComponents.removeElements = function(owner) {
    for (var i = elements.length - 1; i >= 0; i--) {
        var thisElement = elements[i];
        if (thisElement.owner === owner) {
            elements.splice(i, 1);  // remove it from the array
        }
    }

};

customComponents.addElement = function(element) {
    elements.push(element);
};

customComponents.count = function(owner) {
    // how many custom component elements does this owner have?
    var count = 0;
    for (var i = elements.length - 1; i >= 0; i--) {
        var thisElement = elements[i];
        if (thisElement.owner === owner) {
            count++;
        }
    }
    return count;
};

customComponents.extractAndUpdateHtml = function(html, owner) {
    // TODO: if this gets called on every clock tick, it messes up any charts that were rendered
    // into the previous container, because setting the innerHTML replaces every element.
    // We might do better with React?

    var ownerStartedWithElements = (this.count(owner) > 0);

    function walkAndReplaceCustomComponents(element, index) {
        var nextNode;
        var customComponentElement;
        var container;
        var tagName = element.tagName.toLowerCase();
        if (customComponents.isCustomComponent(tagName)) {
            var customComponentType = types.get(tagName);
            if (ownerStartedWithElements) {
                // Use the index of the element in the provided html's DOM to identify it.
                // This could break if the structure of the html changes - but it shouldn't.
                customComponentElement = findCustomComponent(tagName, owner, index);
                container = customComponentType.createContainer(customComponentElement.containerId);
            }
            if (!customComponentElement) {
                customComponentElement = new CustomComponentElement(customComponentType, element, owner, index);
                container = customComponentType.createContainer();
                customComponentElement.containerId = container.id;
                customComponents.addElement(customComponentElement);
            }
            container.innerHTML = element.innerHTML;
            element.parentElement.replaceChild(container, element);
            element = container;
        }
        for (var node = element.firstChild; node; node = nextNode) {
            nextNode = node.nextSibling;
            if (node.nodeType === 1) {
                walkAndReplaceCustomComponents(node, index++);
            }
        }
    }

    var wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    walkAndReplaceCustomComponents(wrapper, 0);
    // note that because we return the innerHTML, 
    // customComponentElement.containerClone !== document.getElementById(customComponentElement.containerClone.id)
    // (which is why it called containerClone, not just container, to discourage its direct use)
    return wrapper.innerHTML;
};

customComponents.render = function(owner) {
    // render all the custom component elements associated with this owner
    for (var i = elements.length - 1; i >= 0; i--) {
        var thisElement = elements[i];
        if (thisElement.owner === owner) {
            if (defined(thisElement.type.render)) {
                thisElement.type.render(thisElement);
            }
        }
    }
};

// returns the custom component matching this owner, index and tagname, if any, else undefined
function findCustomComponent(tagName, owner, index) {
    for (var i = elements.length - 1; i >= 0; i--) {
        var thisElement = elements[i];
        if (thisElement.owner === owner && thisElement.index === index && thisElement.type.name === tagName) {
            return thisElement;
        }
    }
    return undefined;
}

module.exports = customComponents;
