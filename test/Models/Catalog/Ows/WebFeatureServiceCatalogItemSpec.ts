import i18next from "i18next";
import { autorun, runInAction } from "mobx";
import Terria from "../../../../lib/Models/Terria";
import WebFeatureServiceCatalogItem from "../../../../lib/Models/Catalog/Ows/WebFeatureServiceCatalogItem";

describe("WebFeatureServiceCatalogItem", function() {
  it("derives getCapabilitiesUrl from url if getCapabilitiesUrl is not specified", function() {
    const terria = new Terria();
    const wfs = new WebFeatureServiceCatalogItem("test", terria);
    wfs.setTrait("definition", "url", "foo.bar.baz");
    expect(wfs.getCapabilitiesUrl).toBeDefined();
    expect(wfs.url).toBeDefined();
    expect(
      wfs.getCapabilitiesUrl &&
        wfs.getCapabilitiesUrl.indexOf(wfs.url || "undefined") === 0
    ).toBe(true);
  });

  it("loads", function() {
    expect().nothing();
    const terria = new Terria();
    const wfs = new WebFeatureServiceCatalogItem("test", terria);
    runInAction(() => {
      wfs.setTrait("definition", "url", "test/WFS/getCapabilities.xml");
      wfs.setTrait(
        "definition",
        "typeNames",
        "marine:seabed_sediments_collection"
      );
    });
    return wfs.loadMetadata();
  });

  it("updates description from a GetCapabilities", async function() {
    let wfs: WebFeatureServiceCatalogItem;
    const terria = new Terria();
    wfs = new WebFeatureServiceCatalogItem("test", terria);
    runInAction(() => {
      wfs.setTrait("definition", "url", "test/WFS/getCapabilities.xml");
      wfs.setTrait(
        "definition",
        "typeNames",
        "marine:seabed_sediments_collection"
      );
    });
    let description: String | undefined;
    const cleanup = autorun(() => {
      if (wfs.info !== undefined) {
        const descSection = wfs.info.find(
          section =>
            section.name ===
            i18next.t("models.webFeatureServiceCatalogItem.abstract")
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
      await wfs.loadMetadata();
      expect(description).toBe(
        "This service contains point data describing physical properties of marine sediments as held within the Geoscience Australia Marine Sediment database (MARS) for samples acquired by marine surveys that occurred between 1905 and 2017. Points are symbolised by individual texture class according to the Folk (1954) nomenclature for sediments."
      );
    } finally {
      cleanup();
    }
  });
});
