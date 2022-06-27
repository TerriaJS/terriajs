import range from "lodash-es/range";
import { computed, observable, runInAction } from "mobx";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import GeoJsonDataSource from "terriajs-cesium/Source/DataSources/GeoJsonDataSource";
import Cesium3DTileset from "terriajs-cesium/Source/Scene/Cesium3DTileset";
import WebMapServiceImageryProvider from "terriajs-cesium/Source/Scene/WebMapServiceImageryProvider";
import filterOutUndefined from "../../lib/Core/filterOutUndefined";
import runLater from "../../lib/Core/runLater";
import MappableMixin from "../../lib/ModelMixins/MappableMixin";
import WebMapServiceCatalogItem from "../../lib/Models/Catalog/Ows/WebMapServiceCatalogItem";
import Cesium from "../../lib/Models/Cesium";
import CommonStrata from "../../lib/Models/Definition/CommonStrata";
import CreateModel from "../../lib/Models/Definition/CreateModel";
import createStratumInstance from "../../lib/Models/Definition/createStratumInstance";
import Terria from "../../lib/Models/Terria";
import MappableTraits, {
  RectangleTraits
} from "../../lib/Traits/TraitsClasses/MappableTraits";
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

  describe("zoomTo", function() {
    let initialCameraPosition: Cartesian3;

    beforeEach(function() {
      initialCameraPosition = cesium.scene.camera.position.clone();
    });

    it("can zoomTo a rectangle", async function() {
      const [west, south, east, north] = [0, 0, 0, 0];
      await cesium.zoomTo(Rectangle.fromDegrees(west, south, east, north), 0);
      expect(initialCameraPosition.equals(cesium.scene.camera.position)).toBe(
        false
      );
    });

    describe("if the target is a TimeVarying item", function() {
      it("sets the target item as the timeline source", async function() {
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
  });

  it("correctly removes all the primitives from the scene when they are removed from the viewer", async function() {
    const items = observable([
      new MappablePrimitiveItem("1", terria),
      new MappablePrimitiveItem("2", terria),
      new MappablePrimitiveItem("3", terria)
    ]);
    container = document.createElement("div");
    container.id = "cesium-test-container";
    document.body.appendChild(container);

    const cesium = new Cesium(
      new TerriaViewer(
        terria,
        computed(() => items)
      ),
      container
    );

    // Return urls of all tilesets in the scene
    const tilesetUrls = () =>
      filterOutUndefined(
        range(cesium.scene.primitives.length).map(i => {
          const prim = cesium.scene.primitives.get(i);
          return prim.allTilesLoaded && prim._url;
        })
      );

    // Return names of all datasources in the scene
    const dataSourceNames = () =>
      range(cesium.dataSources.length).map(i => cesium.dataSources.get(i).name);

    // Return urls of all imagery providers in the scene
    const imageryProviderUrls = () =>
      range(cesium.scene.imageryLayers.length)
        .map(
          i => (cesium.scene.imageryLayers.get(i).imageryProvider as any).url
        )
        .reverse();

    await runLater(() => {});

    // Test that we have added the correct items
    expect(dataSourceNames()).toEqual(["ds1", "ds2", "ds3"]);
    expect(tilesetUrls()).toEqual(["prim1", "prim2", "prim3"]);
    expect(imageryProviderUrls()).toEqual(["img1", "img2", "img3"]);

    runInAction(() => items.splice(0, 2));
    await runLater(() => {});

    // Test that we have removed the correct items
    expect(dataSourceNames()).toEqual(["ds3"]);
    expect(tilesetUrls()).toEqual(["prim3"]);
    expect(imageryProviderUrls()).toEqual(["img3"]);
  });
});

/**
 * A mappable test class that generates tileset, datasource & imagery layer map
 * items.
 */
class MappablePrimitiveItem extends MappableMixin(CreateModel(MappableTraits)) {
  async forceLoadMapItems() {}

  get mapItems() {
    return [
      new Cesium3DTileset({ url: `prim${this.uniqueId}` }),
      new GeoJsonDataSource(`ds${this.uniqueId}`),
      {
        alpha: 1,
        imageryProvider: new WebMapServiceImageryProvider({
          url: `img${this.uniqueId}`,
          layers: this.uniqueId!
        }),
        show: true,
        clippingRectangle: undefined
      }
    ];
  }
}
