import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { expectClassNames } from "../../test/expectClassNames";
import { MapView, type MapViewer } from "../MapView";

// Stands in for TerriaViewer, recording where it's attached
const recordingViewer = (): MapViewer & { container?: HTMLElement } => {
  const viewer: MapViewer & { container?: HTMLElement } = {
    attach: (container) => {
      viewer.container =
        container instanceof HTMLElement ? container : undefined;
    },
    detach: () => {
      viewer.container = undefined;
    }
  };
  return viewer;
};

describe("MapView", () => {
  it("draws the map into its own element, and lets it go when removed", async () => {
    const viewer = recordingViewer();
    const screen = await render(<MapView viewer={viewer} />);

    expect(viewer.container).toBe(screen.container.firstElementChild);

    await screen.unmount();
    expect(viewer.container).toBeUndefined();
  });

  it("has its base class, and keeps one it's given", async () => {
    await expectClassNames(
      (className) => (
        <MapView viewer={recordingViewer()} className={className} />
      ),
      "tjs-map-view"
    );
  });
});
