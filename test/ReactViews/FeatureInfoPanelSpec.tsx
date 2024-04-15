"use strict";

import { runInAction } from "mobx";
import { act } from "react-dom/test-utils";
import { ReactTestRenderer } from "react-test-renderer";
import PickedFeatures from "../../lib/Map/PickedFeatures/PickedFeatures";
import CompositeCatalogItem from "../../lib/Models/Catalog/CatalogItems/CompositeCatalogItem";
import CommonStrata from "../../lib/Models/Definition/CommonStrata";
import TerriaFeature from "../../lib/Models/Feature/Feature";
import Terria from "../../lib/Models/Terria";
import ViewState from "../../lib/ReactViewModels/ViewState";
import FeatureInfoPanel, {
  determineCatalogItem
} from "../../lib/ReactViews/FeatureInfo/FeatureInfoPanel";
import Loader from "../../lib/ReactViews/Loader";
import SimpleCatalogItem from "../Helpers/SimpleCatalogItem";
import { createWithContexts } from "./withContext";

// var separator = ',';
// if (typeof Intl === 'object' && typeof Intl.NumberFormat === 'function') {
//     separator = (Intl.NumberFormat().format(1000)[1]);
// }

describe("FeatureInfoPanel", function () {
  let terria: Terria;
  // let feature;
  let viewState: ViewState;

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });
    viewState = new ViewState({
      terria: terria,
      catalogSearchProvider: undefined
    });
  });

  it("has isVisible class when viewState.featureInfoPanelIsVisible is true", function () {
    viewState.featureInfoPanelIsVisible = true;
    let testRenderer: ReactTestRenderer;
    act(() => {
      testRenderer = createWithContexts(viewState, <FeatureInfoPanel />);
    });
    expect(() => {
      testRenderer!.root.find((node) =>
        Boolean(
          node.type === "div" && node.props.className?.includes("is-visible")
        )
      );
    }).not.toThrowError();
  });

  it("does not have isVisible class when viewState.featureInfoPanelIsVisible is false", function () {
    viewState.featureInfoPanelIsVisible = false;
    let testRenderer: ReactTestRenderer;
    act(() => {
      testRenderer = createWithContexts(viewState, <FeatureInfoPanel />);
    });
    expect(() => {
      testRenderer!.root.find((node) =>
        Boolean(
          node.type === "div" && node.props.className?.includes("is-visible")
        )
      );
    }).toThrowError();
  });

  it("displays loader while asychronously loading feature information", function () {
    const pickedFeatures = new PickedFeatures();
    pickedFeatures.allFeaturesAvailablePromise = Promise.resolve();
    runInAction(() => {
      terria.pickedFeatures = pickedFeatures;
    });
    let testRenderer: ReactTestRenderer;
    act(() => {
      testRenderer = createWithContexts(viewState, <FeatureInfoPanel />);
    });
    expect(() => {
      testRenderer!.root.findByType(Loader);
    }).not.toThrow();
  });

  describe("determineCatalogItem", function () {
    let simple1: SimpleCatalogItem,
      simple2: SimpleCatalogItem,
      composite: CompositeCatalogItem;
    let feature1: TerriaFeature, feature2: TerriaFeature;
    beforeEach(function () {
      feature1 = new TerriaFeature({});
      simple1 = new SimpleCatalogItem("simple1", terria);
      feature1._catalogItem = simple1;
      feature2 = new TerriaFeature({});
      simple2 = new SimpleCatalogItem("simple2", terria);
      feature2._catalogItem = simple2;
      composite = new CompositeCatalogItem("composite", terria);
      composite.add(CommonStrata.definition, simple1);
      composite.add(CommonStrata.definition, simple2);
    });
    it("determines which catalog item a feature belongs to", function () {
      terria.workbench.items = [simple1, simple2];
      expect(determineCatalogItem(terria.workbench, feature1)).toBe(simple1);
      expect(determineCatalogItem(terria.workbench, feature2)).toBe(simple2);
    });
    it("special cases features from composite models", function () {
      terria.workbench.items = [composite];
      expect(determineCatalogItem(terria.workbench, feature1)).toBe(simple1);
      expect(determineCatalogItem(terria.workbench, feature2)).toBe(simple2);
      // Features from a member of a composite model are determined to belong to
      // the member model, instead of the composite one.
    });
  });
});
