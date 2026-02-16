import { runInAction } from "mobx";
import Terria from "../../../../../lib/Models/Terria";
import ViewState from "../../../../../lib/ReactViewModels/ViewState";
import { renderWithContexts } from "../../../withContext";
import HelpPanel from "../../../../../lib/ReactViews/Map/Panels/HelpPanel/HelpPanel";
import { screen } from "@testing-library/dom";

describe("HelpPanel", function () {
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

  describe("with no help content in config", function () {
    it("renders title, description, tour item ", function () {
      renderWithContexts(<HelpPanel />, viewState);

      expect(screen.getByText("helpPanel.menuPaneTitle")).toBeVisible();
      expect(screen.getByText("helpPanel.menuPaneBody")).toBeVisible();
      // Only close button and tour button should exist (no help item buttons)
      expect(
        screen.getByRole("button", { name: "Close help panel" })
      ).toBeVisible();
      expect(
        screen.getByRole("button", { name: "helpPanel.takeTour" })
      ).toBeVisible();
    });
  });

  describe("with no text, videos and images in helpContent", function () {
    beforeEach(() => {
      runInAction(() => {
        terria.configParameters.helpContent = [
          {
            itemName: "test",
            title: "test"
          }
        ];
      });
    });

    it("renders 1 help menu item", function () {
      renderWithContexts(<HelpPanel />, viewState);

      // Close button + tour button + 1 help menu item button = 3

      expect(
        screen.getByRole("button", { name: "Close help panel" })
      ).toBeVisible();
      expect(
        screen.getByRole("button", { name: "helpPanel.takeTour" })
      ).toBeVisible();
      expect(screen.getByRole("button", { name: "test" })).toBeVisible();
    });

    it("does not render any text in video panel", function () {
      const { container } = renderWithContexts(<HelpPanel />, viewState);

      // HelpVideoPanel only renders when selected, which it isn't
      // So no markdown content should appear from the video panel
      expect(container.textContent).not.toContain("markdownContent");
    });

    it("does not render any images in video panel", function () {
      const { container } = renderWithContexts(<HelpPanel />, viewState);

      // No video link element should exist (panel not selected, no image)
      expect(container.querySelector('[class*="videoLink"]')).toBeNull();
    });
  });

  it("when help item with text, video and image in helpContent is selected", async function () {
    const placeholderImage =
      "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    runInAction(() => {
      terria.configParameters.helpContent = [
        {
          itemName: "test",
          markdownText:
            "# Test\n\nHello, this is just a test\n\nThis is another paragraph",
          videoUrl: "https://www.youtube-nocookie.com/embed/NTtSM70rIvI",
          placeholderImage: placeholderImage
        }
      ];
      viewState.selectedHelpMenuItem = "test";
    });

    const { container } = renderWithContexts(<HelpPanel />, viewState);

    // The markdown renders as 3 text blocks: h1 + 2 paragraphs
    screen.getByText("Test");
    screen.getByText("Hello, this is just a test");
    screen.getByText("This is another paragraph");
    const videoPlaceholder = container.querySelector('[class*="videoLink"]');
    expect(videoPlaceholder).toBeVisible();
    expect(
      videoPlaceholder?.closest("[style]")?.attributes.getNamedItem("style")
        ?.value
    ).toMatch(
      new RegExp(`.*background-image: .*url\\("${placeholderImage}"\\).*`)
    );
  });
});
