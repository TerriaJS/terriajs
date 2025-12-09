import CesiumMath from "terriajs-cesium/Source/Core/Math";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import CatalogMemberMixin from "../../lib/ModelMixins/CatalogMemberMixin";
import MappableMixin, { MapItem } from "../../lib/ModelMixins/MappableMixin";
import CommonStrata from "../../lib/Models/Definition/CommonStrata";
import CreateModel from "../../lib/Models/Definition/CreateModel";
import Terria from "../../lib/Models/Terria";
import ViewerMode, { setViewerMode } from "../../lib/Models/ViewerMode";
import CatalogMemberTraits from "../../lib/Traits/TraitsClasses/CatalogMemberTraits";
import MappableTraits from "../../lib/Traits/TraitsClasses/MappableTraits";
import mixTraits from "../../lib/Traits/mixTraits";
import TerriaViewer from "../../lib/ViewModels/TerriaViewer";

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

  describe("setBaseMap", function () {
    let baseMap: TestBaseMapItem;

    beforeEach(function () {
      baseMap = new TestBaseMapItem("test-basemap", terria);
    });

    it("sets the base map", async function () {
      expect(terriaViewer.baseMap).toBeUndefined();
      await terriaViewer.setBaseMap(baseMap);
      expect(terriaViewer.baseMap).toBe(baseMap);
    });

    describe("if the base map fails to load", function () {
      it("does not change the base map", async function () {
        expect(terriaViewer.baseMap).toBeUndefined();
        baseMap.failLoading = true;
        await terriaViewer.setBaseMap(baseMap);
        expect(terriaViewer.baseMap).toBeUndefined();
      });

      it("raises an error notification", async function () {
        expect(terria.notificationState.getAllNotifications().length).toBe(0);
        baseMap.failLoading = true;
        await terriaViewer.setBaseMap(baseMap);
        expect(terria.notificationState.getAllNotifications().length).toBe(1);
      });
    });

    it("should switch the viewer mode if the base map sets a preferredViewerMode", async function () {
      expect(terriaViewer.viewerMode).toBe(ViewerMode.Cesium);
      baseMap.setTrait(CommonStrata.user, "preferredViewerMode", "2d");
      await terriaViewer.setBaseMap(baseMap);
      expect(terriaViewer.baseMap).toBe(baseMap);
      expect(terriaViewer.viewerMode).toBe(ViewerMode.Leaflet);
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

/**
 * Catalog item for base map tests
 */
class TestBaseMapItem extends MappableMixin(
  CatalogMemberMixin(
    CreateModel(mixTraits(CatalogMemberTraits, MappableTraits))
  )
) {
  failLoading = false;

  protected async forceLoadMapItems(): Promise<void> {
    if (this.failLoading) throw new Error("Loading failed.");
  }

  get mapItems(): MapItem[] {
    return [];
  }
}
