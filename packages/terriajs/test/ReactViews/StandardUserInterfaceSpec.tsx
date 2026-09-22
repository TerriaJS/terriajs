import { render } from "@testing-library/react";
import i18next from "i18next";
import { runInAction } from "mobx";
import Terria from "../../lib/Models/Terria";
import ViewState from "../../lib/ReactViewModels/ViewState";
import { StandardUserInterface } from "../../lib/ReactViews/StandardUserInterface/StandardUserInterface";
import { StoryData } from "../../lib/Models/InitSource";

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
      terria: terria
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

  describe("stories", function () {
    const story: StoryData = {
      id: "story-1",
      title: "Test story",
      text: "Some text",
      shareData: { version: "8.0.0", initSources: [] }
    };

    beforeEach(function () {
      runInAction(() => {
        terria.stories = [story];
      });
    });

    it("asks the user whether to view the story by default", function () {
      render(
        <StandardUserInterface
          terria={terria}
          viewState={viewState}
          version="test"
        />
      );

      expect(terria.notificationState.currentNotification?.type).toBe("story");
      expect(viewState.storyShown).toBeFalsy();
    });

    it("starts the story without prompting when `storyAutoStart` is true", function () {
      runInAction(() => {
        terria.updateParameters({ storyAutoStart: true });
      });

      render(
        <StandardUserInterface
          terria={terria}
          viewState={viewState}
          version="test"
        />
      );

      expect(viewState.storyShown).toBe(true);
      expect(terria.notificationState.currentNotification).toBeUndefined();
    });

    it("starts the story when a share asks it to", function () {
      runInAction(() => {
        terria.updateParameters({ storyAutoStart: false });
      });

      return terria
        .applyInitData({ initData: { settings: { storyAutoStart: true } } })
        .then(() => {
          render(
            <StandardUserInterface
              terria={terria}
              viewState={viewState}
              version="test"
            />
          );

          expect(viewState.storyShown).toBe(true);
          expect(terria.notificationState.currentNotification).toBeUndefined();
        });
    });

    // `playStory` used to be watched by a reaction that never fired when the
    // parameter was already set before the ViewState was constructed.
    it("starts the story when `playStory` was set before the ViewState existed", function () {
      const earlyTerria = new Terria({ baseUrl: "./" });
      runInAction(() => {
        earlyTerria.userProperties.set("playStory", "1");
        earlyTerria.stories = [story];
      });
      const lateViewState = new ViewState({ terria: earlyTerria });

      render(
        <StandardUserInterface
          terria={earlyTerria}
          viewState={lateViewState}
          version="test"
        />
      );

      expect(lateViewState.storyShown).toBe(true);
      expect(earlyTerria.notificationState.currentNotification).toBeUndefined();
    });
  });
});
