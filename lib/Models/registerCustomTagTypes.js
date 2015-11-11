'use strict';

/*global require*/

var defined = require('terriajs-cesium/Source/Core/defined');

var customTags = require('./customTags');
var CustomTagType = require('./CustomTagType');
var ChartViewModel = require('../ViewModels/ChartViewModel');

var registerCustomTagTypes = function() {

    var chartTagType = new CustomTagType({
        name: 'chart',
        customSetup: extractTitleFromTable,
        render: function(instance) {
            var chartViewModel = new ChartViewModel(instance.parentViewModel, instance.attributes.srcPreview || instance.attributes.src, instance.attributes);
            chartViewModel.show(document.getElementById(instance.containerId));
        }
    });

    customTags.register(chartTagType);

};


function removeElement(element) {
    // removeChild is better supported than plain remove()
    element.parentElement.removeChild(element);
}

function extractTitleFromTable(customTagInstance) {
    // if this tag is in a table item (TD),
    // get its title from the preceding column, delete that column, and set this column's colSpan to 2.
    var parent = customTagInstance.element.parentElement;
    if (parent.tagName.toLowerCase() === 'td') {
        if (!defined(customTagInstance.attributes.title)) {
            var uncle = parent.previousSibling;
            if (uncle.nodeType === 1 && uncle.tagName.toLowerCase() === 'td') {
                var title = uncle.firstChild.textContent || uncle.firstChild.innerHTML;
                if (title) {
                    customTagInstance.attributes.title = title;
                }
                removeElement(uncle);
                parent.colSpan = 2;
            }
        }
    }
}

module.exports = registerCustomTagTypes;
