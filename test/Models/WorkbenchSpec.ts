import Terria from "../../lib/Models/Terria";
import WebMapServiceCatalogItem from "../../lib/Models/WebMapServiceCatalogItem";
import Workbench from "../../lib/Models/Workbench";
import { BaseModel } from "../../lib/Models/Model";

describe("Workbench", function() {
  let terria: Terria;
  let workbench: Workbench;
  let item1: BaseModel, item2: BaseModel, item3: BaseModel;

  beforeEach(function() {
    terria = new Terria();
    workbench = terria.workbench;

    item1 = new WebMapServiceCatalogItem("A", terria);
    item2 = new WebMapServiceCatalogItem("B", terria);
    item3 = new WebMapServiceCatalogItem("C", terria);

    terria.addModel(item1);
    terria.addModel(item2);
    terria.addModel(item3);

    workbench.items = [item1, item2, item3];
  });

  it("re-orders items correctly", function() {
    expect(workbench.items).toEqual([item1, item2, item3]);
    expect(workbench.itemIds).toEqual(["A", "B", "C"]);

    workbench.moveItemToIndex(item1, 1);
    expect(workbench.items).toEqual([item2, item1, item3]);
    expect(workbench.itemIds).toEqual(["B", "A", "C"]);

    workbench.moveItemToIndex(item3, 0);
    expect(workbench.items).toEqual([item3, item2, item1]);
    expect(workbench.itemIds).toEqual(["C", "B", "A"]);

    workbench.moveItemToIndex(item2, 2);
    expect(workbench.items).toEqual([item3, item1, item2]);
    expect(workbench.itemIds).toEqual(["C", "A", "B"]);
  });
});
