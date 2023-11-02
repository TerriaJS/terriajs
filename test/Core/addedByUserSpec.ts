import addedByUser from "../../lib/Core/addedByUser";
import Terria from "../../lib/Models/Terria";
import WebMapServiceCatalogGroup from "../../lib/Models/Catalog/Ows/WebMapServiceCatalogGroup";
import WebMapServiceCatalogItem from "../../lib/Models/Catalog/Ows/WebMapServiceCatalogItem";
import CommonStrata from "../../lib/Models/Definition/CommonStrata";

describe("addedByUser", function () {
  let terria: Terria;
  let item: WebMapServiceCatalogItem;
  let group: WebMapServiceCatalogGroup;
  let groupC: WebMapServiceCatalogGroup;

  beforeEach(function () {
    terria = new Terria();

    item = new WebMapServiceCatalogItem("A", terria);
    group = new WebMapServiceCatalogGroup("B", terria);
    groupC = new WebMapServiceCatalogGroup("C", terria);

    terria.addModel(item);
    terria.addModel(group);
    terria.addModel(groupC);
  });

  it("returns true for user added models", function () {
    terria.catalog.userAddedDataGroup.add(CommonStrata.user, item);
    terria.catalog.userAddedDataGroup.add(CommonStrata.user, group);
    expect(addedByUser(item)).toBe(true);
    expect(addedByUser(group)).toBe(true);
  });

  it("returns true for nested user added models", function () {
    terria.catalog.userAddedDataGroup.add(CommonStrata.user, group);
    group.add(CommonStrata.user, item);
    expect(addedByUser(item)).toBe(true);
    expect(addedByUser(group)).toBe(true);
  });

  it("returns false for non user added models", function () {
    expect(addedByUser(item)).toBe(false);
    expect(addedByUser(group)).toBe(false);
  });

  it("does not blow stack when catalog groups ended up nested in itself", function () {
    group.add(CommonStrata.definition, group);
    expect(() => addedByUser(group)).not.toThrow();
    expect(addedByUser(item)).toBe(false);
    expect(addedByUser(group)).toBe(false);
  });

  it("does not blow stack when catalog groups ended up nested in each other", function () {
    terria.catalog.userAddedDataGroup.add(CommonStrata.user, group);
    terria.catalog.userAddedDataGroup.add(CommonStrata.user, groupC);
    groupC.add(CommonStrata.definition, group);
    groupC.add(CommonStrata.definition, item);
    expect(() => addedByUser(groupC)).not.toThrow();
    // Should still eventually figure out they are user added datasets due to the
    // `.some()` filter on addedByUser
    expect(addedByUser(item)).toBe(true);
    expect(addedByUser(group)).toBe(true);
    expect(addedByUser(groupC)).toBe(true);
  });
});
