import { computed } from "mobx";
import Leaflet from "../../lib/Models/Leaflet";
import Terria from "../../lib/Models/Terria";
import ViewerMode, { setViewerMode } from "../../lib/Models/ViewerMode";
import TerriaViewer from "../../lib/ViewModels/TerriaViewer";

const mockBeforeViewerChanges = jasmine.createSpy("", () => {});
const mockAfterViewerChanges = jasmine.createSpy("", () => {});

describe("TerriaViewer", function () {
  let terria: Terria;
  let terriaViewer: TerriaViewer;

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });
    const container = document.createElement("div");
    document.body.appendChild(container);
    terria.mainViewer.attach(container);
    terriaViewer = terria.mainViewer;
    terria.loadHomeCamera({
      west: 45,
      south: -20,
      east: 55,
      north: -10
    });

    setViewerMode("3d", terriaViewer);

    terriaViewer.beforeViewerChanged.addEventListener(() => {
      mockBeforeViewerChanges();
    });
    terriaViewer.afterViewerChanged.addEventListener(() => {
      mockAfterViewerChanges();
    });
    mockBeforeViewerChanges.calls.reset();
    mockAfterViewerChanges.calls.reset();
  });

  describe("viewer change", () => {
    it("should not raise event on initialization", () => {
      expect(terriaViewer.viewerMode).toBe(ViewerMode.Cesium);
      expect(mockBeforeViewerChanges).not.toHaveBeenCalled();
      expect(mockAfterViewerChanges).not.toHaveBeenCalled();
    });

    it("should raise event, change to leaflet from 3d", () => {
      setViewerMode("2d", terriaViewer);
      expect(mockBeforeViewerChanges).toHaveBeenCalledTimes(1);
      expect(mockAfterViewerChanges).toHaveBeenCalledTimes(1);
      expect(terriaViewer.viewerMode).toBe(ViewerMode.Leaflet);
    });

    it("should not trigger event, change to 3dsmooth from 3d", () => {
      setViewerMode("3dsmooth", terriaViewer);
      expect(mockBeforeViewerChanges).not.toHaveBeenCalled();
      expect(mockAfterViewerChanges).not.toHaveBeenCalled();
      expect(terriaViewer.viewerMode).toBe(ViewerMode.Cesium);
    });
    it("should trigger events, on multiple changes", () => {
      setViewerMode("2d", terriaViewer);
      setViewerMode("3dsmooth", terriaViewer);
      expect(mockBeforeViewerChanges).toHaveBeenCalledTimes(2);
      expect(mockAfterViewerChanges).toHaveBeenCalledTimes(2);
      expect(terriaViewer.viewerMode).toBe(ViewerMode.Cesium);
    });
  });
});
