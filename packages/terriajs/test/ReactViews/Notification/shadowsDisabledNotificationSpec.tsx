import { screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import i18next from "i18next";
import Terria from "../../../lib/Models/Terria";
import ViewState from "../../../lib/ReactViewModels/ViewState";
import Notification from "../../../lib/ReactViews/Notification/Notification";
import { shadowsDisabledNotificationMessage } from "../../../lib/ReactViews/Notification/shadowsDisabledNotification";
import { renderWithContexts } from "../withContext";

describe("shadowsDisabledNotificationMessage", function () {
  let viewState: ViewState;

  beforeEach(async function () {
    await i18next.changeLanguage("en");
    viewState = new ViewState({
      terria: new Terria({ baseUrl: "./" })
    });
    viewState.terria.notificationState.addNotificationToQueue({
      title: "Shadows disabled",
      message: shadowsDisabledNotificationMessage,
      showAsToast: true
    });
  });

  afterEach(async function () {
    await i18next.changeLanguage("cimode");
  });

  it("renders the settings panel link from the translation", function () {
    renderWithContexts(<Notification />, viewState);
    const link = screen.getByTitle("Open map quality settings");
    expect(link).toBeVisible();
    expect(link).toHaveTextContent("Display settings");
  });

  it("opens the settings panel and dismisses the toast when the link is clicked", async function () {
    renderWithContexts(<Notification />, viewState);
    expect(viewState.settingsPanelIsVisible).toBe(false);

    await userEvent.click(screen.getByTitle("Open map quality settings"));

    expect(viewState.settingsPanelIsVisible).toBe(true);
    expect(
      viewState.terria.notificationState.currentNotification
    ).toBeUndefined();
  });
});
