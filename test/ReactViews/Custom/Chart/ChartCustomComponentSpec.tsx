import { ReactChild } from "react";
import { isComponentOfType } from "react-shallow-testutils";
import ChartableMixin from "../../../../lib/ModelMixins/ChartableMixin";
import StubCatalogItem from "../../../../lib/Models/Catalog/CatalogItems/StubCatalogItem";
import CreateModel from "../../../../lib/Models/Definition/CreateModel";
import { BaseModel } from "../../../../lib/Models/Definition/Model";
import TerriaFeature from "../../../../lib/Models/Feature/Feature";
import Terria from "../../../../lib/Models/Terria";
import ChartExpandAndDownloadButtons from "../../../../lib/ReactViews/Custom/Chart/ChartExpandAndDownloadButtons";
import Chart from "../../../../lib/ReactViews/Custom/Chart/FeatureInfoPanelChart";
import ChartCustomComponent, {
  ChartCustomComponentAttributes
} from "../../../../lib/ReactViews/Custom/ChartCustomComponent";
import {
  DomElement,
  ProcessNodeContext
} from "../../../../lib/ReactViews/Custom/CustomComponent";
import mixTraits from "../../../../lib/Traits/mixTraits";
import MappableTraits from "../../../../lib/Traits/TraitsClasses/MappableTraits";
import UrlTraits from "../../../../lib/Traits/TraitsClasses/UrlTraits";

describe("ChartCustomComponent", function () {
  let terria: Terria;

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });
  });

  it("correctly creates the chart", () => {
    const component = new TestChartCustomComponent();
    const context: ProcessNodeContext = {
      terria: terria,
      catalogItem: new StubCatalogItem(undefined, terria, undefined),
      feature: new TerriaFeature({})
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

  it("creates shareable chart items for the expand menu", function () {
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
      catalogItem: new StubCatalogItem("parent", terria, undefined),
      feature: new TerriaFeature({})
    };
    const node: DomElement = {
      name: component.name,
      attribs: {
        title: "Foo",
        data: '[["x","y","z"],[1,10,3],[2,15,9],[3,8,12],[5,25,4]]',
        sources: "a, b"
      }
    };
    const spy = spyOn(
      component,
      "constructShareableCatalogItem"
    ).and.callThrough();
    component.processNode(context, node, [], 0);
    expect(component.constructShareableCatalogItem).toHaveBeenCalledTimes(2);
    // Make sure the id is dependent on parent, title & source name
    expect(component.constructShareableCatalogItem).toHaveBeenCalledWith(
      "parent:Foo:a",
      jasmine.any(Object),
      undefined
    );
  });
});

class TestChartCustomComponent extends ChartCustomComponent<ChartableMixin.Instance> {
  get name(): string {
    return "test";
  }
  protected constructCatalogItem(
    id: string | undefined,
    context: ProcessNodeContext,
    sourceReference:
      | import("../../../../lib/Models/Definition/Model").BaseModel
      | undefined
  ) {
    return context.terria
      ? new TestCatalogItem(id, context.terria, undefined)
      : undefined;
  }
  protected setTraitsFromAttrs(
    item: TestCatalogItem,
    attrs: ChartCustomComponentAttributes,
    sourceIndex: number
  ): void {
    return;
  }
}

class TestCatalogItem extends ChartableMixin(
  CreateModel(mixTraits(UrlTraits, MappableTraits))
) {
  get mapItems() {
    return [];
  }
  protected forceLoadMapItems(): Promise<void> {
    return Promise.resolve();
  }
  get chartItems() {
    return [];
  }
}
