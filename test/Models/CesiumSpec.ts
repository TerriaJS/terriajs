import { computed } from "mobx";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import Cesium from "../../lib/Models/Cesium";
import Terria from "../../lib/Models/Terria";
import WebMapServiceCatalogItem from "../../lib/Models/WebMapServiceCatalogItem";
import TerriaViewer from "../../lib/ViewModels/TerriaViewer";

const supportsWebGL = require("../../lib/Core/supportsWebGL");

const describeIfSupported = supportsWebGL() ? describe : xdescribe;

describeIfSupported("Cesium Model", function() {
  let terria: Terria;
  let terriaViewer: TerriaViewer;
  let container: HTMLElement;
  let cesium: Cesium;
  let terriaProgressEvt: jasmine.Spy;

  beforeEach(function() {
    terria = new Terria({
      baseUrl: "./"
    });
    terriaViewer = new TerriaViewer(
      terria,
      computed(() => [])
    );
    container = document.createElement("div");
    container.id = "container";
    document.body.appendChild(container);

    terriaProgressEvt = spyOn(terria.tileLoadProgressEvent, "raiseEvent");

    cesium = new Cesium(terriaViewer, container);
  });

  afterEach(function() {
    cesium.destroy();
    document.body.removeChild(container);
  });

  it("should trigger terria.tileLoadProgressEvent on globe tileLoadProgressEvent", function() {
    cesium.scene.globe.tileLoadProgressEvent.raiseEvent(3);

    expect(terriaProgressEvt).toHaveBeenCalledWith(3, 3);
  });

  it("should retain the maximum length of tiles to be loaded", function() {
    cesium.scene.globe.tileLoadProgressEvent.raiseEvent(3);
    cesium.scene.globe.tileLoadProgressEvent.raiseEvent(7);
    cesium.scene.globe.tileLoadProgressEvent.raiseEvent(4);
    cesium.scene.globe.tileLoadProgressEvent.raiseEvent(2);

    expect(terriaProgressEvt).toHaveBeenCalledWith(2, 7);
  });

  it("should reset maximum length when the number of tiles to be loaded reaches 0", function() {
    cesium.scene.globe.tileLoadProgressEvent.raiseEvent(3);
    cesium.scene.globe.tileLoadProgressEvent.raiseEvent(7);
    cesium.scene.globe.tileLoadProgressEvent.raiseEvent(4);
    cesium.scene.globe.tileLoadProgressEvent.raiseEvent(0);

    expect(terriaProgressEvt.calls.mostRecent().args).toEqual([0, 0]);

    cesium.scene.globe.tileLoadProgressEvent.raiseEvent(2);

    expect(terriaProgressEvt.calls.mostRecent().args).toEqual([2, 2]);
  });

  describe("doZoomTo", function() {
    let initialCameraPosition: Cartesian3;

    beforeEach(function() {
      initialCameraPosition = cesium.scene.camera.position.clone();
    });

    it("can zoomTo a rectangle", async function() {
      const [west, south, east, north] = [0, 0, 0, 0];
      await cesium.doZoomTo(Rectangle.fromDegrees(west, south, east, north));
      expect(initialCameraPosition.equals(cesium.scene.camera.position)).toBe(
        false
      );
    });
  });
});
