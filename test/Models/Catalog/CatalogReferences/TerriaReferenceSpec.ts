import GroupMixin from "../../../../lib/ModelMixins/GroupMixin";
import CatalogGroup from "../../../../lib/Models/Catalog/CatalogGroup";
import TerriaReference from "../../../../lib/Models/Catalog/CatalogReferences/TerriaReference";
import WebMapServiceCatalogItem from "../../../../lib/Models/Catalog/Ows/WebMapServiceCatalogItem";
import CommonStrata from "../../../../lib/Models/Definition/CommonStrata";
import hasTraits from "../../../../lib/Models/Definition/hasTraits";
import Terria from "../../../../lib/Models/Terria";
import CatalogMemberTraits from "../../../../lib/Traits/TraitsClasses/CatalogMemberTraits";

describe("TerriaReference", function () {
  it("can load a full terria catalog", async function () {
    const ref = new TerriaReference("test", new Terria());
    ref.setTrait(CommonStrata.user, "url", "test/init/wms-v8.json");
    ref.setTrait(CommonStrata.user, "isGroup", true);
    await ref.loadReference();
    const target = ref.target;
    expect(target).toBeDefined();
    expect(GroupMixin.isMixedInto(target)).toBe(true);
    if (GroupMixin.isMixedInto(target)) {
      expect(target.members.length).toEqual(1);
    }
  });

  it("can load a group inside the catalog", async function () {
    const ref = new TerriaReference("test", new Terria());
    ref.setTrait(CommonStrata.user, "url", "test/init/wms-v8.json");
    ref.setTrait(CommonStrata.user, "isGroup", true);
    ref.setTrait(CommonStrata.user, "path", ["MLzS8W"]);
    await ref.loadReference();
    const target = ref.target;
    expect(target).toBeDefined();
    expect(GroupMixin.isMixedInto(target)).toBe(true);
    if (GroupMixin.isMixedInto(target)) {
      // Check wether we have loaded all 7 catalog items
      expect(target.members.length).toEqual(7);
    }
  });

  it("can load an item inside the catalog", async function () {
    const ref = new TerriaReference("test", new Terria());
    ref.setTrait(CommonStrata.user, "url", "test/init/wms-v8.json");
    ref.setTrait(CommonStrata.user, "path", ["MLzS8W", "fCUx4Y"]);
    await ref.loadReference();
    const target = ref.target;
    expect(target).toBeDefined();
    expect(target instanceof WebMapServiceCatalogItem).toBe(true);
  });

  it("supports itemProperties, itemPropertiesByType and itemPropertiesByIds", async function () {
    const ref = new TerriaReference("test", new Terria());
    ref.setTrait(CommonStrata.user, "url", "test/init/wms-v8.json");
    ref.setTrait(CommonStrata.user, "itemProperties", {
      url: "some url"
    });
    ref.setTrait(CommonStrata.user, "itemPropertiesByType", [
      { type: "wms", itemProperties: { name: "some WMS name" } },
      {
        type: "group",
        itemProperties: { name: "some group name" }
      }
    ]);
    ref.setTrait(CommonStrata.user, "itemPropertiesByIds", [
      { ids: ["Chuj4y"], itemProperties: { name: "some WMS name (byID)" } }
    ]);

    await ref.loadReference();

    const target = ref.target as CatalogGroup;
    expect(target).toBeDefined();
    expect(target instanceof CatalogGroup).toBe(true);
    expect(target.name).toBe("some group name");

    await target.loadMembers();

    const nestedGroup = target.memberModels[0] as CatalogGroup;

    await nestedGroup.loadMembers();

    const wmsItem1 = nestedGroup.memberModels[0] as WebMapServiceCatalogItem;

    expect(wmsItem1 instanceof WebMapServiceCatalogItem).toBeTruthy();

    expect(wmsItem1.name).toBe("some WMS name");
    expect(wmsItem1.url).toBe("some url");

    const wmsItem2 = nestedGroup.memberModels.find(
      (m) => m.uniqueId === "Chuj4y"
    ) as WebMapServiceCatalogItem;

    expect(wmsItem2.name).toBe("some WMS name (byID)");
    expect(wmsItem2.url).toBe("some url");

    await target.loadMembers();
  });

  it("the target item should use the name of the terria reference item", async function () {
    const ref = new TerriaReference("test", new Terria());
    ref.setTrait(CommonStrata.user, "url", "test/init/wms-v8.json");
    ref.setTrait(CommonStrata.user, "isGroup", true);
    ref.setTrait(CommonStrata.user, "path", ["MLzS8W"]);
    ref.setTrait(CommonStrata.user, "name", "Foo");
    await ref.loadReference();
    const target = ref.target;
    expect(hasTraits(target, CatalogMemberTraits, "name")).toBe(true);
    if (hasTraits(target, CatalogMemberTraits, "name")) {
      expect(target.name).toBe("Foo");
    }
  });

  it("propagates knownUniqueContainerIds", async function () {
    const ref = new TerriaReference("test", new Terria());
    ref.setTrait(CommonStrata.user, "url", "test/init/wms-v8.json");
    ref.setTrait(CommonStrata.user, "isGroup", true);
    ref.setTrait(CommonStrata.user, "path", ["MLzS8W"]);
    ref.setTrait(CommonStrata.user, "name", "Foo");
    ref.knownContainerUniqueIds.push("some-id");
    await ref.loadReference();
    const target = ref.target;
    expect(target?.knownContainerUniqueIds.length).toBe(1);
    expect(target?.knownContainerUniqueIds[0]).toBe("some-id");
  });
});
