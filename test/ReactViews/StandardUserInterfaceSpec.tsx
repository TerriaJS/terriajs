import { render, screen } from "@testing-library/react";
import i18next from "i18next";
import { runInAction } from "mobx";
import Terria from "../../lib/Models/Terria";
import ViewState from "../../lib/ReactViewModels/ViewState";
import { StandardUserInterface } from "../../lib/ReactViews/StandardUserInterface/StandardUserInterface";

describe("StandardUserInterface", function () {
  let terria: Terria;
  let viewState: ViewState;

  beforeAll(async () => {
    await i18next.changeLanguage("en");
  });

  afterAll(async () => {
    await i18next.changeLanguage("cimode");
  });

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });
    viewState = new ViewState({
      terria: terria,
      catalogSearchProvider: undefined
    });
  });

  it("renders with a story-wrapper class", function () {
    const { container } = render(
      <StandardUserInterface
        terria={terria}
        viewState={viewState}
        version="test"
      />
    );

    expect(
      container.querySelector('[class*="story-wrapper"]')
    ).toBeInTheDocument();
  });

  it("feature info panel has top-element class when it is the top element", function () {
    runInAction(() => {
      viewState.topElement = "FeatureInfo";
    });

    const { container } = render(
      <StandardUserInterface
        terria={terria}
        viewState={viewState}
        version="test"
      />
    );

    const featureInfo = container.querySelector('[class*="featureInfo"]');
    expect(featureInfo).toHaveClassName("top-element");
  });

  it("side panel has top-element class when it is the top element", function () {
    runInAction(() => {
      viewState.topElement = "SidePanel";
    });

    const { container } = render(
      <StandardUserInterface
        terria={terria}
        viewState={viewState}
        version="test"
      />
    );

    screen.debug(container);

    const sidePanelContainer = container.querySelector(".top-element");
    expect(sidePanelContainer).toBeInTheDocument();
    expect(sidePanelContainer?.className).toContain("SidePanelContainer-");
  });

  it("feature info panel does not have top-element class when it is not the top element", function () {
    runInAction(() => {
      viewState.topElement = "SidePanel";
    });

    const { container } = render(
      <StandardUserInterface
        terria={terria}
        viewState={viewState}
        version="test"
      />
    );

    const featureInfo = container.querySelector('[class*="featureInfo"]');
    expect(featureInfo).not.toHaveClassName("top-element");
  });
});
