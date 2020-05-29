const create: any = require("react-test-renderer").create;
import React from "react";
import { act } from "react-dom/test-utils";
import { ThemeProvider } from "styled-components";
import { terriaTheme } from "../../../../../lib/ReactViews/StandardUserInterface/StandardTheme";
import Terria from "../../../../../lib/Models/Terria";
import ViewState from "../../../../../lib/ReactViewModels/ViewState";
// import HelpPanel from "../../../../../lib/ReactViews/Map/Panels/HelpPanel/HelpPanel";
const VideoGuide: any = require("../../../../../lib/ReactViews/Map/Panels/HelpPanel/VideoGuide")
  .default;
import HelpPanelItem from "../../../../../lib/ReactViews/Map/Panels/HelpPanel/HelpPanelItem";
import HelpVideoPanel from "../../../../../lib/ReactViews/Map/Panels/HelpPanel/HelpVideoPanel";
import Box from "../../../../../lib/Styled/Box";
import StyledHtml from "../../../../../lib/ReactViews/Map/Panels/HelpPanel/StyledHtml";
import { runInAction } from "mobx";
import Icon, { StyledIcon } from "../../../../../lib/ReactViews/Icon";

describe("VideoGuide", function() {
  let terria: Terria;
  let viewState: ViewState;

  let testRenderer: any;

  const videoName = "testVideo";

  beforeEach(function() {
    terria = new Terria({
      baseUrl: "./"
    });
    viewState = new ViewState({
      terria: terria,
      catalogSearchProvider: null,
      locationSearchProviders: []
    });
  });

  it("renders when videoGuideVisible is set to its videoName", function() {
    runInAction(() => {
      viewState.setVideoGuideVisible(videoName);
    });
    act(() => {
      testRenderer = create(
        <ThemeProvider theme={terriaTheme}>
          <VideoGuide
            viewState={viewState}
            videoLink={"some.url"}
            background={"some_image.png"}
            videoName={videoName}
          />
        </ThemeProvider>
      );
    });
    const videoGuideComponents = testRenderer.root.findAllByType("div");
    expect(videoGuideComponents.length).toBeTruthy();
  });

  it("does not render when videoGuideVisible is an empty string", function() {
    runInAction(() => {
      viewState.setVideoGuideVisible("");
    });
    act(() => {
      testRenderer = create(
        <ThemeProvider theme={terriaTheme}>
          <VideoGuide
            viewState={viewState}
            videoLink={"some.url"}
            background={"some_image.png"}
            videoName={videoName}
          />
        </ThemeProvider>
      );
    });
    const videoGuideComponents = testRenderer.root.findAllByType("div");
    expect(videoGuideComponents.length).toBeFalsy();
  });

  it("does not render when videoGuideVisible is a different string", function() {
    runInAction(() => {
      viewState.setVideoGuideVisible("someRandomString");
    });
    act(() => {
      testRenderer = create(
        <ThemeProvider theme={terriaTheme}>
          <VideoGuide
            viewState={viewState}
            videoLink={"some.url"}
            background={"some_image.png"}
            videoName={videoName}
          />
        </ThemeProvider>
      );
    });
    const videoGuideComponents = testRenderer.root.findAllByType("div");
    expect(videoGuideComponents.length).toBeFalsy();
  });
});
