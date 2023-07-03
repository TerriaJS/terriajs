import L from "leaflet";
import Leaflet from "../../lib/Models/Leaflet";
import Terria from "../../lib/Models/Terria";
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
    terriaViewer = terria.mainViewer;
    container = document.createElement("div");
    container.id = "container";
    container.style.width = "1410px";
    container.style.height = "670px";
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
    leaflet.destroy();
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
    const el = document.createElement("img");
    layers[0]._tiles = {
      1: { loaded: undefined, el },
      2: { loaded: undefined, el },
      a: { loaded: +new Date(), el }, // This is how Leaflet marks loaded tiles
      b: { loaded: undefined, el }
    };
    layers[1]._tiles = {
      3: { loaded: +new Date(), el },
      4: { loaded: undefined, el },
      c: { loaded: +new Date(), el },
      d: { loaded: undefined, el }
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
      const el = document.createElement("img");
      for (var i = 0; i < count; i++) {
        tiles["tile " + i] = { loaded: undefined, el };
      }
      layers[0]._tiles = tiles;
      layers[1]._tiles = {};
      layers[0].fire("tileload");
    }
  });
});
