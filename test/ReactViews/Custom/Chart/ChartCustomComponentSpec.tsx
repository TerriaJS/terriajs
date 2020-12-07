import ChartCustomComponent, {
  ChartCustomComponentAttributes
} from "../../../../lib/ReactViews/Custom/ChartCustomComponent";
import Model, { BaseModel } from "../../../../lib/Models/Model";
import CatalogMemberTraits from "../../../../lib/Traits/CatalogMemberTraits";
import { ProcessNodeContext } from "../../../../lib/ReactViews/Custom/CustomComponent";
import StubCatalogItem from "../../../../lib/Models/StubCatalogItem";
import Terria from "../../../../lib/Models/Terria";
import Feature from "../../../../lib/Models/Feature";
import { DomElement } from "domhandler";
import Chart from "../../../../lib/ReactViews/Custom/Chart/FeatureInfoPanelChart";
import React, { ReactChild } from "react";
import ChartExpandAndDownloadButtons from "../../../../lib/ReactViews/Custom/Chart/ChartExpandAndDownloadButtons";
import Chartable from "../../../../lib/Models/Chartable";
import CreateModel from "../../../../lib/Models/CreateModel";
import UrlTraits from "../../../../lib/Traits/UrlTraits";

const isComponentOfType: any = require("react-shallow-testutils")
  .isComponentOfType;

describe("ChartCustomComponent", function() {
  let terria: Terria;

  beforeEach(function() {
    terria = new Terria({
      baseUrl: "./"
    });
  });

  it("correctly creates the chart", () => {
    const component = new TestChartCustomComponent();
    const context: ProcessNodeContext = {
      terria: terria,
      catalogItem: new StubCatalogItem(undefined, terria, undefined),
      feature: new Feature({})
    };
    const node: DomElement = {
      name: component.name,
      attribs: {
        data: '[["x","y","z"],[1,10,3],[2,15,9],[3,8,12],[5,25,4]]'
      }
    };
    const chart = component.processNode(context, node, [], 0);

    expect(chart).toBeDefined();
    expect(chart?.key).toContain("chart-wrapper");
    expect(isComponentOfType(chart, "div"));
    expect(chart?.props.children).toBeDefined();
    expect(
      chart?.props.children.find((child: ReactChild) =>
        isComponentOfType(child, Chart)
      )
    ).toBeTruthy();
    expect(
      chart?.props.children.find((child: ReactChild) =>
        isComponentOfType(child, ChartExpandAndDownloadButtons)
      )
    ).toBeTruthy();
  });

  it("creates shareable chart items for the expand menu", function() {
    const TestComponentWithShareableChartItem = class extends TestChartCustomComponent {
      constructShareableCatalogItem = (
        id: string | undefined,
        context: ProcessNodeContext,
        sourceReference: BaseModel | undefined
      ) => this.createItemReference(context.catalogItem as any);
    };
    const component = new TestComponentWithShareableChartItem();
    const context: ProcessNodeContext = {
      terria: terria,
      catalogItem: new StubCatalogItem(undefined, terria, undefined),
      feature: new Feature({})
    };
    const node: DomElement = {
      name: component.name,
      attribs: {
        data: '[["x","y","z"],[1,10,3],[2,15,9],[3,8,12],[5,25,4]]',
        sources: "a, b"
      }
    };
    spyOn(component, "constructShareableCatalogItem").and.callThrough();
    component.processNode(context, node, [], 0);
    expect(component.constructShareableCatalogItem).toHaveBeenCalledTimes(2);
  });
});

class TestChartCustomComponent extends ChartCustomComponent<Chartable> {
  get name(): string {
    return "test";
  }
  protected constructCatalogItem(
    id: string | undefined,
    context: ProcessNodeContext,
    sourceReference:
      | import("../../../../lib/Models/Model").BaseModel
      | undefined
  ): TestCatalogItem {
    return new TestCatalogItem(id, context.terria, undefined);
  }
  protected setTraitsFromAttrs(
    item: TestCatalogItem,
    attrs: ChartCustomComponentAttributes,
    sourceIndex: number
  ): void {
    return;
  }
}

class TestCatalogItem extends CreateModel(UrlTraits) implements Chartable {
  async loadChartItems() {}
  get chartItems() {
    return [];
  }
}
