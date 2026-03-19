import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "styled-components";
import { terriaTheme } from "../../../../../lib/ReactViews/StandardUserInterface";
import Terria from "../../../../../lib/Models/Terria";
import ViewState from "../../../../../lib/ReactViewModels/ViewState";
import VideoGuide from "../../../../../lib/ReactViews/Map/Panels/HelpPanel/VideoGuide";
import { runInAction } from "mobx";
import { worker } from "../../../../mocks/browser";
import { http, HttpResponse } from "msw";

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

    worker.use(
      http.get("some_image.png", () => {
        const pixel = new Uint8Array([
          137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0,
          1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 196, 137, 0, 0, 0, 10, 73, 68,
          65, 84, 120, 156, 98, 0, 0, 0, 2, 0, 1, 226, 33, 188, 51, 0, 0, 0, 0,
          73, 69, 78, 68, 174, 66, 96, 130
        ]);
        return new HttpResponse(pixel, {
          headers: { "Content-Type": "image/png" }
        });
      })
    );
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
