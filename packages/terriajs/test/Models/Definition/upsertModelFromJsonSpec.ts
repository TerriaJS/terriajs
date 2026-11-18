import { runInAction } from "mobx";
import CatalogMemberFactory from "../../../lib/Models/Catalog/CatalogMemberFactory";
import StubCatalogItem from "../../../lib/Models/Catalog/CatalogItems/StubCatalogItem";
import WebMapServiceCatalogGroup from "../../../lib/Models/Catalog/Ows/WebMapServiceCatalogGroup";
import WebMapServiceCatalogItem from "../../../lib/Models/Catalog/Ows/WebMapServiceCatalogItem";
import CommonStrata from "../../../lib/Models/Definition/CommonStrata";
import { BaseModel } from "../../../lib/Models/Definition/Model";
import upsertModelFromJson from "../../../lib/Models/Definition/upsertModelFromJson";
import Terria from "../../../lib/Models/Terria";

describe("upsertModelFromJson", function () {
  it("can create basic WMS item", function () {
    const terria = new Terria();

    const json = {
      type: "wms",
      name: "Test",
      url: "foo.bar.baz",
      layers: "mybroadband:MyBroadband_ADSL_Availability"
    };

    const model = upsertModelFromJson(
      CatalogMemberFactory,
      terria,
      "",
      "definition",
      json,
      {}
    ).throwIfUndefined();
    expect(model instanceof WebMapServiceCatalogItem).toBe(true);
    expect(model.type).toBe("wms");

    const wms = model as WebMapServiceCatalogItem;
    expect(wms.name).toBe("Test");
    expect(wms.url).toBe("foo.bar.baz");
    expect(wms.layers).toBe("mybroadband:MyBroadband_ADSL_Availability");
  });

  it("can merge members from multiple strata", async function () {
    const terria = new Terria();

    const json = {
      type: "wms-group",
      name: "Test",
      url: "totally not valid at all",
      getCapabilitiesUrl: "test/WMS/comms_geoserver.xml",
      members: [
        {
          type: "wms",
          localId:
            "mobile-black-spot-programme:funded-base-stations-round4-group",
          name: "This will be overridden by GetCapabilites"
        }
      ]
    };

    const model = runInAction(() => {
      const model = upsertModelFromJson(
        CatalogMemberFactory,
        terria,
        "",
        "definition",
        json,
        {}
      ).throwIfUndefined();
      expect(model instanceof WebMapServiceCatalogGroup).toBe(true);
      expect(model.type).toBe("wms-group");
      return model;
    });

    const group = model as WebMapServiceCatalogGroup;
    const item = terria.getModelById(
      WebMapServiceCatalogItem,
      "/Test/mobile-black-spot-programme:funded-base-stations-round4-group"
    );
    expect(item).toBeDefined();
    if (!item) {
      return;
    }

    expect(group.isLoadingMetadata).toBe(
      false,
      "group.isLoadingMetadata - before calling loadMembers"
    );
    expect(group.isLoadingMembers).toBe(
      false,
      "group.isLoadingMembers - before calling loadMembers"
    );
    expect(group.memberModels.length).toBe(1);
    expect(group.memberModels[0]).toBe(item);
    expect(item.name).toBe("This will be overridden by GetCapabilites");
    expect(item.layers).toBeUndefined();
    expect(item.isGeoServer).toBe(
      false,
      "item.isGeoServer - before calling loadMembers"
    );

    // loadMembers will call loadMetadata first, so check isLoadingMetadata and then await loadMetadata
    const loadMembersPromise = group.loadMembers();
    expect(group.isLoadingMetadata).toBe(
      true,
      "group.isLoadingMetadata - after calling loadMembers"
    );
    await group.loadMetadata();
    expect(group.isLoadingMetadata).toBe(
      false,
      "group.isLoadingMetadata - after loading"
    );
    expect(group.isLoadingMembers).toBe(
      true,
      "group.isLoadingMembers - after calling loadMetadata"
    );
    await loadMembersPromise;

    expect(group.memberModels.length).toBeGreaterThan(1);
    expect(group.memberModels.indexOf(item)).toBeGreaterThanOrEqual(0);
    expect(item.name).toBe("Funded Base Stations with Ineligible Areas");
    expect(item.layers).toBe(
      "mobile-black-spot-programme:funded-base-stations-round4-group"
    );

    await item.loadMetadata();

    expect(item.isGeoServer).toBe(true, "item.isGeoServer");
  });

  it("can update a model by shareKey", function () {
    const terria = new Terria();

    const json = {
      type: "wms",
      name: "Test",
      id: "89afyowhf",
      url: "foo.bar.baz",
      layers: "mybroadband:MyBroadband_ADSL_Availability",
      shareKeys: ["Root Group/Communications/Broadband Availability"]
    };

    const model = upsertModelFromJson(
      CatalogMemberFactory,
      terria,
      "",
      "definition",
      json,
      {}
    ).throwIfUndefined();
    expect(model instanceof WebMapServiceCatalogItem).toBe(true);
    expect(model.type).toBe("wms");

    const modelFromSharekey = terria.shareKeysMap.get(
      "Root Group/Communications/Broadband Availability"
    );

    const model2 = upsertModelFromJson(
      CatalogMemberFactory,
      terria,
      "",
      CommonStrata.user,
      {
        id: modelFromSharekey,
        opacity: 0.5
      },
      {
        replaceStratum: false
      }
    ).throwIfUndefined();
    expect(model).toBe(model2, "Failed to match model by shareKey");

    const wms = model as WebMapServiceCatalogItem;
    expect(wms.opacity).toBe(0.5);
  });

  describe("with a type the map doesn't know", function () {
    const upsertUnknown = (terria: Terria, json: object) =>
      upsertModelFromJson(CatalogMemberFactory, terria, "", "user", {
        id: "from-a-plugin",
        type: "not-a-registered-type",
        ...json
      });

    it("adds a stub item and reports an error", function () {
      const terria = new Terria();

      const result = upsertUnknown(terria, {});

      expect(result.error).toBeDefined();
      expect(result.ignoreError()?.type).toBe(StubCatalogItem.type);
    });

    it("is skipped without an error when isOptionalModel is set", function () {
      const terria = new Terria();
      const warnSpy = spyOn(console, "warn");

      const result = upsertUnknown(terria, {
        isOptionalModel: true,
        speed: 2
      });

      expect(result.error).toBeUndefined();
      expect(result.ignoreError()).toBeUndefined();
      expect(terria.getModelById(BaseModel, "from-a-plugin")).toBeUndefined();
      expect(warnSpy).toHaveBeenCalledOnceWith(
        "Skipped optional model `from-a-plugin`: type `not-a-registered-type` isn't registered on this map."
      );
    });
  });

  it("loads isOptionalModel JSON on a map that knows the type", function () {
    const terria = new Terria();

    const result = upsertModelFromJson(
      CatalogMemberFactory,
      terria,
      "",
      "user",
      { id: "known", type: "wms", isOptionalModel: true, name: "Known" }
    );

    expect(result.error).toBeUndefined();
    expect((result.ignoreError() as WebMapServiceCatalogItem).name).toBe(
      "Known"
    );
  });
});
