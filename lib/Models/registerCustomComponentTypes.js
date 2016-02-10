'use strict';

/*global require*/

const defined = require('terriajs-cesium/Source/Core/defined');

const Chart = require('../ReactViews/Chart');
const Collapsible = require('../ReactViews/Collapsible');
const CustomComponents = require('./CustomComponents');
const CustomComponentType = require('./CustomComponentType');

const React = require('react');

/**
 * Registers custom component types.
 */
var registerCustomComponentTypes = function() {

    var chartComponentType = new CustomComponentType({
        name: 'chart',
        processNode: function(node, children) {
            // charts ignore children.
            // node is eg. {type: "tag", name: "chart", attribs: {src: "filename.csv"}, children: [], next: null, parent: null, prev: null}
            const x = React.createElement(Chart, {
                url: node.attribs.srcPreview,
                key: node.attribs.srcPreview
            });
            return x;
        }
    });
    CustomComponents.register(chartComponentType);

    var collapsibleComponentType = new CustomComponentType({
        name: 'collapsible',
        processNode: function(node, children) {
            const x = React.createElement(Collapsible, {
                startsOpen: node.attribs.open,
                title: node.attribs.title,
                key: node.attribs.title,
                children: children
            });
            return x;
        }
    });
    CustomComponents.register(collapsibleComponentType);

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
