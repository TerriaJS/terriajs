import { describe, expect, it } from "vitest";
import { page, type Locator } from "vitest/browser";
import type { ReactElement } from "react";
import { render } from "vitest-browser-react";
import { ViewStateProvider } from "../../../../ReactViewModels/ViewStateContext";
import { MapView } from "../../../MapView/MapView";
import { addDatasets } from "../../../test/datasets";
import { network } from "../../../test/network";
import { createTerria, waitForMap } from "../../../test/terria";
import { tileServerDown } from "../../../test/tiles";
import { MapProgressBar } from "../MapProgressBar";

const progressBar = (): Locator =>
  page.getByRole("progressbar", { name: "Loading map data" });

// The bar with a real Terria and ViewState, over the 2D map where `onMap`
const renderBar = async (bar: ReactElement, { onMap = false } = {}) => {
  const { terria, viewState } = createTerria();
  const screen = await render(
    <ViewStateProvider viewState={viewState}>
      <div style={{ position: "relative", width: 800, height: 400 }}>
        {onMap && <MapView viewer={terria.mainViewer} />}
        {bar}
      </div>
    </ViewStateProvider>
  );
  if (onMap) await waitForMap(terria);
  return { terria, screen };
};

describe("MapProgressBar", () => {
  it("shows nothing while the map isn't loading", async () => {
    await renderBar(<MapProgressBar />);

    expect(progressBar().query()).toBeNull();
  });

  it("shows how much of what the map is loading has loaded", async () => {
    const { terria } = await renderBar(<MapProgressBar />);

    terria.tileLoadProgressEvent.raiseEvent(3, 4);

    await expect.element(progressBar()).toHaveAttribute("aria-valuenow", "25");
  });

  it("goes once everything has loaded", async () => {
    const { terria } = await renderBar(<MapProgressBar />);
    terria.tileLoadProgressEvent.raiseEvent(3, 4);
    await expect.element(progressBar()).toBeVisible();

    terria.tileLoadProgressEvent.raiseEvent(0, 4);

    await expect.element(progressBar()).not.toBeInTheDocument();
  });

  it("goes once the 2D map has tried every tile, those its server failed too", async () => {
    network.use(tileServerDown);
    const { terria } = await renderBar(<MapProgressBar />, { onMap: true });

    // The most tiles the map has said it's loading at once
    let mostLoading = 0;
    terria.tileLoadProgressEvent.addEventListener((remaining: number) => {
      mostLoading = Math.max(mostLoading, remaining);
    });

    await addDatasets(terria, ["Rainfall"]);

    await expect.poll(() => mostLoading).toBeGreaterThan(0);
    await expect
      .element(progressBar(), { timeout: 5000 })
      .not.toBeInTheDocument();
  });

  it("shows the map is loading without how far, while it can't say", async () => {
    const { terria } = await renderBar(<MapProgressBar />);

    terria.indeterminateTileLoadProgressEvent.raiseEvent(true);

    await expect.element(progressBar()).toBeVisible();
    expect(progressBar().element().hasAttribute("aria-valuenow")).toBe(false);
    terria.indeterminateTileLoadProgressEvent.raiseEvent(false);
    await expect.element(progressBar()).not.toBeInTheDocument();
  });

  it("goes back to how far it's got once the map can say again", async () => {
    const { terria } = await renderBar(<MapProgressBar />);
    terria.tileLoadProgressEvent.raiseEvent(3, 4);
    terria.indeterminateTileLoadProgressEvent.raiseEvent(true);
    await expect
      .poll(() => progressBar().element().hasAttribute("aria-valuenow"))
      .toBe(false);

    terria.indeterminateTileLoadProgressEvent.raiseEvent(false);

    await expect.element(progressBar()).toHaveAttribute("aria-valuenow", "25");
  });

  it("stops following the map once it's gone", async () => {
    const { terria, screen } = await renderBar(<MapProgressBar />);

    await screen.unmount();

    expect(terria.tileLoadProgressEvent.numberOfListeners).toBe(0);
    expect(terria.indeterminateTileLoadProgressEvent.numberOfListeners).toBe(0);
  });

  it("has its base class, and keeps one it's given", async () => {
    const { terria } = await renderBar(<MapProgressBar className="map-own" />);

    terria.tileLoadProgressEvent.raiseEvent(1, 2);

    await expect.element(progressBar()).toBeVisible();
    const classes = [...progressBar().element().classList];
    expect(classes).toContain("tjs-map-progress-bar");
    expect(classes.at(-1)).toBe("map-own");
  });
});
