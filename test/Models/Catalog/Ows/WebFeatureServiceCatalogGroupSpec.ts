import i18next from "i18next";
import { runInAction } from "mobx";
import CatalogMemberMixin from "../../../../lib/ModelMixins/CatalogMemberMixin";
import WebFeatureServiceCatalogGroup from "../../../../lib/Models/Catalog/Ows/WebFeatureServiceCatalogGroup";
import Terria from "../../../../lib/Models/Terria";

describe("WebFeatureServiceCatalogGroup", function () {
  let terria: Terria;
  let wfs: WebFeatureServiceCatalogGroup;

  beforeEach(function () {
    terria = new Terria();
    wfs = new WebFeatureServiceCatalogGroup("test", terria);
  });

  it("has a type", function () {
    expect(wfs.type).toBe("wfs-group");
  });

  it("derives getCapabilitiesUrl from url if getCapabilitiesUrl is not specified", function () {
    wfs.setTrait("definition", "url", "http://www.example.com");
    expect(wfs.getCapabilitiesUrl).toBeDefined();
    expect(wfs.url).toBeDefined();
    expect(
      wfs.getCapabilitiesUrl &&
        wfs.getCapabilitiesUrl.indexOf(wfs.url || "undefined") === 0
    ).toBe(true);
  });

  describe("after loading capabilities", function () {
    beforeEach(async function () {
      runInAction(() => {
        wfs.setTrait("definition", "url", "test/WFS/getCapabilities.xml");
      });
    });

    it("defines name", async function () {
      (await wfs.loadMetadata()).throwIfError();
      expect(wfs.name).toBe("Fake Web Feature Service");
    });

    it("doesn't override user set name", async function () {
      const userDefinedName = "user defined name";
      runInAction(() => {
        wfs.setTrait("definition", "name", userDefinedName);
      });
      (await wfs.loadMetadata()).throwIfError();
      expect(wfs.name).toBe(userDefinedName);
    });

    it("defines info", async function () {
      (await wfs.loadMetadata()).throwIfError();
      const abstract = i18next.t(
        "models.webFeatureServiceCatalogGroup.abstract"
      );
      const accessConstraints = i18next.t(
        "models.webFeatureServiceCatalogGroup.accessConstraints"
      );

      expect(wfs.info.map(({ name }) => name)).toEqual([
        abstract,
        accessConstraints
      ]);

      expect(wfs.info.map(({ content }) => content)).toEqual([
        "This is a fake WFS abstract.",
        "Lots of constraints"
      ]);
    });
  });

  describe("loads members", function () {
    beforeEach(async function () {
      runInAction(() => {
        wfs.setTrait("definition", "url", "test/WFS/getCapabilities.xml");
      });
      (await wfs.loadMembers()).throwIfError();
    });

    it("loads", async function () {
      expect(wfs.members.length).toEqual(1);
      expect(wfs.memberModels.length).toEqual(1);

      const firstModel = wfs.memberModels[0];
      expect(
        CatalogMemberMixin.isMixedInto(firstModel) && firstModel.name
      ).toEqual("Title of feature type");
    });
  });
});
