import L from "leaflet";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { page } from "vitest/browser";
import { addDatasets } from "../../test/datasets";
import { TILES } from "../../test/tiles";
import { createTerria, waitForMap } from "../../test/terria";
import { UserInterface } from "../UserInterface";

// The colour at the middle of an element, as the screen shows it
const centrePixel = async (element: Element): Promise<Uint8ClampedArray> => {
  // Not saved, a screenshot comes back as the image's base64
  const base64 = await page.screenshot({ element, save: false });
  const image = new Image();
  image.src = `data:image/png;base64,${base64}`;
  await image.decode();
  const canvas = new OffscreenCanvas(image.width, image.height);
  const context = canvas.getContext("2d");
  context?.drawImage(image, 0, 0);
  return (
    context?.getImageData(image.width >> 1, image.height >> 1, 1, 1).data ??
    new Uint8ClampedArray(4)
  );
};

describe("UserInterface", () => {
  it("shows the map, in the shell's map region", async () => {
    const { terria, viewState } = createTerria();
    const screen = await render(
      <UserInterface terria={terria} viewState={viewState} />
    );

    const map = screen.getByRole("main");
    await expect.element(map).toBeInTheDocument();
    expect(terria.mainViewer.attached).toBe(true);
    expect(map.element().contains(terria.mainViewer.mapContainer as Node)).toBe(
      true
    );

    await screen.unmount();
    expect(terria.mainViewer.attached).toBe(false);
  });

  it("lays out the 2D map's layers on top of each other", async () => {
    const { terria, viewState } = createTerria();
    const screen = await render(
      <UserInterface terria={terria} viewState={viewState} />
    );

    // Without Leaflet's stylesheet its panes stack down the page instead
    await waitForMap(terria);
    const pane = screen.container.querySelector(".leaflet-map-pane");
    expect(pane && getComputedStyle(pane).position).toBe("absolute");
  });

  it("draws lines and shapes on the 2D map at the map's size", async () => {
    const { terria, viewState } = createTerria();
    const screen = await render(
      <UserInterface terria={terria} viewState={viewState} />
    );
    await waitForMap(terria);

    // Leaflet draws vectors, such as a measured line, on a canvas
    terria.leaflet?.map.addLayer(
      L.polyline([
        [-35, 149],
        [-34, 150]
      ])
    );
    const canvas = screen.container.querySelector(
      ".leaflet-overlay-pane canvas"
    );
    expect(canvas?.getBoundingClientRect().width).toBeGreaterThan(0);
  });

  it("keeps the 3D globe the map's size", async () => {
    const { terria, viewState } = createTerria("3d");
    const screen = await render(
      <UserInterface terria={terria} viewState={viewState} />
    );
    await waitForMap(terria);

    // The globe sizes its canvas to the map every frame: let frames go by
    await new Promise((resolve) => setTimeout(resolve, 500));
    const map = screen.getByRole("main").element().getBoundingClientRect();
    const canvas = screen.container.querySelector(".cesium-widget canvas");
    expect(canvas?.getBoundingClientRect().height).toBe(map.height);
  });

  it("draws the 3D globe in the middle of the map", async () => {
    const { terria, viewState } = createTerria("3d");
    const screen = await render(
      <UserInterface terria={terria} viewState={viewState} />
    );
    await waitForMap(terria);

    // With no base map, the globe is its plain blue; the page around a
    // misplaced canvas would be white, and an undrawn one black
    const map = screen.getByRole("main");
    // Its first tiles are built in Cesium's workers, slowly on a machine
    // without a GPU, such as CI's
    await expect
      .poll(() => terria.cesium?.scene.globe.tilesLoaded, { timeout: 30_000 })
      .toBe(true);
    const [red, , blue] = await centrePixel(map.element());
    expect(blue - red).toBeGreaterThan(100);
  }, 40_000);

  it("draws a dataset's tiles on the map, from its server", async () => {
    const { terria, viewState } = createTerria();
    const screen = await render(
      <UserInterface terria={terria} viewState={viewState} />
    );
    await waitForMap(terria);
    await addDatasets(terria, ["Rainfall"]);

    // The test tile server's blank tile, a pixel in size
    await expect
      .poll(() =>
        [...screen.container.querySelectorAll("img")].some(
          (tile) =>
            tile.src.startsWith(TILES) &&
            tile.complete &&
            tile.naturalWidth === 1
        )
      )
      .toBe(true);
  });

  it("is styled by the design system", async () => {
    const { terria, viewState } = createTerria();
    await render(<UserInterface terria={terria} viewState={viewState} />);

    // Its tokens are defined on the root
    expect(
      getComputedStyle(document.documentElement)
        .getPropertyValue("--terria-ds-text-foreground")
        .trim()
    ).not.toBe("");
  });
});
