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

    it(" - info and infoWithoutSources can produce different results", function() {
      expect(wmsItem.info.length).toBe(4);
      if (wmsItem._sourceInfoItemNames !== undefined) {
        expect(wmsItem._sourceInfoItemNames.length).toBe(1);
      }
      expect(wmsItem.infoWithoutSources.length).toBe(3);
    });
  });
});
