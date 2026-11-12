import L from "../../lib/Map/LeafletPatched";

describe("LeafletPatched", function () {
  let container: HTMLElement;

  beforeEach(function () {
    container = document.createElement("div");
    container.style.width = "100px";
    container.style.height = "100px";
    document.body.appendChild(container);
  });

  afterEach(function () {
    container.remove();
  });

  it("doesn't redraw a canvas after its map is removed", async function () {
    const map = L.map(container, { preferCanvas: true }).setView([0, 0], 1);
    // Adding a path queues a redraw for the next animation frame.
    L.polygon([
      [0, 0],
      [1, 1],
      [1, 0]
    ]).addTo(map);
    const renderer = (map as any)._renderer;
    // A synchronous redraw, as the renderer does on its "update" event.
    renderer._updatePaths();
    const clear = spyOn(renderer, "_clear");

    map.remove();
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve))
    );

    expect(clear).not.toHaveBeenCalled();
  });
});
