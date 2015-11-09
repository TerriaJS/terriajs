"use strict";

/*global require*/
var AssociativeArray = require('terriajs-cesium/Source/Core/AssociativeArray');

var CustomTagInstance = require('./CustomTagInstance');

var types = new AssociativeArray();
var instances = [];

/**
 * A store of registered custom tag types, eg. <chart>,
 * and instances of custom tags.
 */

var customTags = {};

customTags.register = function(customTagType) {
    types.set(customTagType.name, customTagType);
};

customTags.isCustomTag = function(tagName) {
    return (types.contains(tagName.toLowerCase()));
};


customTags.resetInstances = function() {
    instances = [];
};

customTags.removeInstance = function(tag) {
    // TODO
};

customTags.addInstance = function(tagInstance) {
    instances.push(tagInstance);
};

customTags.addFromAndUpdateHtml = function(html, viewModel) {
    function walkAndReplaceCustomTags(element) {
        var nextNode;
        if (customTags.isCustomTag(element.tagName)) {
            var customTagType = types.get(element.tagName.toLowerCase());
            var customTagInstance = new CustomTagInstance(customTagType, element, viewModel);
            customTags.addInstance(customTagInstance);
            element.parentElement.replaceChild(customTagInstance.container, element);
        } else {
            for (var node = element.firstChild; node; node = nextNode) {
                nextNode = node.nextSibling;
                if (node.nodeType === 1) {
                    walkAndReplaceCustomTags(node);
                }
            }
        }
    }

    var wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    walkAndReplaceCustomTags(wrapper);
    return wrapper.innerHTML;
};

customTags.render = function(viewModel) {
    // render all the custom tags associated with this viewModel
    for (var i = instances.length - 1; i >= 0; i--) {
        var thisInstance = instances[i];
        if (thisInstance.parentViewModel === viewModel) {
            thisInstance.tagType.render(thisInstance);
        }
    }
};

module.exports = customTags;
