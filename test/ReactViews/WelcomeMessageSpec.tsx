import { runInAction } from "mobx";
import Terria from "../../lib/Models/Terria";
import ViewState from "../../lib/ReactViewModels/ViewState";
import WelcomeMessage from "../../lib/ReactViews/WelcomeMessage/WelcomeMessage";
import { renderWithContexts } from "./withContext";
import { screen, within } from "@testing-library/dom";

describe("WelcomeMessage", function () {
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

  it("renders when showWelcomeMessage is set to true in config file", function () {
    runInAction(() => {
      terria.configParameters.showWelcomeMessage = true;
      terria.configParameters.welcomeMessageVideo = {
        videoTitle: "Getting started with the map",
        videoUrl: "",
        placeholderImage: ""
      };
    });
    const { container } = renderWithContexts(<WelcomeMessage />, viewState);
    const localScreen = within(container);

    expect(viewState.showWelcomeMessage).toEqual(true);
    expect(localScreen.getByText("welcomeMessage.title")).toBeVisible();
    expect(
      localScreen.getByText("welcomeMessage.welcomeMessage")
    ).toBeVisible();

    expect(localScreen.getByText("Getting started with the map")).toBeVisible();
    expect(
      localScreen.getByRole("button", { name: "welcomeMessage.tourBtnText" })
    ).toBeVisible();
    expect(
      localScreen.getByRole("button", { name: "welcomeMessage.helpBtnText" })
    ).toBeVisible();
    expect(
      localScreen.getByRole("button", {
        name: "welcomeMessage.exploreDataBtnText"
      })
    ).toBeVisible();
    expect(
      localScreen.getByRole("button", { name: "welcomeMessage.dismissText" })
    ).toBeVisible();
  });

  it("doesn't render when showWelcomeMessage is set to false in config file", function () {
    runInAction(() => (terria.configParameters.showWelcomeMessage = false));
    renderWithContexts(<WelcomeMessage />, viewState);

    expect(viewState.showWelcomeMessage).toEqual(false);
    expect(screen.queryByText("welcomeMessage.title")).not.toBeInTheDocument();
  });
});
