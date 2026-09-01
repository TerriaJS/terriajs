import { render, screen } from "@testing-library/react";
import Terria from "../../../../../lib/Models/Terria";
import ViewState from "../../../../../lib/ReactViewModels/ViewState";
import VideoGuide from "../../../../../lib/ReactViews/Map/Panels/HelpPanel/VideoGuide";
import { runInAction } from "mobx";
import { TerriaThemeProvider } from "../../../withContext";

describe("VideoGuide", function () {
  let terria: Terria;
  let viewState: ViewState;

  const videoName = "testVideo";

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });
    viewState = new ViewState({
      terria: terria
    });
  });

  it("renders when videoGuideVisible is set to its videoName", function () {
    runInAction(() => {
      viewState.setVideoGuideVisible(videoName);
    });
    render(
      <TerriaThemeProvider>
        <VideoGuide
          viewState={viewState}
          videoLink={"some.url"}
          background={"some_image.png"}
          videoName={videoName}
        />
      </TerriaThemeProvider>
    );

    expect(screen.getByTitle(videoName)).toBeVisible();
    expect(screen.getByTitle(videoName)).toHaveAttribute("src", "some.url");
  });

  it("does not render when videoGuideVisible is an empty string", function () {
    runInAction(() => {
      viewState.setVideoGuideVisible("");
    });
    render(
      <TerriaThemeProvider>
        <VideoGuide
          viewState={viewState}
          videoLink={"some.url"}
          background={"some_image.png"}
          videoName={videoName}
        />
      </TerriaThemeProvider>
    );

    expect(screen.queryByTitle(videoName)).not.toBeInTheDocument();
  });

  it("does not render when videoGuideVisible is a different string", function () {
    runInAction(() => {
      viewState.setVideoGuideVisible("someRandomString");
    });
    render(
      <TerriaThemeProvider>
        <VideoGuide
          viewState={viewState}
          videoLink={"some.url"}
          background={"some_image.png"}
          videoName={videoName}
        />
      </TerriaThemeProvider>
    );
    expect(screen.queryByTitle(videoName)).not.toBeInTheDocument();
  });
});
