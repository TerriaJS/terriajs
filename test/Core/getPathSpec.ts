import getPath from "../../lib/Core/getPath";
import CatalogGroup from "../../lib/Models/Catalog/CatalogGroup";
import CommonStrata from "../../lib/Models/Definition/CommonStrata";
import Terria from "../../lib/Models/Terria";
import WebMapServiceCatalogItem from "../../lib/Models/Catalog/Ows/WebMapServiceCatalogItem";

describe("getPath", function () {
  let terria: Terria;
  let item: WebMapServiceCatalogItem;
  let group1: CatalogGroup;
  let group2: CatalogGroup;

  beforeEach(function () {
    terria = new Terria();

    item = new WebMapServiceCatalogItem("A", terria);
    group1 = new CatalogGroup("G1", terria);
    group2 = new CatalogGroup("G2", terria);

    terria.addModel(item);
    terria.addModel(group1);
    terria.addModel(group2);
    group1.add(CommonStrata.user, item);
    group2.add(CommonStrata.definition, group1);
    terria.catalog.group.add(CommonStrata.definition, group2);
  });

  it("returns correct path with default / separator", function () {
    expect(getPath(group2)).toBe("G2");
    expect(getPath(group1)).toBe("G2/G1");
    expect(getPath(item)).toBe("G2/G1/A");
  });

  it("returns correct path with custom separator", function () {
    expect(getPath(group2, " -> ")).toBe("G2");
    expect(getPath(group1, " -> ")).toBe("G2 -> G1");
    expect(getPath(item, " -> ")).toBe("G2 -> G1 -> A");
  });
});
