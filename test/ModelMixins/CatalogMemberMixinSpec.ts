import { runInAction } from "mobx";
import Terria from "../../lib/Models/Terria";
import WebMapServiceCatalogItem from "../../lib/Models/WebMapServiceCatalogItem";

describe("CatalogMemberMixin", function() {
  describe(" - infoWithoutSources", function() {
    let terria: Terria;
    let wmsItem: WebMapServiceCatalogItem;

    beforeEach(async function() {
      terria = new Terria({
        baseUrl: "./"
      });
      wmsItem = new WebMapServiceCatalogItem("test", terria);

      runInAction(() => {
        wmsItem.setTrait(
          "definition",
          "url",
          "test/WMS/single_metadata_url.xml"
        );
      });
      await wmsItem.loadMetadata();
    });

    it(" - infoAsObject exists", function() {
      expect(wmsItem.info.length).toBe(6);
      expect(Object.keys(wmsItem.infoAsObject).length).toBe(6);
      expect(wmsItem.infoAsObject.WebMapServiceLayerDescription).toBe(
        "description foo bar baz"
      );
    });

    it(" - info section can contain both content and contentAsObject ", function() {
      wmsItem.info.forEach(i => {
        // Something a bit funky with i18n strings not yet being transformed
        if (i.name === "models.webMapServiceCatalogItem.dataDescription") {
          expect(i.content).toBeUndefined();
          expect(i.contentAsObject).toBeDefined();
        } else if (i.name === "Web Map Service Layer Description") {
          expect(i.contentAsObject).toBeUndefined();
          expect(i.content).toBeDefined();
        }
      });
    });

    it(" - info and infoWithoutSources can produce different results", function() {
      expect(wmsItem.info.length).toBe(6);
      if (wmsItem._sourceInfoItemNames !== undefined) {
        expect(wmsItem._sourceInfoItemNames.length).toBe(1);
      }
      expect(wmsItem.infoWithoutSources.length).toBe(5);
    });
  });
});
