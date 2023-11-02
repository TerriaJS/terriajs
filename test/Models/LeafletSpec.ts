import L from "leaflet";
import { computed } from "mobx";
import CustomDataSource from "terriajs-cesium/Source/DataSources/CustomDataSource";
import CommonStrata from "../../lib/Models/Definition/CommonStrata";
import createStratumInstance from "../../lib/Models/Definition/createStratumInstance";
import Leaflet from "../../lib/Models/Leaflet";
import Terria from "../../lib/Models/Terria";
import WebMapServiceCatalogItem from "../../lib/Models/Catalog/Ows/WebMapServiceCatalogItem";
import { RectangleTraits } from "../../lib/Traits/TraitsClasses/MappableTraits";
import TerriaViewer from "../../lib/ViewModels/TerriaViewer";

describe("Leaflet Model", function () {
  let terria: Terria;
  let terriaViewer: TerriaViewer;
  let container: HTMLElement;
  let leaflet: Leaflet;
  // let layers: [L.Layer];
  let layers: any[];
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
    // TODO: calling destroy on our mobx leaflet model results in a tile error
    try {
      leaflet.destroy();
    } catch {}
    document.body.removeChild(container);
  });

  function initLeaflet() {}

  describe("should trigger a tileLoadProgressEvent", function () {
    ["tileloadstart", "tileload", "load"].forEach(function (event) {
      it("on " + event, function () {
        initLeaflet();

        layers[0].fire(event);

        expect(terriaProgressEvt).toHaveBeenCalled();
      });
    });
  });

  it("should be able to reference its container", function () {
    initLeaflet();

    expect(leaflet.getContainer()).toBe(container);
  });

  it("should trigger a tileLoadProgressEvent with the total number of tiles to be loaded for all layers", function () {
    initLeaflet();
    layers[0]._tiles = {
      1: { loaded: undefined },
      2: { loaded: undefined },
      a: { loaded: +new Date() }, // This is how Leaflet marks loaded tiles
      b: { loaded: undefined }
    };
    layers[1]._tiles = {
      3: { loaded: +new Date() },
      4: { loaded: undefined },
      c: { loaded: +new Date() },
      d: { loaded: undefined }
    };

    layers[1].fire("tileload");

    expect(terriaProgressEvt).toHaveBeenCalledWith(5, 5);
  });

  describe("should change the max", function () {
    it("to whatever the highest count of loading tiles so far was", function () {
      initLeaflet();

      changeTileLoadingCount(3);
      changeTileLoadingCount(6);
      changeTileLoadingCount(8);
      changeTileLoadingCount(2);

      expect(terriaProgressEvt.calls.mostRecent().args).toEqual([2, 8]);
    });

    it("to 0 when loading tile count reaches 0", function () {
      initLeaflet();

      changeTileLoadingCount(3);
      changeTileLoadingCount(6);
      changeTileLoadingCount(8);
      changeTileLoadingCount(0);

      expect(terriaProgressEvt.calls.mostRecent().args).toEqual([0, 0]);

      changeTileLoadingCount(3);

      expect(terriaProgressEvt.calls.mostRecent().args).toEqual([3, 3]);
    });

    function changeTileLoadingCount(count: number) {
      var tiles: any = {};
      // Add loading tiles
      for (var i = 0; i < count; i++) {
        tiles["tile " + i] = { loaded: undefined };
      }
      layers[0]._tiles = tiles;
      layers[1]._tiles = {};
      layers[0].fire("tileload");
    }
  });

  describe("zoomTo", function () {
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
  });
});
