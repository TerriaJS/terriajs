'use strict';

/*global require*/

var defined = require('terriajs-cesium/Source/Core/defined');

var customComponents = require('./customComponents');
var CustomComponentType = require('./CustomComponentType');
var ChartViewModel = require('../ViewModels/ChartViewModel');
var CollapsibleViewModel = require('../ViewModels/CollapsibleViewModel');

var registerCustomComponentTypes = function() {

    var chartTagType = new CustomComponentType({
        name: 'chart',
        customSetup: function(customComponentInstance) {
            extractTitleFromTable(customComponentInstance);
            // assume all charts shown as custom components are expandable and downloadable
            customComponentInstance.attributes.canExpand = true;
            customComponentInstance.attributes.canDownload = true;
        },
        render: function(instance) {
            var chartViewModel = new ChartViewModel(instance.parentViewModel, instance.attributes.srcPreview || instance.attributes.src, instance.attributes);
            chartViewModel.show(document.getElementById(instance.containerId));
        }
    });
    customComponents.register(chartTagType);


    var collapsibleTagType = new CustomComponentType({
        name: 'collapsible',
        render: function(instance) {
            var collapsibleViewModel = new CollapsibleViewModel(instance.attributes.name, instance.attributes.open);
            collapsibleViewModel.show(document.getElementById(instance.containerId));
        }
    });
    customComponents.register(collapsibleTagType);


    var testTagType = new CustomComponentType({
        name: 'test',
    });
    customComponents.register(testTagType);

};


function removeElement(element) {
    // removeChild is better supported than plain remove()
    element.parentElement.removeChild(element);
}

function extractTitleFromTable(customComponentInstance) {
    // if this tag is in a table item (TD),
    // get its title from the preceding column, delete that column, and set this column's colSpan to 2.
    var parent = customComponentInstance.element.parentElement;
    if (parent.tagName.toLowerCase() === 'td') {
        if (!defined(customComponentInstance.attributes.title)) {
            var uncle = parent.previousSibling;
            if (uncle.nodeType === 1 && uncle.tagName.toLowerCase() === 'td') {
                var title = uncle.firstChild.textContent || uncle.firstChild.innerHTML;
                if (title) {
                    customComponentInstance.attributes.title = title;
                }
                removeElement(uncle);
                parent.colSpan = 2;
            }
        }
    }
}

module.exports = registerCustomComponentTypes;
