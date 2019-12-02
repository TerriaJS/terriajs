"use strict";

/* global require */

const defined = require("terriajs-cesium/Source/Core/defined").default;
const DeveloperError = require("terriajs-cesium/Source/Core/DeveloperError")
  .default;

const Chart = require("./Chart/Chart");
const ChartExpandAndDownloadButtons = require("./Chart/ChartExpandAndDownloadButtons");
const Collapsible = require("./Collapsible/Collapsible");
const CustomComponents = require("./CustomComponents");
const CustomComponentType = require("./CustomComponentType");
const TableStructure = require("../../Map/TableStructure");
const VarType = require("../../Map/VarType");
const Icon = require("../Icon");
const GLYPHS = require("../Icon").GLYPHS;

const React = require("react");

import ChartPreviewStyles from "./Chart/chart-preview.scss";

const chartAttributes = [
  "src",
  "src-preview",
  "sources",
  "source-names",
  "downloads",
  "download-names",
  "preview-x-label",
  "data",
  "id",
  "x-column",
  "y-column",
  "y-columns",
  "colors",
  "column-names",
  "column-units",
  "styling",
  "highlight-x",
  "poll-seconds",
  "poll-sources",
  "poll-id-columns",
  "poll-replace",
  "title",
  "can-download",
  "hide-buttons"
];

/**
 * @private
 */
function splitStringIfDefined(string) {
  return defined(string) ? string.split(",") : undefined;
}

/**
 * Registers custom component types.
 *
 * Here we define the following:
 * - <chart>
 * - <collapsible>
 * You can define your own by replacing this file with your own version.
 *
 *
 * <collapsible> displays a collapsible section (see Collapsible.jsx) around its children components.
 * It has two allowed attributes:
 * - title:          The title of the section.
 * - [open]:         true or false (the default).
 *
 *
 * <chart> displays an interactive chart (see Chart.jsx), along with "expand" and "download" buttons (ChartExpandAndDownloadButtons.jsx).
 * This button enables a catalog item based on the data, for display in the Chart Panel (ChartPanel.jsx).
 * It also detects if it appears in the second column of a <table> and, if so, rearranges itself to span two columns.
 *
 * It can have the following attributes. Currently URLs must point to csv (not json) data; but inline json data is supported.
 * Note if you change any of these, also update the chartAttributes array above, or they won't make it here.
 *
 * - [title]:        The title of the chart.  If not supplied, defaults to the name of the context-supplied feature, if available, or else simply "Chart".
 * - [x-column]:     The x column name or number to show in the preview, if not the first appropriate column. NOT FULLY IMPLEMENTED YET.
 * - [y-column]:     The y column name or number to show in the preview, if not the first scalar column.
 * - [y-columns]:    Comma-separated list of y column names or numbers to show in the preview. Overrides "y-column" if provided.
 * - [colors]:       Comma-separated list of css colors to apply to data columns.
 * - [column-names]: Comma-separated list of column names to override those in the source data; empty strings retain the original column name.
 *                   Eg. column-names="Time,Height,Speed"
 * - [column-units]: Comma-separated list of the units for each column. Empty strings are ok.
 *                   Eg. column-units=",m,km/h"
 * - [preview-x-label]: The preview chart x-axis label. Defaults to empty string. Eg. long-names="Last 24 hours,Last 5 days,Time".
 * - [id]:           An id for the chart; give different charts from the same feature different ids. The actual catalogItem.id used for the expanded chart will
 *                   also incorporate the chart title and the catalog item name it came from.
 * - [styling]:      Defaults to 'feature-info'. Can also be 'histogram'. TODO: improve.
 * - [highlight-x]:  An x-coordinate to highlight.
 * - [poll-seconds]: If present, the chart is updated from [poll-sources] every [poll-seconds] seconds.
 *                   TODO: Returned data is merged into existing data and shown.
 * - [poll-sources]: Comma-separated list of URLs to poll every [poll-seconds] seconds. Defaults to sources.
 * - [poll-replace]: Either 'true' or 'false' (case sensitive). Pass 'true' to completely replace the data, 'false' to update
 *                   the existing data. Defaults to false (updating).
 * - [can-download]: 'false' to hide the Download button on the chart.  By default true and for any other value, the download button is shown.
 * - [hide-buttons]: 'true' to hide the Expand and Download buttons on the chart.  By default and for any other value, the buttons are shown when applicable.
 *                   Overrides can-download.
 *
 * Provide the data in one of these four ways:
 * - [sources]:      Comma-separated URLs for data at each available time range. The first in the list is shown in the feature info panel preview.
 *                   Eg. sources="http://example.com/series?offset=1d,http://example.com/series?offset=5d,http://example.com/series?all"
 * - [source-names]: Comma-separated display names for each available time range, used in the expand-chart dropdown button.
 *                   Eg. source-names="1d,5d,30d".
 * - [downloads]:    Same as sources, but for download only. Defaults to the same as sources.
 *                   Eg. sources="http://example.com/series?offset=1d,http://example.com/series?offset=5d,http://example.com/series?all"
 * - [download-names]: Same as source-names, but for download only. Defaults to the same as source-names.
 *                   Eg. source-names="1d,5d,30d,max".
 * Or:
 * - [src]:          The URL of the data to show in the chart panel, once "expand" is clicked. Eg. src="http://example.com/full_time_series.csv".
 * - [src-preview]:  The URL of the data to show in the feature info panel. Defaults to src. Eg. src-preview="http://example.com/preview_time_series.csv".
 * Or:
 * - [data]:         csv-formatted data, with \n for newlines. Eg. data="time,a,b\n2016-01-01,2,3\n2016-01-02,5,6".
 *                   or json-formatted string data, with \quot; for quotes, eg. data="[[\quot;a\quot;,\quot;b\quot;],[2,3],[5,6]]".
 * Or:
 * - None of the above, but supply csv or json-formatted data as the content of the chart data, with \n for newlines.
 *                   Eg. <chart>time,a,b\n2016-01-01,2,3\n2016-01-02,5,6</chart>.
 *                   or  <chart>[["x","y","z"],[1,10,3],[2,15,9],[3,8,12],[5,25,4]]</chart>.
 *
 *
 * See CustomComponentType for more details.
 */
const registerCustomComponentTypes = function(terria) {
  /**
   * @private
   */
  function processChartNode(context, node, children) {
    checkAllPropertyKeys(node.attribs, chartAttributes);
    const columnNames = splitStringIfDefined(node.attribs["column-names"]);
    const columnUnits = splitStringIfDefined(node.attribs["column-units"]);
    const styling = node.attribs["styling"] || "feature-info";

    // Present src and src-preview as if they came from sources.
    let sources = splitStringIfDefined(node.attribs.sources);
    const sourceNames = splitStringIfDefined(node.attribs["source-names"]);
    if (!defined(sources) && defined(node.attribs.src)) {
      // [src-preview, src], or [src] if src-preview is not defined.
      sources = [node.attribs.src];
      if (defined(node.attribs["src-preview"])) {
        sources.unshift(node.attribs["src-preview"]);
      }
    }
    const downloads = splitStringIfDefined(node.attribs.downloads) || sources;
    const downloadNames =
      splitStringIfDefined(node.attribs["download-names"]) || sourceNames;
    const pollSources = splitStringIfDefined(node.attribs["poll-sources"]);

    const id = node.attribs.id;
    const xColumn = node.attribs["x-column"];
    let yColumns = splitStringIfDefined(node.attribs["y-columns"]);
    if (!defined(yColumns) && defined(node.attribs["y-column"])) {
      yColumns = [node.attribs["y-column"]];
    }
    const url = defined(sources) ? sources[0] : undefined;
    const tableStructure = tableStructureFromStringData(
      getSourceData(node, children)
    );

    const colors = splitStringIfDefined(node.attribs["colors"]);
    const title = node.attribs["title"];
    const updateCounterKeyProps = {
      url: url,
      xColumn: xColumn,
      yColumns: yColumns
    };
    const updateCounter = CustomComponents.getUpdateCounter(
      context.updateCounters,
      Chart,
      updateCounterKeyProps
    );

    // If any of these attributes change, change the key so that React knows to re-render the chart.
    const reactKeys = [
      title || "",
      id || "",
      (sources && sources.join("|")) || "",
      xColumn || "",
      defined(yColumns) ? yColumns.join("|") : "",
      colors || ""
    ];

    const chartElements = [];
    if (node.attribs["hide-buttons"] !== "true") {
      chartElements.push(
        React.createElement(ChartExpandAndDownloadButtons, {
          key: "button",
          terria: terria,
          catalogItem: context.catalogItem,
          title: title,
          colors: colors, // The colors are used when the chart is expanded.
          feature: context.feature,
          sources: sources,
          sourceNames: sourceNames,
          downloads: downloads,
          downloadNames: downloadNames,
          tableStructure: tableStructure,
          columnNames: columnNames,
          columnUnits: columnUnits,
          xColumn: node.attribs["x-column"],
          yColumns: yColumns,
          id: id,
          canDownload: !(node.attribs["can-download"] === "false"),
          raiseToTitle: !!getInsertedTitle(node),
          pollSources: pollSources,
          pollSeconds: node.attribs["poll-seconds"],
          pollReplace: node.attribs["poll-replace"] === "true",
          updateCounter: updateCounter // Change this to trigger an update.
        })
      );
    }

    chartElements.push(
      React.createElement(Chart, {
        key: "chart",
        axisLabel: {
          x: node.attribs["preview-x-label"],
          y: undefined
        },
        catalogItem: context.catalogItem,
        url: url,
        tableStructure: tableStructure,
        xColumn: node.attribs["x-column"],
        yColumns: yColumns,
        styling: styling,
        highlightX: node.attribs["highlight-x"],
        // colors: colors,  // Note that the preview chart doesn't show the colors.
        pollUrl: defined(pollSources) ? pollSources[0] : undefined,
        pollSeconds: node.attribs["poll-seconds"], // This is unorthodox: this prop is picked up not by Chart.jsx, but in selfUpdateSeconds below.
        // pollIdColumns: node.attribs['poll-id-columns'],  // TODO: implement.
        // pollReplace: (node.attribs['poll-replace'] === 'true'),
        updateCounter: updateCounter,
        transitionDuration: 300
      })
    );

    return React.createElement(
      "div",
      {
        key: reactKeys.join("-") || "chart-wrapper",
        className: ChartPreviewStyles.previewChartWrapper
      },
      chartElements
    );
  }

  /**
   * Returns the 'data' attribute if available, otherwise the child of this node.
   * @private
   */
  function getSourceData(node, children) {
    const sourceData = node.attribs["data"];
    if (sourceData) {
      return sourceData;
    }
    if (Array.isArray(children) && children.length > 0) {
      return children[0];
    }
    return children;
  }

  /**
   * This function does not activate any columns in itself.
   * That should be done by TableCatalogItem when it is created around this.
   * @private
   */
  function tableStructureFromStringData(stringData) {
    // sourceData can be either json (starts with a '[') or csv format (contains a true line feed or '\n'; \n is replaced with a real linefeed).
    if (!defined(stringData) || stringData.length < 2) {
      return;
    }
    // We prevent ALT, LON and LAT from being chosen, since we know this is a non-geo csv already.
    const result = new TableStructure("chart", {
      unallowedTypes: [VarType.ALT, VarType.LAT, VarType.LON]
    });
    if (stringData[0] === "[") {
      // Treat as json.
      const json = JSON.parse(stringData.replace(/&quot;/g, '"'));
      return TableStructure.fromJson(json, result);
    }
    if (stringData.indexOf("\\n") >= 0 || stringData.indexOf("\n") >= 0) {
      // Treat as csv.
      return TableStructure.fromCsv(stringData.replace(/\\n/g, "\n"), result);
    }
  }

  /**
   * @private
   */
  function getInsertedTitle(node) {
    // Check if there is a title in the position 'Title' relative to node <chart>:
    // <tr><td>Title</td><td><chart></chart></tr>
    if (
      defined(node.parent) &&
      node.parent.name === "td" &&
      defined(node.parent.parent) &&
      node.parent.parent.name === "tr" &&
      defined(node.parent.parent.children[0]) &&
      defined(node.parent.parent.children[0].children[0])
    ) {
      return node.parent.parent.children[0].children[0].data;
    }
  }

  const chartComponentType = new CustomComponentType({
    name: "chart",
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
        shouldProcessNode: node =>
          // If this node is a <chart> in the second column of a 2-column table,
          // then add a title taken from the first column, and give it colSpan 2.
          node.name === "td" &&
          node.children.length === 1 &&
          node.children[0].name === "chart" &&
          node.parent.name === "tr" &&
          node.parent.children.length === 2,
        // eslint-disable-next-line react/display-name
        processNode: (context, node, children) => {
          const title = node.parent.children[0].children[0].data;
          const revisedChildren = [
            React.createElement(
              "div",
              {
                key: "title",
                className: ChartPreviewStyles.chartTitleFromTable
              },
              title
            )
          ].concat(children);
          return React.createElement(
            node.name,
            { key: "chart", colSpan: 2, className: ChartPreviewStyles.chartTd },
            node.data,
            revisedChildren
          );
        }
      },
      {
        shouldProcessNode: node =>
          // If this node is in the first column of a 2-column table, and the second column is a <chart>,
          // then remove it.
          node.name === "td" &&
          node.children.length === 1 &&
          node.parent.name === "tr" &&
          node.parent.children.length === 2 &&
          node.parent.children[1].name === "td" &&
          node.parent.children[1].children.length === 1 &&
          node.parent.children[1].children[0].name === "chart",
        processNode: function() {
          return; // Do not return a node.
        }
      }
    ],
    /*
     * isCorresponding is a function which checks a ReactComponent and returns a Boolean,
     * indicating if that react component corresponds to this type.
     * "Correspondence" is whatever the component wants it to be, but must be consistent with selfUpdateSeconds.
     */
    isCorresponding: function(reactComponent) {
      return reactComponent.type === Chart;
    },
    selfUpdateSeconds: function(reactComponent) {
      return reactComponent.props.pollSeconds; // Note this is unorthodox.
    }
  });
  if (!defined(terria)) {
    // The chart expand button needs a reference to the Terria instance to add the chart to the catalog.
    throw new DeveloperError(
      "Terria is a required argument of registerCustomComponentTypes."
    );
  }
  CustomComponents.register(chartComponentType);

  const collapsibleComponentType = new CustomComponentType({
    name: "collapsible",
    attributes: ["title", "open"],
    processNode: function(context, node, children) {
      return React.createElement(
        Collapsible,
        {
          key: node.attribs.title,
          displayName: node.attribs.title,
          title: node.attribs.title,
          startsOpen:
            typeof node.attribs.open === "string"
              ? JSON.parse(node.attribs.open)
              : undefined
        },
        children
      );
    }
  });
  CustomComponents.register(collapsibleComponentType);

  const iconComponentType = new CustomComponentType({
    name: "icon",
    attributes: ["glyph", "className"],
    processNode: function(context, node, children) {
      const badGlyphName = node.attribs.glyph.split("Icon.GLYPHS.")[1];
      const goodGlyphName = badGlyphName.substring(0, badGlyphName.length - 1);
      return React.createElement(
        Icon,
        {
          displayName: "Icon",
          glyph: GLYPHS[goodGlyphName],
          className: node.attribs.classname
        },
        children
      );
    }
  });
  CustomComponents.register(iconComponentType);
};

/**
 * @private
 */
function checkAllPropertyKeys(object, allowedKeys) {
  for (const key in object) {
    if (object.hasOwnProperty(key)) {
      if (allowedKeys.indexOf(key) === -1) {
        console.log("Unknown attribute " + key);
        throw new DeveloperError("Unknown attribute " + key);
      }
    }
  }
}

module.exports = registerCustomComponentTypes;
