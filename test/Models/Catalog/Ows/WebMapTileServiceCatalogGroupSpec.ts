import WebMapTileServiceCatalogGroup from "../../../../lib/Models/Catalog/Ows/WebMapTileServiceCatalogGroup";
import Terria from "../../../../lib/Models/Terria";
import { runInAction } from "mobx";
import i18next from "i18next";

describe("WebMapTileServiceCatalogGroup", function () {
  let terria: Terria;
  let wmts: WebMapTileServiceCatalogGroup;
  beforeEach(function () {
    terria = new Terria();
    wmts = new WebMapTileServiceCatalogGroup("test", terria);
  });

  it("has a type", function () {
    expect(wmts.type).toBe("wmts-group");
  });

  it("derives getCapabilitiesUrl from url if getCapabilitiesUrl is not specifiied", function () {
    wmts.setTrait("definition", "url", "http://www.example.com");
    expect(wmts.url).toBeDefined();
    expect(
      wmts.getCapabilitiesUrl &&
        wmts.getCapabilitiesUrl.indexOf(wmts.url || "undefined") === 0
    ).toBeTruthy();
  });

  describe("after loading capabilities", function () {
    beforeEach(async function () {
      runInAction(() => {
        wmts.setTrait("definition", "url", "test/WMTS/with_tilematrix.xml");
      });
    });

    it("defines name", async function () {
      await wmts.loadMetadata();
      expect(wmts.name).toBe("Test WMTS");
    });

    it("doesn't override user set name", async function () {
      const userDefinedName = "user defined name";
      runInAction(() => {
        wmts.setTrait("definition", "name", userDefinedName);
      });
      await wmts.loadMetadata();
      expect(wmts.name).toBe(userDefinedName);
    });

    it("defines info", async function () {
      await wmts.loadMetadata();
      const abstract = i18next.t(
        "models.webMapTileServiceCatalogGroup.abstract"
      );
      const accessConstraints = i18next.t(
        "models.webMapTileServiceCatalogGroup.accessConstraints"
      );
      const fees = i18next.t("models.webMapTileServiceCatalogGroup.fees");
      expect(wmts.info.map(({ name }) => name)).toEqual([
        abstract,
        accessConstraints,
        fees
      ]);

      expect(wmts.info.map(({ content }) => content)).toEqual([
        "Datum. Of the test variety.",
        "test",
        "test"
      ]);
    });
  });

  describe("load members", function () {
    beforeEach(async function () {
      runInAction(() => {
        wmts.setTrait("definition", "url", "test/WMTS/with_tilematrix.xml");
      });
      await wmts.loadMembers();
    });

    it("loads", async function () {
      expect(wmts.members.length).toEqual(3);
      expect(wmts.memberModels.length).toEqual(3);
    });
  });
});
