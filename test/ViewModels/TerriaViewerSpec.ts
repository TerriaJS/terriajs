import CesiumMath from "terriajs-cesium/Source/Core/Math";
import Terria from "../../lib/Models/Terria";
import ViewerMode, { setViewerMode } from "../../lib/Models/ViewerMode";
import TerriaViewer from "../../lib/ViewModels/TerriaViewer";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";

const mockBeforeViewerChanges = jasmine.createSpy("", () => {});
const mockAfterViewerChanges = jasmine.createSpy("", () => {});

describe("TerriaViewer", function () {
  let terria: Terria;
  let terriaViewer: TerriaViewer;
  let container: HTMLElement;

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });
    container = document.createElement("div");
    document.body.appendChild(container);
    terria.loadHomeCamera({
      west: 45,
      south: -20,
      east: 55,
      north: -10
    });
    terria.mainViewer.attach(container);
    terriaViewer = terria.mainViewer;

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

  afterEach(() => {
    terriaViewer.destroy();
    document.body.removeChild(container);
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

  describe("currentViewer", function () {
    const rectangleDegrees = ({ west, south, east, north }: Rectangle) => ({
      west: CesiumMath.toDegrees(west),
      south: CesiumMath.toDegrees(south),
      east: CesiumMath.toDegrees(east),
      north: CesiumMath.toDegrees(north)
    });

    it("should return the home camera view", function () {
      const r = rectangleDegrees(
        terriaViewer.currentViewer.getCurrentCameraView().rectangle
      );
      expect(r.west).toBe(45);
      expect(r.south).toBe(-20);
      expect(r.east).toBe(55);
      expect(r.north).toBe(-10);
    });
  });
});
