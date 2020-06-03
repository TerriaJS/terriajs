import { DomElement } from "domhandler";
import React, { ReactElement } from "react";
import createGuid from "terriajs-cesium/Source/Core/createGuid";
import DeveloperError from "terriajs-cesium/Source/Core/DeveloperError";
import CommonStrata from "../../Models/CommonStrata";
import SensorObservationServiceCatalogItem from "../../Models/SensorObservationServiceCatalogItem";
import ChartPreviewStyles from "./Chart/chart-preview.scss";
import ChartExpandAndDownloadButtons from "./Chart/ChartExpandAndDownloadButtons";
import Chart from "./Chart/FeatureInfoPanelChart";
import CustomComponent, { ProcessNodeContext } from "./CustomComponent";
import SplitItemReference from "../../Models/SplitItemReference";

export default class SOSChartCustomComponent extends CustomComponent {
  readonly attributes = ["identifier", "name", "units", "hide-buttons"];

  get name(): string {
    return "sos-chart";
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

    if (!(context.catalogItem instanceof SensorObservationServiceCatalogItem)) {
      throw new DeveloperError(
        "<sos-chart> can only be used for showing charts for SensorObservationServiceCatalogItem"
      );
    }
    const catalogItem: SensorObservationServiceCatalogItem =
      context.catalogItem;
    const featureOfInterestId = node.attribs["identifier"];
    const featureName = node.attribs["name"];
    const hideButtons = node.attribs["hide-buttons"];
    const chartElements = [];
    const units = catalogItem.selectedObservable?.units;
    if (!hideButtons) {
      // Build expand/download buttons
      const itemPromise = createDuplicateReferenceModel(catalogItem).then(
        downloadItem => {
          if (!downloadItem) {
            return;
          }

          downloadItem.setTrait(CommonStrata.user, "showAsChart", true);
          downloadItem.setTrait(
            CommonStrata.user,
            "name",
            featureName || catalogItem.name
          );
          downloadItem.setTrait(
            CommonStrata.user,
            "chartFeatureOfInterestIdentifier",
            featureOfInterestId
          );
          downloadItem
            .addObject(CommonStrata.user, "columns", "values")
            ?.setTrait(CommonStrata.user, "units", units);

          return downloadItem;
        }
      );
      chartElements.push(
        React.createElement(ChartExpandAndDownloadButtons, {
          key: "button",
          terria: context.terria,
          sourceItems: [itemPromise],
          raiseToTitle: !!getInsertedTitle(node)
        })
      );
    }

    // Build chart item to show in the info panel
    const chartItem = catalogItem.duplicateModel(createGuid());
    chartItem.setTrait(CommonStrata.user, "showAsChart", true);
    chartItem.setTrait(
      CommonStrata.user,
      "name",
      featureName || catalogItem.name
    );
    chartItem.setTrait(
      CommonStrata.user,
      "chartFeatureOfInterestIdentifier",
      featureOfInterestId
    );
    chartItem
      .addObject(CommonStrata.user, "columns", "values")
      ?.setTrait(CommonStrata.user, "units", units);

    chartElements.push(
      React.createElement(Chart, {
        key: "chart",
        terria: context.terria,
        item: chartItem,
        height: 110
        // styling: attrs.styling,
        // highlightX: attrs.highlightX,
        // transitionDuration: 300
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

async function createDuplicateReferenceModel(
  sourceItem: SensorObservationServiceCatalogItem
): Promise<SensorObservationServiceCatalogItem | undefined> {
  const terria = sourceItem.terria;
  const ref = new SplitItemReference(createGuid(), terria);
  ref.setTrait(CommonStrata.user, "splitSourceItemId", sourceItem.uniqueId);
  await ref.loadReference();
  if (ref.target) {
    terria.addModel(ref);
    return ref.target as SensorObservationServiceCatalogItem;
  }
}

function checkAllPropertyKeys(object: any, allowedKeys: string[]) {
  for (const key in object) {
    if (object.hasOwnProperty(key)) {
      if (allowedKeys.indexOf(key) === -1) {
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
