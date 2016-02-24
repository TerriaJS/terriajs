'use strict';

/*global require*/

const defined = require('terriajs-cesium/Source/Core/defined');
const DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');

const Chart = require('../ReactViews/Chart');
const ChartExpandButton = require('../ReactViews/ChartExpandButton');
const Collapsible = require('../ReactViews/Collapsible');
const CustomComponents = require('./CustomComponents');
const CustomComponentType = require('./CustomComponentType');

const React = require('react');

const chartAttributes = [
    'src',
    'src-preview',
    'sources',
    'source-names',
    'long-names',
    'data',
    'source-preview',
    'source-default',
    'title',
    'x-column',
    'y-column',
    'y-columns',
    'column-names',
    'column-units'
];

function splitStringIfDefined(string) {
    return defined(string) ? string.split(',') : undefined;
}

/**
 * Registers custom component types.
 * See CustomComponentType for details.
 */
const registerCustomComponentTypes = function(terria) {
    //
    // A <chart> can have the following attributes. Currently only csv data is implemented.
    //
    // - [title]:        TBC
    // - [x-column]:     TBC
    // - [y-column]:     TBC
    // - [y-columns]:    TBC
    // - [column-names]: Comma-separated list of column names to override those in the source data; empty strings retain the original column name.
    //                   Eg. column-names="Time,Height,Speed"
    // - [column-units]: Comma-separated list of the units for each column. Empty strings are ok.
    //                   Eg. column-units=",m,km/h"
    //
    // Provide the data in one of these four ways:
    // - [sources]:      Comma-separated URLs for data at each available time range. The first in the list is shown in the feature info panel preview.
    //                   Eg. sources="http://example.com/series?offset=1d,http://example.com/series?offset=5d,http://example.com/series?all"
    // - [source-names]: Comma-separated display names for each available time range, used in the expand-chart dropdown button.
    //                   Eg. source-names="1d,5d,max".
    // - [long-names]:   Comma-separated longer names for each available time range. Only the first is used, as the preview chart x-axis label. Defaults to source-names.
    //                   Eg. long-names="Last 24 hours,Last 5 days,Time".
    // Or:
    // - [src]:          The URL of the data to show in the chart panel, once "expand" is clicked. Eg. src="http://example.com/full_time_series.csv".
    // - [src-preview]:  The URL of the data to show in the feature info panel. Defaults to src. Eg. src-preview="http://example.com/preview_time_series.csv".
    // Or:
    // - [data]:         csv-formatted data, with \n for newlines. Eg. data="time,a,b\n2016-01-01,2,3\n2016-01-02,5,6".
    // Or:
    // - None of the above, but supply csv-formatted data as the content of the chart data, with \n for newlines.
    //                   Eg. <chart>time,a,b\n2016-01-01,2,3\n2016-01-02,5,6</chart>.
    //
    function processChartNode(catalogItem, feature, node, children) {
        checkAllPropertyKeys(node.attribs, chartAttributes);
        const columnNames = splitStringIfDefined(node.attribs['column-names']);
        const columnUnits = splitStringIfDefined(node.attribs['column-units']);
        // Present src and src-preview as if they came from sources.
        let sources = splitStringIfDefined(node.attribs.sources);
        const sourceNames = splitStringIfDefined(node.attribs['source-names']);
        const longSourceNames = splitStringIfDefined(node.attribs['long-names']);
        if (!defined(sources) && defined(node.attribs.src)) {
            // [src-preview, src], or [src] if src-preview is not defined.
            sources = [node.attribs.src];
            if (defined(node.attribs['src-preview'])) {
                sources.unshift(node.attribs['src-preview']);
            }
        }
        let title = node.attribs.title;
        if (!defined(title)) {
            title = getTitleFromFirstColumnIfPossible(node);
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
                columnNames: columnNames,
                columnUnits: columnUnits,
                chartTitle: title
            }),
            React.createElement(Chart, {
                key: 'chart',
                axisLabel: {
                    x: defined(longSourceNames) ? longSourceNames[0] : (defined(sourceNames) ? sourceNames[0] : undefined),
                    y: undefined
                },
                url: defined(sources) ? sources[0] : undefined,
                mini: true,
                data: replaceNewLines(node.attribs.data || children[0]),  // Present contents and data attribute as data. TODO: This is in the wrong format (csv not LineChart).
                // columnNames: columnNames,  // Not sure yet if we need this; ideally Chart would get it direct from data.
                // columnUnits: columnUnits,
                transitionDuration: 300
            }),
        ]);
    }

    function getTitleFromFirstColumnIfPossible(node) {
        // If the chart tag doesn't have a title, then check for one in the position 'Title' relative to node <chart>:
        // <tr><td>Title</td><td><chart></chart></tr>
        if (defined(node.parent) && (node.parent.name === 'td')
            && defined(node.parent.parent) && (node.parent.parent.name === 'tr')
            && defined(node.parent.parent.children[0])
            && defined(node.parent.parent.children[0].children[0])) {
                return node.parent.parent.children[0].children[0].data;
        }
    }

    var chartComponentType = new CustomComponentType({
        name: 'chart',
        attributes: chartAttributes,
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

function checkAllPropertyKeys(object, allowedKeys) {
    for (var key in object) {
        if (object.hasOwnProperty(key)) {
            if (allowedKeys.indexOf(key) === -1) {
                throw new DeveloperError('Unknown attribute ' + key);
            }
        }
    }
}

module.exports = registerCustomComponentTypes;
