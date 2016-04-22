'use strict';

/*global require*/

const defined = require('terriajs-cesium/Source/Core/defined');
const DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');

const Chart = require('../ReactViews/Chart/Chart');
const ChartExpandButton = require('../ReactViews/Chart/ChartExpandButton');
const Collapsible = require('../ReactViews/Chart/Collapsible');
const CustomComponents = require('./CustomComponents');
const CustomComponentType = require('./CustomComponentType');
const TableStructure = require('../Map/TableStructure');

const React = require('react');

const chartAttributes = [
    'src',
    'src-preview',
    'sources',
    'source-names',
    'preview-x-label',
    'data',
    'source-preview',
    'source-default',
    'id',
    'x-column',
    'y-column',
    'y-columns',
    'column-names',
    'column-units',
    'styling',
    'highlight-x'
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
    // Note if you change any of these, also update the chartAttributes array above, or they won't make it here.
    //
    // - [x-column]:     The x column name or number to show in the preview, if not the first appropriate column. NOT FULLY IMPLEMENTED YET.
    // - [y-column]:     The y column name or number to show in the preview, if not the first scalar column.
    // - [y-columns]:    Comma-separated list of y column names or numbers to show in the preview. Overrides "y-column" if provided.
    // - [column-names]: Comma-separated list of column names to override those in the source data; empty strings retain the original column name.
    //                   Eg. column-names="Time,Height,Speed"
    // - [column-units]: Comma-separated list of the units for each column. Empty strings are ok.
    //                   Eg. column-units=",m,km/h"
    // - [preview-x-label]: The preview chart x-axis label. Defaults to empty string. Eg. long-names="Last 24 hours,Last 5 days,Time".
    // - [id]:           An id for the chart; give different charts from the same feature different ids.
    // - [styling]:      Defaults to 'feature-info'. Can also be 'histogram'. TODO: improve.
    // - [highlight-x]:  An x-coordinate to highlight.
    //
    // Provide the data in one of these four ways:
    // - [sources]:      Comma-separated URLs for data at each available time range. The first in the list is shown in the feature info panel preview.
    //                   Eg. sources="http://example.com/series?offset=1d,http://example.com/series?offset=5d,http://example.com/series?all"
    // - [source-names]: Comma-separated display names for each available time range, used in the expand-chart dropdown button.
    //                   Eg. source-names="1d,5d,max".
    // Or:
    // - [src]:          The URL of the data to show in the chart panel, once "expand" is clicked. Eg. src="http://example.com/full_time_series.csv".
    // - [src-preview]:  The URL of the data to show in the feature info panel. Defaults to src. Eg. src-preview="http://example.com/preview_time_series.csv".
    // Or:
    // - [data]:         csv-formatted data, with \n for newlines. Eg. data="time,a,b\n2016-01-01,2,3\n2016-01-02,5,6".
    //                   or json-formatted string data, with \quot; for quotes, eg. data="[[\quot;a\quot;,\quot;b\quot;],[2,3],[5,6]]".
    // Or:
    // - None of the above, but supply csv-formatted data as the content of the chart data, with \n for newlines.
    //                   Eg. <chart>time,a,b\n2016-01-01,2,3\n2016-01-02,5,6</chart>.
    //
    function processChartNode(catalogItem, feature, node, children) {
        checkAllPropertyKeys(node.attribs, chartAttributes);
        const columnNames = splitStringIfDefined(node.attribs['column-names']);
        const columnUnits = splitStringIfDefined(node.attribs['column-units']);
        const styling = node.attribs['styling'] || 'feature-info';
        // Present src and src-preview as if they came from sources.
        let sources = splitStringIfDefined(node.attribs.sources);
        const sourceNames = splitStringIfDefined(node.attribs['source-names']);
        const previewXLabel = node.attribs['preview-x-label'];
        if (!defined(sources) && defined(node.attribs.src)) {
            // [src-preview, src], or [src] if src-preview is not defined.
            sources = [node.attribs.src];
            if (defined(node.attribs['src-preview'])) {
                sources.unshift(node.attribs['src-preview']);
            }
        }
        const id = node.attribs.id;
        let yColumns = splitStringIfDefined(node.attribs['y-columns']);
        if (!defined(yColumns) && defined(node.attribs['y-column'])) {
            yColumns = [node.attribs['y-column']];
        }
        return React.createElement('div', {
            key: (sources && sources.join('|')) || 'chart-wrapper',
            className: 'preview-chart-wrapper'
        }, [
            React.createElement(ChartExpandButton, {
                key: 'button',
                terria: terria,
                catalogItem: catalogItem,
                feature: feature,
                sources: sources,
                // sourceData: sourceData,
                sourceNames: sourceNames,
                columnNames: columnNames,
                columnUnits: columnUnits,
                xColumn: node.attribs['x-column'],
                yColumns: yColumns,
                id: id,
                canDownload: true,
                raiseToTitle: !!getInsertedTitle(node)
            }),
            React.createElement(Chart, {
                key: 'chart',
                axisLabel: {
                    x: previewXLabel,
                    y: undefined
                },
                url: defined(sources) ? sources[0] : undefined,
                tableStructure: tableStructureFromStringData(node.attribs['data']),
                xColumn: node.attribs['x-column'],
                yColumns: yColumns,
                styling: styling,
                highlightX: node.attribs['highlight-x'],
                // columnNames: columnNames,  // Not sure yet if we need this; ideally Chart would get it direct from data.
                // columnUnits: columnUnits,
                transitionDuration: 300
            }),
        ]);
    }

    function tableStructureFromStringData(stringData) {
        // sourceData can be either json (starts with a '[') or csv format (contains a '\n'; \n is replaced with a real linefeed).
        if (!defined(stringData) || stringData.length < 2) {
            return;
        }
        if (stringData[0] === '[') {
            // Treat as json.
            const json = JSON.parse(stringData.replace(/&quot;/g, '"'));
            return TableStructure.fromJson(json);
        }
        if (stringData.indexOf('\\n') >=0) {
            // Treat as csv.
            return TableStructure.fromCsv(stringData.replace(/\\n/g, '\n'));
        }
    }

    function getInsertedTitle(node) {
        // Check if there is a title in the position 'Title' relative to node <chart>:
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
                        React.createElement('div', {key: 'title', displayName: 'title', className: 'chart-title-from-table'}, title)
                    ].concat(children);
                    return React.createElement(node.name, {key: 'chart', displayName: 'chart', colSpan: 2, className: 'chart'}, node.data, revisedChildren);
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
    if (!defined(terria)) {
        // The chart expand button needs a reference to the Terria instance to add the chart to the catalog.
        throw new DeveloperError('Terria is a required argument of registerCustomComponentTypes.');
    }
    CustomComponents.register(chartComponentType);

    var collapsibleComponentType = new CustomComponentType({
        name: 'collapsible',
        attributes: ['title', 'open'],
        processNode: function(catalogItem, feature, node, children) {
            return React.createElement(Collapsible, {
                key: node.attribs.title,
                displayName: node.attribs.title,
                title: node.attribs.title,
                startsOpen: typeof node.attribs.open === 'string' ? JSON.parse(node.attribs.open) : undefined,
                children: children
            });
        }
    });
    CustomComponents.register(collapsibleComponentType);

};

// function replaceNewLines(string) {
//     if (defined(string)) {
//         return string.replace('\\n', '\n');
//     }
// }

function checkAllPropertyKeys(object, allowedKeys) {
    for (var key in object) {
        if (object.hasOwnProperty(key)) {
            if (allowedKeys.indexOf(key) === -1) {
                console.log('Unknown attribute ' + key);
                throw new DeveloperError('Unknown attribute ' + key);
            }
        }
    }
}

module.exports = registerCustomComponentTypes;
