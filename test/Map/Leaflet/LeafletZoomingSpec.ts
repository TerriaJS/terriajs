import L from "leaflet";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import CustomDataSource from "terriajs-cesium/Source/DataSources/CustomDataSource";
import UrlTemplateImageryProvider from "terriajs-cesium/Source/Scene/UrlTemplateImageryProvider";
import MappableMixin, {
  ImageryParts,
  MapItem
} from "../../../lib/ModelMixins/MappableMixin";
import CameraView from "../../../lib/Models/CameraView";
import WebMapServiceCatalogItem from "../../../lib/Models/Catalog/Ows/WebMapServiceCatalogItem";
import CommonStrata from "../../../lib/Models/Definition/CommonStrata";
import CreateModel from "../../../lib/Models/Definition/CreateModel";
import createStratumInstance from "../../../lib/Models/Definition/createStratumInstance";
import updateModelFromJson from "../../../lib/Models/Definition/updateModelFromJson";
import Leaflet from "../../../lib/Models/Leaflet";
import Terria from "../../../lib/Models/Terria";
import MappableTraits, {
  RectangleTraits
} from "../../../lib/Traits/TraitsClasses/MappableTraits";
import TerriaViewer from "../../../lib/ViewModels/TerriaViewer";

describe("LeafletZooming", function () {
  let terria: Terria;
  let terriaViewer: TerriaViewer;
  let container: HTMLElement;
  let leaflet: Leaflet;
  let layers: any[];

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });
    terriaViewer = terria.mainViewer;
    container = document.createElement("div");
    container.id = "container";
    container.style.width = "1410px";
    container.style.height = "670px";
    document.body.appendChild(container);

    leaflet = new Leaflet(terriaViewer, container);
    layers = [
      new L.TileLayer("http://example.com"),
      new L.TileLayer("http://example.com"),
      // Make sure there's a non-tile layer in there to make sure we're able to handle those.
      new L.ImageOverlay("http://example.com", L.latLngBounds([1, 1], [3, 3]))
    ];

    layers.forEach(function (layer) {
      leaflet.map.addLayer(layer);
    });
  });

  afterEach(function () {
    leaflet.destroy();
    document.body.removeChild(container);
  });

  it("can zoom to a Rectangle", async function () {
    await leaflet.zoomTo(Rectangle.fromDegrees(30.0, 10.0, 40.0, 20.0), 0);
    expect(leaflet.map.getCenter().lng).toBeCloseTo(35.0);
    expect(leaflet.map.getCenter().lat).toBeCloseTo(15.0586);
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
    await leaflet.zoomTo(item, 0);
    expect(leaflet.map.getCenter().lng).toBeCloseTo(35);
    expect(leaflet.map.getCenter().lat).toBeCloseTo(15.0586);
  });

  it("can zoom to a mappable item containing a DataSource mapItem", async function () {
    const dataSource1 = new CustomDataSource();
    dataSource1.entities.add({
      rectangle: {
        coordinates: Rectangle.fromDegrees(30.0, 10.0, 40.0, 20.0)
      }
    });
    const dataSource2 = new CustomDataSource();
    dataSource2.entities.add({
      rectangle: {
        coordinates: Rectangle.fromDegrees(40.0, 20.0, 50.0, 30.0)
      }
    });
    const item = new ZoomableCatalogItem("test-zoom", terria);
    item.mapItems = [dataSource1, dataSource2];
    await terria.workbench.add(item);
    await leaflet.zoomTo(item, 0);
    expect(leaflet.map.getCenter().lng).toBeCloseTo(39.999);
    expect(leaflet.map.getCenter().lat).toBeCloseTo(20.322);
  });

  it("can zoom to a mappable containing an ImageryProvider mapItem", async function () {
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
    await leaflet.zoomTo(item, 0);
    expect(leaflet.map.getCenter().lng).toBeCloseTo(39.999);
    expect(leaflet.map.getCenter().lat).toBeCloseTo(20.322);
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
    await leaflet.zoomTo(item, 0);
    expect(leaflet.map.getCenter().lng).toBeCloseTo(144.998);
    expect(leaflet.map.getCenter().lat).toBeCloseTo(-37.762);
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
    await leaflet.zoomTo(item, 0);
    // Verifies that idealZoom settings has higher priority than rectangle
    updateModelFromJson(item, CommonStrata.user, {
      rectangle: {
        west: 1.0,
        east: 0.0,
        north: 1.0,
        south: 0.0
      }
    });
    expect(leaflet.map.getCenter().lng).toBeCloseTo(144.998);
    expect(leaflet.map.getCenter().lat).toBeCloseTo(-37.762);
  });

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
    await leaflet.zoomTo(items, 0);

    expect(leaflet.map.getCenter().lng).toBeCloseTo(54.999);
    expect(leaflet.map.getCenter().lat).toBeCloseTo(39.262);
  });

  it("can zoom to a CameraView object with only a `rectangle` defined", async function () {
    const rectangle = Rectangle.fromDegrees(30.0, 10.0, 40.0, 20.0);
    const cameraView = new CameraView(rectangle);
    await leaflet.zoomTo(cameraView, 0);
    expect(leaflet.map.getCenter().lng).toBeCloseTo(35);
    expect(leaflet.map.getCenter().lat).toBeCloseTo(15.0586);
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
      spyOn(terria.timelineStack, "promoteToTop");
      await leaflet.zoomTo(targetItem, 0);
      expect(terria.timelineStack.promoteToTop).toHaveBeenCalledWith(
        targetItem
      );
    });
  });

  it("correctly handles bounds that cross the dateline", async function () {
    const rectangle = Rectangle.fromDegrees(40.0, 20.0, 30.0, 10.0);
    const cameraView = new CameraView(rectangle);
    await leaflet.zoomTo(cameraView, 0);
    expect(leaflet.map.getCenter().lng).toBeCloseTo(215);
    expect(leaflet.map.getCenter().lat).toBeCloseTo(15.0586);
  });
});

class ZoomableCatalogItem extends MappableMixin(CreateModel(MappableTraits)) {
  mapItems: MapItem[] = [];
  async forceLoadMapItems() {}
}
