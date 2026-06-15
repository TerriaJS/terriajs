import i18next from "i18next";
import { runInAction } from "mobx";
import ProtomapsImageryProvider from "../../../../lib/Map/ImageryProvider/ProtomapsImageryProvider";
import GeoRssCatalogItem from "../../../../lib/Models/Catalog/CatalogItems/GeoRssCatalogItem";
import CommonStrata from "../../../../lib/Models/Definition/CommonStrata";
import Terria from "../../../../lib/Models/Terria";

describe("GeoRssCatalogItem", function () {
  let terria: Terria;
  let item: GeoRssCatalogItem;

  beforeEach(function () {
    terria = new Terria();
    item = new GeoRssCatalogItem("test", terria);
  });

  it("has a type and typeName", function () {
    expect(item.type).toBe("georss");
    expect(item.typeName).toBe(i18next.t("models.georss.name"));
  });

  it("supports zooming to extent", async function () {
    item.setTrait(CommonStrata.definition, "url", "test/GeoRSS/rss2/rss2.xml");
    await item.loadMapItems();
    expect(item.disableZoomTo).toBeFalsy();
  });

  it("supports show info", function () {
    expect(item.disableAboutData).toBeFalsy();
  });
  describe("georss 2.0", function () {
    it("properly loads rss2 file", async function () {
      runInAction(() => {
        item.setTrait(
          CommonStrata.definition,
          "url",
          "test/GeoRSS/rss2/rss2.xml"
        );
      });

      await item.loadMapItems();
      expect(item.mapItems.length).toEqual(2);
      const mapItem = item.mapItems[1];
      expect(
        "imageryProvider" in mapItem &&
          mapItem.imageryProvider instanceof ProtomapsImageryProvider
      ).toBeTruthy();
      expect(item.readyData?.features.length).toEqual(3);
    });

    it("load combined geometry rss", async function () {
      runInAction(() => {
        item.setTrait(
          CommonStrata.definition,
          "url",
          "test/GeoRSS/rss2/combineGeometry.xml"
        );
      });
      await item.loadMapItems();
      expect(item.mapItems.length).toEqual(2);
      const mapItem = item.mapItems[1];
      expect(
        "imageryProvider" in mapItem &&
          mapItem.imageryProvider instanceof ProtomapsImageryProvider
      ).toBeTruthy();
      expect(item.readyData?.features.length).toEqual(8);
    });

    it("properly handles entry with no geometry", async function () {
      runInAction(() => {
        item.setTrait(
          CommonStrata.definition,
          "url",
          "test/GeoRSS/rss2/badItem.xml"
        );
      });
      await item.loadMapItems();
      expect(item.mapItems.length).toEqual(1);
      const mapItem = item.mapItems[0];
      expect(
        "imageryProvider" in mapItem &&
          mapItem.imageryProvider instanceof ProtomapsImageryProvider
      ).toBeTruthy();
      expect(item.readyData?.features.length).toEqual(2);
    });
  });

  describe("atom feed", function () {
    it("properly loads atom feed response file", async function () {
      runInAction(() => {
        item.setTrait(
          CommonStrata.definition,
          "url",
          "test/GeoRSS/atom/atom.xml"
        );
      });

      await item.loadMapItems();

      expect(item.mapItems.length).toEqual(2);
      const mapItem = item.mapItems[1];
      expect(
        "imageryProvider" in mapItem &&
          mapItem.imageryProvider instanceof ProtomapsImageryProvider
      ).toBeTruthy();
      expect(item.readyData?.features.length).toEqual(3);
    });

    it("load combined geometry atom feed", async function () {
      runInAction(() => {
        item.setTrait(
          CommonStrata.definition,
          "url",
          "test/GeoRSS/atom/combineGeometry.xml"
        );
      });
      await item.loadMapItems();
      expect(item.mapItems.length).toEqual(2);
      const mapItem = item.mapItems[1];
      expect(
        "imageryProvider" in mapItem &&
          mapItem.imageryProvider instanceof ProtomapsImageryProvider
      ).toBeTruthy();
      expect(item.readyData?.features.length).toEqual(8);
    });

    it("properly handles entry with no geometry", async function () {
      runInAction(() => {
        item.setTrait(
          CommonStrata.definition,
          "url",
          "test/GeoRSS/atom/badItem.xml"
        );
      });
      await item.loadMapItems();
      expect(item.mapItems.length).toEqual(2);
      const mapItem = item.mapItems[1];
      expect(
        "imageryProvider" in mapItem &&
          mapItem.imageryProvider instanceof ProtomapsImageryProvider
      ).toBeTruthy();
      expect(item.readyData?.features.length).toEqual(2);
    });
  });

  it("name is defined from title element", async function () {
    runInAction(() => {
      item.setTrait(
        CommonStrata.definition,
        "url",
        "test/GeoRSS/geoRssName.xml"
      );
    });
    await item.loadMapItems();
    expect(item.name).toEqual("GeoRSS feed sample");
  });

  it("name is defined", async function () {
    runInAction(() => {
      item.setTrait(
        CommonStrata.definition,
        "url",
        "test/GeoRSS/geoRssWithoutName.xml"
      );
    });
    await item.loadMapItems();
    expect(item.name).toEqual("geoRssWithoutName.xml");
  });
});
