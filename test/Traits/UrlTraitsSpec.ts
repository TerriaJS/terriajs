import { configure, runInAction } from "mobx";
import Terria from "../../lib/Models/Terria";
import CommonStrata from "../../lib/Models/Definition/CommonStrata";
import GeoJsonCatalogItem from "../../lib/Models/Catalog/CatalogItems/GeoJsonCatalogItem";
import UrlMixin from "../../lib/ModelMixins/UrlMixin";

configure({
  enforceActions: "observed",
  computedRequiresReaction: true
});

describe("UrlTraits", function () {
  let terria: Terria;
  let geoJsonCatalogItem: GeoJsonCatalogItem;

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });
    geoJsonCatalogItem = new GeoJsonCatalogItem("test", terria);
  });

  it(" - returns true UrlMixin.isMixedInto", function () {
    expect(UrlMixin.isMixedInto(geoJsonCatalogItem)).toBeTruthy();
  });

  it(" - gets default cache duration", function () {
    expect(geoJsonCatalogItem.cacheDuration).toBe("1d");
  });

  it(" - can set cache duration", function () {
    runInAction(() => {
      geoJsonCatalogItem.setTrait(
        CommonStrata.definition,
        "cacheDuration",
        "0d"
      );
    });
    expect(geoJsonCatalogItem.cacheDuration).toBe("0d");
  });
});
