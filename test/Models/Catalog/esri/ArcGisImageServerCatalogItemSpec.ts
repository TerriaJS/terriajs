import ArcGisImageServerCatalogItem from "../../../../lib/Models/Catalog/Esri/ArcGisImageServerCatalogItem";
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

// TODO add token

describe("ArcGisImageServer", function () {
  let terria: Terria;
  let imageServerItem: ArcGisImageServerCatalogItem;

  beforeEach(async function () {
    jasmine.Ajax.install();

    jasmine.Ajax.stubRequest(
      "http://www.example.com/agsimage/rest/services/rasterfn/ImageServer?f=json"
    ).andReturn({ responseText: rasterFnImageServer });

    jasmine.Ajax.stubRequest(
      "http://www.example.com/agsimage/rest/services/rasterfn/ImageServer/legend?f=json"
    ).andReturn({ responseText: rasterFnLegend });

    jasmine.Ajax.stubRequest(
      "http://www.example.com/agsimage/rest/services/time/ImageServer?f=json"
    ).andReturn({ responseText: timeImageServer });

    jasmine.Ajax.stubRequest(
      "http://www.example.com/agsimage/rest/services/time/ImageServer/legend?f=json"
    ).andReturn({ responseText: timeLegend });

    jasmine.Ajax.stubRequest(
      "http://www.example.com/agsimage/rest/services/tile/ImageServer?f=json"
    ).andReturn({ responseText: tileImageServer });

    jasmine.Ajax.stubRequest(
      "http://www.example.com/agsimage/rest/services/tile/ImageServer/legend?f=json"
    ).andReturn({ responseText: tileLegend });

    terria = new Terria();
    imageServerItem = new ArcGisImageServerCatalogItem(
      "test",
      terria,
      undefined
    );
    imageServerItem.setTrait(
      "definition",
      "url",
      "http://www.example.com/agsimage/rest/services/time/ImageServer"
    );
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
  });

  it("has a type", function () {
    expect(imageServerItem.type).toBe("esri-imageServer");
  });

  it("adds bandIds to parameters", function () {
    // TODO
  });

  describe("image server with time", function () {
    beforeEach(async function () {
      imageServerItem.setTrait(
        "definition",
        "url",
        "http://www.example.com/agsimage/rest/services/rasterfn/ImageServer"
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

    it("creates time intervals", async function () {
      expect(imageServerItem.startTime).toBe("2019-01-01T00:00:00Z");
      expect(imageServerItem.stopTime).toBe("2019-01-01T00:00:00Z");
      expect(imageServerItem.discreteTimes?.length).toBe(1);
    });

    it("Sets `time` parameter", async function () {
      //
    });

    it("creates next imagery provider", async function () {
      //
    });
  });

  describe("image server with raster fns", function () {
    beforeEach(async function () {
      imageServerItem.setTrait(
        "definition",
        "url",
        "http://www.example.com/agsimage/rest/services/time/ImageServer"
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
        "http://www.example.com/agsimage/rest/services/tile/ImageServer"
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
