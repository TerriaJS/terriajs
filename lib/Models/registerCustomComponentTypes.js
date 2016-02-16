'use strict';

/*global require*/

const defined = require('terriajs-cesium/Source/Core/defined');

const Chart = require('../ReactViews/Chart');
const ChartExpandButton = require('../ReactViews/ChartExpandButton');
const Collapsible = require('../ReactViews/Collapsible');
const CustomComponents = require('./CustomComponents');
const CustomComponentType = require('./CustomComponentType');

const React = require('react');

/**
 * Registers custom component types.
 * See CustomComponentType for details.
 */
var registerCustomComponentTypes = function(terria) {
    //
    // A <chart> can have the following attributes. Currently only csv data is implemented.
    //
    // Provide the data in one of these four ways:
    // - [sources]:      Comma-separated URLs for data at each available time range. The first in the list is shown in the feature info panel preview.
    //                   Eg. sources="http://example.com/series?offset=1d,http://example.com/series?offset=5d,http://example.com/series?all"
    // - [source-names]: Comma-separated display names for each available time range.
    //                   Eg. source-names="1d,5d,max"
    // Or:
    // - [src]:          The URL of the data to show in the chart panel, once "expand" is clicked. Eg. src="http://example.com/full_time_series.csv".
    // - [src-preview]:  The URL of the data to show in the feature info panel. Defaults to src. Eg. src-preview="http://example.com/preview_time_series.csv".
    // Or:
    // - [data]:         csv-formatted data, with \n for newlines. Eg. data="time,a,b\n2016-01-01,2,3\n2016-01-02,5,6"
    // Or:
    // - None of the above, but supply csv-formatted data as the content of the chart data, with \n for newlines.
    //                   Eg. <chart>time,a,b\n2016-01-01,2,3\n2016-01-02,5,6</chart>
    //
    function processChartNode(catalogItem, feature, node, children) {
        // Present src and src-preview as if they came from sources.
        var sources = node.attribs.sources;
        var sourceNames = node.attribs['source-names'];
        if (defined(sources)) {
            sources = sources.split(',');
            sourceNames = defined(sourceNames) ? sourceNames.split(',') : undefined;
        } else if (defined(node.attribs.src)) {
            // [src-preview, src], or [src] if src-preview is not defined.
            sources = [node.attribs.src];
            if (defined(node.attribs['src-preview'])) {
                sources.unshift(node.attribs['src-preview']);
            }
        }
        return React.createElement('div', {
            key: sources.join('|') || 'chart-wrapper',
            className: 'preview-chart-wrapper'
        }, [
            React.createElement(ChartExpandButton, {
                key: 'button',
                terria: terria,
                catalogItem: catalogItem,
                feature: feature,
                sources: sources,
                sourceNames: sourceNames,
            }),
            React.createElement(Chart, {
                key: 'chart',
                url: defined(sources) ? sources[0] : undefined,
                mini: true,
                data: replaceNewLines(node.attribs.data || children[0]),  // Present contents and data attribute as data. TODO: This is in the wrong format (csv not LineChart).
                transitionDuration: 300
            }),
        ]);
    }

    var chartComponentType = new CustomComponentType({
        name: 'chart',
        attributes: ['src', 'src-preview', 'sources', 'source-names', 'data', 'source-preview', 'source-default', 'x-column', 'y-column', 'y-columns'],
        processNode: processChartNode,
        furtherProcessing: [
            //
            // These replacements reformat <chart>s defined directly in a csv, so they take the full width of the 2-column table,
            // and present the column name as the title.
            // It replaces:
            // <tr><td>Title</td><td><chart></chart></tr>
            // with:
            // <tr><td colSpan:2><div class="chart-title">Title</div><chart></chart></tr>
            //
            {
                shouldProcessNode: node => (
                    // If this node is a <chart> in the second column of a 2-column table,
                    // then add a title taken from the first column, and give it colSpan 2.
                    node.name === 'td'
                    && node.children.length === 1
                    && node.children[0].name === 'chart'
                    && node.parent.name === 'tr'
                    && node.parent.children.length === 2
                ),
                processNode: function(catalogItem, feature, node, children) {
                    const title = node.parent.children[0].children[0].data;
                    const revisedChildren = [
                        React.createElement('div', {key: 'title', className: 'chart-title'}, title)
                    ].concat(children);
                    return React.createElement(node.name, {key: 'chart', colSpan: 2}, node.data, revisedChildren);
                }
            },
            {
                shouldProcessNode: node => (
                    // If this node is in the first column of a 2-column table, and the second column is a <chart>,
                    // then remove it.
                    node.name === 'td'
                    && node.children.length === 1
                    && node.parent.name === 'tr'
                    && node.parent.children.length === 2
                    && node.parent.children[1].name === 'td'
                    && node.parent.children[1].children.length === 1
                    && node.parent.children[1].children[0].name === 'chart'
                ),
                processNode: function() {
                    return;  // Do not return a node.
                }
            }
        ]
    });
    CustomComponents.register(chartComponentType);

    var collapsibleComponentType = new CustomComponentType({
        name: 'collapsible',
        attributes: ['title', 'open'],
        processNode: function(catalogItem, feature, node, children) {
            return React.createElement(Collapsible, {
                key: node.attribs.title,
                title: node.attribs.title,
                startsOpen: node.attribs.open,
                children: children
            });
        }
    });
    CustomComponents.register(collapsibleComponentType);

};

function replaceNewLines(string) {
    if (defined(string)) {
        return string.replace('\\n', '\n');
    }
}

module.exports = registerCustomComponentTypes;
