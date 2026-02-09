import range from "lodash-es/range";
import {
  IObservableValue,
  action,
  computed,
  observable,
  runInAction,
  when
} from "mobx";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import CesiumTerrainProvider from "terriajs-cesium/Source/Core/CesiumTerrainProvider";
import EllipsoidTerrainProvider from "terriajs-cesium/Source/Core/EllipsoidTerrainProvider";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import Cesium3DTileset from "terriajs-cesium/Source/Scene/Cesium3DTileset";
import PrimitiveCollection from "terriajs-cesium/Source/Scene/PrimitiveCollection";
import Scene from "terriajs-cesium/Source/Scene/Scene";
import filterOutUndefined from "../../lib/Core/filterOutUndefined";
import runLater from "../../lib/Core/runLater";
import supportsWebGL from "../../lib/Core/supportsWebGL";
import MappableMixin from "../../lib/ModelMixins/MappableMixin";
import CameraView from "../../lib/Models/CameraView";
import Cesium3DTilesCatalogItem from "../../lib/Models/Catalog/CatalogItems/Cesium3DTilesCatalogItem";
import CesiumTerrainCatalogItem from "../../lib/Models/Catalog/CatalogItems/CesiumTerrainCatalogItem";
import GeoJsonCatalogItem from "../../lib/Models/Catalog/CatalogItems/GeoJsonCatalogItem";
import CatalogMemberFactory from "../../lib/Models/Catalog/CatalogMemberFactory";
import WebMapServiceCatalogItem from "../../lib/Models/Catalog/Ows/WebMapServiceCatalogItem";
import Cesium from "../../lib/Models/Cesium";
import CommonStrata from "../../lib/Models/Definition/CommonStrata";
import createStratumInstance from "../../lib/Models/Definition/createStratumInstance";
import updateModelFromJson from "../../lib/Models/Definition/updateModelFromJson";
import upsertModelFromJson from "../../lib/Models/Definition/upsertModelFromJson";
import Terria from "../../lib/Models/Terria";
import { RectangleTraits } from "../../lib/Traits/TraitsClasses/MappableTraits";
import TerriaViewer from "../../lib/ViewModels/TerriaViewer";

const describeIfSupported = supportsWebGL() ? describe : xdescribe;

describeIfSupported("Cesium Model", function () {
  let terria: Terria;
  let terriaViewer: TerriaViewer;
  let container: HTMLElement;
  let cesium: Cesium;
  let terriaProgressEvt: jasmine.Spy;
  let viewerItems: IObservableValue<MappableMixin.Instance[]>;

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "../"
    });

    // Use an observable box so that we can dynamically change the viewer items
    // from specs
    viewerItems = observable.box([]);
    terriaViewer = new TerriaViewer(
      terria,
      computed(() => viewerItems.get())
    );
    container = document.createElement("div");
    container.id = "container";
    document.body.appendChild(container);

    terriaProgressEvt = spyOn(terria.tileLoadProgressEvent, "raiseEvent");

    cesium = new Cesium(terriaViewer, container);

    // TODO: some specs results in calls to ION api for fetching terrain which
    // we should avoid. Ideally we do this after splitting terrain handling
    // into a separate TerrainManager class
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

  describe("adding and removing viewer items", function () {
    function create3dTilesCatalogItem(id: number) {
      const item = new Cesium3DTilesCatalogItem(`tileset-${id}`, terria);
      updateModelFromJson(item, CommonStrata.definition, {
        id: `tileset-${id}`,
        url: `test/Cesium3DTiles/tileset.json?id=${id}`,
        drapeImagery: true
      });
      return item;
    }

    function createImageryItem(id: number) {
      const item = new WebMapServiceCatalogItem(`wms-${id}`, terria);
      updateModelFromJson(item, CommonStrata.definition, {
        id: `wms-${id}`,
        url: `wms-${id}`
      });
      return item;
    }

    function createDataSourceItem(id: number) {
      const item = new GeoJsonCatalogItem(`geojson-${id}`, terria);
      updateModelFromJson(item, CommonStrata.definition, {
        geoJsonData: {
          type: "Feature",
          properties: {
            nameProp: `ds-${id}`
          },
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [145.0130295753479, -37.77042639061412],
                [145.0200891494751, -37.77042639061412],
                [145.0200891494751, -37.76543949054887],
                [145.0130295753479, -37.76543949054887],
                [145.0130295753479, -37.77042639061412]
              ]
            ]
          }
        },
        forceCesiumPrimitives: true
      });
      return item;
    }

    function loadItems(items: MappableMixin.Instance[]) {
      return Promise.all(items.map((it) => it.loadMapItems().then(() => it)));
    }

    it("correctly removes all the primitives, imageries and datasources from the scene when they are removed from the viewer", async function () {
      let items = await loadItems([
        create3dTilesCatalogItem(0),
        createImageryItem(0),
        createDataSourceItem(0),

        create3dTilesCatalogItem(1),
        createImageryItem(1),
        createDataSourceItem(1),

        create3dTilesCatalogItem(2),
        createImageryItem(2),
        createDataSourceItem(2)
      ]);

      runInAction(() => {
        viewerItems.set(items);
      });

      // Return urls of all tilesets in the scene
      const tilesetUrls = () => {
        const terriaPrimitives: PrimitiveCollection =
          cesium.scene.primitives.get(0);
        return filterOutUndefined(
          range(terriaPrimitives.length).map((i) => {
            const prim = terriaPrimitives.get(i);
            return prim.allTilesLoaded && prim._url;
          })
        );
      };

      // Return names of all datasources in the scene
      const dataSourceNames = () =>
        range(cesium.dataSources.length).map((i) => {
          const ds = cesium.dataSources.get(i);
          const name = ds.entities.values[0].properties?.getValue().nameProp;
          return name;
        });

      // Return urls of all imagery providers in the scene
      const imageryProviderUrls = () =>
        range(cesium.scene.imageryLayers.length)
          .map(
            (i) =>
              (cesium.scene.imageryLayers.get(i).imageryProvider as any).url
          )
          .reverse();

      // Need await here for the datasources reaction to sync
      await runLater(() => {});

      // Test that we have added the correct items
      expect(dataSourceNames()).toEqual(["ds-0", "ds-1", "ds-2"]);
      expect(tilesetUrls()).toEqual([
        "test/Cesium3DTiles/tileset.json?id=0",
        "test/Cesium3DTiles/tileset.json?id=1",
        "test/Cesium3DTiles/tileset.json?id=2"
      ]);
      expect(imageryProviderUrls()).toEqual(["wms-0", "wms-1", "wms-2"]);

      runInAction(() => {
        // Remove all except middle 3 items
        items = items.slice(3, 6);
        viewerItems.set(items);
      });

      // Need await here for the datasources reaction to sync
      await runLater(() => {});

      // Test that we have removed the correct items
      expect(dataSourceNames()).toEqual(["ds-1"]);
      expect(tilesetUrls()).toEqual(["test/Cesium3DTiles/tileset.json?id=1"]);
      expect(imageryProviderUrls()).toEqual(["wms-1"]);
    });

    describe("tilesets with imagery draping enabled", function () {
      let items: MappableMixin.Instance[];

      beforeEach(async function () {
        items = await loadItems([
          create3dTilesCatalogItem(0),
          createImageryItem(1),
          create3dTilesCatalogItem(2),
          createImageryItem(3),
          create3dTilesCatalogItem(4)
        ]);
        runInAction(() => viewerItems.set(items));
      });

      it("must add the imageries that are placed above a tileset to the tileset's own imagery collection", function () {
        const tileset0 = items[0].mapItems[0] as Cesium3DTileset;
        const tileset1 = items[2].mapItems[0] as Cesium3DTileset;
        const tileset2 = items[4].mapItems[0] as Cesium3DTileset;

        expect(tileset0.imageryLayers.length).toBe(0);
        expect(tileset1.imageryLayers.length).toBe(1);
        expect(tileset2.imageryLayers.length).toBe(2);

        // Make sure tileset1 and tileset2 have 1 and 2 layers respectively added
        // to their imageryLayer collection
        expect((tileset1.imageryLayers.get(0).imageryProvider as any).url).toBe(
          `wms-1`
        );

        // Note that this reflects the ordering of Cesium imagery collection, the
        // layer with lowest index will appear at the bottom.
        expect((tileset2.imageryLayers.get(0).imageryProvider as any).url).toBe(
          `wms-3`
        );

        expect((tileset2.imageryLayers.get(1).imageryProvider as any).url).toBe(
          `wms-1`
        );
      });

      it("must remove items from a tilesets imagery collection when they are removed from the viewer", function () {
        // Remove the last WMS imagery item
        items.splice(3, 1);
        runInAction(() => viewerItems.set(items));

        const tileset0 = items[0].mapItems[0] as Cesium3DTileset;
        const tileset1 = items[2].mapItems[0] as Cesium3DTileset;
        const tileset2 = items[3].mapItems[0] as Cesium3DTileset;

        expect(tileset0.imageryLayers.length).toBe(0);
        expect(tileset1.imageryLayers.length).toBe(1);
        expect(tileset2.imageryLayers.length).toBe(1);

        // Make sure tileset1 and tileset2 have 1 and 2 layers respectively added
        // to their imageryLayer collection
        expect((tileset1.imageryLayers.get(0).imageryProvider as any).url).toBe(
          `wms-1`
        );

        expect((tileset2.imageryLayers.get(0).imageryProvider as any).url).toBe(
          `wms-1`
        );
      });
    });
  });

  describe("Terrain provider selection", function () {
    let workbenchTerrainItem: CesiumTerrainCatalogItem;
    let scene: Scene;

    beforeEach(
      action(async function () {
        // We need a cesium instance bound to terria.mainViewer for workbench
        // changes to be reflected in these specs
        cesium.destroy();
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
        ).and.returnValue(new CesiumTerrainProvider());
        (await terria.workbench.add(workbenchTerrainItem)).throwIfError();
      })
    );

    it("should use Elliposidal/3d-smooth terrain when `useTerrain` is `false`", async function () {
      runInAction(() => {
        cesium.terriaViewer.viewerOptions.useTerrain = false;
      });
      await terrainLoadPromise(cesium);
      expect(scene.terrainProvider instanceof EllipsoidTerrainProvider).toBe(
        true
      );
    });

    it(
      "should otherwise use the first terrain provider from the workbench or overlay",
      action(async function () {
        runInAction(() => {
          cesium.terriaViewer.viewerOptions.useTerrain = true;
        });
        await terrainLoadPromise(cesium);
        expect(scene.terrainProvider).toBe(workbenchTerrainItem.mapItems[0]);
      })
    );

    it("should otherwise use the ION terrain specified by configParameters.cesiumTerrainAssetId", async function () {
      const fakeIonTerrainProvider = new CesiumTerrainProvider();
      const createSpy = spyOn(
        cesium as any,
        "createTerrainProviderFromIonAssetId"
      ).and.returnValue(Promise.resolve(fakeIonTerrainProvider));

      runInAction(() => {
        cesium.terriaViewer.viewerOptions.useTerrain = true;
        terria.workbench.removeAll();
      });

      await terrainLoadPromise(cesium);

      expect(createSpy).toHaveBeenCalledTimes(1);
      expect(scene.terrainProvider).toEqual(fakeIonTerrainProvider);
    });

    it("should otherwise use the terrain specified by configParameters.cesiumTerrainUrl", async function () {
      const fakeUrlTerrainProvider = new CesiumTerrainProvider();
      const createSpy = spyOn(
        cesium as any,
        "createTerrainProviderFromUrl"
      ).and.returnValue(Promise.resolve(fakeUrlTerrainProvider));

      runInAction(() => {
        cesium.terriaViewer.viewerOptions.useTerrain = true;
        terria.workbench.removeAll();
        terria.configParameters.cesiumTerrainAssetId = undefined;
      });

      await terrainLoadPromise(cesium);
      expect(createSpy).toHaveBeenCalledTimes(1);
      expect(scene.terrainProvider).toEqual(fakeUrlTerrainProvider);
    });

    it("should otherwise use cesium-world-terrain when `configParameters.useCesiumIonTerrain` is true", async function () {
      const fakeCesiumWorldTerrainProvider = new CesiumTerrainProvider();
      const createSpy = spyOn(
        cesium as any,
        "createWorldTerrain"
      ).and.returnValue(Promise.resolve(fakeCesiumWorldTerrainProvider));

      runInAction(() => {
        cesium.terriaViewer.viewerOptions.useTerrain = true;
        terria.workbench.removeAll();
        terria.configParameters.cesiumTerrainAssetId = undefined;
        terria.configParameters.cesiumTerrainUrl = undefined;
      });

      await terrainLoadPromise(cesium);
      expect(terria.configParameters.useCesiumIonTerrain).toBe(true);
      expect(createSpy).toHaveBeenCalledTimes(1);
      expect(scene.terrainProvider).toEqual(fakeCesiumWorldTerrainProvider);
    });

    it("should otherwise fallback to Elliposidal/3d-smooth", async function () {
      runInAction(() => {
        cesium.terriaViewer.viewerOptions.useTerrain = true;
        terria.workbench.removeAll();
        terria.configParameters.cesiumTerrainAssetId = undefined;
        terria.configParameters.cesiumTerrainUrl = undefined;
        terria.configParameters.useCesiumIonTerrain = false;
      });

      await terrainLoadPromise(cesium);
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
        baseUrl: "/"
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

    it("should throw a warning when cesiumIonAccessToken is invalid", async function () {
      runInAction(() => {
        // Set an invalid token for the test
        terria2.configParameters.cesiumIonAccessToken = "expired_token";
      });
      // Instantiate Cesium object with the invalid token
      cesium2 = new Cesium(terriaViewer2, container2);

      await terrainLoadPromise(cesium2);

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
      expect(terriaViewer2.viewerOptions.useTerrain).toBe(true, "1");
      runInAction(() => {
        // Set an invalid token for the test
        terria2.configParameters.cesiumIonAccessToken = "expired_token";
      });

      // Instantiate Cesium object with the invalid token
      cesium2 = new Cesium(terriaViewer2, container2);

      await terrainLoadPromise(cesium2);

      expect(terriaViewer2.viewerOptions.useTerrain).toBe(false, "2");
      expect(
        cesium2.scene.terrainProvider instanceof EllipsoidTerrainProvider
      ).toBe(true, "3");
    });

    it("should throw a warning when `cesiumIonAccessToken` is invalid and `cesiumTerrainAssetId` is present", async function () {
      runInAction(() => {
        // Set an invalid token for the test
        terria2.configParameters.cesiumIonAccessToken = "expired_token";
        // Set a valid asset id
        terria2.configParameters.cesiumTerrainAssetId = 480278;
      });
      // Instantiate Cesium object with the invalid token and valid asset id
      cesium2 = new Cesium(terriaViewer2, container2);

      await terrainLoadPromise(cesium2);

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

      await terrainLoadPromise(cesium2);

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

  describe("getCurrentCameraView", function () {
    const rectangleDegrees = ({ west, south, east, north }: Rectangle) => ({
      west: CesiumMath.toDegrees(west),
      south: CesiumMath.toDegrees(south),
      east: CesiumMath.toDegrees(east),
      north: CesiumMath.toDegrees(north)
    });

    it("returns the current camera view", function () {
      const cameraView = cesium.getCurrentCameraView();
      const { west, south, east, north } = rectangleDegrees(
        cameraView.rectangle
      );
      expect(west).toBeCloseTo(-180);
      expect(south).toBeCloseTo(-90);
      expect(east).toBeCloseTo(180);
      expect(north).toBeCloseTo(90);
    });

    describe("when initial camera view is set", function () {
      const viewRectangle = {
        west: 119.04785,
        south: -33.6512,
        east: 156.31347,
        north: -22.83694
      };

      beforeEach(function () {
        const initialView = CameraView.fromJson(viewRectangle);
        cesium.setInitialView(initialView);
      });

      it("returns the initial view", function () {
        const r = rectangleDegrees(cesium.getCurrentCameraView().rectangle);
        expect(r.west).toBe(viewRectangle.west);
        expect(r.south).toBe(viewRectangle.south);
        expect(r.east).toBe(viewRectangle.east);
        expect(r.north).toBe(viewRectangle.north);
      });

      it("returns a new view if the camera view changes", async function () {
        cesium.scene.camera.changed.raiseEvent(1.0);
        const view = cesium.getCurrentCameraView();
        const rectangle = rectangleDegrees(view.rectangle);
        expect(rectangle.west).not.toBe(119.04785);
        expect(rectangle.south).not.toBe(-33.6512);
        expect(rectangle.east).not.toBe(156.31347);
        expect(rectangle.north).not.toBe(-22.83694);
      });
    });
  });
});

/**
 * Returns a promise that fulfills when terrain provider has finished loading.
 */
async function terrainLoadPromise(cesium: Cesium): Promise<void> {
  return when(() => cesium.isTerrainLoading === false);
}
