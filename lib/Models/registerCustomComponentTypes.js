'use strict';

/*global require*/

const Chart = require('../ReactViews/Chart');
const Collapsible = require('../ReactViews/Collapsible');
const CustomComponents = require('./CustomComponents');
const CustomComponentType = require('./CustomComponentType');

const React = require('react');

/**
 * Registers custom component types.
 */
var registerCustomComponentTypes = function(terria) {

    function processChartNode(node, children) {
        return React.createElement(Chart, {
            url: node.attribs['src-preview'],
            key: node.attribs['src-preview'],
            children: children,
            mini: true,
            data: node.attribs.data,
            transitionDuration: 300,
            terria: terria,
            expandUrl: node.attribs.src
        });
    }

    var chartComponentType = new CustomComponentType({
        name: 'chart',
        attributes: ['src', 'src-preview', 'data'],
        processNode: processChartNode,
        furtherProcessing: [
            {
                shouldProcessNode: node => (
                    // Finds and replaces <tr><td>Title</td><td><chart></chart></tr>
                    node.name === 'td'
                    && node.children.length === 1
                    && node.children[0].name === 'chart'
                    && node.parent.name === 'tr'
                    && node.parent.children.length === 2
                ),
                processNode: function(node, children) {
                    const rowName = node.parent.children[0].children[0].data;
                    const revisedChildren = [
                        React.createElement('div', {key: 'title', className: 'chart-title'}, rowName)
                    ].concat(children);
                    return React.createElement(node.name, {key: 'chart', colSpan: 2}, node.data, revisedChildren);
                }
            },
            {
                shouldProcessNode: node => (
                    // Finds and replaces <tr><td>Title</td><td><chart></chart></tr>
                    node.name === 'td'
                    && node.children.length === 1
                    && node.parent.name === 'tr'
                    && node.parent.children.length === 2
                    && node.parent.children[1].name === 'td'
                    && node.parent.children[1].children.length === 1
                    && node.parent.children[1].children[0].name === 'chart'
                ),
                processNode: function(node, children) {
                    return; // kill this one
                }
            }
        ]
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

module.exports = registerCustomComponentTypes;
