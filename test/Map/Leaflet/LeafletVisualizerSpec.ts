import L from "leaflet";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import BillboardGraphics from "terriajs-cesium/Source/DataSources/BillboardGraphics";
import CustomDataSource from "terriajs-cesium/Source/DataSources/CustomDataSource";
import Entity from "terriajs-cesium/Source/DataSources/Entity";
import LeafletScene from "../../../lib/Map/Leaflet/LeafletScene";
import LeafletVisualizer from "../../../lib/Map/Leaflet/LeafletVisualizer";

describe("LeafletVisualizer", function () {
  let container: HTMLElement;
  let map: L.Map;
  let scene: LeafletScene;
  let dataSource: CustomDataSource;

  beforeEach(function () {
    container = document.createElement("div");
    container.style.width = "200px";
    container.style.height = "200px";
    document.body.appendChild(container);
    map = L.map(container, { center: [0, 0], zoom: 3 });
    scene = new LeafletScene(map);
    dataSource = new CustomDataSource();
  });

  afterEach(function () {
    map.remove();
    document.body.removeChild(container);
  });

  function visualize() {
    const visualizer = new LeafletVisualizer().visualizersCallback(
      scene,
      undefined,
      dataSource
    )[0];
    visualizer.update(JulianDate.now());
  }

  describe("billboard", function () {
    it("applies a CSS rotate transform when the billboard defines a rotation", function () {
      const rotation = CesiumMath.toRadians(42);
      dataSource.entities.add(
        new Entity({
          position: Cartesian3.fromDegrees(0, 0) as any,
          billboard: new BillboardGraphics({
            // single pixel dot
            image:
              "data:image/gif;base64,R0lGODlhAQABAPAAAAAAAP///yH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==",
            width: 24,
            height: 24,
            rotation
          })
        })
      );
      visualize();

      const icon = container.querySelector<HTMLElement>(".leaflet-marker-icon");
      expect(icon).not.toBeNull();
      expect(icon!.style.transform).toMatch(/rotateZ\(0\.73\d*rad\)/);
      expect(icon!.style.transformOrigin).toBe("center center");
    });
  });
});
