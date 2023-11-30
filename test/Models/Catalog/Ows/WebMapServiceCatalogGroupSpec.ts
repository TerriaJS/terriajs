import i18next from "i18next";
import { runInAction } from "mobx";
import CatalogMemberMixin from "../../../../lib/ModelMixins/CatalogMemberMixin";
import GroupMixin from "../../../../lib/ModelMixins/GroupMixin";
import WebMapServiceCatalogGroup from "../../../../lib/Models/Catalog/Ows/WebMapServiceCatalogGroup";
import WebMapServiceCatalogItem from "../../../../lib/Models/Catalog/Ows/WebMapServiceCatalogItem";
import createStratumInstance from "../../../../lib/Models/Definition/createStratumInstance";
import Terria from "../../../../lib/Models/Terria";
import ExportWebCoverageServiceTraits, {
  WebCoverageServiceParameterTraits
} from "../../../../lib/Traits/TraitsClasses/ExportWebCoverageServiceTraits";

describe("WebMapServiceCatalogGroup", function () {
  let terria: Terria;
  let wms: WebMapServiceCatalogGroup;

  beforeEach(function () {
    terria = new Terria();
    wms = new WebMapServiceCatalogGroup("test", terria);
  });

  it("has a type", function () {
    expect(wms.type).toBe("wms-group");
  });

  it("derives getCapabilitiesUrl from url if getCapabilitiesUrl is not specified", function () {
    wms.setTrait("definition", "url", "http://www.example.com");
    expect(wms.getCapabilitiesUrl).toBeDefined();
    expect(wms.url).toBeDefined();
    expect(
      wms.getCapabilitiesUrl &&
        wms.getCapabilitiesUrl.indexOf(wms.url || "undefined") === 0
    ).toBe(true);
  });

  describe("after loading capabilities", function () {
    beforeEach(async function () {
      runInAction(() => {
        wms.setTrait("definition", "url", "test/WMS/single_metadata_url.xml");
      });
    });

    it("defines name", async function () {
      await wms.loadMetadata();
      expect(wms.name).toBe("wms Server");
    });

    it("doesn't override user set name", async function () {
      const userDefinedName = "user defined name";
      runInAction(() => {
        wms.setTrait("definition", "name", userDefinedName);
      });
      await wms.loadMetadata();
      expect(wms.name).toBe(userDefinedName);
    });

    it("defines info", async function () {
      await wms.loadMetadata();
      const abstract = i18next.t("models.webMapServiceCatalogGroup.abstract");
      const accessConstraints = i18next.t(
        "models.webMapServiceCatalogGroup.accessConstraints"
      );
      const fees = i18next.t("models.webMapServiceCatalogGroup.fees");

      expect(wms.info.map(({ name }) => name)).toEqual([
        abstract,
        accessConstraints,
        fees
      ]);

      expect(wms.info.map(({ content }) => content)).toEqual([
        "web map service foo bar test",
        "test",
        "test"
      ]);
    });
  });

  describe("loadMembers", function () {
    beforeEach(async function () {
      runInAction(() => {
        wms.setTrait("definition", "url", "test/WMS/single_metadata_url.xml");
        wms.setTrait("definition", "itemProperties", {
          parameters: {
            foo: "baa"
          }
        });
      });
      await wms.loadMembers();
    });

    it("loads", async function () {
      expect(wms.members.length).toEqual(1);
      expect(wms.memberModels.length).toEqual(1);
    });

    it("item properties are passed down", async function () {
      const member: any = wms.memberModels[0];
      expect(member.parameters.foo).toEqual("baa");
    });
  });

  describe("loadMembersWithSharekeys", function () {
    beforeEach(async function () {
      runInAction(() => {
        terria.addShareKey(wms.uniqueId!, "some-share-key");
        wms.setTrait("definition", "url", "test/WMS/single_metadata_url.xml");
      });
      await wms.loadMembers();
    });

    it("addsShareKeys", async function () {
      expect(wms.members.length).toEqual(1);
      expect(wms.memberModels.length).toEqual(1);
      const wmsItem = wms.memberModels[0] as WebMapServiceCatalogItem;
      expect(wmsItem.uniqueId).toBeDefined();
      expect(terria.modelIdShareKeysMap.has(wmsItem.uniqueId!)).toBeTruthy();

      expect(terria.modelIdShareKeysMap.get(wmsItem.uniqueId!)).toEqual([
        "test/average_data",
        "some-share-key/average_data",
        "some-share-key/single_period"
      ]);
    });
  });

  describe("loadNestedMembers", function () {
    beforeEach(async function () {
      runInAction(() => {
        wms.setTrait("definition", "url", "test/WMS/wms_nested_groups.xml");
      });
      await wms.loadMembers();
    });

    it("loads", async function () {
      expect(wms.members.length).toEqual(2);
      expect(wms.memberModels.length).toEqual(2);

      const firstGroup = wms.memberModels[0] as WebMapServiceCatalogGroup;
      expect(firstGroup.uniqueId).toEqual(
        "test/Digital Earth Australia - OGC Web Services"
      );
      expect(
        GroupMixin.isMixedInto(firstGroup) && firstGroup.members.length
      ).toEqual(3);

      const firstSubGroup = firstGroup
        .memberModels[0] as WebMapServiceCatalogGroup;
      expect(firstSubGroup.uniqueId).toEqual(
        "test/Digital Earth Australia - OGC Web Services/Surface Reflectance"
      );
      expect(firstSubGroup.name).toEqual("Surface Reflectance");
      expect(firstSubGroup.members.length).toEqual(3);

      const firstSubGroupModel = firstSubGroup
        .memberModels[0] as WebMapServiceCatalogItem;
      expect(firstSubGroupModel.uniqueId).toEqual(
        "test/Digital Earth Australia - OGC Web Services/Surface Reflectance/ls8_nbart_geomedian_annual"
      );
      expect(firstSubGroupModel.name).toEqual(
        "Surface Reflectance 25m Annual Geomedian (Landsat 8)"
      );

      const secondGroup = wms.memberModels[1] as WebMapServiceCatalogGroup;
      expect(secondGroup.uniqueId).toEqual("test/Some other catalog");
      expect(secondGroup.name).toEqual("Some other catalog");
      expect(secondGroup.memberModels.length).toEqual(1);

      const secondSubGroup = secondGroup
        .memberModels[0] as WebMapServiceCatalogGroup;
      expect(secondSubGroup.uniqueId).toEqual(
        "test/Some other catalog/Surface Reflectance"
      );
      expect(secondSubGroup.name).toEqual("Surface Reflectance");
      expect(secondSubGroup.members.length).toEqual(1);

      const secondSubGroupModel = secondSubGroup
        .memberModels[0] as WebMapServiceCatalogItem;
      expect(secondSubGroupModel.uniqueId).toEqual(
        "test/Some other catalog/Surface Reflectance/some_layer"
      );
      expect(secondSubGroupModel.name).toEqual("Some layer");
    });
  });

  describe("perLayerLinkedWcs", function () {
    beforeEach(async function () {
      runInAction(() => {
        wms.setTrait("definition", "url", "test/WMS/wms_nested_groups.xml");
        wms.setTrait(
          "definition",
          "perLayerLinkedWcs",
          createStratumInstance(ExportWebCoverageServiceTraits, {
            linkedWcsUrl: "some-url",
            linkedWcsParameters: createStratumInstance(
              WebCoverageServiceParameterTraits,
              { outputFormat: "some-output-format" }
            )
          })
        );
      });
      await wms.loadMembers();
    });

    it("sets traits correctly", async function () {
      const wmsItem = (
        (wms.memberModels[0] as WebMapServiceCatalogGroup)
          .memberModels[0] as WebMapServiceCatalogGroup
      ).memberModels[0] as WebMapServiceCatalogItem;

      expect(wmsItem.linkedWcsUrl).toEqual("some-url");
      expect(wmsItem.linkedWcsCoverage).toEqual("ls8_nbart_geomedian_annual");
      expect(wmsItem.linkedWcsParameters.outputFormat).toEqual(
        "some-output-format"
      );
    });
  });
});
