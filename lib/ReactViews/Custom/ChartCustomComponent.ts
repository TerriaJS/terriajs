import { DomElement } from "domhandler";
import { action } from "mobx";
import React, { ReactElement } from "react";
import DeveloperError from "terriajs-cesium/Source/Core/DeveloperError";
import filterOutUndefined from "../../Core/filterOutUndefined";
import CommonStrata from "../../Models/CommonStrata";
import CsvCatalogItem from "../../Models/CsvCatalogItem";
import ChartPreviewStyles from "./Chart/chart-preview.scss";
import ChartExpandAndDownloadButtons from "./Chart/ChartExpandAndDownloadButtons";
import Chart from "./Chart/NewChart";
import CustomComponent, { ProcessNodeContext } from "./CustomComponent";

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
 * - [column-titles]: Maps column names to titles. Eg. column-names="time:Time,height:Height,speed:Speed"
 * - [column-units]: Maps column names to units. Eg. column-units="height:m,speed:km/h"
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
  readonly attributes = [
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
    "column-titles",
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

  get name(): string {
    return "chart";
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

    const attrs = parseNodeAttrs(node.attribs);
    const chartElements = [];
    if (node.attribs["hide-buttons"] !== "true") {
      // Build expand/download buttons
      const sourceItems = (attrs.sources || []).map(
        (source: string, i: number) => {
          const id = [
            context.catalogItem.uniqueId,
            context.feature.id,
            source
          ].join(":");
          const item = new CsvCatalogItem(id, context.terria);
          this.setTraitsFromAttrs(item, attrs, i);
          return item;
        }
      );
      chartElements.push(
        React.createElement(ChartExpandAndDownloadButtons, {
          key: "button",
          terria: context.terria,
          sourceItems: sourceItems,
          sourceNames: attrs.sourceNames,
          canDownload: attrs.canDownload,
          downloads: attrs.downloads,
          downloadNames: attrs.downloadNames,
          raiseToTitle: !!getInsertedTitle(node)
        })
      );
    }

    // Build chart item to show in the info panel
    const chartItem = new CsvCatalogItem(undefined, context.terria);
    this.setTraitsFromAttrs(chartItem, attrs, 0);
    chartElements.push(
      React.createElement(Chart, {
        key: "chart",
        items: [chartItem],
        styling: attrs.styling,
        highlightX: attrs.highlightX,
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

  @action
  private setTraitsFromAttrs(
    item: CsvCatalogItem,
    attrs: ReturnType<typeof parseNodeAttrs>,
    sourceIndex: number
  ) {
    // Set name
    let name = attrs.title;
    if (attrs.sourceNames && attrs.sourceNames[sourceIndex]) {
      name = `${name} - ${attrs.sourceNames[sourceIndex]}`;
    }
    item.setTrait(CommonStrata.user, "name", name);

    // Set polling traits
    if (attrs.pollSeconds) {
      const pollUrl = attrs.pollSources && attrs.pollSources[sourceIndex];
      item.polling.setTrait(CommonStrata.user, "seconds", attrs.pollSeconds);
      item.polling.setTrait(CommonStrata.user, "url", pollUrl);
      item.polling.setTrait(
        CommonStrata.user,
        "shouldReplaceData",
        attrs.pollReplace
      );
    }

    // Set column titles
    attrs.columnTitles.forEach(({ name, title }) => {
      const column = item.addObject(CommonStrata.user, "columns", name)!;
      column.setTrait(CommonStrata.user, "title", title);
    });

    // Set column units
    attrs.columnUnits.forEach(({ name, units }) => {
      const column = item.addObject(CommonStrata.user, "columns", name)!;
      column.setTrait(CommonStrata.user, "units", units);
    });

    // Set chart axes
    if (attrs.xColumn || attrs.yColumns) {
      const chartStyle = item.addObject(CommonStrata.user, "styles", "chart")!;
      chartStyle.chart.setTrait(
        CommonStrata.user,
        "xAxisColumn",
        attrs.xColumn
      );

      (attrs.yColumns || []).forEach(y => {
        chartStyle.chart.addObject(CommonStrata.user, "lines", y)!;
      });

      item.setTrait(CommonStrata.user, "activeStyle", "chart");
    }
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

/**
 * Parse node attrs to an easier to process structure.
 */
function parseNodeAttrs(nodeAttrs: { [name: string]: string | undefined }) {
  let sources = splitStringIfDefined(nodeAttrs.sources);
  if (sources === undefined && nodeAttrs.src !== undefined) {
    // [src-preview, src], or [src] if src-preview is not defined.
    sources = [nodeAttrs.src];
    const srcPreview = nodeAttrs["src-preview"];
    if (srcPreview !== undefined) {
      sources.unshift(srcPreview);
    }
  }
  const sourceNames = splitStringIfDefined(nodeAttrs["source-names"]);

  const downloads = splitStringIfDefined(nodeAttrs.downloads) || sources;
  const downloadNames =
    splitStringIfDefined(nodeAttrs["download-names"]) || sourceNames;

  const columnTitles = filterOutUndefined(
    (nodeAttrs["column-titles"] || "").split(",").map(s => {
      const [name, title] = s.split(":");
      return name ? { name, title } : undefined;
    })
  );

  const columnUnits = filterOutUndefined(
    (nodeAttrs["column-units"] || "").split(",").map(s => {
      const [name, units] = s.split(":");
      return name ? { name, units } : undefined;
    })
  );

  let yColumns;
  if (nodeAttrs["y-column"] || nodeAttrs["y-columns"]) {
    yColumns = (nodeAttrs["y-column"] || nodeAttrs["y-columns"] || "").split(
      ","
    );
  }

  return {
    title: nodeAttrs["title"],
    sources,
    sourceNames,
    canDownload: !(nodeAttrs["can-download"] === "false"),
    downloads,
    downloadNames,
    styling: nodeAttrs["styling"] || "feature-info",
    highlightX: nodeAttrs["highlight-x"],
    pollSeconds: parseIntOrUndefined(nodeAttrs["poll-seconds"]),
    pollSources: splitStringIfDefined(nodeAttrs["poll-sources"]),
    pollReplace: nodeAttrs["poll-replace"] === "true",
    columnTitles,
    columnUnits,
    xColumn: nodeAttrs["x-column"],
    yColumns
  };
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

function splitStringIfDefined(s: string | undefined) {
  return s !== undefined ? s.split(",") : undefined;
}

function parseIntOrUndefined(s: string | undefined): number | undefined {
  const maybeInt = parseInt(s || "");
  return isNaN(maybeInt) ? undefined : maybeInt;
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
