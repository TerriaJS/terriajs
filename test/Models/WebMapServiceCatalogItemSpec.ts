import WebMapServiceCatalogItem from "../../lib/Models/WebMapServiceCatalogItem";
import { autorun, runInAction, observable } from "mobx";
import Terria from "../../lib/Models/Terria";
import { ImageryParts } from "../../lib/Models/Mappable";
import WebMapServiceImageryProvider from "terriajs-cesium/Source/Scene/WebMapServiceImageryProvider";
import CommonStrata from "../../lib/Models/CommonStrata";

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
        styles: "contour/ferret,shadefill/alg2",
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
        expect(wmsItem.styleSelectableDimensions[0].options!.length).toBe(40);

        expect(wmsItem.styleSelectableDimensions[1].selectedId).toBe(
          "shadefill/alg2"
        );
        expect(wmsItem.styleSelectableDimensions[0].options!.length).toBe(40);

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
      })
      .then(done)
      .catch(done.fail);
  });
});
