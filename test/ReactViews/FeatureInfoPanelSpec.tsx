import { runInAction } from "mobx";

import { screen, waitFor, within } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import PickedFeatures from "../../lib/Map/PickedFeatures/PickedFeatures";
import CompositeCatalogItem from "../../lib/Models/Catalog/CatalogItems/CompositeCatalogItem";
import CommonStrata from "../../lib/Models/Definition/CommonStrata";
import TerriaFeature from "../../lib/Models/Feature/Feature";
import Terria from "../../lib/Models/Terria";
import ViewState from "../../lib/ReactViewModels/ViewState";
import {
  FeatureInfoPanel,
  determineCatalogItem
} from "../../lib/ReactViews/FeatureInfo/FeatureInfoPanel";
import SimpleCatalogItem from "../Helpers/SimpleCatalogItem";
import { renderWithContexts } from "./withContext";

describe("FeatureInfoPanel", function () {
  let terria: Terria;
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
    runInAction(() => {
      viewState.featureInfoPanelIsVisible = true;
    });
    const { container } = renderWithContexts(
      <FeatureInfoPanel viewState={viewState} t={(key) => key} />,
      viewState
    );
    expect(container.querySelector('[class*="is-visible"]')).toBeTruthy();
  });

  it("displays loader while asychronously loading feature information", function () {
    const pickedFeatures = new PickedFeatures();
    pickedFeatures.allFeaturesAvailablePromise = Promise.resolve();
    runInAction(() => {
      terria.pickedFeatures = pickedFeatures;
    });
    renderWithContexts(
      <FeatureInfoPanel viewState={viewState} t={(key) => key} />,
      viewState
    );
    // Loader renders a spinning icon (svg) and optional message text
    expect(screen.getByText("loader.loadingMessage")).toBeInTheDocument();
  });

  it("does not have isVisible class when viewState.featureInfoPanelIsVisible is false", function () {
    runInAction(() => {
      viewState.featureInfoPanelIsVisible = false;
    });
    const { container } = renderWithContexts(
      <FeatureInfoPanel viewState={viewState} t={(key) => key} />,
      viewState
    );
    expect(container.querySelector('[class*="is-visible"]')).toBeNull();
  });

  it("shows a feature info sections", async function () {
    const simple1 = new SimpleCatalogItem("simple1", terria);
    const feature1 = new TerriaFeature({
      name: "Foo"
    });
    feature1._catalogItem = simple1;

    const feature2 = new TerriaFeature({
      name: "Bar"
    });
    const simple2 = new SimpleCatalogItem("simple2", terria);
    feature2._catalogItem = simple2;

    const pickedFeatures = new PickedFeatures();
    pickedFeatures.allFeaturesAvailablePromise = Promise.resolve();
    runInAction(() => {
      pickedFeatures.features = [feature1, feature2];
      pickedFeatures.isLoading = false;
    });

    terria.pickedFeatures = pickedFeatures;
    terria.workbench.items = [simple1, simple2];
    const { container } = renderWithContexts(
      <FeatureInfoPanel viewState={viewState} t={(key) => key} />,
      viewState
    );
    await waitFor(() =>
      expect(
        screen.queryByText("loader.loadingMessage")
      ).not.toBeInTheDocument()
    );

    expect(screen.queryByText("loader.loadingMessage")).not.toBeInTheDocument();
    expect(
      within(container).getByRole("button", { name: "simple1 - Foo" })
    ).toBeVisible();
    expect(
      within(container).getByRole("button", { name: "simple2 - Bar" })
    ).toBeVisible();
  });

  it('opens a feature info section with "featureInfo.noInfoAvailable" message when the feature has no properties', async function () {
    const feature = new TerriaFeature({
      name: "Foo"
    });
    const simple = new SimpleCatalogItem("simple", terria);
    feature._catalogItem = simple;

    const pickedFeatures = new PickedFeatures();
    pickedFeatures.allFeaturesAvailablePromise = Promise.resolve();
    runInAction(() => {
      pickedFeatures.features = [feature];
      pickedFeatures.isLoading = false;
    });
    terria.pickedFeatures = pickedFeatures;
    terria.workbench.items = [simple];
    renderWithContexts(
      <FeatureInfoPanel viewState={viewState} t={() => {}} />,
      viewState
    );
    await waitFor(() =>
      expect(
        screen.queryByText("loader.loadingMessage")
      ).not.toBeInTheDocument()
    );
    const button = screen.getByRole("button", { name: "simple - Foo" });
    expect(button).toBeVisible();
    await userEvent.click(button);

    expect(screen.getByText("featureInfo.noInfoAvailable")).toBeInTheDocument();
  });

  it("opens a feature info section with feature properties", async function () {
    const feature = new TerriaFeature({
      name: "Foo",
      properties: {
        prop1: "Value 1",
        prop2: "Value 2"
      }
    });
    const simple = new SimpleCatalogItem("simple", terria);
    feature._catalogItem = simple;

    const pickedFeatures = new PickedFeatures();
    pickedFeatures.allFeaturesAvailablePromise = Promise.resolve();
    runInAction(() => {
      pickedFeatures.features = [feature];
      pickedFeatures.isLoading = false;
    });
    terria.pickedFeatures = pickedFeatures;
    terria.workbench.items = [simple];
    renderWithContexts(
      <FeatureInfoPanel viewState={viewState} t={() => {}} />,
      viewState
    );
    await waitFor(() =>
      expect(
        screen.queryByText("loader.loadingMessage")
      ).not.toBeInTheDocument()
    );
    const button = screen.getByRole("button", { name: "simple - Foo" });
    expect(button).toBeVisible();
    await userEvent.click(button);
    expect(screen.getByText("prop1")).toBeInTheDocument();
    expect(screen.getByText("Value 1")).toBeInTheDocument();
    expect(screen.getByText("prop2")).toBeInTheDocument();
    expect(screen.getByText("Value 2")).toBeInTheDocument();
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
    });
  });
});
