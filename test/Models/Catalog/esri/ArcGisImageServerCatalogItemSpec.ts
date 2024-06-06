import { runInAction } from "mobx";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import WebMercatorTilingScheme from "terriajs-cesium/Source/Core/WebMercatorTilingScheme";
import loadWithXhr from "../../../../lib/Core/loadWithXhr";
import ArcGisImageServerImageryProvider from "../../../../lib/Map/ImageryProvider/ArcGisImageServerImageryProvider";
import ArcGisImageServerCatalogItem from "../../../../lib/Models/Catalog/Esri/ArcGisImageServerCatalogItem";
import CommonStrata from "../../../../lib/Models/Definition/CommonStrata";
import Terria from "../../../../lib/Models/Terria";

const rasterFnImageServer = JSON.stringify(
  require("../../../../wwwroot/test/ArcGisImageServer/rasterFns/imageserver.json")
);

const rasterFnLegend = JSON.stringify(
  require("../../../../wwwroot/test/ArcGisImageServer/rasterFns/legend.json")
);

const timeImageServer = JSON.stringify(
  require("../../../../wwwroot/test/ArcGisImageServer/time/imageserver.json")
);

const timeLegend = JSON.stringify(
  require("../../../../wwwroot/test/ArcGisImageServer/time/legend.json")
);

const tileImageServer = JSON.stringify(
  require("../../../../wwwroot/test/ArcGisImageServer/tile/imageserver.json")
);

const tileLegend = JSON.stringify(
  require("../../../../wwwroot/test/ArcGisImageServer/tile/legend.json")
);

let spyOnLoad: any;

describe("ArcGisImageServer", function () {
  let terria: Terria;
  let imageServerItem: ArcGisImageServerCatalogItem;

  beforeEach(async function () {
    spyOnLoad = spyOn(loadWithXhr as any, "load").and.callThrough();
    jasmine.Ajax.install();
    jasmine.Ajax.stubRequest(/.*/).andCallFunction((r) => {
      console.error(r);
      throw new Error("Unhandled request: " + r.url);
    });

    jasmine.Ajax.stubRequest(
      /http:\/\/example\.com\/agsimage\/rest\/services\/rasterfn\/ImageServer\?.+/
    ).andReturn({ responseText: rasterFnImageServer });

    jasmine.Ajax.stubRequest(
      /http:\/\/example\.com\/agsimage\/rest\/services\/rasterfn\/ImageServer\/legend\?.+/
    ).andReturn({ responseText: rasterFnLegend });

    jasmine.Ajax.stubRequest(
      /http:\/\/example\.com\/agsimage\/rest\/services\/time\/ImageServer\?.+/
    ).andReturn({ responseText: timeImageServer });

    jasmine.Ajax.stubRequest(
      /http:\/\/example\.com\/agsimage\/rest\/services\/time\/ImageServer\/legend\?.+/
    ).andReturn({ responseText: timeLegend });

    jasmine.Ajax.stubRequest(
      /http:\/\/example\.com\/agsimage\/rest\/services\/tile\/ImageServer\?.+/
    ).andReturn({ responseText: tileImageServer });

    jasmine.Ajax.stubRequest(
      /http:\/\/example\.com\/agsimage\/rest\/services\/tile\/ImageServer\/legend\?.+/
    ).andReturn({ responseText: tileLegend });

    jasmine.Ajax.stubRequest("http://example.com/token").andReturn({
      responseText: JSON.stringify({
        token: "fakeToken"
      })
    });

    jasmine.Ajax.stubRequest(
      /http:\/\/example.com\/agsimage\/rest\/services\/.+\/ImageServer\/exportImage\?.+/
    ).andReturn({
      responseText: "fakeImage"
    });

    terria = new Terria();
    imageServerItem = new ArcGisImageServerCatalogItem(
      "test",
      terria,
      undefined
    );
    imageServerItem.setTrait(
      "definition",
      "url",
      "http://example.com/agsimage/rest/services/time/ImageServer"
    );
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
  });

  it("has a type", function () {
    expect(imageServerItem.type).toBe("esri-imageServer");
  });

  it("supports splitting", function () {
    expect(imageServerItem.disableSplitter).toBeFalsy();
  });

  it("supports zooming to extent", function () {
    expect(imageServerItem.disableZoomTo).toBeFalsy();
  });

  it("supports preview", function () {
    expect(imageServerItem.disableAboutData).toBeFalsy();
  });

  describe("when tokenUrl is set", function () {
    beforeEach(() => {
      imageServerItem.setTrait(
        CommonStrata.definition,
        "tokenUrl",
        "http://example.com/token"
      );
    });

    it("fetches the token", async function () {
      await imageServerItem.loadMapItems();
      expect(spyOnLoad.calls.argsFor(0)[0]).toBe("http://example.com/token");
      expect(imageServerItem.token).toBe("fakeToken");
    });

    it("adds the token to subsequent requests", async function () {
      await imageServerItem.loadMapItems();
      console.log(spyOnLoad.calls);
      const tokenre = /token=fakeToken/;
      expect(tokenre.test(spyOnLoad.calls.argsFor(1)[0])).toBeTruthy();
      expect(tokenre.test(spyOnLoad.calls.argsFor(2)[0])).toBeTruthy();
    });

    it("passes the token to the imageryProvider", async function () {
      console.log(imageServerItem);
      await imageServerItem.loadMapItems();
      const imageryProvider = imageServerItem.mapItems[0]
        .imageryProvider as ArcGisImageServerImageryProvider;

      console.log(imageryProvider.baseResource);
      expect(imageryProvider.baseResource.queryParameters.token).toBe(
        "fakeToken"
      );
    });
  });

  describe("basic image server", function () {
    it("correctly sets `alpha`", function () {
      runInAction(() =>
        imageServerItem.setTrait(CommonStrata.definition, "opacity", 0.42)
      );
      expect(imageServerItem.mapItems[0].alpha).toBe(0.42);
    });

    it("correctly sets `show`", function () {
      runInAction(() =>
        imageServerItem.setTrait(CommonStrata.definition, "show", false)
      );
      expect(imageServerItem.mapItems[0].show).toBe(false);
    });

    describe("imageryProvider", function () {
      let imageryProvider: ArcGisImageServerImageryProvider;

      beforeEach(async function () {
        runInAction(() => {
          imageServerItem.setTrait(CommonStrata.definition, "parameters", {
            foo: "bar"
          });
          imageServerItem.setTrait(
            CommonStrata.definition,
            "minScaleDenominator",
            1
          );
          imageServerItem.setTrait(
            CommonStrata.definition,
            "hideLayerAfterMinScaleDenominator",
            true
          );
        });

        await imageServerItem.loadMapItems();
        imageryProvider = imageServerItem.mapItems[0]
          .imageryProvider as ArcGisImageServerImageryProvider;
      });

      it("should be an ArcGisImageServerImageryProvider", function () {
        expect(
          imageryProvider instanceof ArcGisImageServerImageryProvider
        ).toBeTruthy();
      });

      it("sets the URL correctly", function () {
        expect(imageryProvider.baseResource.getBaseUri()).toBe(
          "http://example.com/agsimage/rest/services/time/ImageServer/"
        );
      });

      it("tilingScheme should be a WebMercatorTilingScheme", function () {
        expect(
          imageryProvider.tilingScheme instanceof WebMercatorTilingScheme
        ).toBeTruthy();
      });

      it("sets the maximumLevel", function () {
        expect(imageryProvider.maximumLevel).toBe(25);
      });

      it("passes on request parameters", function () {
        if (!imageServerItem.currentDiscreteJulianDate)
          throw new Error("No currentDiscreteJulianDate");

        expect(imageryProvider.baseResource.queryParameters).toEqual({
          ...imageServerItem.parameters,
          time: JulianDate.toDate(
            imageServerItem.currentDiscreteJulianDate
          ).getTime()
        });
      });

      it("correctly sets enablePickFeatures", function () {
        expect(imageryProvider.enablePickFeatures).toBe(true);
      });
    });
  });

  it("adds bandIds to parameters", function () {
    // TODO
  });

  describe("image server with time", function () {
    beforeEach(async function () {
      imageServerItem.setTrait(
        "definition",
        "url",
        "http://example.com/agsimage/rest/services/time/ImageServer"
      );

      await imageServerItem.loadMetadata();
    });

    it("sets basic traits", async function () {
      console.log(imageServerItem);
      expect(imageServerItem.name).toBe("Some name");
      expect(imageServerItem.description).toBe("Some description");
      expect(imageServerItem.rectangle.east).toBe(179.6875);
      expect(imageServerItem.rectangle.north).toBe(90.25);
      expect(imageServerItem.rectangle.west).toBe(-180.3125);
      expect(imageServerItem.rectangle.south).toBe(-90.25);
      expect(imageServerItem.attribution).toBe("Some copyright");
      expect(imageServerItem.maximumScale).toBe(0);
      expect(imageServerItem.maximumLevel).toBeUndefined();
      expect(imageServerItem.minimumLevel).toBeUndefined();
      expect(imageServerItem.allowRasterFunction).toBe(true);
      expect(imageServerItem.availableRasterFunctions.length).toBe(0);
      expect(imageServerItem.disableRasterFunctionSelectors).toBe(false);
      expect(imageServerItem.usePreCachedTiles).toBe(false);
      expect(imageServerItem.tileHeight).toBe(256);
      expect(imageServerItem.tileWidth).toBe(256);
      expect(imageServerItem.wkid).toBe(102100);
    });

    it("creates legend", async function () {
      expect(imageServerItem.legends.length).toBe(1);
      expect(imageServerItem.legends[0].items.length).toBe(3);
      expect(imageServerItem.legends[0].items[0].imageUrl).toBe(
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAAAAAAAAAAHqZRakAAAAeElEQVQ4ja3RsQ3CQBQE0TlYhAiQ8B04owD334q7gAACJ0jno4n5BTxp/paxXAfS7eunhHqwPADCfJTBm+oRHnbyZCc31SPMJxls+sr2KM1OrnLydvaSLzvk3asGPgvkxeSBQL7cNRAgG14yQH42OMQfApTeuwr+AYLYEoMMYRRCAAAAAElFTkSuQmCC"
      );
      expect(imageServerItem.legends[0].items[1].imageUrl).toBe(
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAAAAAAAAAAHqZRakAAAAh0lEQVQ4jbXTsQ3CQBSD4d/KEx26VCg1M7EBW2UDVkpBdZBQIEikSBR3gSWMB/ga27qU/ospJ50VA0+XB0DcaLzgnb0XHDl4wczRCopSbC1XSZEeLg7oINLoBicjCET7MoNpMYPt6nzKRiy5GkER89XoAfHJZnD33oxcQ6TZ6PGHHapWZ8vwA8yIImKpipDXAAAAAElFTkSuQmCC"
      );
      expect(imageServerItem.legends[0].items[2].imageUrl).toBe(
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAAAAAAAAAAHqZRakAAAAIUlEQVQ4jWP8+/cvAzUBE1VNGzVw1MBRA0cNHDVwCBkIAEMfAx/78kANAAAAAElFTkSuQmCC"
      );

      expect(imageServerItem.legends[0].items[0].title).toBe(
        "High : Some Value"
      );
      expect(imageServerItem.legends[0].items[1].title).toBe("Some time layer");
      expect(imageServerItem.legends[0].items[2].title).toBe(
        "Low : Some Value"
      );
    });

    it("creates time intervals", async function () {
      expect(imageServerItem.startTime).toBe("1981-12-31T00:00:00.000000000Z");
      expect(imageServerItem.stopTime).toBe("2021-12-30T16:48:00.000000000Z");
      expect(imageServerItem.currentDiscreteTimeTag).toBe(
        "2021-12-30T16:48:00Z"
      );
      expect(imageServerItem.discreteTimes?.length).toBe(482);
    });

    it("Sets `time` parameter", async function () {
      let imageryProvider = imageServerItem.mapItems[0]
        .imageryProvider as ArcGisImageServerImageryProvider;

      if (!imageServerItem.currentDiscreteJulianDate)
        throw new Error("No currentDiscreteJulianDate");

      expect(imageryProvider.baseResource.queryParameters).toEqual({
        time: JulianDate.toDate(
          imageServerItem.currentDiscreteJulianDate
        ).getTime()
      });

      const time = imageServerItem.discreteTimes?.[100]?.time ?? "";

      runInAction(() => {
        imageServerItem.setTrait(CommonStrata.definition, "currentTime", time);
      });

      imageryProvider = imageServerItem.mapItems[0]
        .imageryProvider as ArcGisImageServerImageryProvider;

      expect(imageryProvider.baseResource.queryParameters).toEqual({
        time: new Date(time).getTime()
      });
    });

    it("creates next imagery provider", async function () {
      const time = imageServerItem.discreteTimes?.[100]?.time ?? "";
      const nextTime = imageServerItem.discreteTimes?.[101]?.time ?? "";

      runInAction(() => {
        imageServerItem.setTrait(CommonStrata.definition, "currentTime", time);
        imageServerItem.setTrait(CommonStrata.definition, "isPaused", false);
        terria.timelineStack.addToTop(imageServerItem);
      });

      const imageryProvider = imageServerItem.mapItems[0]
        ?.imageryProvider as ArcGisImageServerImageryProvider;
      const nextImageryProvider = imageServerItem._nextImageryParts
        ?.imageryProvider as ArcGisImageServerImageryProvider;

      expect(imageryProvider.baseResource.queryParameters).toEqual({
        time: new Date(time).getTime()
      });

      expect(nextImageryProvider.baseResource.queryParameters).toEqual({
        time: new Date(nextTime).getTime()
      });
    });
  });

  describe("image server with raster fns", function () {
    beforeEach(async function () {
      imageServerItem.setTrait(
        "definition",
        "url",
        "http://example.com/agsimage/rest/services/rasterfns/ImageServer"
      );

      await imageServerItem.loadMetadata();
    });

    it("sets basic traits", async function () {
      expect(imageServerItem.name).toBe("Some name");
      expect(imageServerItem.description).toBe("Some description");
      expect(imageServerItem.rectangle.east).toBe(179.6875);
      expect(imageServerItem.rectangle.north).toBe(90.25);
      expect(imageServerItem.rectangle.west).toBe(-180.3125);
      expect(imageServerItem.rectangle.south).toBe(-90.25);
      expect(imageServerItem.attribution).toBe("Some copyright");
      expect(imageServerItem.maximumScale).toBe(0);
      expect(imageServerItem.maximumLevel).toBeUndefined();
      expect(imageServerItem.minimumLevel).toBeUndefined();
      expect(imageServerItem.allowRasterFunction).toBe(true);
      expect(imageServerItem.availableRasterFunctions.length).toBe(0);
      expect(imageServerItem.disableRasterFunctionSelectors).toBe(false);
      expect(imageServerItem.usePreCachedTiles).toBe(false);
      expect(imageServerItem.tileHeight).toBe(256);
      expect(imageServerItem.tileWidth).toBe(256);
      expect(imageServerItem.wkid).toBe(102100);
    });

    it("creates legend", async function () {
      expect(imageServerItem.legends.length).toBe(1);
      // TODO
    });

    it("creates legend - with raster fn", async function () {
      expect(imageServerItem.legends.length).toBe(1);
      // TODO
    });

    it("creates legend - uses bandIds", async function () {
      expect(imageServerItem.legends.length).toBe(1);
      // TODO
    });

    it("has raster functions", async function () {
      expect(imageServerItem.availableRasterFunctions.length).toBe(1);
      expect(imageServerItem.availableRasterFunctions[0].name).toBe(
        "Hillshade"
      );
    });

    it("creates raster fn selectable dimensions", function () {
      // TODO
    });

    it("adds rasterfn to parameters", function () {
      // TODO
    });

    it("creates imagery provider", function () {
      // TODO
    });
  });

  describe("image server with tiles", function () {
    beforeEach(async function () {
      imageServerItem.setTrait(
        "definition",
        "url",
        "http://example.com/agsimage/rest/services/tile/ImageServer"
      );

      await imageServerItem.loadMetadata();
    });

    it("sets basic traits", async function () {
      expect(imageServerItem.name).toBe("Surface Geology");
      expect(imageServerItem.description).toBe("Surface Geology");
      expect(imageServerItem.rectangle.east).toBe(151.208);
      expect(imageServerItem.rectangle.north).toBe(-33.868);
      expect(imageServerItem.rectangle.west).toBe(151.207);
      expect(imageServerItem.rectangle.south).toBe(-33.869);
      expect(imageServerItem.attribution).toBe("Geoscience Australia");
      expect(imageServerItem.maximumScale).toBe(1);
      expect(imageServerItem.maximumLevel).toBe(1);
      expect(imageServerItem.minimumLevel).toBe(1);
      expect(imageServerItem.allowRasterFunction).toBe(true);
      expect(imageServerItem.availableRasterFunctions.length).toBe(0);
      expect(imageServerItem.disableRasterFunctionSelectors).toBe(false);
      expect(imageServerItem.usePreCachedTiles).toBe(false);
      expect(imageServerItem.tileHeight).toBe(256);
      expect(imageServerItem.tileWidth).toBe(256);
      expect(imageServerItem.wkid).toBe(102100);
    });

    it("creates legend", async function () {
      expect(imageServerItem.legends.length).toBe(1);
      // TODO
    });

    it("disables tile if parameters", async function () {
      expect(imageServerItem.legends.length).toBe(1);
      // TODO
    });

    it("disables tile if renderRule", async function () {
      expect(imageServerItem.legends.length).toBe(1);
      // TODO
    });

    it("creates imagery provider", function () {
      // TODO
    });
  });
});
