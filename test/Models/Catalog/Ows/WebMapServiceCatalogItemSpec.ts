import { autorun, runInAction } from "mobx";
import GeographicTilingScheme from "terriajs-cesium/Source/Core/GeographicTilingScheme";
import WebMercatorTilingScheme from "terriajs-cesium/Source/Core/WebMercatorTilingScheme";
import WebMapServiceImageryProvider from "terriajs-cesium/Source/Scene/WebMapServiceImageryProvider";
import { ImageryParts } from "../../../../lib/ModelMixins/MappableMixin";
import CommonStrata from "../../../../lib/Models/Definition/CommonStrata";
import Terria from "../../../../lib/Models/Terria";
import WebMapServiceCatalogItem from "../../../../lib/Models/Catalog/Ows/WebMapServiceCatalogItem";

describe("WebMapServiceCatalogItem", function() {
  it("derives getCapabilitiesUrl from url if getCapabilitiesUrl is not specified", function() {
    const terria = new Terria();
    const wms = new WebMapServiceCatalogItem("test", terria);
    wms.setTrait("definition", "url", "foo.bar.baz");
    expect(wms.getCapabilitiesUrl).toBeDefined();
    expect(wms.url).toBeDefined();
    expect(
      wms.getCapabilitiesUrl &&
        wms.getCapabilitiesUrl.indexOf(wms.url || "undefined") === 0
    ).toBe(true);
  });

  it("loads", function() {
    expect().nothing();
    const terria = new Terria();
    const wms = new WebMapServiceCatalogItem("test", terria);
    runInAction(() => {
      wms.setTrait("definition", "url", "test/WMS/single_metadata_url.xml");
      wms.setTrait(
        "definition",
        "layers",
        "mobile-black-spot-programme:funded-base-stations-group"
      );
    });
    return wms.loadMapItems();
  });

  describe("selects correct tilingScheme", () => {
    it("uses 4326 is no 3857", async function() {
      const terria = new Terria();
      const wms = new WebMapServiceCatalogItem("test", terria);
      runInAction(() => {
        wms.setTrait("definition", "url", "test/WMS/wms_crs.xml");
        wms.setTrait("definition", "layers", "ls8_nbart_geomedian_annual");
      });
      await wms.loadMapItems();

      expect(wms.crs).toBe("EPSG:4326");
      expect(wms.tilingScheme instanceof GeographicTilingScheme).toBeTruthy();
    });

    it("uses 3857 over 4326", async function() {
      const terria = new Terria();
      const wms = new WebMapServiceCatalogItem("test", terria);
      runInAction(() => {
        wms.setTrait("definition", "url", "test/WMS/wms_nested_groups.xml");
        wms.setTrait("definition", "layers", "ls8_nbart_geomedian_annual");
      });
      await wms.loadMapItems();

      expect(wms.crs).toBe("EPSG:3857");
      expect(wms.tilingScheme instanceof WebMercatorTilingScheme).toBeTruthy();
    });
  });

  it("updates description from a GetCapabilities", async function() {
    let wms: WebMapServiceCatalogItem;
    const terria = new Terria();
    wms = new WebMapServiceCatalogItem("test", terria);
    runInAction(() => {
      wms.setTrait("definition", "url", "test/WMS/single_metadata_url.xml");
      wms.setTrait("definition", "layers", "single_period");
    });
    let description: String | undefined;
    const cleanup = autorun(() => {
      if (wms.info !== undefined) {
        const descSection = wms.info.find(
          section => section.name === "Web Map Service Layer Description"
        );
        if (
          descSection !== undefined &&
          descSection.content !== undefined &&
          descSection.content !== null
        ) {
          description = descSection.content;
        }
      }
    });
    try {
      await wms.loadMetadata();
      expect(description).toBe("description foo bar baz");
    } finally {
      cleanup();
    }
  });

  it("correctly contstructs ImageryProvider", async function() {
    let wms: WebMapServiceCatalogItem;
    const terria = new Terria();
    wms = new WebMapServiceCatalogItem("test", terria);
    runInAction(() => {
      wms.setTrait("definition", "url", "test/WMS/single_metadata_url.xml");
      wms.setTrait(
        "definition",
        "layers",
        "mobile-black-spot-programme:funded-base-stations-group"
      );
    });
    let mapItems: ImageryParts[] = [];
    const cleanup = autorun(() => {
      mapItems = wms.mapItems.slice();
    });
    try {
      await wms.loadMetadata();
      expect(mapItems.length).toBe(1);
      expect(mapItems[0].alpha).toBeCloseTo(0.8);
      expect(
        mapItems[0].imageryProvider instanceof WebMapServiceImageryProvider
      ).toBeTruthy();
      if (mapItems[0].imageryProvider instanceof WebMapServiceImageryProvider) {
        expect(mapItems[0].imageryProvider.url).toBe(
          "test/WMS/single_metadata_url.xml"
        );
        expect(mapItems[0].imageryProvider.tileHeight).toBe(256);
        expect(mapItems[0].imageryProvider.tileWidth).toBe(256);
      }
    } finally {
      cleanup();
    }
  });

  it("constructs correct ImageryProvider when layers trait provided Title", async function() {
    let wms: WebMapServiceCatalogItem;
    const terria = new Terria();
    wms = new WebMapServiceCatalogItem("test", terria);
    runInAction(() => {
      wms.setTrait("definition", "url", "test/WMS/wms_nested_groups.xml");
      wms.setTrait(
        "definition",
        "layers",
        "Landsat 30+ Barest Earth 25m albers (Combined Landsat)"
      );
    });
    let mapItems: ImageryParts[] = [];
    const cleanup = autorun(() => {
      mapItems = wms.mapItems.slice();
    });
    try {
      await wms.loadMetadata();
      //@ts-ignore
      expect(mapItems[0].imageryProvider.layers).toBe("landsat_barest_earth");
    } finally {
      cleanup();
    }
  });

  it("uses tileWidth and tileHeight", async function() {
    let wms: WebMapServiceCatalogItem;
    const terria = new Terria();
    wms = new WebMapServiceCatalogItem("test", terria);
    runInAction(() => {
      wms.setTrait("definition", "url", "test/WMS/single_metadata_url.xml");
      wms.setTrait(
        "definition",
        "layers",
        "mobile-black-spot-programme:funded-base-stations-group"
      );
      wms.setTrait("definition", "tileWidth", 512);
      wms.setTrait("definition", "tileHeight", 512);
    });
    let mapItems: ImageryParts[] = [];
    const cleanup = autorun(() => {
      mapItems = wms.mapItems.slice();
    });
    try {
      await wms.loadMetadata();
      expect(
        mapItems[0].imageryProvider instanceof WebMapServiceImageryProvider
      ).toBeTruthy();
      if (mapItems[0].imageryProvider instanceof WebMapServiceImageryProvider) {
        expect(mapItems[0].imageryProvider.tileHeight).toBe(512);
        expect(mapItems[0].imageryProvider.tileWidth).toBe(512);
      }
    } finally {
      cleanup();
    }
  });

  it("uses default time", function(done) {
    const terria = new Terria();
    const wmsItem = new WebMapServiceCatalogItem("some-layer", terria);
    runInAction(() => {
      wmsItem.setTrait(CommonStrata.definition, "url", "http://example.com");
      wmsItem.setTrait(
        CommonStrata.definition,
        "getCapabilitiesUrl",
        "test/WMS/styles_and_dimensions.xml"
      );
      wmsItem.setTrait(CommonStrata.definition, "layers", "A,B");
    });

    wmsItem
      .loadMetadata()
      .then(function() {
        expect(wmsItem.currentTime).toBe("2016-09-24T00:00:00.000Z");
      })
      .then(done)
      .catch(done.fail);
  });

  it("dimensions and styles for a 'real' WMS layer", function(done) {
    const terria = new Terria();
    const wmsItem = new WebMapServiceCatalogItem("some-layer", terria);
    runInAction(() => {
      wmsItem.setTrait(CommonStrata.definition, "url", "http://example.com");
      wmsItem.setTrait(
        CommonStrata.definition,
        "getCapabilitiesUrl",
        "test/WMS/styles_and_dimensions.xml"
      );
      wmsItem.setTrait(CommonStrata.definition, "layers", "A,B");
      wmsItem.setTrait(CommonStrata.definition, "dimensions", {
        custom: "Another thing",
        elevation: "-0.59375"
      });
      wmsItem.setTrait(
        CommonStrata.definition,
        "styles",
        "contour/ferret,shadefill/alg2"
      );
    });

    wmsItem
      .loadMetadata()
      .then(function() {
        expect(wmsItem.styleSelectableDimensions.length).toBe(2);

        // Check Styles and dimensions
        expect(wmsItem.styleSelectableDimensions[0].selectedId).toBe(
          "contour/ferret"
        );
        expect(wmsItem.styleSelectableDimensions[0].options!.length).toBe(41);

        expect(wmsItem.styleSelectableDimensions[1].selectedId).toBe(
          "shadefill/alg2"
        );
        expect(wmsItem.styleSelectableDimensions[1].options!.length).toBe(40);

        expect(wmsItem.wmsDimensionSelectableDimensions[0].name).toBe(
          "elevation"
        );
        expect(wmsItem.wmsDimensionSelectableDimensions[0].selectedId).toBe(
          "-0.59375"
        );
        expect(
          wmsItem.wmsDimensionSelectableDimensions[0].options!.length
        ).toBe(16);

        expect(wmsItem.wmsDimensionSelectableDimensions[1].name).toBe("custom");
        expect(wmsItem.wmsDimensionSelectableDimensions[1].selectedId).toBe(
          "Another thing"
        );
        expect(
          wmsItem.wmsDimensionSelectableDimensions[1].options!.length
        ).toBe(4);

        expect(wmsItem.wmsDimensionSelectableDimensions[2].name).toBe(
          "another"
        );
        expect(wmsItem.wmsDimensionSelectableDimensions[2].selectedId).toBe(
          "Second"
        );
        expect(
          wmsItem.wmsDimensionSelectableDimensions[2].options!.length
        ).toBe(3);

        expect(wmsItem.legends.length).toBe(2);
        expect(wmsItem.legends[0].url).toBe(
          "http://geoport-dev.whoi.edu/thredds/wms/coawst_4/use/fmrc/coawst_4_use_best.ncd?REQUEST=GetLegendGraphic&LAYER=v&PALETTE=ferret"
        );
        expect(wmsItem.legends[1].url).toBe(
          "http://geoport-dev.whoi.edu/thredds/wms/coawst_4/use/fmrc/coawst_4_use_best.ncd?REQUEST=GetLegendGraphic&LAYER=wetdry_mask_u&PALETTE=alg2"
        );
      })
      .then(done)
      .catch(done.fail);
  });

  it("fetches default legend", function(done) {
    const terria = new Terria();
    const wmsItem = new WebMapServiceCatalogItem("some-layer", terria);
    runInAction(() => {
      wmsItem.setTrait(CommonStrata.definition, "url", "http://example.com");
      wmsItem.setTrait(
        CommonStrata.definition,
        "getCapabilitiesUrl",
        "test/WMS/styles_and_dimensions.xml"
      );
      wmsItem.setTrait(CommonStrata.definition, "layers", "A");
    });

    wmsItem
      .loadMetadata()
      .then(function() {
        expect(wmsItem.legends.length).toBe(1);
        expect(wmsItem.legends[0].url).toBe(
          "http://geoport-dev.whoi.edu/thredds/wms/coawst_4/use/fmrc/coawst_4_use_best.ncd?REQUEST=GetLegendGraphic&LAYER=v&PALETTE=rainbow"
        );
      })
      .then(done)
      .catch(done.fail);
  });

  it("fetches geoserver legend", function(done) {
    const terria = new Terria();
    const wmsItem = new WebMapServiceCatalogItem("some-layer", terria);
    runInAction(() => {
      wmsItem.setTrait(CommonStrata.definition, "url", "http://example.com");
      wmsItem.setTrait(
        CommonStrata.definition,
        "getCapabilitiesUrl",
        "test/WMS/styles_and_dimensions.xml"
      );
      wmsItem.setTrait(CommonStrata.definition, "layers", "A");
      wmsItem.setTrait(CommonStrata.definition, "isGeoServer", true);
    });

    wmsItem
      .loadMetadata()
      .then(function() {
        expect(wmsItem.legends.length).toBe(1);

        // Match for fontColour = 0xffffff || 0xfff
        expect(
          wmsItem.legends[0].url ===
            "http://example.com/?service=WMS&version=1.3.0&request=GetLegendGraphic&format=image%2Fpng&layer=A&LEGEND_OPTIONS=fontName%3ACourier%3BfontStyle%3Abold%3BfontSize%3A12%3BforceLabels%3Aon%3BfontAntiAliasing%3Atrue%3BlabelMargin%3A5%3BfontColor%3A0xffffff%3Bdpi%3A182&transparent=true" ||
            wmsItem.legends[0].url ===
              "http://example.com/?service=WMS&version=1.3.0&request=GetLegendGraphic&format=image%2Fpng&layer=A&LEGEND_OPTIONS=fontName%3ACourier%3BfontStyle%3Abold%3BfontSize%3A12%3BforceLabels%3Aon%3BfontAntiAliasing%3Atrue%3BlabelMargin%3A5%3BfontColor%3A0xfff%3Bdpi%3A182&transparent=true"
        ).toBeTruthy();
      })
      .then(done)
      .catch(done.fail);
  });

  it("fetches GetLegendGraphic", function(done) {
    const terria = new Terria();
    const wmsItem = new WebMapServiceCatalogItem("some-layer", terria);
    runInAction(() => {
      wmsItem.setTrait(CommonStrata.definition, "url", "http://example.com");
      wmsItem.setTrait(
        CommonStrata.definition,
        "getCapabilitiesUrl",
        "test/WMS/styles_and_dimensions.xml"
      );
      wmsItem.setTrait(CommonStrata.definition, "layers", "A");
      wmsItem.setTrait(CommonStrata.definition, "styles", "no-legend");
      wmsItem.setTrait(
        CommonStrata.definition,
        "supportsGetLegendGraphic",
        true
      );
    });

    wmsItem
      .loadMetadata()
      .then(function() {
        expect(wmsItem.legends.length).toBe(1);
        expect(wmsItem.legends[0].url).toBe(
          "http://example.com/?service=WMS&version=1.3.0&request=GetLegendGraphic&format=image%2Fpng&layer=A&style=no-legend"
        );
      })
      .then(done)
      .catch(done.fail);
  });

  it("fetches legend with colourScaleRange", function(done) {
    const terria = new Terria();
    const wmsItem = new WebMapServiceCatalogItem("some-layer", terria);
    runInAction(() => {
      wmsItem.setTrait(
        CommonStrata.definition,
        "url",
        "http://geoport-dev.whoi.edu/thredds/wms/"
      );
      wmsItem.setTrait(
        CommonStrata.definition,
        "getCapabilitiesUrl",
        "test/WMS/styles_and_dimensions.xml"
      );
      wmsItem.setTrait(CommonStrata.definition, "layers", "A");
      wmsItem.setTrait(
        CommonStrata.definition,
        "supportsColorScaleRange",
        true
      );
      wmsItem.setTrait(CommonStrata.definition, "colorScaleMinimum", 0);
      wmsItem.setTrait(CommonStrata.definition, "colorScaleMaximum", 1);
    });

    wmsItem
      .loadMetadata()
      .then(function() {
        expect(wmsItem.isThredds).toBeTruthy();
        expect(wmsItem.legends.length).toBe(1);
        expect(wmsItem.legends[0].url).toBe(
          "http://geoport-dev.whoi.edu/thredds/wms/?service=WMS&version=1.3.0&request=GetLegendGraphic&format=image%2Fpng&layer=A&colorscalerange=0%2C1"
        );
      })
      .then(done)
      .catch(done.fail);
  });

  it("`selectableDimensions` is empty if `disableDimensionSelectors` is true", function(done) {
    const terria = new Terria();
    const wmsItem = new WebMapServiceCatalogItem("some-layer", terria);
    runInAction(() => {
      wmsItem.setTrait(CommonStrata.definition, "url", "http://example.com");
      wmsItem.setTrait(
        CommonStrata.definition,
        "getCapabilitiesUrl",
        "test/WMS/styles_and_dimensions.xml"
      );
      wmsItem.setTrait(CommonStrata.definition, "layers", "A,B");
      wmsItem.setTrait(CommonStrata.definition, "dimensions", {
        styles: "contour/ferret,shadefill/alg2",
        custom: "Another thing",
        elevation: "-0.59375"
      });
      wmsItem.setTrait(
        CommonStrata.definition,
        "styles",
        "contour/ferret,shadefill/alg2"
      );
      wmsItem.setTrait(CommonStrata.user, "disableDimensionSelectors", true);
    });

    wmsItem
      .loadMetadata()
      .then(function() {
        expect(wmsItem.selectableDimensions.length).toBe(0);
      })
      .then(done)
      .catch(done.fail);
  });
});
