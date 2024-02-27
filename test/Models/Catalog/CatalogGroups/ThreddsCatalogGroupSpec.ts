import { configure } from "mobx";
import Terria from "../../../../lib/Models/Terria";
import ThreddsCatalogGroup, {
  ThreddsStratum
} from "../../../../lib/Models/Catalog/CatalogGroups/ThreddsCatalogGroup";
import i18next from "i18next";
import CatalogGroup from "../../../../lib/Models/Catalog/CatalogGroup";
import WebMapServiceCatalogGroup from "../../../../lib/Models/Catalog/Ows/WebMapServiceCatalogGroup";

configure({
  enforceActions: "observed",
  computedRequiresReaction: true
});

describe("ThreddsCatalogGroup", function () {
  let terria: Terria;
  let threddsCatalogGroup: ThreddsCatalogGroup;
  let threddsStratum: ThreddsStratum;

  beforeEach(async function () {
    terria = new Terria({
      baseUrl: "./"
    });
    threddsCatalogGroup = new ThreddsCatalogGroup("test", terria);
    const url = `${window.location.origin}/test/thredds/catalog.xml`;
    threddsCatalogGroup.setTrait("definition", "url", url);

    await threddsCatalogGroup.loadMembers();
    threddsStratum = threddsCatalogGroup.strata.get(
      ThreddsStratum.stratumName
    ) as ThreddsStratum;
  });

  it("has a type and typeName", function () {
    expect(threddsCatalogGroup.type).toBe("thredds-group");
    expect(threddsCatalogGroup.typeName).toBe(
      i18next.t("models.thredds.nameGroup")
    );
  });

  it("properly creates members ", async function () {
    expect(threddsCatalogGroup.members).toBeDefined();
    expect(threddsCatalogGroup.members.length).toBe(3);
    const member0 = threddsCatalogGroup.memberModels[0] as CatalogGroup;

    expect(member0.name).toBe("Some Catalog 1");
    expect(member0.type).toBe("thredds-group");
    await member0.loadMembers();
    expect(member0.members.length).toBe(1);

    const member1 = threddsCatalogGroup.memberModels[1] as CatalogGroup;
    expect(member1.name).toBe("Some Catalog 2");
    expect(member1.type).toBe("thredds-group");
    await member1.loadMembers();
    expect(member1.members.length).toBe(2);

    const member2 = threddsCatalogGroup
      .memberModels[2] as WebMapServiceCatalogGroup;
    expect(member2.name).toBe(
      "eReefs GBR4 SHOC Model v1.85 Results for 2016-06"
    );
  });
});
