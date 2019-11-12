"use strict";

/*global require,describe,it,expect,beforeEach,fail*/

var Credit = require("terriajs-cesium/Source/Core/Credit").default;
var ImageryProvider = require("terriajs-cesium/Source/Scene/ImageryProvider")
  .default;
var JulianDate = require("terriajs-cesium/Source/Core/JulianDate").default;
var Rectangle = require("terriajs-cesium/Source/Core/Rectangle").default;
var TimeInterval = require("terriajs-cesium/Source/Core/TimeInterval").default;
var TimeIntervalCollection = require("terriajs-cesium/Source/Core/TimeIntervalCollection")
  .default;
var WebMercatorTilingScheme = require("terriajs-cesium/Source/Core/WebMercatorTilingScheme")
  .default;

var ImageryLayerCatalogItem = require("../../lib/Models/ImageryLayerCatalogItem");
var LegendUrl = require("../../lib/Map/LegendUrl");
var Terria = require("../../lib/Models/Terria");
var WebMapServiceCatalogItem = require("../../lib/Models/WebMapServiceCatalogItem");

var terria;
var wmsItem;

beforeEach(function() {
  terria = new Terria({
    baseUrl: "./"
  });
  wmsItem = new WebMapServiceCatalogItem(terria);
});

describe("WebMapServiceCatalogItem", function() {
  it("has sensible type and typeName", function() {
    expect(wmsItem.type).toBe("wms");
    expect(wmsItem.typeName).toBe("Web Map Service (WMS)");
  });

  it("throws if constructed without a Terria instance", function() {
    expect(function() {
      var viewModel = new WebMapServiceCatalogItem(); // eslint-disable-line no-unused-vars
    }).toThrow();
  });

  it("can be constructed", function() {
    expect(wmsItem).toBeDefined();
  });

  it("is derived from ImageryLayerCatalogItem", function() {
    expect(wmsItem instanceof ImageryLayerCatalogItem).toBe(true);
  });

  describe("legendUrls", function() {
    it("is used when explicitly-provided", function() {
      wmsItem.legendUrl = new LegendUrl("http://foo.com/legend.png");
      wmsItem.url = "http://foo.com/somethingElse";
      expect(wmsItem.legendUrl).toEqual(
        new LegendUrl("http://foo.com/legend.png")
      );
    });

    it("is derived from url if not explicitly provided or read from XML", function(done) {
      wmsItem.updateFromJson({
        url: "http://foo.com/bar",
        metadataUrl: "test/WMS/no_legend_url.xml",
        layers: "single_period",
        dataUrl: "" // to prevent a DescribeLayer request
      });
      wmsItem
        .load()
        .then(function() {
          expect(wmsItem.legendUrl.url.indexOf("http://foo.com/bar")).toBe(0);
        })
        .then(done)
        .otherwise(done.fail);
    });

    it("incorporates parameters if legendUrl comes from style", function(done) {
      wmsItem.updateFromJson({
        url: "http://example.com",
        metadataUrl: "test/WMS/multiple_style_legend_url.xml",
        layers: "single_period",
        parameters: { styles: "jet2", foo: "bar" },
        dataUrl: "" // to prevent a DescribeLayer request
      });
      wmsItem
        .load()
        .then(function() {
          expect(wmsItem.legendUrl).toEqual(
            new LegendUrl(
              "http://www.example.com/foo?request=GetLegendGraphic&secondUrl&styles=jet2&foo=bar&srs=EPSG%3A3857",
              "image/gif"
            )
          );
        })
        .then(done)
        .otherwise(done.fail);
    });

    it("incorporates parameters if legendUrl is created from scratch", function(done) {
      wmsItem.updateFromJson({
        url: "http://foo.com/bar",
        metadataUrl: "test/WMS/no_legend_url.xml",
        layers: "single_period",
        parameters: { alpha: "beta", foo: "bar" },
        dataUrl: "" // to prevent a DescribeLayer request
      });
      wmsItem
        .load()
        .then(function() {
          expect(
            wmsItem.legendUrl.url.indexOf(
              "http://foo.com/bar?service=WMS&version=1.1.0&request=GetLegendGraphic&format=image%2Fpng&transparent=True&layer=single_period&styles=jet&alpha=beta&foo=bar&srs=EPSG%3A3857"
            )
          ).toBe(0);
        })
        .then(done)
        .otherwise(done.fail);
    });

    it("is read from XML when specified with a single style", function(done) {
      wmsItem.updateFromJson({
        url: "http://example.com",
        metadataUrl: "test/WMS/single_style_legend_url.xml",
        layers: "single_period",
        dataUrl: "" // to prevent a DescribeLayer request
      });
      wmsItem
        .load()
        .then(function() {
          expect(wmsItem.legendUrl).toEqual(
            new LegendUrl(
              "http://www.example.com/foo?request=GetLegendGraphic&firstUrl&srs=EPSG%3A3857",
              "image/gif"
            )
          );
        })
        .then(done)
        .otherwise(done.fail);
    });

    it("is read from the first style tag when XML specifies multiple styles for a layer, provided style is unspecified", function(done) {
      wmsItem.updateFromJson({
        url: "http://example.com",
        metadataUrl: "test/WMS/multiple_style_legend_url.xml",
        layers: "single_period",
        dataUrl: "" // to prevent a DescribeLayer request
      });
      wmsItem
        .load()
        .then(function() {
          expect(wmsItem.legendUrl).toEqual(
            new LegendUrl(
              "http://www.example.com/foo?request=GetLegendGraphic&firstUrl&srs=EPSG%3A3857",
              "image/gif"
            )
          );
        })
        .then(done)
        .otherwise(done.fail);
    });

    it("is read from the first LegendURL tag when XML specifies multiple LegendURL tags for a style", function(done) {
      wmsItem.updateFromJson({
        url: "http://example.com",
        metadataUrl: "test/WMS/single_style_multiple_legend_urls.xml",
        layers: "single_period",
        dataUrl: "" // to prevent a DescribeLayer request
      });
      wmsItem
        .load()
        .then(function() {
          expect(wmsItem.legendUrl).toEqual(
            new LegendUrl(
              "http://www.example.com/foo?request=GetLegendGraphic&firstUrl&srs=EPSG%3A3857",
              "image/gif"
            )
          );
        })
        .then(done)
        .otherwise(done.fail);
    });

    it("is not overridden by the XML value when set manually", function(done) {
      wmsItem.updateFromJson({
        url: "http://example.com",
        metadataUrl: "test/WMS/single_style_legend_url.xml",
        layers: "single_period",
        dataUrl: "" // to prevent a DescribeLayer request
      });

      wmsItem.legendUrl = new LegendUrl("http://www.example.com/blahFace");

      wmsItem
        .load()
        .then(function() {
          expect(wmsItem.legendUrl).toEqual(
            new LegendUrl("http://www.example.com/blahFace")
          );
        })
        .then(done)
        .otherwise(done.fail);
    });
  });

  describe("metadata urls", function() {
    it("are parsed when one is present", function(done) {
      wmsItem.updateFromJson({
        url: "http://foo.com/bar",
        metadataUrl: "test/WMS/single_metadata_url.xml",
        layers: "single_period",
        dataUrl: "" // to prevent a DescribeLayer request
      });
      wmsItem
        .load()
        .then(function() {
          expect(wmsItem.findInfoSection("Metadata Links").content).toBe(
            "http://examplemetadata.com"
          );
        })
        .then(done)
        .otherwise(fail);
    });

    it("are parsed when multiple are present", function(done) {
      wmsItem.updateFromJson({
        url: "http://foo.com/bar",
        metadataUrl: "test/WMS/multiple_metadata_url.xml",
        layers: "single_period",
        dataUrl: "" // to prevent a DescribeLayer request
      });
      wmsItem
        .load()
        .then(function() {
          expect(wmsItem.findInfoSection("Metadata Links").content).toBe(
            "http://examplemetadata1.com<br>http://examplemetadata2.com"
          );
        })
        .then(done)
        .otherwise(fail);
    });
  });

  it("derives getCapabilitiesUrl from url if getCapabilitiesUrl is not explicitly provided", function() {
    wmsItem.url = "http://foo.com/bar";
    expect(wmsItem.getCapabilitiesUrl.indexOf(wmsItem.url)).toBe(0);
  });

  it("uses explicitly-provided getCapabilitiesUrl", function() {
    wmsItem.getCapabilitiesUrl = "http://foo.com/metadata";
    wmsItem.url = "http://foo.com/somethingElse";
    expect(wmsItem.getCapabilitiesUrl).toBe("http://foo.com/metadata");
  });

  it("defaults to having no dataUrl", function() {
    wmsItem.url = "http://foo.bar";
    expect(wmsItem.dataUrl).toBeUndefined();
    expect(wmsItem.dataUrlType).toBeUndefined();
  });

  it("uses explicitly-provided dataUrl and dataUrlType", function() {
    wmsItem.dataUrl = "http://foo.com/data";
    wmsItem.dataUrlType = "wfs-complete";
    wmsItem.url = "http://foo.com/somethingElse";
    expect(wmsItem.dataUrl).toBe("http://foo.com/data");
    expect(wmsItem.dataUrlType).toBe("wfs-complete");
  });

  it("can update from json", function() {
    wmsItem.updateFromJson({
      name: "Name",
      description: "Description",
      rectangle: [-10, 10, -20, 20],
      legendUrl: "http://legend.com",
      dataUrlType: "wfs",
      dataUrl: "http://my.wfs.com/wfs",
      dataCustodian: "Data Custodian",
      getCapabilitiesUrl: "http://my.metadata.com",
      url: "http://my.wms.com",
      layers: "mylayer",
      parameters: {
        custom: true,
        awesome: "maybe"
      },
      tilingScheme: new WebMercatorTilingScheme(),
      getFeatureInfoFormats: []
    });

    expect(wmsItem.name).toBe("Name");
    expect(wmsItem.description).toBe("Description");
    expect(wmsItem.rectangle).toEqual(Rectangle.fromDegrees(-10, 10, -20, 20));
    expect(wmsItem.legendUrl).toEqual(new LegendUrl("http://legend.com"));
    expect(wmsItem.dataUrlType).toBe("wfs");
    expect(wmsItem.dataUrl.indexOf("http://my.wfs.com/wfs")).toBe(0);
    expect(wmsItem.dataCustodian).toBe("Data Custodian");
    expect(wmsItem.getCapabilitiesUrl).toBe("http://my.metadata.com");
    expect(wmsItem.url).toBe("http://my.wms.com");
    expect(wmsItem.layers).toBe("mylayer");
    expect(wmsItem.parameters).toEqual({
      custom: true,
      awesome: "maybe"
    });
    expect(wmsItem.tilingScheme instanceof WebMercatorTilingScheme).toBe(true);
    expect(wmsItem.getFeatureInfoFormats).toEqual([]);
  });

  it("uses reasonable defaults for updateFromJson", function() {
    wmsItem.updateFromJson({});

    expect(wmsItem.name).toBe("Unnamed Item");
    expect(wmsItem.description).toBe("");
    expect(wmsItem.rectangle).toBeUndefined();
    expect(wmsItem.legendUrl).toBeUndefined();
    expect(wmsItem.dataUrlType).toBeUndefined();
    expect(wmsItem.dataUrl).toBeUndefined();
    expect(wmsItem.dataCustodian).toBeUndefined();
    expect(wmsItem.metadataUrl).toBeUndefined();
    expect(wmsItem.url).toBeUndefined();
    expect(wmsItem.layers).toBe("");
    expect(wmsItem.parameters).toEqual({});
    expect(wmsItem.tilingScheme).toBeUndefined();
    expect(wmsItem.getFeatureInfoFormats).toBeUndefined();
  });

  it("requests styles property", function() {
    // Spy on the request to create an image, so that we can see what URL is requested.
    // Unfortunately this is implementation-dependent.
    spyOn(ImageryProvider, "loadImage");
    wmsItem.updateFromJson({
      dataUrlType: "wfs",
      url: "http://my.wms.com",
      layers: "mylayer",
      tilingScheme: new WebMercatorTilingScheme(),
      getFeatureInfoFormats: [],
      parameters: {
        styles: "foobar"
      }
    });
    var imageryLayer = wmsItem.createImageryProvider();
    imageryLayer.requestImage(0, 0, 2);
    var requestedUrl = ImageryProvider.loadImage.calls.argsFor(0)[0].url;
    expect(requestedUrl.toLowerCase()).toContain("styles=foobar");
  });

  it("requests styles property even if uppercase", function() {
    // Spy on the request to create an image, so that we can see what URL is requested.
    // Unfortunately this is implementation-dependent.
    spyOn(ImageryProvider, "loadImage");
    wmsItem.updateFromJson({
      dataUrlType: "wfs",
      url: "http://my.wms.com",
      layers: "mylayer",
      tilingScheme: new WebMercatorTilingScheme(),
      getFeatureInfoFormats: [],
      parameters: {
        STYLES: "foobar"
      }
    });
    var imageryLayer = wmsItem.createImageryProvider();
    imageryLayer.requestImage(0, 0, 2);
    var requestedUrl = ImageryProvider.loadImage.calls.argsFor(0)[0].url;
    expect(requestedUrl.toLowerCase()).toContain("styles=foobar");
  });

  it("can be round-tripped with serializeToJson and updateFromJson", function() {
    wmsItem.name = "Name";
    wmsItem.id = "Id";
    // wmsItem.description = 'Description';
    wmsItem.rectangle = Rectangle.fromDegrees(-10, 10, -20, 20);
    wmsItem.legendUrl = new LegendUrl("http://legend.com", "image/png");
    wmsItem.dataUrlType = "wfs";
    wmsItem.dataUrl = "http://my.wfs.com/wfs";
    wmsItem.dataCustodian = "Data Custodian";
    wmsItem.metadataUrl = "http://my.metadata.com";
    wmsItem.url = "http://my.wms.com";
    wmsItem.layers = "mylayer";
    wmsItem.parameters = {
      custom: true,
      awesome: "maybe"
    };
    wmsItem.getFeatureInfoFormats = [];

    // This initialTime is before any interval, so internally it will be changed to the first start date.
    wmsItem.initialTimeSource = "2012-01-01T12:00:00Z";

    wmsItem.intervals = new TimeIntervalCollection([
      new TimeInterval({
        start: JulianDate.fromIso8601("2013-08-01T15:00:00Z"),
        stop: JulianDate.fromIso8601("2013-08-01T18:00:00Z")
      }),
      new TimeInterval({
        start: JulianDate.fromIso8601("2013-09-01T11:00:00Z"),
        stop: JulianDate.fromIso8601("2013-09-03T13:00:00Z")
      })
    ]);

    var json = wmsItem.serializeToJson();

    var reconstructed = new WebMapServiceCatalogItem(terria);
    reconstructed.updateFromJson(json);

    // We'll check for these later in toEqual but this makes it a bit easier to see what's different.
    expect(reconstructed.name).toBe(wmsItem.name);
    // We do not serialize the description, to keep the serialization shorter.
    // expect(reconstructed.description).toBe(wmsItem.description);
    expect(reconstructed.rectangle).toEqual(wmsItem.rectangle);
    expect(reconstructed.legendUrl).toEqual(wmsItem.legendUrl);
    expect(reconstructed.legendUrls).toEqual(wmsItem.legendUrls);
    expect(reconstructed.dataUrlType).toBe(wmsItem.dataUrlType);
    expect(reconstructed.dataUrl).toBe(wmsItem.dataUrl);
    expect(reconstructed.dataCustodian).toBe(wmsItem.dataCustodian);
    expect(reconstructed.metadataUrl).toBe(wmsItem.metadataUrl);
    expect(reconstructed.url).toBe(wmsItem.url);
    expect(reconstructed.layers).toBe(wmsItem.layers);
    expect(reconstructed.parameters).toBe(wmsItem.parameters);
    expect(reconstructed.getFeatureInfoFormats).toEqual(
      wmsItem.getFeatureInfoFormats
    );
    // Do not compare time, because on some systems the second could have ticked over between getting the two times.
    var initialTimeSource = reconstructed.initialTimeSource.substr(0, 10);
    expect(initialTimeSource).toEqual("2013-08-01");
    // We do not serialize the intervals, to keep the serialization shorter.
    // expect(reconstructed.intervals.length).toEqual(wmsItem.intervals.length);
  });

  it("can get handle plain text in textAttribution", function() {
    wmsItem.updateFromJson({
      attribution: "Plain text"
    });
    expect(wmsItem.attribution).toEqual(new Credit("Plain text"));
  });
  it("can handle object in textAttribution", function() {
    var test = {
      text: "test",
      link: "link"
    };
    wmsItem.updateFromJson({
      attribution: test
    });
    expect(wmsItem.attribution.html).toContain("test");
    expect(wmsItem.attribution.html).toContain("link");
  });

  it("can understand comma-separated datetimes", function(done) {
    // <Dimension name="time" units="ISO8601" multipleValues="true" current="true" default="2014-01-01T00:00:00.000Z">
    // 2002-01-01T00:00:00.000Z,2003-01-01T00:00:00.000Z,2004-01-01T00:00:00.000Z,
    // 2005-01-01T00:00:00.000Z,2006-01-01T00:00:00.000Z,2007-01-01T00:00:00.000Z,
    // 2008-01-01T00:00:00.000Z,2009-01-01T00:00:00.000Z,2010-01-01T00:00:00.000Z,
    // 2011-01-01T00:00:00.000Z,2012-01-01T00:00:00.000Z,2013-01-01T00:00:00.000Z,
    // 2014-01-01T00:00:00.000Z
    // </Dimension>
    wmsItem.updateFromJson({
      url: "http://example.com",
      metadataUrl: "test/WMS/comma_sep_datetimes.xml",
      layers: "13_intervals",
      dataUrl: "" // to prevent a DescribeLayer request
    });
    wmsItem
      .load()
      .then(function() {
        expect(wmsItem.intervals.length).toEqual(13);

        const firstInterval = wmsItem.intervals.get(0);
        expect(firstInterval.data).toEqual("2002-01-01T00:00:00.000Z");
        expect(firstInterval.start.dayNumber).toEqual(2452275);
        expect(firstInterval.start.secondsOfDay).toEqual(43232);
        expect(firstInterval.stop.dayNumber).toEqual(2452640);
        expect(firstInterval.stop.secondsOfDay).toEqual(43232);

        const lastInterval = wmsItem.intervals.get(12);
        expect(lastInterval.data).toEqual("2014-01-01T00:00:00.000Z");
        expect(lastInterval.start.dayNumber).toEqual(2456658);
        expect(lastInterval.start.secondsOfDay).toEqual(43235);
        expect(lastInterval.stop.dayNumber).toEqual(2457023);
        expect(lastInterval.stop.secondsOfDay).toEqual(43235);
      })
      .then(done)
      .otherwise(done.fail);
  });

  it("can understand two-part period datetimes", function(done) {
    // <Dimension name="time" units="ISO8601" />
    //   <Extent name="time">2015-04-27T16:15:00/2015-04-27T18:45:00</Extent>
    wmsItem.updateFromJson({
      url: "http://example.com",
      metadataUrl: "test/WMS/single_period_datetimes.xml",
      layers: "single_period",
      dataUrl: "" // to prevent a DescribeLayer request
    });
    wmsItem
      .load()
      .then(function() {
        expect(wmsItem.intervals.length).toEqual(1);

        const firstInterval = wmsItem.intervals.get(0);
        // expect(firstInterval.data).toEqual("2015-04-27T06:15:00.000Z");
        // expect(typeof firstInterval.data).toEqual("string");

        expect(firstInterval.start.dayNumber).toEqual(2457140);
        expect(firstInterval.start.secondsOfDay).toEqual(15335);
        expect(firstInterval.stop.dayNumber).toEqual(2457140);
        expect(firstInterval.stop.secondsOfDay).toEqual(24335);
      })
      .then(done)
      .otherwise(done.fail);
  });

  it("can understand three-part period datetimes", function(done) {
    // <Dimension name="time" units="ISO8601" />
    //   <Extent name="time">2015-04-27T16:15:00/2015-04-27T18:45:00/PT15M</Extent>
    wmsItem.updateFromJson({
      url: "http://example.com",
      metadataUrl: "test/WMS/period_datetimes.xml",
      layers: "single_period",
      dataUrl: "" // to prevent a DescribeLayer request
    });
    wmsItem
      .load()
      .then(function() {
        expect(wmsItem.intervals.length).toEqual(11);

        const firstInterval = wmsItem.intervals.get(0);
        expect(firstInterval.data).toEqual("2015-04-27T16:15:00Z");
        expect(typeof firstInterval.data).toEqual("string");
        expect(typeof firstInterval.start).toEqual(typeof new JulianDate());
        expect(typeof firstInterval.stop).toEqual(typeof new JulianDate());

        expect(firstInterval.start.dayNumber).toEqual(2457140);
        expect(firstInterval.start.secondsOfDay).toEqual(15335);
        expect(firstInterval.stop.dayNumber).toEqual(2457140);
        expect(firstInterval.stop.secondsOfDay).toEqual(16235);

        const lastInterval = wmsItem.intervals.get(10);
        expect(lastInterval.data).toEqual("2015-04-27T18:45:00Z");
      })
      .then(done)
      .otherwise(done.fail);
  });

  it("can understand three-part period date with no time", function(done) {
    // <Dimension name="time" units="ISO8601" />
    //   <Extent name="time">2015-04-27/2015-04-29/P1D</Extent>
    wmsItem.updateFromJson({
      url: "http://example.com",
      metadataUrl: "test/WMS/period_date_notime.xml",
      layers: "single_period",
      dataUrl: "" // to prevent a DescribeLayer request
    });
    wmsItem
      .load()
      .then(function() {
        expect(wmsItem.intervals.length).toEqual(3);

        const firstInterval = wmsItem.intervals.get(0);
        expect(firstInterval.data).toEqual("2015-04-27");

        const lastInterval = wmsItem.intervals.get(2);
        expect(lastInterval.data).toEqual("2015-04-29");
      })
      .then(done)
      .otherwise(done.fail);
  });

  it("limits intervals returned", function(done) {
    // <Dimension name="time" units="ISO8601" />
    //   <Extent name="time">2015-04-27T16:15:00/2018-04-27T18:45:00/PT15M</Extent>
    wmsItem.updateFromJson({
      url: "http://example.com",
      metadataUrl: "test/WMS/period_datetimes_many_intervals.xml",
      layers: "single_period",
      dataUrl: "" // to prevent a DescribeLayer request
    });
    wmsItem
      .load()
      .then(function() {
        expect(wmsItem.intervals.length).toEqual(1000);
      })
      .then(done)
      .otherwise(done.fail);
  });

  it("supports multiple units in a single period", function(done) {
    // <Dimension name="time" units="ISO8601" />
    //   <Extent name="time">2015-04-27T16:00:00/2015-04-27T16:15:00/PT1M57S</Extent>
    wmsItem.updateFromJson({
      url: "http://example.com",
      metadataUrl: "test/WMS/period_datetimes_multiple_units.xml",
      layers: "single_period",
      dataUrl: "" // to prevent a DescribeLayer request
    });
    wmsItem
      .load()
      .then(function() {
        expect(wmsItem.intervals.length).toEqual(8);
      })
      .then(done)
      .otherwise(done.fail);
  });

  it("ignores leap seconds when evaluating period", function(done) {
    // <Dimension name="time" units="ISO8601" />
    //   <Extent name="time">2015-06-30T20:00:00Z/2015-07-01T01:00:00Z/PT15M</Extent>
    wmsItem.updateFromJson({
      url: "http://example.com",
      metadataUrl: "test/WMS/period_datetimes_crossing_leap_second.xml",
      layers: "single_period",
      dataUrl: "" // to prevent a DescribeLayer request
    });
    wmsItem
      .load()
      .then(function() {
        expect(wmsItem.intervals.length).toEqual(9);
        expect(wmsItem.intervals.get(8).start).toEqual(
          JulianDate.fromIso8601("2015-07-01T01:00:00Z")
        );
        expect(wmsItem.intervals.get(8).stop).toEqual(
          JulianDate.fromIso8601("2015-07-01T01:15:00Z")
        );
      })
      .then(done)
      .otherwise(done.fail);
  });

  it("warns on bad periodicity in datetimes", function(done) {
    // <Dimension name="time" units="ISO8601" />
    //   <Extent name="time">2015-04-27T16:15:00/2015-04-27T18:45:00/PBAD</Extent>
    wmsItem.updateFromJson({
      url: "http://example.com",
      metadataUrl: "test/WMS/bad_datetime.xml",
      layers: "single_period",
      dataUrl: "" // to prevent a DescribeLayer request
    });
    var remover = wmsItem.terria.error.addEventListener(function() {
      expect(true).toBe(true);
      remover();
      done();
    });
    wmsItem.load();
  });

  it("uses time dimension inherited from parent", function(done) {
    // <Dimension name="time" units="ISO8601" multipleValues="true" current="true" default="2014-01-01T00:00:00.000Z">
    // 2002-01-01T00:00:00.000Z,2003-01-01T00:00:00.000Z,2004-01-01T00:00:00.000Z,
    // 2005-01-01T00:00:00.000Z,2006-01-01T00:00:00.000Z,2007-01-01T00:00:00.000Z,
    // 2008-01-01T00:00:00.000Z,2009-01-01T00:00:00.000Z,2010-01-01T00:00:00.000Z,
    // 2011-01-01T00:00:00.000Z,2012-01-01T00:00:00.000Z,2013-01-01T00:00:00.000Z,
    // 2014-01-01T00:00:00.000Z
    // </Dimension>
    wmsItem.updateFromJson({
      url: "http://example.com",
      metadataUrl: "test/WMS/comma_sep_datetimes_inherited.xml",
      layers: "13_intervals",
      dataUrl: "" // to prevent a DescribeLayer request
    });
    wmsItem
      .load()
      .then(function() {
        expect(wmsItem.intervals.length).toEqual(13);
      })
      .then(done)
      .otherwise(done.fail);
  });

  it("discards invalid layer names as long as at least one layer name is valid", function(done) {
    wmsItem.updateFromJson({
      url: "http://example.com",
      metadataUrl: "test/WMS/single_style_legend_url.xml",
      layers: "foo,single_period",
      dataUrl: "" // to prevent a DescribeLayer request
    });
    wmsItem
      .load()
      .then(function() {
        expect(wmsItem.layers).toBe("single_period");
      })
      .then(done)
      .otherwise(done.fail);
  });

  it("fails to load if all layer names are invalid", function(done) {
    wmsItem.updateFromJson({
      url: "http://example.com",
      metadataUrl: "test/WMS/single_style_legend_url.xml",
      layers: "foo,bar",
      dataUrl: "" // to prevent a DescribeLayer request
    });
    wmsItem
      .load()
      .then(done.fail)
      .otherwise(done);
  });

  it("supports a namespaced layer name", function(done) {
    wmsItem.updateFromJson({
      url: "http://example.com",
      metadataUrl: "test/WMS/single_style_legend_url.xml",
      layers: "namespace:single_period",
      dataUrl: "" // to prevent a DescribeLayer request
    });
    wmsItem
      .load()
      .then(function() {
        expect(wmsItem.layers).toBe("single_period");
      })
      .then(done)
      .otherwise(done.fail);
  });

  it("detects ncWMS implementation correctly", function(done) {
    wmsItem.updateFromJson({
      url: "http://example.com",
      metadataUrl: "test/WMS/ncwms_service.xml",
      layers: "ncwms",
      dataUrl: "" // to prevent a DescribeLayer request
    });
    wmsItem
      .load()
      .then(function() {
        expect(wmsItem.isNcWMS).toBe(true);
        expect(wmsItem.supportsColorScaleRange).toBe(true);
      })
      .then(done)
      .otherwise(done.fail);
  });

  it("detects ncWMS2 implementation correctly", function(done) {
    wmsItem.updateFromJson({
      url: "http://example.com",
      metadataUrl: "test/WMS/ncwms2_service.xml",
      layers: "mylayer",
      dataUrl: "" // to prevent a DescribeLayer request
    });
    wmsItem
      .load()
      .then(function() {
        expect(wmsItem.isNcWMS).toBe(true);
        expect(wmsItem.supportsColorScaleRange).toBe(true);
      })
      .then(done)
      .otherwise(done.fail);
  });

  it("does not indicate ncWMS on other service", function(done) {
    wmsItem.updateFromJson({
      url: "http://example.com",
      metadataUrl: "test/WMS/single_style_legend_url.xml",
      layers: "single_period",
      dataUrl: "" // to prevent a DescribeLayer request
    });
    wmsItem
      .load()
      .then(function() {
        expect(wmsItem.isNcWMS).toBe(undefined);
        done();
      })
      .then(done)
      .otherwise(done.fail);
  });

  it("detects support for COLORSCALERANGE via ExtendedCapabilities (exposed by latest versions of ncWMS2)", function(done) {
    wmsItem.updateFromJson({
      url: "http://example.com",
      metadataUrl: "test/WMS/colorscalerange.xml",
      layers: "mylayer",
      dataUrl: "" // to prevent a DescribeLayer request
    });
    wmsItem
      .load()
      .then(function() {
        expect(wmsItem.supportsColorScaleRange).toBe(true);
      })
      .then(done)
      .otherwise(done.fail);
  });

  describe("dimensions", function() {
    it("are loaded from GetCapabilities", function(done) {
      wmsItem.updateFromJson({
        url: "http://example.com",
        metadataUrl: "test/WMS/styles_and_dimensions.xml",
        layers: "A",
        dataUrl: "" // to prevent a DescribeLayer request
      });

      wmsItem
        .load()
        .then(function() {
          expect(wmsItem.availableDimensions).toBeDefined();
          expect(wmsItem.availableDimensions.A).toBeDefined();
          expect(wmsItem.availableDimensions.B).toBeDefined();

          var aDimensions = wmsItem.availableDimensions.A;
          expect(aDimensions.length).toBe(3);

          expect(aDimensions[0].name).toEqual("elevation");
          expect(aDimensions[0].units).toEqual("meters");
          expect(aDimensions[0].unitSymbol).toEqual("m");
          expect(aDimensions[0].default).toEqual("-0.03125");
          expect(aDimensions[0].options).toEqual([
            "-0.96875",
            "-0.90625",
            "-0.84375",
            "-0.78125",
            "-0.71875",
            "-0.65625",
            "-0.59375",
            "-0.53125",
            "-0.46875",
            "-0.40625",
            "-0.34375",
            "-0.28125",
            "-0.21875",
            "-0.15625",
            "-0.09375",
            "-0.03125"
          ]);

          expect(aDimensions[1].name).toEqual("custom");
          expect(aDimensions[1].units).toEqual("A");
          expect(aDimensions[1].unitSymbol).toEqual("B");
          expect(aDimensions[1].default).toEqual("Third thing");
          expect(aDimensions[1].options).toEqual([
            "Something",
            "Another thing",
            "Third thing",
            "yeah"
          ]);

          expect(aDimensions[2].name).toEqual("time");
          expect(aDimensions[2].units).toEqual("ISO8601");
          expect(aDimensions[2].unitSymbol).not.toBeDefined();
          expect(aDimensions[2].default).toEqual("2016-09-24T00:00:00.000Z");
          expect(aDimensions[2].options).toEqual([
            "2012-06-25T01:00:00.000Z/2012-06-26T00:00:00.000Z/PT1H",
            "2012-06-27T01:00:00.000Z/2012-06-30T00:00:00.000Z/PT1H",
            "2012-07-02T01:00:00.000Z/2012-07-03T00:00:00.000Z/PT1H",
            "2012-07-05T01:00:00.000Z/2012-07-09T00:00:00.000Z/PT1H"
          ]);
        })
        .then(done)
        .otherwise(done.fail);
    });

    it("elevation is passed to imagery provider constructor", function(done) {
      wmsItem.updateFromJson({
        url: "http://example.com",
        metadataUrl: "test/WMS/styles_and_dimensions.xml",
        layers: "A",
        dimensions: {
          elevation: "-0.90625"
        },
        dataUrl: "" // to prevent a DescribeLayer request
      });

      wmsItem
        .load()
        .then(function() {
          var imageryProvider = wmsItem._createImageryProvider();
          expect(imageryProvider._tileProvider.url).toContain(
            "elevation=-0.90625"
          );
        })
        .then(done)
        .otherwise(done.fail);
    });

    it("custom dimension is passed to imagery provider constructor", function(done) {
      wmsItem.updateFromJson({
        url: "http://example.com",
        metadataUrl: "test/WMS/styles_and_dimensions.xml",
        layers: "A",
        dimensions: {
          custom: "Another thing"
        },
        dataUrl: "" // to prevent a DescribeLayer request
      });

      wmsItem
        .load()
        .then(function() {
          var imageryProvider = wmsItem._createImageryProvider();
          expect(imageryProvider._tileProvider.url).toContain(
            "dim_custom=Another%20thing"
          );
        })
        .then(done)
        .otherwise(done.fail);
    });
  });
});
