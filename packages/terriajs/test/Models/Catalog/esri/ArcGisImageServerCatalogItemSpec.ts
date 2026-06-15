import { http, HttpResponse } from "msw";
import { reaction, runInAction } from "mobx";
import GeographicTilingScheme from "terriajs-cesium/Source/Core/GeographicTilingScheme";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import Request from "terriajs-cesium/Source/Core/Request";
import WebMercatorTilingScheme from "terriajs-cesium/Source/Core/WebMercatorTilingScheme";
import ArcGisImageServerImageryProvider from "../../../../lib/Map/ImageryProvider/ArcGisImageServerImageryProvider";
import ArcGisImageServerCatalogItem from "../../../../lib/Models/Catalog/Esri/ArcGisImageServerCatalogItem";
import CommonStrata from "../../../../lib/Models/Definition/CommonStrata";
import createStratumInstance from "../../../../lib/Models/Definition/createStratumInstance";
import { SelectableDimensionEnum } from "../../../../lib/Models/SelectableDimensions/SelectableDimensions";
import Terria from "../../../../lib/Models/Terria";
import { ArcGisImageServerRenderingRule } from "../../../../lib/Traits/TraitsClasses/ArcGisImageServerCatalogItemTraits";
import { worker } from "../../../mocks/browser";

import rasterFnImageServer from "../../../../wwwroot/test/ArcGisImageServer/rasterFns/imageserver.json";
import rasterFnLegend from "../../../../wwwroot/test/ArcGisImageServer/rasterFns/legend.json";
import timeImageServer from "../../../../wwwroot/test/ArcGisImageServer/time/imageserver.json";
import timeLegend from "../../../../wwwroot/test/ArcGisImageServer/time/legend.json";
import timeIdentify from "../../../../wwwroot/test/ArcGisImageServer/time/identify.json";
import tileImageServer from "../../../../wwwroot/test/ArcGisImageServer/tile/imageserver.json";
import tileLegend from "../../../../wwwroot/test/ArcGisImageServer/tile/legend.json";
import tileIdentify from "../../../../wwwroot/test/ArcGisImageServer/tile/identify.json";

describe("ArcGisImageServer", function () {
  let terria: Terria;
  let imageServerItem: ArcGisImageServerCatalogItem;

  beforeEach(function () {
    worker.use(
      http.get(
        "http://example.com/agsimage/rest/services/rasterfns/ImageServer",
        () => HttpResponse.json(rasterFnImageServer)
      ),
      http.get(
        "http://example.com/agsimage/rest/services/rasterfns/ImageServer/legend",
        () => HttpResponse.json(rasterFnLegend)
      ),
      http.get(
        "http://example.com/agsimage/rest/services/time/ImageServer",
        () => HttpResponse.json(timeImageServer)
      ),
      http.get(
        "http://example.com/agsimage/rest/services/time/ImageServer/legend",
        () => HttpResponse.json(timeLegend)
      ),
      http.get(
        "http://example.com/agsimage/rest/services/tile/ImageServer",
        () => HttpResponse.json(tileImageServer)
      ),
      http.get(
        "http://example.com/agsimage/rest/services/tile/ImageServer/legend",
        () => HttpResponse.json(tileLegend)
      ),
      http.post(
        "http://example.com/token",
        () => new HttpResponse(JSON.stringify({ token: "fakeToken" }))
      ),
      http.get(
        "http://example.com/agsimage/rest/services/:service/ImageServer/exportImage",
        () => new HttpResponse("fakeImage")
      ),
      http.get(
        "http://example.com/agsimage/rest/services/:service/ImageServer/tile/:z/:x/:y",
        () => new HttpResponse("fakeImage")
      )
    );

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

      worker.use(
        http.get(
          "http://example.com/agsimage/rest/services/time/ImageServer",
          ({ request }) => {
            if (new URL(request.url).searchParams.get("token") !== "fakeToken")
              return HttpResponse.error();
            return HttpResponse.json(timeImageServer);
          }
        ),
        http.get(
          "http://example.com/agsimage/rest/services/time/ImageServer/legend",
          ({ request }) => {
            if (new URL(request.url).searchParams.get("token") !== "fakeToken")
              return HttpResponse.error();
            return HttpResponse.json(timeLegend);
          }
        )
      );
    });

    it("fetches the token", async function () {
      await imageServerItem.loadMapItems();
      expect(imageServerItem.token).toBe("fakeToken");
    });

    it("adds the token to subsequent requests", async function () {
      await imageServerItem.loadMapItems();
      expect(imageServerItem.legends.length).toBe(1);
    });

    it("passes the token to the imageryProvider", async function () {
      await imageServerItem.loadMapItems();
      const imageryProvider = imageServerItem.mapItems[0]
        .imageryProvider as ArcGisImageServerImageryProvider;

      expect(imageryProvider.baseResource.queryParameters.token).toBe(
        "fakeToken"
      );
    });
  });

  describe("when token is set", function () {
    beforeEach(() => {
      imageServerItem.setTrait(
        CommonStrata.definition,
        "token",
        "some-token-in-config"
      );

      worker.use(
        http.get(
          "http://example.com/agsimage/rest/services/time/ImageServer",
          ({ request }) => {
            if (
              new URL(request.url).searchParams.get("token") !==
              "some-token-in-config"
            )
              return HttpResponse.error();
            return HttpResponse.json(timeImageServer);
          }
        ),
        http.get(
          "http://example.com/agsimage/rest/services/time/ImageServer/legend",
          ({ request }) => {
            if (
              new URL(request.url).searchParams.get("token") !==
              "some-token-in-config"
            )
              return HttpResponse.error();
            return HttpResponse.json(timeLegend);
          }
        )
      );
    });

    it("uses the token in url when loading metadata", async function () {
      await imageServerItem.loadMapItems();
      expect(imageServerItem.legends.length).toBe(1);
    });

    it("passes the token to the imageryProvider", async function () {
      await imageServerItem.loadMapItems();
      const imageryProvider = imageServerItem.mapItems[0]
        .imageryProvider as ArcGisImageServerImageryProvider;

      expect(imageryProvider.baseResource.queryParameters.token).toBe(
        "some-token-in-config"
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
  });

  describe("bandIds", function () {
    it("adds to parameters", async function () {
      runInAction(() =>
        imageServerItem.setTrait(CommonStrata.definition, "bandIds", [2, 3])
      );
      expect(imageServerItem.flattenedParameters).toEqual({
        bandIds: "2,3"
      });

      worker.use(
        http.get(
          "http://example.com/agsimage/rest/services/time/ImageServer/legend",
          ({ request }) => {
            const params = new URL(request.url).searchParams;
            if (params.get("bandIds") !== "2,3") return HttpResponse.error();
            if (params.get("f") !== "json") return HttpResponse.error();
            return HttpResponse.json(timeLegend);
          }
        )
      );

      await imageServerItem.loadMapItems();

      // Check imagery provider
      const imageryProvider = imageServerItem.mapItems[0]
        .imageryProvider as ArcGisImageServerImageryProvider;

      expect(imageryProvider.baseResource.queryParameters.bandIds).toEqual(
        "2,3"
      );
    });
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

    it("sets basic traits", function () {
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

    it("creates legend", function () {
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

    it("creates time intervals", function () {
      expect(imageServerItem.startTime).toBe("1981-12-31T00:00:00.000000000Z");
      expect(imageServerItem.stopTime).toBe("2021-12-30T16:48:00.000000000Z");
      expect(imageServerItem.currentDiscreteTimeTag).toBe(
        "2021-12-30T16:48:00Z"
      );
      expect(imageServerItem.discreteTimes?.length).toBe(482);
    });

    it("Sets `time` parameter", function () {
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

    it("creates next imagery provider", function () {
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

    it("sets basic traits", function () {
      expect(imageServerItem.name).toBe("Some name");
      expect(imageServerItem.description).toBe("Some description");
      expect(imageServerItem.rectangle.east).toBe(-116.43027039325061);
      expect(imageServerItem.rectangle.north).toBe(46.31633967431312);
      expect(imageServerItem.rectangle.west).toBe(-124.63200690054119);
      expect(imageServerItem.rectangle.south).toBe(41.93340221567374);
      expect(imageServerItem.attribution).toBe("Some Copyright");
      expect(imageServerItem.maximumScale).toBe(0);
      expect(imageServerItem.maximumLevel).toBeUndefined();
      expect(imageServerItem.minimumLevel).toBeUndefined();
      expect(imageServerItem.allowRasterFunction).toBe(true);
      expect(imageServerItem.availableRasterFunctions.length).toBe(3);
      expect(imageServerItem.disableRasterFunctionSelectors).toBe(false);
      expect(imageServerItem.usePreCachedTiles).toBe(false);
      expect(imageServerItem.tileHeight).toBe(256);
      expect(imageServerItem.tileWidth).toBe(256);
      expect(imageServerItem.wkid).toBe(102100);
    });

    it("creates legend", async function () {
      await imageServerItem.loadMapItems();
      expect(imageServerItem.legends.length).toBe(1);
      expect(imageServerItem.legends[0].items.length).toBe(3);
      expect(imageServerItem.legends[0].items[0].imageUrl).toBe(
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAAAAAAAAAAHqZRakAAAAT0lEQVQ4je3RwQkAMAgDwAjiz/1XVUTtEE1/zQCHibK7C1JmRjQiWB7MDJqZXJB5obtzQQDQquKCzA0BPKhMB+mV6U/5G96Df8PrSHdTwQOUlT8HeNXIpAAAAABJRU5ErkJggg=="
      );
      expect(imageServerItem.legends[0].items[1].imageUrl).toBe(
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAAAAAAAAAAHqZRakAAAAUElEQVQ4je3UwQkAMQhE0S+kbcGyjSK7RWQOOWQKeMgMaO7+IUpE2MpMlQfA2ntrQfmF3a0FX4fn4P0dVpUWvH/l1+FxDJB97JkxmxmVB8APVtY8xR14rRcAAAAASUVORK5CYII="
      );
      expect(imageServerItem.legends[0].items[2].imageUrl).toBe(
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAAAAAAAAAAHqZRakAAAAIUlEQVQ4jWP8+/cvAzUBE1VNGzVw1MBRA0cNHDVwCBkIAEMfAx/78kANAAAAAElFTkSuQmCC"
      );

      expect(imageServerItem.legends[0].items[0].title).toBe(
        "High : Some value"
      );
      expect(imageServerItem.legends[0].items[1].title).toBe("Some label");
      expect(imageServerItem.legends[0].items[2].title).toBe(
        "Low : Some value"
      );
    });

    it("adds to rasterFn to legend URL - and reloads correctly", async function () {
      await imageServerItem.loadMapItems();
      expect(imageServerItem.legends.length).toBe(1);

      // Override legend handler to require renderingRule param
      worker.use(
        http.get(
          "http://example.com/agsimage/rest/services/rasterfns/ImageServer/legend",
          ({ request }) => {
            const params = new URL(request.url).searchParams;
            if (
              params.get("renderingRule") !==
              '{"rasterFunction":"RFTAspectColor"}'
            )
              return HttpResponse.error();
            if (params.get("f") !== "json") return HttpResponse.error();
            return HttpResponse.json(rasterFnLegend);
          }
        )
      );

      // By observing mapItems, we can trigger a reload when the renderingRule changes
      const disposer = reaction(
        () => imageServerItem.mapItems,
        () => 1
      );

      runInAction(() => {
        imageServerItem.setTrait(
          CommonStrata.user,
          "renderingRule",
          createStratumInstance(ArcGisImageServerRenderingRule, {
            rasterFunction: "RFTAspectColor"
          })
        );
      });

      const imageryProvider = imageServerItem.mapItems[0]
        .imageryProvider as ArcGisImageServerImageryProvider;
      expect(imageryProvider.baseResource.queryParameters.renderingRule).toBe(
        '{"rasterFunction":"RFTAspectColor"}'
      );

      disposer();
    });

    it("has raster functions", function () {
      expect(imageServerItem.availableRasterFunctions.length).toBe(3);
      expect(imageServerItem.availableRasterFunctions[0].name).toBe(
        "RFTAspectColor"
      );
      expect(imageServerItem.availableRasterFunctions[1].name).toBe(
        "RFTHillshade"
      );
      expect(imageServerItem.availableRasterFunctions[2].name).toBe(
        "RFTShadedReliefElevationColorRamp"
      );
      expect(imageServerItem.availableRasterFunctions[0].description).toBe(
        "This function generates a color representation of aspect."
      );
      expect(imageServerItem.availableRasterFunctions[1].description).toBe(
        "This function creates a hillshade effect based on the elevation data source."
      );
      expect(imageServerItem.availableRasterFunctions[2].description).toBe(
        "This function processes the elevation surface as shaded relief. "
      );
    });

    it("creates raster fn selectable dimensions", function () {
      expect(imageServerItem.selectableDimensions.length).toBe(1);
      let selDim = imageServerItem
        .selectableDimensions[0] as SelectableDimensionEnum;
      expect(selDim.name).toBe(
        "models.arcGisImageServerCatalogItem.rasterFunction"
      );
      expect(selDim.allowUndefined).toBeTruthy();
      expect(selDim.selectedId).toBeUndefined();
      expect(selDim.options?.length).toBe(3);
      expect(selDim.options?.[0].id).toBe("RFTAspectColor");
      expect(selDim.options?.[1].id).toBe("RFTHillshade");
      expect(selDim.options?.[2].id).toBe("RFTShadedReliefElevationColorRamp");

      runInAction(() => {
        imageServerItem.setTrait(
          CommonStrata.user,
          "renderingRule",
          createStratumInstance(ArcGisImageServerRenderingRule, {
            rasterFunction: "RFTHillshade"
          })
        );
      });

      selDim = imageServerItem
        .selectableDimensions[0] as SelectableDimensionEnum;

      expect(selDim.selectedId).toBe("RFTHillshade");
    });

    it("adds rasterfn to parameters", function () {
      runInAction(() => {
        imageServerItem.setTrait(
          CommonStrata.user,
          "renderingRule",
          createStratumInstance(ArcGisImageServerRenderingRule, {
            rasterFunction: "RFTHillshade"
          })
        );
      });

      expect(imageServerItem.flattenedParameters).toEqual({
        renderingRule: '{"rasterFunction":"RFTHillshade"}'
      });
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

    it("sets basic traits", function () {
      expect(imageServerItem.name).toBe("Some name");
      expect(imageServerItem.description).toBe("Some description");
      expect(imageServerItem.rectangle.east).toBe(-116.43027039325061);
      expect(imageServerItem.rectangle.north).toBe(46.31633967431312);
      expect(imageServerItem.rectangle.west).toBe(-124.63200690054119);
      expect(imageServerItem.rectangle.south).toBe(41.93340221567374);
      expect(imageServerItem.attribution).toBe("Some copyright");
      expect(imageServerItem.maximumScale).toBe(1128.497176);
      expect(imageServerItem.maximumLevel).toBe(19);
      expect(imageServerItem.minimumLevel).toBe(0);
      expect(imageServerItem.allowRasterFunction).toBe(true);
      expect(imageServerItem.availableRasterFunctions.length).toBe(0);
      expect(imageServerItem.disableRasterFunctionSelectors).toBe(false);
      expect(imageServerItem.usePreCachedTiles).toBe(true);
      expect(imageServerItem.tileHeight).toBe(256);
      expect(imageServerItem.tileWidth).toBe(256);
      expect(imageServerItem.wkid).toBe(102100);
    });

    it("disables tile if parameters", function () {
      runInAction(() =>
        imageServerItem.setTrait(CommonStrata.definition, "parameters", {
          foo: "bar"
        })
      );
      expect(imageServerItem.usePreCachedTiles).toBe(false);
    });

    it("disables tile if renderRule", function () {
      runInAction(() =>
        imageServerItem.setTrait(
          CommonStrata.user,
          "renderingRule",
          createStratumInstance(ArcGisImageServerRenderingRule, {
            rasterFunction: "RFTHillshade"
          })
        )
      );

      expect(imageServerItem.usePreCachedTiles).toBe(false);
    });

    it("creates imagery provider", function () {
      const imageryProvider = imageServerItem.mapItems[0]
        ?.imageryProvider as ArcGisImageServerImageryProvider;

      expect(imageryProvider.usePreCachedTiles).toBe(true);
    });
  });
});

describe("ArcGisImageServerImageryProvider", function () {
  let imageryProvider: ArcGisImageServerImageryProvider;

  beforeEach(function () {
    worker.use(
      http.get(
        "http://example.com/agsimage/rest/services/:service/ImageServer/identify",
        ({ request }) => {
          const url = new URL(request.url);
          const service = url.pathname.split("/services/")[1]?.split("/")[0];
          if (service === "time") return HttpResponse.json(timeIdentify);
          if (service === "tile") return HttpResponse.json(tileIdentify);
          return new HttpResponse("fakeImage");
        }
      ),
      http.get(
        "http://example.com/agsimage/rest/services/:service/ImageServer/exportImage",
        () => new HttpResponse("fakeImage")
      ),
      http.get(
        "http://example.com/agsimage/rest/services/:service/ImageServer/tile/:z/:x/:y",
        () => new HttpResponse("fakeImage")
      )
    );
  });

  describe("dynamic web mercator", function () {
    beforeEach(function () {
      imageryProvider = new ArcGisImageServerImageryProvider({
        url: "http://example.com/agsimage/rest/services/time/ImageServer",
        token: "fakeToken",
        credit: "Some credit",
        parameters: { foo: "bar" },
        minimumLevel: 1,
        maximumLevel: 25,
        rectangle: Rectangle.fromDegrees(-20, -10, 20, 10),
        enablePickFeatures: true,
        usePreCachedTiles: false,
        tileWidth: 256,
        tileHeight: 256,
        tilingScheme: new WebMercatorTilingScheme()
      });
    });

    it("should be an ArcGisImageServerImageryProvider", function () {
      expect(
        imageryProvider instanceof ArcGisImageServerImageryProvider
      ).toBeTruthy();
    });

    it("sets basic properties", function () {
      expect(imageryProvider.credit.html).toBe("Some credit");
      expect(imageryProvider.minimumLevel).toBe(1);
      expect(imageryProvider.maximumLevel).toBe(25);
      expect(imageryProvider.rectangle).toEqual(
        Rectangle.fromDegrees(-20, -10, 20, 10)
      );
      expect(imageryProvider.enablePickFeatures).toBe(true);
      expect(imageryProvider.tileWidth).toBe(256);
      expect(imageryProvider.tileHeight).toBe(256);
    });

    it("sets the URL, token and parameters correctly", function () {
      expect(imageryProvider.baseResource.toString()).toBe(
        "http://example.com/agsimage/rest/services/time/ImageServer/?token=fakeToken&foo=bar"
      );
      expect(imageryProvider.baseResource.queryParameters).toEqual({
        foo: "bar",
        token: "fakeToken"
      });
    });

    it("tilingScheme should be a WebMercatorTilingScheme", function () {
      expect(
        imageryProvider.tilingScheme instanceof WebMercatorTilingScheme
      ).toBeTruthy();
    });

    it("creates correct image resource", function () {
      expect(imageryProvider.usePreCachedTiles).toBe(false);

      const testResource = imageryProvider.buildImageResource(0, 0, 2);
      expect(testResource.url).toBe(
        "http://example.com/agsimage/rest/services/time/ImageServer/exportImage?bbox=-20037508.342789244%2C10018754.171394622%2C-10018754.171394622%2C20037508.342789244&size=256%2C256&format=png32&transparent=true&f=image&bboxSR=3857&imageSR=3857&token=fakeToken&foo=bar"
      );

      expect(testResource.request).toEqual(
        imageryProvider.baseResource.request
      );
    });

    it("passes request parameter through to image resource", function () {
      expect(imageryProvider.usePreCachedTiles).toBe(false);

      const testRequest = new Request();
      const testResource = imageryProvider.buildImageResource(
        0,
        0,
        2,
        testRequest
      );
      expect(testResource.url).toBe(
        "http://example.com/agsimage/rest/services/time/ImageServer/exportImage?bbox=-20037508.342789244%2C10018754.171394622%2C-10018754.171394622%2C20037508.342789244&size=256%2C256&format=png32&transparent=true&f=image&bboxSR=3857&imageSR=3857&token=fakeToken&foo=bar"
      );

      expect(testResource.request).toEqual(testRequest);
    });
  });

  describe("dynamic wgs84", function () {
    beforeEach(function () {
      imageryProvider = new ArcGisImageServerImageryProvider({
        url: "http://example.com/agsimage/rest/services/time/ImageServer",
        token: "fakeToken",
        credit: "Some credit",
        parameters: { foo: "bar" },
        minimumLevel: 3,
        maximumLevel: 5,
        rectangle: Rectangle.fromDegrees(-20, -10, 20, 10),
        enablePickFeatures: true,
        usePreCachedTiles: false,
        tileWidth: 512,
        tileHeight: 512,
        tilingScheme: new GeographicTilingScheme()
      });
    });

    it("should be an ArcGisImageServerImageryProvider", function () {
      expect(
        imageryProvider instanceof ArcGisImageServerImageryProvider
      ).toBeTruthy();
    });

    it("sets basic properties", function () {
      expect(imageryProvider.credit.html).toBe("Some credit");
      expect(imageryProvider.minimumLevel).toBe(3);
      expect(imageryProvider.maximumLevel).toBe(5);
      expect(imageryProvider.rectangle).toEqual(
        Rectangle.fromDegrees(-20, -10, 20, 10)
      );
      expect(imageryProvider.enablePickFeatures).toBe(true);
      expect(imageryProvider.tileWidth).toBe(512);
      expect(imageryProvider.tileHeight).toBe(512);
    });

    it("sets the URL, token and parameters correctly", function () {
      expect(imageryProvider.baseResource.toString()).toBe(
        "http://example.com/agsimage/rest/services/time/ImageServer/?token=fakeToken&foo=bar"
      );
      expect(imageryProvider.baseResource.queryParameters).toEqual({
        foo: "bar",
        token: "fakeToken"
      });
    });

    it("tilingScheme should be a GeographicTilingScheme", function () {
      expect(
        imageryProvider.tilingScheme instanceof GeographicTilingScheme
      ).toBeTruthy();
    });

    it("creates correct image resource", function () {
      expect(imageryProvider.usePreCachedTiles).toBe(false);

      const testResource = imageryProvider.buildImageResource(1, 1, 4);
      expect(testResource.url).toBe(
        "http://example.com/agsimage/rest/services/time/ImageServer/exportImage?bbox=-168.75%2C67.5%2C-157.5%2C78.75&size=512%2C512&format=png32&transparent=true&f=image&bboxSR=4326&imageSR=4326&token=fakeToken&foo=bar"
      );
    });

    it("picks features", async function () {
      const features = await imageryProvider.pickFeatures(1, 1, 4, 1, 1);

      expect(features.length).toBe(1);
      expect(features[0].name).toBe("Pixel");
      expect(features[0].description).toBe("8");
    });
  });

  describe("tiled web mercator", function () {
    beforeEach(function () {
      imageryProvider = new ArcGisImageServerImageryProvider({
        url: "http://example.com/agsimage/rest/services/tile/ImageServer",
        token: "fakeToken",
        credit: "Some credit",
        parameters: { foo: "bar" },
        minimumLevel: 0,
        maximumLevel: 24,
        rectangle: Rectangle.fromDegrees(-20, -10, 20, 10),
        enablePickFeatures: true,
        usePreCachedTiles: true,
        tileWidth: 256,
        tileHeight: 256,
        tilingScheme: new WebMercatorTilingScheme()
      });
    });

    it("should be an ArcGisImageServerImageryProvider", function () {
      expect(
        imageryProvider instanceof ArcGisImageServerImageryProvider
      ).toBeTruthy();
    });

    it("sets basic properties", function () {
      expect(imageryProvider.credit.html).toBe("Some credit");
      expect(imageryProvider.minimumLevel).toBe(0);
      expect(imageryProvider.maximumLevel).toBe(24);
      expect(imageryProvider.rectangle).toEqual(
        Rectangle.fromDegrees(-20, -10, 20, 10)
      );
      expect(imageryProvider.enablePickFeatures).toBe(true);
      expect(imageryProvider.tileWidth).toBe(256);
      expect(imageryProvider.tileHeight).toBe(256);
    });

    it("sets the URL, token and parameters correctly", function () {
      expect(imageryProvider.baseResource.toString()).toBe(
        "http://example.com/agsimage/rest/services/tile/ImageServer/?token=fakeToken&foo=bar"
      );
      expect(imageryProvider.baseResource.queryParameters).toEqual({
        foo: "bar",
        token: "fakeToken"
      });
    });

    it("tilingScheme should be a WebMercatorTilingScheme", function () {
      expect(
        imageryProvider.tilingScheme instanceof WebMercatorTilingScheme
      ).toBeTruthy();
    });

    it("creates correct image resource", function () {
      expect(imageryProvider.usePreCachedTiles).toBe(true);

      const testResource = imageryProvider.buildImageResource(1, 1, 4);
      expect(testResource.url).toBe(
        "http://example.com/agsimage/rest/services/tile/ImageServer/tile/4/1/1?token=fakeToken&foo=bar"
      );
    });

    it("picks features", async function () {
      const features = await imageryProvider.pickFeatures(1, 1, 4, 1, 1);

      expect(features.length).toBe(1);
      expect(features[0].name).toBe("Pixel");
      expect(features[0].description).toBe("178, 135, 99, 255");
    });
  });
});
