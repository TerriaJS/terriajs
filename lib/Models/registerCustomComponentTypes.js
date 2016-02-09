'use strict';

/*global require*/

var defined = require('terriajs-cesium/Source/Core/defined');

var customComponents = require('./customComponents');
var CustomComponentType = require('./CustomComponentType');
var ChartViewModel = require('../ViewModels/ChartViewModel');
var CollapsibleViewModel = require('../ViewModels/CollapsibleViewModel');

/**
 * Registers custom component types.
 *
 * @param  {Object} [options] Options.
 * @param  {ChartPanelViewModel} [options.chartPanelViewModel] The chartPanelViewModel, if available.
 */
var registerCustomComponentTypes = function(options) {

    var chartComponentType = new CustomComponentType({
        name: 'chart',
        customSetup: function(customComponentElement) {
            extractTitleFromTable(customComponentElement);
            // assume all charts shown as custom components are expandable and downloadable
            customComponentElement.attributes.canExpand = true;
            customComponentElement.attributes.canDownload = true;
        },
        render: function(element) {
            var chartViewModel = new ChartViewModel(options.chartPanelViewModel, element.owner, element.attributes.srcPreview || element.attributes.src, element.attributes);
            chartViewModel.show(document.getElementById(element.containerId));
        }
    });
    customComponents.register(chartComponentType);


    var collapsibleComponentType = new CustomComponentType({
        name: 'collapsible',
        render: function(element) {
            var collapsibleViewModel = new CollapsibleViewModel(element.attributes.name, element.attributes.open);
            collapsibleViewModel.show(document.getElementById(element.containerId));
        }
    });
    customComponents.register(collapsibleComponentType);

};


function removeElement(element) {
    // removeChild is better supported than plain remove()
    element.parentElement.removeChild(element);
}

function extractTitleFromTable(customComponentElement) {
    // if this tag is in a table item (TD),
    // get its title from the preceding column, delete that column, and set this column's colSpan to 2.
    var parent = customComponentElement.originalElement.parentElement;
    if (parent.tagName.toLowerCase() === 'p') {
        parent = parent.parentElement;
    }
    if (parent.tagName.toLowerCase() === 'td') {
        if (!defined(customComponentElement.attributes.title)) {
            var uncle = parent.previousSibling;
            if (uncle.nodeType === 1 && uncle.tagName.toLowerCase() === 'td') {
                var title = uncle.firstChild.textContent || uncle.firstChild.innerHTML;
                if (title) {
                    customComponentElement.attributes.title = title;
                }
                removeElement(uncle);
                parent.colSpan = 2;
            }
        }
    }
}

module.exports = registerCustomComponentTypes;
