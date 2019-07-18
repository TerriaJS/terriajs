import { DomElement } from "domhandler";
import { ReactElement } from "react";
import CustomComponent, { ProcessNodeContext } from "./CustomComponent";
import DeveloperError from "terriajs-cesium/Source/Core/DeveloperError";
import React from "react";
const utils = require("html-to-react/lib/utils");
import ChartPreviewStyles from "./Chart/chart-preview.scss";
import ChartExpandAndDownloadButtons from "./Chart/ChartExpandAndDownloadButtons";
import Chart from "./Chart/Chart";
import CsvCatalogItem from "../../Models/CsvCatalogItem";
import CommonStrata from "../../Models/CommonStrata";
import filterOutUndefined from "../../Core/filterOutUndefined";

/**
 * A `<chart>` custom component. It displays an interactive chart along with
 * "expand" and "download" buttons. The expand button adds a catalog item with
 * the data to the workbench, causing it to be displayed on the Chart Panel.
 * The chart detects if it appears in the second column of a <table> and, if so,
 * rearranges itself to span two columns.
 *
 * A `<chart>` component may have the following attributes:
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
 *                   Eg. `sources="http://example.com/series?offset=1d,http://example.com/series?offset=5d,http://example.com/series?all"`
 * - [source-names]: Comma-separated display names for each available time range, used in the expand-chart dropdown button.
 *                   Eg. `source-names="1d,5d,30d"`.
 * - [downloads]:    Same as sources, but for download only. Defaults to the same as sources.
 *                   Eg. `sources="http://example.com/series?offset=1d,http://example.com/series?offset=5d,http://example.com/series?all"`
 * - [download-names]: Same as source-names, but for download only. Defaults to the same as source-names.
 *                   Eg. `source-names="1d,5d,30d,max"`.
 * Or:
 * - [src]:          The URL of the data to show in the chart panel, once "expand" is clicked. Eg. `src="http://example.com/full_time_series.csv"`.
 * - [src-preview]:  The URL of the data to show in the feature info panel. Defaults to src. Eg. `src-preview="http://example.com/preview_time_series.csv"`.
 * Or:
 * - [data]:         csv-formatted data, with \n for newlines. Eg. data="time,a,b\n2016-01-01,2,3\n2016-01-02,5,6".
 *                   or json-formatted string data, with \quot; for quotes, eg. `data="[[\quot;a\quot;,\quot;b\quot;],[2,3],[5,6]]"`.
 * Or:
 * - None of the above, but supply csv or json-formatted data as the content of the chart data, with \n for newlines.
 *                   Eg. `<chart>time,a,b\n2016-01-01,2,3\n2016-01-02,5,6</chart>`.
 *                   or  `<chart>[["x","y","z"],[1,10,3],[2,15,9],[3,8,12],[5,25,4]]</chart>`.
 */
export default class ChartCustomComponent extends CustomComponent {
  get name(): string {
    return "chart";
  }

  get attributes(): string[] {
    return [
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
  }

  shouldProcessNode(context: ProcessNodeContext, node: DomElement): boolean {
    return (
      this.isChart(node) ||
      this.isFirstColumnOfChartRow(node) ||
      this.isSecondColumnOfChartRow(node)
    );
  }

  processNode(
    context: ProcessNodeContext,
    node: DomElement,
    children: ReactElement[],
    index: number
  ): ReactElement | undefined {
    if (this.isChart(node)) {
      return this.processChart(context, node, children, index);
    } else if (this.isFirstColumnOfChartRow(node)) {
      return this.processFirstColumn(context, node, children, index);
    } else if (this.isSecondColumnOfChartRow(node)) {
      return this.processSecondColumn(context, node, children, index);
    }
    throw new DeveloperError("processNode called unexpectedly.");
  }

  /**
   * Is this node the chart element itself?
   * @param node The node to test.
   */
  private isChart(node: DomElement): boolean {
    return node.name === this.name;
  }

  private processChart(
    context: ProcessNodeContext,
    node: DomElement,
    children: ReactElement[],
    index: number
  ): ReactElement | undefined {
    if (node.attribs === undefined) {
      return undefined;
    }

    checkAllPropertyKeys(node.attribs, this.attributes);
    const columnNames = splitStringIfDefined(node.attribs["column-names"]);
    const columnUnits = splitStringIfDefined(node.attribs["column-units"]);
    const styling = node.attribs["styling"] || "feature-info";

    // Present src and src-preview as if they came from sources.
    let sources = splitStringIfDefined(node.attribs.sources);
    const sourceNames = splitStringIfDefined(node.attribs["source-names"]);
    if (sources === undefined && node.attribs.src !== undefined) {
      // [src-preview, src], or [src] if src-preview is not defined.
      sources = [node.attribs.src];
      if (node.attribs["src-preview"] !== undefined) {
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
    if (yColumns === undefined && node.attribs["y-column"] !== undefined) {
      yColumns = [node.attribs["y-column"]];
    }
    const url = sources !== undefined ? sources[0] : undefined;

    const colors = splitStringIfDefined(node.attribs["colors"]);
    const title = node.attribs["title"];
    // const updateCounterKeyProps = {
    //   url: url,
    //   xColumn: xColumn,
    //   yColumns: yColumns
    // };
    // const updateCounter = CustomComponents.getUpdateCounter(
    //   context.updateCounters,
    //   Chart,
    //   updateCounterKeyProps
    // );

    // If any of these attributes change, change the key so that React knows to re-render the chart.
    // const reactKeys = [
    //   title || "",
    //   id || "",
    //   (sources && sources.join("|")) || "",
    //   xColumn || "",
    //   defined(yColumns) ? yColumns.join("|") : "",
    //   colors || ""
    // ];

    const chartElements = [];
    if (node.attribs["hide-buttons"] !== "true") {
      chartElements.push(
        React.createElement(ChartExpandAndDownloadButtons, {
          key: "button",
          terria: context.terria,
          catalogItem: context.catalogItem,
          title: title,
          colors: colors, // The colors are used when the chart is expanded.
          feature: context.feature,
          sources: sources,
          sourceNames: sourceNames,
          downloads: downloads,
          downloadNames: downloadNames,
          //tableStructure: tableStructure,
          columnNames: columnNames,
          columnUnits: columnUnits,
          xColumn: node.attribs["x-column"],
          yColumns: yColumns,
          id: id,
          canDownload: !(node.attribs["can-download"] === "false"),
          raiseToTitle: !!getInsertedTitle(node),
          pollSources: pollSources,
          pollSeconds: node.attribs["poll-seconds"],
          pollReplace: node.attribs["poll-replace"] === "true"
          // updateCounter: updateCounter // Change this to trigger an update.
        })
      );
    }

    const chartItem = new CsvCatalogItem(undefined, context.terria);
    chartItem.setTrait(CommonStrata.user, "url", url);
    const chartStyle = chartItem.addObject(
      CommonStrata.user,
      "styles",
      "chart"
    )!;

    chartStyle.chart.setTrait(CommonStrata.user, "xAxisColumn", xColumn);

    if (yColumns) {
      yColumns.forEach(column => {
        chartStyle.chart.addObject(CommonStrata.user, "lines", column);
      });
    }

    chartItem.setTrait(CommonStrata.user, "activeStyle", "chart");

    chartElements.push(
      React.createElement(Chart, {
        key: "chart",
        items: [chartItem],
        styling: styling,
        highlightX: node.attribs["highlight-x"],
        transitionDuration: 300
      })
    );

    return React.createElement(
      "div",
      {
        key: "chart-wrapper",
        className: ChartPreviewStyles.previewChartWrapper
      },
      chartElements
    );
  }

  /**
   * Is this node the first column of a two-column table where the second
   * column contains a `<chart>`?
   * @param node The node to test
   */
  private isFirstColumnOfChartRow(node: DomElement): boolean {
    return (
      node.name === "td" &&
      node.children !== undefined &&
      node.children.length === 1 &&
      node.parent !== undefined &&
      node.parent.name === "tr" &&
      node.parent.children !== undefined &&
      node.parent.children.length === 2 &&
      node === node.parent.children[0] &&
      node.parent.children[1].name === "td" &&
      node.parent.children[1].children !== undefined &&
      node.parent.children[1].children.length === 1 &&
      node.parent.children[1].children[0].name === "chart"
    );
  }

  private processFirstColumn(
    context: ProcessNodeContext,
    node: DomElement,
    children: ReactElement[],
    index: number
  ): ReactElement | undefined {
    // Do not return a node.
    return undefined;
  }

  /**
   * Is this node the second column of a two-column table where the second
   * column contains a `<chart>`?
   * @param node The node to test
   */
  private isSecondColumnOfChartRow(node: DomElement): boolean {
    return (
      node.name === "td" &&
      node.children !== undefined &&
      node.children.length === 1 &&
      node.children[0].name === "chart" &&
      node.parent !== undefined &&
      node.parent.name === "tr" &&
      node.parent.children !== undefined &&
      node.parent.children.length === 2
    );
  }

  private processSecondColumn(
    context: ProcessNodeContext,
    node: DomElement,
    children: ReactElement[],
    index: number
  ): ReactElement | undefined {
    const title = node.parent!.children![0].children![0].data;
    const revisedChildren: ReactElement[] = [
      React.createElement(
        "div",
        {
          key: "title",
          className: ChartPreviewStyles.chartTitleFromTable
        },
        title
      ) as ReactElement
    ].concat(children);
    return React.createElement(
      "td",
      { key: "chart", colSpan: 2, className: ChartPreviewStyles.chartTd },
      node.data,
      revisedChildren
    );
  }
}

function splitStringIfDefined(s: string) {
  return s !== undefined ? s.split(",") : undefined;
}

function checkAllPropertyKeys(object: any, allowedKeys: string[]) {
  for (const key in object) {
    if (object.hasOwnProperty(key)) {
      if (allowedKeys.indexOf(key) === -1) {
        console.log("Unknown attribute " + key);
        throw new DeveloperError("Unknown attribute " + key);
      }
    }
  }
}

function getInsertedTitle(node: DomElement) {
  // Check if there is a title in the position 'Title' relative to node <chart>:
  // <tr><td>Title</td><td><chart></chart></tr>
  if (
    node.parent !== undefined &&
    node.parent.name === "td" &&
    node.parent.parent !== undefined &&
    node.parent.parent.name === "tr" &&
    node.parent.parent.children !== undefined &&
    node.parent.parent.children[0] !== undefined &&
    node.parent.parent.children[0].children !== undefined &&
    node.parent.parent.children[0].children[0] !== undefined
  ) {
    return node.parent.parent.children[0].children[0].data;
  }
}
