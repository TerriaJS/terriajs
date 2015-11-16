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

customComponents.isCustomComponent = function(componentName) {
    return (types.contains(componentName.toLowerCase()));
};


customComponents.resetInstances = function() {
    instances = [];
};

customComponents.removeInstances = function(owner) {
    for (var i = instances.length - 1; i >= 0; i--) {
        var thisInstance = instances[i];
        if (thisInstance.owner === owner) {
            instances.splice(i, 1);  // remove it from the array
        }
    }

};

customComponents.addInstance = function(tagInstance) {
    instances.push(tagInstance);
};

customComponents.count = function(owner) {
    // how many custom component instances does this owner have?
    var count = 0;
    for (var i = instances.length - 1; i >= 0; i--) {
        var thisInstance = instances[i];
        if (thisInstance.owner === owner) {
            count++;
        }
    }
    return count;
};

customComponents.extractAndUpdateHtml = function(html, owner) {

    var ownerStartedWithInstances = (this.count(owner) > 0);

    function walkAndReplaceCustomComponents(element, index) {
        var nextNode;
        var customComponentInstance;
        var container;
        var tagName = element.tagName.toLowerCase();
        if (customComponents.isCustomComponent(tagName)) {
            var customComponentType = types.get(tagName);
            if (ownerStartedWithInstances) {
                // Use the index of the element in the provided html's DOM to identify it.
                // This could break if the structure of the html changes - but it shouldn't.
                customComponentInstance = findCustomComponent(tagName, owner, index);
                container = customComponentType.createContainer(customComponentInstance.containerId);
            }
            if (!customComponentInstance) {
                customComponentInstance = new CustomComponentInstance(customComponentType, element, owner, index);
                container = customComponentType.createContainer();
                customComponentInstance.containerId = container.id;
                customComponents.addInstance(customComponentInstance);
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
    // customComponentInstance.containerClone !== document.getElementById(customComponentInstance.containerClone.id)
    // (which is why it called containerClone, not just container, to discourage its direct use)
    return wrapper.innerHTML;
};

customComponents.render = function(owner) {
    // render all the custom component instances associated with this owner
    for (var i = instances.length - 1; i >= 0; i--) {
        var thisInstance = instances[i];
        if (thisInstance.owner === owner) {
            if (defined(thisInstance.type.render)) {
                thisInstance.type.render(thisInstance);
            }
        }
    }
};

// returns the custom component matching this owner, index and tagname, if any, else undefined
function findCustomComponent(tagName, owner, index) {
    for (var i = instances.length - 1; i >= 0; i--) {
        var thisInstance = instances[i];
        if (thisInstance.owner === owner && thisInstance.index === index && thisInstance.type.name === tagName) {
            return thisInstance;
        }
    }
    return undefined;
}

module.exports = customComponents;
