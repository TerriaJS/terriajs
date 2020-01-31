import addedByUser from "../../lib/Core/addedByUser";
import Terria from "../../lib/Models/Terria";
import WebMapServiceCatalogGroup from "../../lib/Models/WebMapServiceCatalogGroup";
import WebMapServiceCatalogItem from "../../lib/Models/WebMapServiceCatalogItem";
import CommonStrata from "../../lib/Models/CommonStrata";

describe("addedByUser", function() {
  let terria: Terria;
  let item: WebMapServiceCatalogItem;
  let group: WebMapServiceCatalogGroup;

  beforeEach(function() {
    terria = new Terria();

    item = new WebMapServiceCatalogItem("A", terria);
    group = new WebMapServiceCatalogGroup("B", terria);

    terria.addModel(item);
    terria.addModel(group);
  });

  it("returns true for user added models", function() {
    terria.catalog.userAddedDataGroup.add(CommonStrata.user, item);
    terria.catalog.userAddedDataGroup.add(CommonStrata.user, group);
    expect(addedByUser(item)).toBe(true);
    expect(addedByUser(group)).toBe(true);
  });

  it("returns true for nested user added models", function() {
    terria.catalog.userAddedDataGroup.add(CommonStrata.user, group);
    group.add(CommonStrata.user, item);
    expect(addedByUser(item)).toBe(true);
    expect(addedByUser(group)).toBe(true);
  });

  it("returns false for non user added models", function() {
    expect(addedByUser(item)).toBe(false);
    expect(addedByUser(group)).toBe(false);
  });
});
