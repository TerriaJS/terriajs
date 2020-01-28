import WebMapServiceCatalogItem from "../../lib/Models/WebMapServiceCatalogItem";
import { autorun, runInAction, observable } from "mobx";
import Terria from "../../lib/Models/Terria";
import { ImageryParts } from "../../lib/Models/Mappable";
import WebMapServiceImageryProvider from "terriajs-cesium/Source/Scene/WebMapServiceImageryProvider";

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
});
