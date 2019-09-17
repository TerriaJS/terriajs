import { runInAction } from "mobx";
import CatalogMemberFactory from "../../lib/Models/CatalogMemberFactory";
import Terria from "../../lib/Models/Terria";
import upsertModelFromJson from "../../lib/Models/upsertModelFromJson";
import WebMapServiceCatalogGroup from "../../lib/Models/WebMapServiceCatalogGroup";
import WebMapServiceCatalogItem from "../../lib/Models/WebMapServiceCatalogItem";

describe("upsertModelFromJson", function() {
  it("can create basic WMS item", function() {
    CatalogMemberFactory.register(
      WebMapServiceCatalogItem.type,
      WebMapServiceCatalogItem
    );

    const terria = new Terria();

    const json = {
      type: "wms",
      name: "Test",
      url: "https://programs.communications.gov.au/geoserver/ows",
      layers: "mybroadband:MyBroadband_ADSL_Availability"
    };

    const model = upsertModelFromJson(
      CatalogMemberFactory,
      terria,
      "",
      undefined,
      "definition",
      json
    );
    expect(model instanceof WebMapServiceCatalogItem).toBe(true);
    expect(model.type).toBe("wms");

    const wms = <WebMapServiceCatalogItem>model;
    expect(wms.name).toBe("Test");
    expect(wms.url).toBe(
      "https://programs.communications.gov.au/geoserver/ows"
    );
    expect(wms.layers).toBe("mybroadband:MyBroadband_ADSL_Availability");
  });

  it("can merge members from multiple strata", async function() {
    CatalogMemberFactory.register(
      WebMapServiceCatalogGroup.type,
      WebMapServiceCatalogGroup
    );
    CatalogMemberFactory.register(
      WebMapServiceCatalogItem.type,
      WebMapServiceCatalogItem
    );

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
          name: "Override"
        }
      ]
    };

    const model = runInAction(() => {
      const model = upsertModelFromJson(
        CatalogMemberFactory,
        terria,
        "",
        undefined,
        "definition",
        json
      );
      expect(model instanceof WebMapServiceCatalogGroup).toBe(true);
      expect(model.type).toBe("wms-group");
      return model;
    });

    const group = <WebMapServiceCatalogGroup>model;
    const item = terria.getModelById(
      WebMapServiceCatalogItem,
      "/Test/mobile-black-spot-programme:funded-base-stations-round4-group"
    );
    expect(item).toBeDefined();
    if (!item) {
      return;
    }

    expect(group.isLoadingMetadata).toBe(false);
    expect(group.isLoadingMembers).toBe(false);
    expect(group.memberModels.length).toBe(1);
    expect(group.memberModels[0]).toBe(item);
    expect(item.name).toBe("Override");
    expect(item.layers).toBeUndefined();
    expect(item.isGeoServer).toBe(false);

    const loadMetadataPromise = group.loadMetadata();
    const loadMembersPromise = group.loadMembers();

    expect(group.isLoadingMetadata).toBe(true);
    expect(group.isLoadingMembers).toBe(true);

    await loadMetadataPromise;
    await loadMembersPromise;

    expect(group.isLoadingMetadata).toBe(false);
    expect(group.memberModels.length).toBeGreaterThan(1);
    expect(group.memberModels.indexOf(item)).toBeGreaterThanOrEqual(0);
    expect(item.name).toBe("Override");
    expect(item.layers).toBe(
      "mobile-black-spot-programme:funded-base-stations-round4-group"
    );

    await item.loadMetadata();

    expect(item.isGeoServer).toBe(true);
  });
});
