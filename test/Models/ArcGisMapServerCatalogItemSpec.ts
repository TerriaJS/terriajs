import { configure, runInAction } from "mobx";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import WebMercatorTilingScheme from "terriajs-cesium/Source/Core/WebMercatorTilingScheme";
import ArcGisMapServerImageryProvider from "terriajs-cesium/Source/Scene/ArcGisMapServerImageryProvider";
import when from "terriajs-cesium/Source/ThirdParty/when";
import isDefined from "../../lib/Core/isDefined";
import _loadWithXhr from "../../lib/Core/loadWithXhr";
import ArcGisMapServerCatalogItem from "../../lib/Models/ArcGisMapServerCatalogItem";
import Terria from "../../lib/Models/Terria";
import { RectangleTraits } from "../../lib/Traits/MappableTraits";

configure({
  enforceActions: "observed",
  computedRequiresReaction: true
});

interface ExtendedLoadWithXhr {
  (): any;
  load: { (...args: any[]): any; calls: any };
}

const loadWithXhr: ExtendedLoadWithXhr = <any>_loadWithXhr;

describe("ArcGisMapServerCatalogItem", function() {
  const mapServerUrl =
    "http://www.example.com/Dynamic_National_Map_Hydrography_and_Marine/MapServer";
  const singleLayerUrl = mapServerUrl + "/31";

  let item: ArcGisMapServerCatalogItem;

  beforeEach(function() {
    item = new ArcGisMapServerCatalogItem("test", new Terria());
    const realLoadWithXhr = loadWithXhr.load;
    // We replace calls to GA's servers with pre-captured JSON files so our testing is isolated, but reflects real data.
    spyOn(loadWithXhr, "load").and.callFake(function(...args: any[]) {
      let url = args[0];
      url = url.replace("http://example.com/42/", "");
      if (url.match("Dynamic_National_Map_Hydrography_and_Marine/MapServer")) {
        url = url.replace(/^.*\/MapServer/, "MapServer");
        url = url.replace(/MapServer\/?\?.*/i, "mapserver.json");
        url = url.replace(/MapServer\/Legend\/?\?.*/i, "legend.json");
        url = url.replace(/MapServer\/Layers\/?\?.*/i, "layers.json");
        url = url.replace(/MapServer\/31\/?\?.*/i, "31.json");
        args[0] =
          "test/ArcGisMapServer/Dynamic_National_Map_Hydrography_and_Marine/" +
          url;
      } else if (url.match("/token")) {
        args[0] =
          "test/ArcGisMapServer/Dynamic_National_Map_Hydrography_and_Marine/token.json";
        args[1] = "text";
        args[2] = "GET";
        args[3] = undefined;
        return realLoadWithXhr(...args);
      }

      return realLoadWithXhr(...args);
    });
  });

  it("has a type and type name", function() {
    expect(ArcGisMapServerCatalogItem.type).toBe("esri-mapServer");
    expect(item.typeName).toBe("Esri ArcGIS MapServer");
  });

  it("supports splitting", function() {
    expect(item.supportsSplitting).toBeTruthy();
  });

  it("supports zooming to extent", function() {
    expect(item.canZoomTo).toBeTruthy();
  });

  it("supports preview", function() {
    expect(item.showsInfo).toBeTruthy();
  });

  describe("loadMapItems", function() {
    it("can load all layers", async function() {
      runInAction(() => {
        item = new ArcGisMapServerCatalogItem("test", new Terria());
        item.setTrait("definition", "url", mapServerUrl);
      });
      await item.loadMapItems();
      expect(item.allSelectedLayers.length).toBe(74);
    });

    it("can load specific layers", async function() {
      runInAction(() => {
        item = new ArcGisMapServerCatalogItem("test", new Terria());
        item.setTrait("definition", "url", mapServerUrl);
        item.setTrait("definition", "layers", "31,32");
      });
      await item.loadMapItems();
      expect(item.allSelectedLayers.length).toBe(2);
    });

    it("can load a single layer given in the URL", async function() {
      runInAction(() => {
        item = new ArcGisMapServerCatalogItem("test", new Terria());
        item.setTrait("definition", "url", singleLayerUrl);
      });
      await item.loadMapItems();
      expect(item.allSelectedLayers.length).toBe(1);
      expect(item.layers).toBe("31");
    });

    describe("when tokenUrl is set", function() {
      beforeEach(() => {
        runInAction(() => {
          item = new ArcGisMapServerCatalogItem("test", new Terria());
          item.setTrait("definition", "url", singleLayerUrl);
          item.setTrait("definition", "tokenUrl", "http://example.com/token");
        });
      });

      it("fetches the token", async function() {
        await item.loadMapItems();
        expect(loadWithXhr.load.calls.argsFor(0)[0]).toBe(
          "http://example.com/token"
        );
      });

      it("adds the token to subsequent requests", async function() {
        await item.loadMapItems();
        const tokenre = /token=fakeToken/;
        expect(tokenre.test(loadWithXhr.load.calls.argsFor(1)[0])).toBeTruthy();
        expect(tokenre.test(loadWithXhr.load.calls.argsFor(2)[0])).toBeTruthy();
        expect(tokenre.test(loadWithXhr.load.calls.argsFor(3)[0])).toBeTruthy();
      });

      it("passess the token to the imageryProvider", async function() {
        await item.loadMapItems();
        const imageryProvider = item.mapItems[0].imageryProvider;
        expect(imageryProvider.token).toBe("fakeToken");
      });
    });
  });

  describe("after loading", function() {
    beforeEach(async function() {
      runInAction(() => {
        item = new ArcGisMapServerCatalogItem("test", new Terria());
        item.setTrait("definition", "url", mapServerUrl);
      });
      await item.loadMapItems();
    });

    it("returns exactly one mapItems", function() {
      expect(item.mapItems.length).toBe(1);
    });

    describe("the mapItem", function() {
      it("correctly sets `alpha`", function() {
        runInAction(() => item.setTrait("definition", "opacity", 0.42));
        expect(item.mapItems[0].alpha).toBe(0.42);
      });

      it("correctly sets `show`", function() {
        runInAction(() => item.setTrait("definition", "show", false));
        expect(item.mapItems[0].show).toBe(false);
      });

      describe("imageryProvider", function() {
        let imageryProvider: ArcGisMapServerImageryProvider;

        beforeEach(function() {
          runInAction(() => {
            item.setTrait("definition", "layers", "31");
            item.setTrait("definition", "parameters", { foo: "bar" });
            item.setTrait("definition", "maximumScaleBeforeMessage", 1);
          });

          imageryProvider = item.mapItems[0].imageryProvider;
        });

        it("should be an ArcGisMapServerImageryProvider", function() {
          expect(
            imageryProvider instanceof ArcGisMapServerImageryProvider
          ).toBeTruthy();
        });

        it("sets the URL correctly", function() {
          expect(imageryProvider.url).toBe(mapServerUrl + "/");
        });

        it("sets the layers correctly", function() {
          expect(imageryProvider.layers).toBe("31");
        });

        it("tilingScheme should be a WebMercatorTilingScheme", function() {
          expect(
            imageryProvider.tilingScheme instanceof WebMercatorTilingScheme
          ).toBeTruthy();
        });

        it("sets the maximumLevel", function() {
          expect(imageryProvider.maximumLevel).toBe(13);
        });

        it("passes on request parameters", function() {
          expect(imageryProvider.parameters).toEqual(item.parameters);
        });

        it("correctly sets enablePickFeatures", function() {
          expect(imageryProvider.enablePickFeatures).toBe(true);
        });

        it("raise an error if requested level is above maximumScaleBeforeMessage", function() {
          spyOn(item.terria.error, "raiseEvent");
          imageryProvider.requestImage(0, 0, 100);
          expect(item.terria.error.raiseEvent).toHaveBeenCalled();
        });
      });
    });

    it("defines the dataCustodian", function() {
      expect(item.dataCustodian).toBe("Geoscience Australia");
    });

    it("defines a rectangle", function() {
      expect(item.rectangle).toBeDefined();
      if (item.rectangle) {
        expect(rectangleFromTraits(item.rectangle)).toEqual(
          new Rectangle(
            1.7088098606747266,
            -0.946999399137436,
            2.919623350055036,
            0.017166897952326066
          )
        );
      }
    });

    it("defines info", function() {
      expect(item.info.map(({ name }) => name)).toEqual([
        "Data Description",
        "Service Description",
        "Copyright Text"
      ]);
    });

    it("defines legends", function() {
      expect(item.legends).toBeDefined();
      if (isDefined(item.legends)) {
        expect(item.legends.length).toBe(1);
        if (isDefined(item.legends[0].items)) {
          expect(item.legends[0].items.length).toBe(30);
        }
      }
    });
  });
});

function rectangleFromTraits({ west, south, east, north }: RectangleTraits) {
  return new Rectangle(west, south, east, north);
}
