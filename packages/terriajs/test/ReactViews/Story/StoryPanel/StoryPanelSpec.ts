import Terria from "../../../../lib/Models/Terria";
import { activateStory } from "../../../../lib/ReactViews/Story/StoryPanel/StoryPanel";

describe("activateStory", function () {
  let terria: Terria;

  beforeEach(function () {
    terria = new Terria({ baseUrl: "./" });
  });

  it("does not reset the viewer's map quality or native resolution", async function () {
    terria.setBaseMaximumScreenSpaceError(3);
    terria.setUseNativeResolution(false);

    await activateStory(
      {
        id: "scene-1",
        title: "Scene 1",
        text: "",
        shareData: {
          version: "8.0.0",
          initSources: [
            {
              settings: {
                baseMaximumScreenSpaceError: 1,
                useNativeResolution: true,
                alwaysShowTimeline: true
              }
            }
          ]
        }
      },
      terria
    );

    expect(terria.baseMaximumScreenSpaceError).toBe(3);
    expect(terria.useNativeResolution).toBe(false);
    expect(terria.timelineStack.alwaysShowingTimeline).toBe(true);
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
