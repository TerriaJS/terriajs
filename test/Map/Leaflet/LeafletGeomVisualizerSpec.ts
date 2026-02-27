import L from "leaflet";
import { runInAction } from "mobx";
import SplitDirection from "terriajs-cesium/Source/Scene/SplitDirection";
import EntityCollection from "terriajs-cesium/Source/DataSources/EntityCollection";
import LeafletScene from "../../../lib/Map/Leaflet/LeafletScene";
import { LeafletGeomVisualizer } from "../../../lib/Map/Leaflet/LeafletVisualizer";

function createMap(): L.Map {
  const container = document.createElement("div");
  container.style.width = "1000px";
  container.style.height = "600px";
  document.body.appendChild(container);
  return L.map(container, { zoomControl: false }).setView([0, 0], 2);
}

describe("LeafletGeomVisualizer", function () {
  let map: L.Map;
  let scene: LeafletScene;
  let entities: EntityCollection;

  beforeEach(function () {
    map = createMap();
    scene = new LeafletScene(map);
    entities = new EntityCollection();
  });

  afterEach(function () {
    map.remove();
    const container = map.getContainer();
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  it("creates a custom pane on construction", function () {
    const visualizer = new LeafletGeomVisualizer(scene, entities);
    const paneElement = visualizer.paneElement;
    expect(paneElement).toBeDefined();
    expect(paneElement.parentNode).toBe(map.getPane("mapPane")!);
    visualizer.destroy();
  });

  it("generates unique pane names across instances", function () {
    const v1 = new LeafletGeomVisualizer(scene, entities);
    const v2 = new LeafletGeomVisualizer(scene, entities);
    expect(v1.paneName).not.toBe(v2.paneName);
    v1.destroy();
    v2.destroy();
  });

  describe("splitter clipping", function () {
    it("applies no clip-path when splitDirection is NONE", function () {
      const visualizer = new LeafletGeomVisualizer(scene, entities);
      runInAction(() => {
        visualizer.splitDirection = SplitDirection.NONE;
      });

      expect(
        visualizer.paneElement.style.clipPath === "none" ||
          visualizer.paneElement.style.clipPath === ""
      ).toBe(true);
      visualizer.destroy();
    });

    it("applies left clip-path polygon when splitDirection is LEFT", function () {
      const visualizer = new LeafletGeomVisualizer(scene, entities);
      runInAction(() => {
        visualizer.splitDirection = SplitDirection.LEFT;
        visualizer.splitPosition = 0.5;
      });

      const clipPath = visualizer.paneElement.style.clipPath;
      expect(clipPath).not.toBe("none");
      expect(clipPath).not.toBe("");
      expect(clipPath).toMatch(/^polygon\(/);
      visualizer.destroy();
    });

    it("applies right clip-path polygon when splitDirection is RIGHT", function () {
      const visualizer = new LeafletGeomVisualizer(scene, entities);
      runInAction(() => {
        visualizer.splitDirection = SplitDirection.RIGHT;
        visualizer.splitPosition = 0.5;
      });

      const clipPath = visualizer.paneElement.style.clipPath;
      expect(clipPath).not.toBe("none");
      expect(clipPath).not.toBe("");
      expect(clipPath).toMatch(/^polygon\(/);
      visualizer.destroy();
    });

    it("produces different clip-paths for LEFT vs RIGHT at the same position", function () {
      const v1 = new LeafletGeomVisualizer(scene, entities);
      const v2 = new LeafletGeomVisualizer(scene, entities);

      runInAction(() => {
        v1.splitDirection = SplitDirection.LEFT;
        v1.splitPosition = 0.5;
        v2.splitDirection = SplitDirection.RIGHT;
        v2.splitPosition = 0.5;
      });

      expect(v1.paneElement.style.clipPath).not.toBe(
        v2.paneElement.style.clipPath
      );
      v1.destroy();
      v2.destroy();
    });
  });

  it("removes the pane element from DOM on destroy", function () {
    const visualizer = new LeafletGeomVisualizer(scene, entities);
    const paneElement = visualizer.paneElement;
    expect(paneElement.parentNode).not.toBeNull();
    visualizer.destroy();
    expect(paneElement.parentNode).toBeNull();
  });
});
