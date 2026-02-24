import { render, screen } from "@testing-library/react";
import Terria from "../../../../../lib/Models/Terria";
import ViewState from "../../../../../lib/ReactViewModels/ViewState";
import { GyroscopeGuidance } from "../../../../../lib/ReactViews/Map/MapNavigation/Items/Compass/GyroscopeGuidance";
import userEvent from "@testing-library/user-event";

describe("GyroscopeGuidance", function () {
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
    it("renders the guidance button", async function () {
      render(<GyroscopeGuidance onClose={() => {}} viewState={viewState} />);

      const button = screen.getByRole("button");
      expect(button).toBeVisible();
    });

    it("opens the guidance when the button is clicked", async function () {
      render(<GyroscopeGuidance onClose={() => {}} viewState={viewState} />);

      const button = screen.getByRole("button");
      await userEvent.click(button);

      expect(screen.getByText("compass.guidance.title")).toBeVisible();
      expect(screen.getByText("compass.guidance.outerRingTitle")).toBeVisible();
      expect(
        screen.getByText("compass.guidance.outerRingDescription")
      ).toBeVisible();
      expect(
        screen.getByText("compass.guidance.innerCircleTitle")
      ).toBeVisible();
      expect(
        screen.getByText("compass.guidance.innerCircleDescription1")
      ).toBeVisible();
      expect(
        screen.getByText("compass.guidance.innerCircleDescription2")
      ).toBeVisible();
      expect(
        screen.getByText("compass.guidance.ctrlDragDescription")
      ).toBeVisible();
      expect(
        screen.getByRole("button", { name: "compass.guidance.dismissText" })
      ).toBeVisible();
    });

    it("closes the guidance when the dismiss button is clicked", async function () {
      render(<GyroscopeGuidance onClose={() => {}} viewState={viewState} />);

      const openButton = screen.getByRole("button");
      await userEvent.click(openButton);

      const dismissButton = screen.getByRole("button", {
        name: "compass.guidance.dismissText"
      });
      await userEvent.click(dismissButton);

      expect(
        screen.queryByText("compass.guidance.title")
      ).not.toBeInTheDocument();
    });
  });
});
