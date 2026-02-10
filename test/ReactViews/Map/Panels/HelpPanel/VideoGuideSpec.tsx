import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "styled-components";
import { terriaTheme } from "../../../../../lib/ReactViews/StandardUserInterface";
import Terria from "../../../../../lib/Models/Terria";
import ViewState from "../../../../../lib/ReactViewModels/ViewState";
import VideoGuide from "../../../../../lib/ReactViews/Map/Panels/HelpPanel/VideoGuide";
import { runInAction } from "mobx";

describe("VideoGuide", function () {
  let terria: Terria;
  let viewState: ViewState;

  const videoName = "testVideo";

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });
    viewState = new ViewState({
      terria: terria,
      catalogSearchProvider: undefined
    });
  });

  it("renders when videoGuideVisible is set to its videoName", function () {
    runInAction(() => {
      viewState.setVideoGuideVisible(videoName);
    });
    render(
      <ThemeProvider theme={terriaTheme}>
        <VideoGuide
          viewState={viewState}
          videoLink={"some.url"}
          background={"some_image.png"}
          videoName={videoName}
        />
      </ThemeProvider>
    );

    expect(screen.getByTitle(videoName)).toBeVisible();
    expect(screen.getByTitle(videoName)).toHaveAttribute("src", "some.url");
  });

  it("does not render when videoGuideVisible is an empty string", function () {
    runInAction(() => {
      viewState.setVideoGuideVisible("");
    });
    render(
      <ThemeProvider theme={terriaTheme}>
        <VideoGuide
          viewState={viewState}
          videoLink={"some.url"}
          background={"some_image.png"}
          videoName={videoName}
        />
      </ThemeProvider>
    );

    expect(screen.queryByTitle(videoName)).not.toBeInTheDocument();
  });

  it("does not render when videoGuideVisible is a different string", function () {
    runInAction(() => {
      viewState.setVideoGuideVisible("someRandomString");
    });
    render(
      <ThemeProvider theme={terriaTheme}>
        <VideoGuide
          viewState={viewState}
          videoLink={"some.url"}
          background={"some_image.png"}
          videoName={videoName}
        />
      </ThemeProvider>
    );
    expect(screen.queryByTitle(videoName)).not.toBeInTheDocument();
  });
});
