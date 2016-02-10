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
        attributes: ['src', 'src-preview'],
        processNode: function(node, children) {
            // node is eg. {type: "tag", name: "chart", attribs: {src: "filename.csv"}, children: [], next: null, parent: null, prev: null}
            return React.createElement(Chart, {
                url: node.attribs['src-preview'],
                key: node.attribs['src-preview'],
                children: children
            });
        }
    });
    CustomComponents.register(chartComponentType);

    var collapsibleComponentType = new CustomComponentType({
        name: 'collapsible',
        attributes: ['title', 'open'],
        processNode: function(node, children) {
            return React.createElement(Collapsible, {
                title: node.attribs.title,
                startsOpen: node.attribs.open,
                key: node.attribs.title,
                children: children
            });
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
