import range from "lodash-es/range";
import { action, computed, observable, runInAction } from "mobx";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import EllipsoidTerrainProvider from "terriajs-cesium/Source/Core/EllipsoidTerrainProvider";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import GeoJsonDataSource from "terriajs-cesium/Source/DataSources/GeoJsonDataSource";
import Cesium3DTileset from "terriajs-cesium/Source/Scene/Cesium3DTileset";
import Scene from "terriajs-cesium/Source/Scene/Scene";
import WebMapServiceImageryProvider from "terriajs-cesium/Source/Scene/WebMapServiceImageryProvider";
import filterOutUndefined from "../../lib/Core/filterOutUndefined";
import runLater from "../../lib/Core/runLater";
import MappableMixin from "../../lib/ModelMixins/MappableMixin";
import CesiumTerrainCatalogItem from "../../lib/Models/Catalog/CatalogItems/CesiumTerrainCatalogItem";
import CatalogMemberFactory from "../../lib/Models/Catalog/CatalogMemberFactory";
import WebMapServiceCatalogItem from "../../lib/Models/Catalog/Ows/WebMapServiceCatalogItem";
import Cesium from "../../lib/Models/Cesium";
import CommonStrata from "../../lib/Models/Definition/CommonStrata";
import CreateModel from "../../lib/Models/Definition/CreateModel";
import createStratumInstance from "../../lib/Models/Definition/createStratumInstance";
import upsertModelFromJson from "../../lib/Models/Definition/upsertModelFromJson";
import Terria from "../../lib/Models/Terria";
import MappableTraits, {
  RectangleTraits
} from "../../lib/Traits/TraitsClasses/MappableTraits";
import TerriaViewer from "../../lib/ViewModels/TerriaViewer";
import CesiumTerrainProvider from "terriajs-cesium/Source/Core/CesiumTerrainProvider";

const supportsWebGL = require("../../lib/Core/supportsWebGL");

const describeIfSupported = supportsWebGL() ? describe : xdescribe;

describeIfSupported("Cesium Model", function () {
  let terria: Terria;
  let terriaViewer: TerriaViewer;
  let container: HTMLElement;
  let cesium: Cesium;
  let terriaProgressEvt: jasmine.Spy;

  beforeEach(function () {
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

  afterEach(function () {
    cesium.destroy();
    document.body.removeChild(container);
  });

  it("should trigger terria.tileLoadProgressEvent on globe tileLoadProgressEvent", function () {
    cesium.scene.globe.tileLoadProgressEvent.raiseEvent(3);

    expect(terriaProgressEvt).toHaveBeenCalledWith(3, 3);
  });

  it("should retain the maximum length of tiles to be loaded", function () {
    cesium.scene.globe.tileLoadProgressEvent.raiseEvent(3);
    cesium.scene.globe.tileLoadProgressEvent.raiseEvent(7);
    cesium.scene.globe.tileLoadProgressEvent.raiseEvent(4);
    cesium.scene.globe.tileLoadProgressEvent.raiseEvent(2);

    expect(terriaProgressEvt).toHaveBeenCalledWith(2, 7);
  });

  it("should reset maximum length when the number of tiles to be loaded reaches 0", function () {
    cesium.scene.globe.tileLoadProgressEvent.raiseEvent(3);
    cesium.scene.globe.tileLoadProgressEvent.raiseEvent(7);
    cesium.scene.globe.tileLoadProgressEvent.raiseEvent(4);
    cesium.scene.globe.tileLoadProgressEvent.raiseEvent(0);

    expect(terriaProgressEvt.calls.mostRecent().args).toEqual([0, 0]);

    cesium.scene.globe.tileLoadProgressEvent.raiseEvent(2);

    expect(terriaProgressEvt.calls.mostRecent().args).toEqual([2, 2]);
  });

  describe("zoomTo", function () {
    let initialCameraPosition: Cartesian3;

    beforeEach(function () {
      initialCameraPosition = cesium.scene.camera.position.clone();
    });

    it("can zoomTo a rectangle", async function () {
      const [west, south, east, north] = [0, 0, 0, 0];
      await cesium.zoomTo(Rectangle.fromDegrees(west, south, east, north), 0);
      expect(initialCameraPosition.equals(cesium.scene.camera.position)).toBe(
        false
      );
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
  });

  it("correctly removes all the primitives from the scene when they are removed from the viewer", async function () {
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
        range(cesium.scene.primitives.length).map((i) => {
          const prim = cesium.scene.primitives.get(i);
          return prim.allTilesLoaded && prim._url;
        })
      );

    // Return names of all datasources in the scene
    const dataSourceNames = () =>
      range(cesium.dataSources.length).map(
        (i) => cesium.dataSources.get(i).name
      );

    // Return urls of all imagery providers in the scene
    const imageryProviderUrls = () =>
      range(cesium.scene.imageryLayers.length)
        .map(
          (i) => (cesium.scene.imageryLayers.get(i).imageryProvider as any).url
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

  describe("Terrain provider selection", function () {
    let workbenchTerrainItem: CesiumTerrainCatalogItem;
    let scene: Scene;

    beforeEach(
      action(async function () {
        // We need a cesium instance bound to terria.mainViewer for workbench
        // changes to be reflected in these specs
        cesium = new Cesium(terria.mainViewer, container);
        scene = cesium.scene;
        cesium.terriaViewer.viewerOptions.useTerrain = true;
        terria.configParameters.cesiumTerrainAssetId = 123;
        terria.configParameters.cesiumTerrainUrl =
          "https://cesium-terrain.example.com/";
        terria.configParameters.useCesiumIonTerrain = true;

        workbenchTerrainItem = upsertModelFromJson(
          CatalogMemberFactory,
          terria,
          "",
          CommonStrata.user,
          {
            id: "local-terrain",
            type: "cesium-terrain",
            name: "Local terrain",
            url: "http://local-terrain.example.com"
          },
          { addModelToTerria: true }
        ).throwIfUndefined() as CesiumTerrainCatalogItem;
        spyOn(
          workbenchTerrainItem as any,
          "loadTerrainProvider"
        ).and.returnValue(
          Promise.resolve(new CesiumTerrainProvider({ url: "some/url" }))
        );
        await terria.workbench.add(workbenchTerrainItem);
      })
    );

    it("should use Elliposidal/3d-smooth terrain when `useTerrain` is `false`", function () {
      expect(scene.terrainProvider instanceof EllipsoidTerrainProvider).toBe(
        false
      );
      runInAction(() => {
        cesium.terriaViewer.viewerOptions.useTerrain = false;
      });
      expect(scene.terrainProvider instanceof EllipsoidTerrainProvider).toBe(
        true
      );
    });

    it(
      "should otherwise use the first terrain provider from the workbench or overlay",
      action(async function () {
        expect(scene.terrainProvider).toBe(workbenchTerrainItem.mapItems[0]);
      })
    );

    it("should otherwise use the ION terrain specified by configParameters.cesiumTerrainAssetId", function () {
      const createSpy = spyOn(
        cesium as any,
        "createTerrainProviderFromIonAssetId"
      ).and.callThrough();
      runInAction(() => terria.workbench.removeAll());

      expect(createSpy).toHaveBeenCalledTimes(1);
      const ionAssetTerrainProvider = createSpy.calls.mostRecent().returnValue;
      expect(scene.terrainProvider).toEqual(ionAssetTerrainProvider);
    });

    it("should otherwise use the terrain specified by configParameters.cesiumTerrainUrl", function () {
      const createSpy = spyOn(
        cesium as any,
        "createTerrainProviderFromUrl"
      ).and.callThrough();

      runInAction(() => {
        terria.workbench.removeAll();
        terria.configParameters.cesiumTerrainAssetId = undefined;
      });

      expect(createSpy).toHaveBeenCalledTimes(1);
      const urlTerrainProvider = createSpy.calls.mostRecent().returnValue;
      expect(scene.terrainProvider).toEqual(urlTerrainProvider);
    });

    it("should otherwise use cesium-world-terrain when `configParameters.useCesiumIonTerrain` is true", function () {
      const createSpy = spyOn(
        cesium as any,
        "createWorldTerrain"
      ).and.callThrough();

      runInAction(() => {
        terria.workbench.removeAll();
        terria.configParameters.cesiumTerrainAssetId = undefined;
        terria.configParameters.cesiumTerrainUrl = undefined;
      });

      expect(terria.configParameters.useCesiumIonTerrain).toBe(true);
      expect(createSpy).toHaveBeenCalledTimes(1);
      const cesiumWorldTerrainProvider =
        createSpy.calls.mostRecent().returnValue;
      expect(scene.terrainProvider).toEqual(cesiumWorldTerrainProvider);
    });

    it("should otherwise fallback to Elliposidal/3d-smooth", function () {
      runInAction(() => {
        terria.workbench.removeAll();
        terria.configParameters.cesiumTerrainAssetId = undefined;
        terria.configParameters.cesiumTerrainUrl = undefined;
        terria.configParameters.useCesiumIonTerrain = false;
      });

      expect(scene.terrainProvider instanceof EllipsoidTerrainProvider).toBe(
        true
      );
    });
  });

  describe("Cesium Terrain Extra Tests", function () {
    // declare different variables here, we need new instances to test because we are changing config values and want to instantiate with these different values
    let terria2: Terria;
    let terriaViewer2: TerriaViewer;
    let container2: HTMLElement;
    let cesium2: Cesium;

    beforeEach(function () {
      terria2 = new Terria({
        baseUrl: "./"
      });
      terriaViewer2 = new TerriaViewer(
        terria2,
        computed(() => [])
      );
      container2 = document.createElement("div");
      container2.id = "container2";
      document.body.appendChild(container2);
    });

    afterEach(function () {
      cesium2?.destroy();
      document.body.removeChild(container2);
    });

    it("should thow a warning when cesiumIonAccessToken is invalid", async function () {
      runInAction(() => {
        // Set an invalid token for the test
        terria2.configParameters.cesiumIonAccessToken = "expired_token";
      });
      // Instantiate Cesium object with the invalid token
      cesium2 = new Cesium(terriaViewer2, container2);

      await cesium2.terrainProvider.readyPromise.catch(() => {});
      // Wait a few ticks to allow for delay in adding event listener to terrainProvider in Cesium.ts
      await runLater(() => {}, 5);

      // We should then get an error about the terrain server
      const currentNotificationTitle =
        typeof terria2.notificationState.currentNotification?.title === "string"
          ? terria2.notificationState.currentNotification?.title
          : terria2.notificationState.currentNotification?.title();

      expect(currentNotificationTitle).toBe(
        "map.cesium.terrainServerErrorTitle"
      );
    });

    it("should revert to 3dSmooth mode when cesiumIonAccessToken is invalid", async function () {
      runInAction(() => {
        // Set an invalid token for the test
        terria2.configParameters.cesiumIonAccessToken = "expired_token";
      });

      // Instantiate Cesium object with the invalid token
      cesium2 = new Cesium(terriaViewer2, container2);

      await cesium2.terrainProvider.readyPromise.catch(() => {});
      // Wait a few ticks to allow for delay in adding event listener to terrainProvider in Cesium.ts
      await runLater(() => {}, 5);

      expect(terriaViewer2.viewerOptions.useTerrain).toBe(false);
      expect(
        cesium2.scene.terrainProvider instanceof EllipsoidTerrainProvider
      ).toBe(true);
    });

    it("should thow a warning when `cesiumIonAccessToken` is invalid and `cesiumTerrainAssetId` is present", async function () {
      runInAction(() => {
        // Set an invalid token for the test
        terria2.configParameters.cesiumIonAccessToken = "expired_token";
        // Set a valid asset id
        terria2.configParameters.cesiumTerrainAssetId = 480278;
      });
      // Instantiate Cesium object with the invalid token and valid asset id
      cesium2 = new Cesium(terriaViewer2, container2);

      await cesium2.terrainProvider.readyPromise.catch(() => {});
      // Wait a few ticks to allow for delay in adding event listener to terrainProvider in Cesium.ts
      await runLater(() => {}, 5);

      // We should then get an error about the terrain server
      const currentNotificationTitle =
        typeof terria2.notificationState.currentNotification?.title === "string"
          ? terria2.notificationState.currentNotification?.title
          : terria2.notificationState.currentNotification?.title();

      expect(currentNotificationTitle).toBe(
        "map.cesium.terrainServerErrorTitle"
      );
    });

    it("should thow a warning when 'cesiumTerrainUrl' is invalid", async function () {
      runInAction(() => {
        terria2.configParameters.cesiumTerrainUrl =
          "https://storage.googleapis.com/vic-datasets-public/xxxxxxx-xxxx-xxxx-xxxx-xxxxxxx/v1"; // An invalid url
      });
      // Instantiate Cesium object with the invalid terrain url
      cesium2 = new Cesium(terriaViewer2, container2);

      await cesium2.terrainProvider.readyPromise.catch(() => {});
      // Wait a few ticks to allow for delay in adding event listener to terrainProvider in Cesium.ts
      await runLater(() => {}, 5);

      // We should then get an error about the terrain server
      const currentNotificationTitle =
        typeof terria2.notificationState.currentNotification?.title === "string"
          ? terria2.notificationState.currentNotification?.title
          : terria2.notificationState.currentNotification?.title();

      expect(currentNotificationTitle).toBe(
        "map.cesium.terrainServerErrorTitle"
      );
    });
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
