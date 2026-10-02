import { fireEvent, screen } from "@testing-library/react";
import TerriaError from "../../../lib/Core/TerriaError";
import Terria from "../../../lib/Models/Terria";
import ViewState from "../../../lib/ReactViewModels/ViewState";
import { terriaErrorToast } from "../../../lib/ReactViews/Notification/terriaErrorNotification";
import { renderWithContexts } from "../withContext";

describe("terriaErrorToast", function () {
  it("opens the full error when 'See details' is clicked", function () {
    const terria = new Terria({ baseUrl: "./" });
    const viewState = new ViewState({ terria });
    const error = TerriaError.from("Something went wrong");
    terria.notificationState.addNotificationToQueue(
      error.toToastNotification()
    );

    renderWithContexts(<>{terriaErrorToast(error)(viewState)}</>, viewState);
    fireEvent.click(screen.getByText("models.raiseError.seeDetails"));

    const current = terria.notificationState.currentNotification;
    expect(current).toBeDefined();
    expect(current?.showAsToast).toBeFalsy();
    expect(error.showDetails).toBe(true);
  });
});
