import { runInAction } from "mobx";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import CustomDataSource from "terriajs-cesium/Source/DataSources/CustomDataSource";
import Camera from "terriajs-cesium/Source/Scene/Camera";
import Cesium3DTileset from "terriajs-cesium/Source/Scene/Cesium3DTileset";
import UrlTemplateImageryProvider from "terriajs-cesium/Source/Scene/UrlTemplateImageryProvider";
import MappableMixin, {
  ImageryParts,
  MapItem
} from "../../../lib/ModelMixins/MappableMixin";
import CameraView from "../../../lib/Models/CameraView";
import WebMapServiceCatalogItem from "../../../lib/Models/Catalog/Ows/WebMapServiceCatalogItem";
import Cesium from "../../../lib/Models/Cesium";
import CommonStrata from "../../../lib/Models/Definition/CommonStrata";
import CreateModel from "../../../lib/Models/Definition/CreateModel";
import createStratumInstance from "../../../lib/Models/Definition/createStratumInstance";
import updateModelFromJson from "../../../lib/Models/Definition/updateModelFromJson";
import Terria from "../../../lib/Models/Terria";
import MappableTraits, {
  RectangleTraits
} from "../../../lib/Traits/TraitsClasses/MappableTraits";
import TerriaViewer from "../../../lib/ViewModels/TerriaViewer";

describe("Cesium Zooming", function () {
  let camera: Camera;
  let terria: Terria;
  let terriaViewer: TerriaViewer;
  let container: HTMLElement;
  let cesium: Cesium;

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });
    terriaViewer = terria.mainViewer;
    runInAction(() => {
      terriaViewer.viewerOptions.useTerrain = false;
    });
    container = document.createElement("div");
    container.id = "container";
    document.body.appendChild(container);

    cesium = new Cesium(terriaViewer, container);
    camera = cesium.scene.camera;
  });

  afterEach(function () {
    cesium.destroy();
    document.body.removeChild(container);
  });

  it("can zoom to a rectangle", async function () {
    await cesium.zoomTo(Rectangle.fromDegrees(30.0, 10.0, 40.0, 20.0), 0);
    const cameraPositionDegrees = cartographicDegrees(
      cesium.scene.camera.positionCartographic
    );
    expect(cameraPositionDegrees.longitude).toBeCloseTo(35);
    expect(cameraPositionDegrees.latitude).toBeCloseTo(15);
  });

  it("can zoom to a mappable item with rectangle trait", async function () {
    const item = new ZoomableCatalogItem("test", terria);
    item.setTrait(
      CommonStrata.user,
      "rectangle",
      createStratumInstance(RectangleTraits, {
        west: 30.0,
        south: 10.0,
        east: 40.0,
        north: 20.0
      })
    );
    await cesium.zoomTo(item, 0);
    expect(
      CesiumMath.toDegrees(camera.positionCartographic.longitude)
    ).toBeCloseTo(35);
    expect(
      CesiumMath.toDegrees(camera.positionCartographic.latitude)
    ).toBeCloseTo(15);
  });

  it("can zoom to a mappable item containing a DataSource mapItem", async function () {
    const dataSource = new CustomDataSource();
    const rectangle = Rectangle.fromDegrees(30.0, 10.0, 40.0, 20.0);
    dataSource.entities.add({
      rectangle: {
        coordinates: rectangle
      }
    });
    const item = new ZoomableCatalogItem("test-zoom", terria);
    item.mapItems = [dataSource];
    await terria.workbench.add(item);
    await cesium.zoomTo(item, 0);
    expect(
      CesiumMath.toDegrees(camera.positionCartographic.longitude)
    ).toBeCloseTo(34.9417);
    expect(
      CesiumMath.toDegrees(camera.positionCartographic.latitude)
    ).toBeCloseTo(1.882);
  });

  it("can zoom to a mappable item containing a Cesium3DTileset mapItem", async function () {
    const tileset = new Cesium3DTileset({
      url: "test/Cesium3DTiles/tileset.json"
    });
    const item = new ZoomableCatalogItem("test-zoom", terria);
    item.mapItems = [tileset];
    await terria.workbench.add(item);
    await cesium.zoomTo(item, 0);
    expect(
      CesiumMath.toDegrees(camera.positionCartographic.longitude)
    ).toBeCloseTo(-75.612);
    expect(
      CesiumMath.toDegrees(camera.positionCartographic.latitude)
    ).toBeCloseTo(40.022);
  });

  it("can zoom to a mappable item containing an ImageryProvider mapItem", async function () {
    const item = new ZoomableCatalogItem("test-zoom", terria);
    const imageryProvider1 = new UrlTemplateImageryProvider({
      url: "foo",
      rectangle: Rectangle.fromDegrees(30.0, 10.0, 40.0, 20.0)
    });
    const imageryPart1: ImageryParts = {
      imageryProvider: imageryProvider1,
      alpha: 1.0,
      clippingRectangle: undefined,
      show: true
    };
    const imageryProvider2 = new UrlTemplateImageryProvider({
      url: "foo",
      rectangle: Rectangle.fromDegrees(40.0, 20.0, 50.0, 30.0)
    });
    const imageryPart2: ImageryParts = {
      imageryProvider: imageryProvider2,
      alpha: 1.0,
      clippingRectangle: undefined,
      show: true
    };
    item.mapItems = [imageryPart1, imageryPart2];
    await terria.workbench.add(item);
    await cesium.zoomTo(item, 0);
    const cameraPositionDegrees = cartographicDegrees(
      cesium.scene.camera.positionCartographic
    );
    expect(cameraPositionDegrees.longitude).toBeCloseTo(39.742);
    expect(cameraPositionDegrees.latitude).toBeCloseTo(-0.48);
  });

  it("can zoom to a mappable item with a valid `idealZoomCameraView`", async function () {
    const item = new ZoomableCatalogItem("test-zoom", terria);
    updateModelFromJson(item, CommonStrata.user, {
      idealZoom: {
        camera: {
          west: 144.4131322334807,
          south: -38.059532192437786,
          east: 145.5840146790676,
          north: -37.464551785126034,
          position: {
            x: -4137503.5715755797,
            y: 2896521.908795708,
            z: -3973708.4744639127
          },
          direction: {
            x: 0.022817485629030406,
            y: -0.007631137491888094,
            z: 0.9997105221463606
          },
          up: {
            x: -0.8157292307510975,
            y: 0.5779752880271604,
            z: 0.02303016561260074
          }
        }
      }
    });
    await terria.workbench.add(item);
    await cesium.zoomTo(item, 0);
    expect(
      CesiumMath.toDegrees(camera.positionCartographic.longitude)
    ).toBeCloseTo(145.005);
    expect(
      CesiumMath.toDegrees(camera.positionCartographic.latitude)
    ).toBeCloseTo(-38.38);
  });

  it("chooses `idealZoom` settings over other settings", async function () {
    const item = new ZoomableCatalogItem("test-zoom", terria);
    updateModelFromJson(item, CommonStrata.user, {
      idealZoom: {
        camera: {
          west: 144.4131322334807,
          south: -38.059532192437786,
          east: 145.5840146790676,
          north: -37.464551785126034,
          position: {
            x: -4137503.5715755797,
            y: 2896521.908795708,
            z: -3973708.4744639127
          },
          direction: {
            x: 0.022817485629030406,
            y: -0.007631137491888094,
            z: 0.9997105221463606
          },
          up: {
            x: -0.8157292307510975,
            y: 0.5779752880271604,
            z: 0.02303016561260074
          }
        }
      }
    });
    await terria.workbench.add(item);
    await cesium.zoomTo(item, 0);
    // Verifies that idealZoom settings has higher priority than rectangle
    updateModelFromJson(item, CommonStrata.user, {
      rectangle: {
        west: 1.0,
        east: 0.0,
        north: 1.0,
        south: 0.0
      }
    });
    expect(
      CesiumMath.toDegrees(camera.positionCartographic.longitude)
    ).toBeCloseTo(145.005);
    expect(
      CesiumMath.toDegrees(camera.positionCartographic.latitude)
    ).toBeCloseTo(-38.38);
  });

  it("samples the terrain to adjust the bounding sphere height when zooming to a clamped model", function () {});

  it("can zoom to multiple mappables", async function () {
    const ds1 = new CustomDataSource("ds1");
    ds1.entities.add({
      rectangle: {
        coordinates: Rectangle.fromDegrees(30.0, 10.0, 40.0, 20.0)
      }
    });

    const item1 = new ZoomableCatalogItem("item1", terria);
    item1.mapItems = [ds1];

    const ds2 = new CustomDataSource("ds2");
    ds2.entities.add({
      rectangle: {
        coordinates: Rectangle.fromDegrees(70.0, 50.0, 80.0, 60.0)
      }
    });
    const item2 = new ZoomableCatalogItem("item2", terria);
    item2.mapItems = [ds2];

    const items = [item1, item2];
    await terria.workbench.add(items);
    await cesium.zoomTo(items, 0);
    expect(
      CesiumMath.toDegrees(camera.positionCartographic.longitude)
    ).toBeCloseTo(49.447);
    expect(
      CesiumMath.toDegrees(camera.positionCartographic.latitude)
    ).toBeCloseTo(5.368);
  });

  it("can zoom to a CameraView object with `position`, `direction` and `up` settings", async function () {
    const rectangle = Rectangle.fromDegrees(30.0, 10.0, 40.0, 20.0);
    const positon = Cartographic.toCartesian(Rectangle.center(rectangle));
    const cameraView = new CameraView(
      rectangle,
      positon,
      cesium.scene.camera.direction,
      cesium.scene.camera.up
    );
    await cesium.zoomTo(cameraView, 0);
    expect(
      CesiumMath.toDegrees(camera.positionCartographic.longitude)
    ).toBeCloseTo(35);
    expect(
      CesiumMath.toDegrees(camera.positionCartographic.latitude)
    ).toBeCloseTo(14.999);
  });

  it("can zoom to a CameraView object with only a `rectangle` defined", async function () {
    const rectangle = Rectangle.fromDegrees(30.0, 10.0, 40.0, 20.0);
    const cameraView = new CameraView(rectangle);
    await cesium.zoomTo(cameraView, 0);
    expect(
      CesiumMath.toDegrees(camera.positionCartographic.longitude)
    ).toBeCloseTo(35);
    expect(
      CesiumMath.toDegrees(camera.positionCartographic.latitude)
    ).toBeCloseTo(14.999);
  });

  describe("if the target is a TimeVarying item", function () {
    it("sets the target item as the timeline source", async function () {
      const targetItem = new WebMapServiceCatalogItem("test", terria);
      targetItem.setTrait(
        CommonStrata.user,
        "rectangle",
        createStratumInstance(RectangleTraits, {
          east: 0,
          west: 0,
          north: 0,
          south: 0
        })
      );
      const promoteToTop = spyOn(terria.timelineStack, "promoteToTop");
      await cesium.zoomTo(targetItem, 0);
      expect(promoteToTop).toHaveBeenCalledWith(targetItem);
    });
  });

  it("calls `notifyRepaintRequired` before and after zooming (to wake up a paused renderer)", async function () {
    const spy = spyOn(cesium, "notifyRepaintRequired").and.callThrough();
    await cesium.zoomTo(Rectangle.fromDegrees(30.0, 10.0, 40.0, 20.0), 0);
    expect(spy.calls.count()).toBeGreaterThanOrEqual(2);
  });

  describe("when called successively", function () {
    it("always zooms to the last item irrespective of which item resolves last", async function () {
      const ds1 = new CustomDataSource("ds1");
      ds1.isLoading = true;
      ds1.entities.add({
        rectangle: {
          coordinates: Rectangle.fromDegrees(30.0, 10.0, 40.0, 20.0)
        }
      });

      const item1 = new ZoomableCatalogItem("item1", terria);
      item1.mapItems = [ds1];

      const ds2 = new CustomDataSource("ds2");
      ds2.isLoading = true;
      ds2.entities.add({
        rectangle: {
          coordinates: Rectangle.fromDegrees(70.0, 50.0, 80.0, 60.0)
        }
      });

      const item2 = new ZoomableCatalogItem("item2", terria);
      item2.mapItems = [ds2];

      await terria.workbench.add([item1, item2]);

      const zoomPromise = Promise.all([
        cesium.zoomTo(item1, 0),
        cesium.zoomTo(item2, 0)
      ]);
      ds2.loadingEvent.raiseEvent(); // resolve first
      setTimeout(() => ds1.loadingEvent.raiseEvent(), 0.0000001); // resolve last

      await zoomPromise;

      // Assert that resulting zoom is for `item2` (last called) even though
      // `item1` was the last to resolve. That means `zoomTo` should bail out
      // if it detects that another call has been made to it.
      expect(
        CesiumMath.toDegrees(camera.positionCartographic.longitude)
      ).toBeCloseTo(75.4259);
      expect(
        CesiumMath.toDegrees(camera.positionCartographic.latitude)
      ).toBeCloseTo(43.4188);
    });
  });
});

class ZoomableCatalogItem extends MappableMixin(CreateModel(MappableTraits)) {
  mapItems: MapItem[] = [];
  async forceLoadMapItems() {}
}

function cartographicDegrees(cartographic: Cartographic) {
  return {
    longitude: CesiumMath.toDegrees(cartographic.longitude),
    latitude: CesiumMath.toDegrees(cartographic.latitude),
    height: cartographic.height
  };
}
