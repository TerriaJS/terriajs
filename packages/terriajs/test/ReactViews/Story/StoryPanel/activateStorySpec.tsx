import { fireEvent, screen } from "@testing-library/react";
import TerriaError from "../../../../lib/Core/TerriaError";
import Terria from "../../../../lib/Models/Terria";
import ViewState from "../../../../lib/ReactViewModels/ViewState";
import { terriaErrorToast } from "../../../../lib/ReactViews/Notification/terriaErrorNotification";
import { activateStory } from "../../../../lib/ReactViews/Story/StoryPanel/StoryPanel";
import { renderWithContexts } from "../../withContext";

describe("activateStory", function () {
  let terria: Terria;

  beforeEach(function () {
    terria = new Terria({ baseUrl: "./" });
  });

  it("shows scene errors that aren't on a workbench item as a toast", async function () {
    const raiseSpy = spyOn(terria, "raiseErrorToUser");

    await activateStory(
      {
        id: "scene",
        title: "Scene",
        text: "",
        shareData: {
          version: "8.0.0",
          initSources: [{ initialCamera: { west: "not a number" } }]
        }
      } as any,
      terria
    );

    expect(raiseSpy).not.toHaveBeenCalled();
    expect(terria.notificationState.currentNotification?.showAsToast).toBe(
      true
    );
  });
});

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
