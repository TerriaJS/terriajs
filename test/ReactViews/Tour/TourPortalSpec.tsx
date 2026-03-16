import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { runInAction } from "mobx";
import { act } from "react";
import Terria from "../../../lib/Models/Terria";
import ViewState from "../../../lib/ReactViewModels/ViewState";
import TourPortal from "../../../lib/ReactViews/Tour/TourPortal";
import { renderWithContexts } from "../withContext";

describe("TourPortal", function () {
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

  describe("with basic props", function () {
    describe("renders", function () {
      it("nothing when current tour index is negative", function () {
        const { container } = renderWithContexts(<TourPortal />, viewState);
        // tourportal should just not render anything in this case
        expect(container).toBeEmptyDOMElement();
      });

      it("renders something using the TourPreface path under preface conditions", function () {
        runInAction(() => {
          viewState.setTourIndex(0);
          viewState.setShowTour(true);
        });
        renderWithContexts(<TourPortal />, viewState);
        // tourportal should render the TourPreface: 2*close & accept buttons
        const buttons = screen.getAllByRole("button");
        expect(buttons.length).toEqual(3);

        expect(screen.getByText("tour.preface.title")).toBeVisible();
        expect(screen.getByText("tour.preface.content")).toBeVisible();
        expect(
          screen.getByRole("button", { name: "tour.preface.start" })
        ).toBeVisible();
        expect(
          screen.getByRole("button", { name: "tour.preface.close" })
        ).toBeVisible();
      });

      it("renders something using the TourGrouping path under showPortal conditions", async function () {
        // Create mock refs with real DOM elements
        const testRef = { current: document.createElement("div") };
        const testRef2 = { current: document.createElement("div") };
        const testRef3 = { current: document.createElement("div") };

        runInAction(() => {
          viewState.setTourIndex(0);
          // Set showTour directly — setShowTour(true) uses setTimeout internally
          viewState.showTour = true;

          viewState.updateAppRef("TestRef", testRef);
          viewState.updateAppRef("TestRef2", testRef2);
          viewState.updateAppRef("TestRef3", testRef3);
          viewState.tourPoints = [
            {
              appRefName: "TestRef",
              priority: 10,
              content: "## Best friends\n\nMochi and neko are best friends"
            },
            {
              appRefName: "TestRef2",
              priority: 20,
              content: "## Motivated by food\n\nNeko loves food"
            },
            {
              appRefName: "TestRef3",
              priority: 30,
              content: "## Lazy\n\nThey like to lounge around all day"
            }
          ];
        });

        renderWithContexts(<TourPortal />, viewState);

        // 3 test tour points
        expect(viewState.tourPointsWithValidRefs.length).toBe(3);

        // Active tour point content is rendered
        expect(screen.getByText("Best friends")).toBeVisible();
        expect(
          screen.getByText("Mochi and neko are best friends")
        ).toBeVisible();
        expect(
          screen.getByRole("button", { name: "general.next" })
        ).toBeVisible();
        expect(
          screen.queryByRole("button", { name: "general.back" })
        ).not.toBeInTheDocument();

        await userEvent.click(
          screen.getByRole("button", { name: "general.next" })
        );

        // Next tour point content is rendered
        expect(screen.getByText("Motivated by food")).toBeVisible();
        expect(screen.getByText("Neko loves food")).toBeVisible();
        expect(
          screen.getByRole("button", { name: "general.next" })
        ).toBeVisible();
        expect(
          screen.getByRole("button", { name: "general.back" })
        ).toBeVisible();

        await userEvent.click(
          screen.getByRole("button", { name: "general.next" })
        );

        // Last tour point content is rendered
        expect(screen.getByText("Lazy")).toBeVisible();
        expect(
          screen.getByText("They like to lounge around all day")
        ).toBeVisible();
        expect(
          screen.queryByRole("button", { name: "general.next" })
        ).not.toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: "general.back" })
        ).toBeVisible();

        // Remove one tour point and we should only have 2 left
        act(() => {
          runInAction(() => {
            viewState.deleteAppRef("TestRef");
          });
        });

        // 2 test tour points
        expect(viewState.tourPointsWithValidRefs.length).toBe(2);
      });
    });
  });
});
