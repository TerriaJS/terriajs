import CommonStrata from "../../lib/Models/Definition/CommonStrata";
import MagdaReference from "../../lib/Models/Catalog/CatalogReferences/MagdaReference";
import { BaseModel } from "../../lib/Models/Definition/Model";
import Terria from "../../lib/Models/Terria";
import WebMapServiceCatalogItem from "../../lib/Models/Catalog/Ows/WebMapServiceCatalogItem";
import Workbench from "../../lib/Models/Workbench";
import Result from "../../lib/Core/Result";
import TerriaError, { TerriaErrorSeverity } from "../../lib/Core/TerriaError";

describe("Workbench", function () {
  let terria: Terria;
  let workbench: Workbench;
  let item1: BaseModel, item2: BaseModel, item3: BaseModel, item4: BaseModel;

  beforeEach(function () {
    terria = new Terria();
    workbench = terria.workbench;

    item1 = new WebMapServiceCatalogItem("A", terria);
    item2 = new WebMapServiceCatalogItem("B", terria);
    item3 = new WebMapServiceCatalogItem("C", terria);
    item4 = new WebMapServiceCatalogItem("D", terria);

    item1.setTrait("definition", "url", "test/WMS/single_metadata_url.xml");
    item2.setTrait("definition", "url", "test/WMS/single_metadata_url.xml");
    item3.setTrait("definition", "url", "test/WMS/single_metadata_url.xml");
    item4.setTrait("definition", "url", "test/WMS/single_metadata_url.xml");

    terria.addModel(item1);
    terria.addModel(item2);
    terria.addModel(item3);
  });

  it("re-orders items correctly", function () {
    workbench.items = [item1, item2, item3];

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

  describe("re-orders items correctly (with keepOnTop)", function () {
    beforeEach(async () => {
      item3.setTrait("definition", "keepOnTop", true);

      await workbench.add([item1, item2, item3]);
    });

    it("will keepOnTop item3 ", () => {
      expect(workbench.items).toEqual([item3, item1, item2]);
      expect(workbench.itemIds).toEqual(["C", "A", "B"]);
    });

    it("will move item1 ", () => {
      workbench.moveItemToIndex(item1, 2);
      expect(workbench.items).toEqual([item3, item2, item1]);
      expect(workbench.itemIds).toEqual(["C", "B", "A"]);
    });

    it("will not move item3 ", () => {
      workbench.moveItemToIndex(item3, 2);
      expect(workbench.items).toEqual([item3, item1, item2]);
      expect(workbench.itemIds).toEqual(["C", "A", "B"]);
    });

    it("will move item2 ", () => {
      workbench.moveItemToIndex(item2, 0);
      expect(workbench.items).toEqual([item3, item2, item1]);
      expect(workbench.itemIds).toEqual(["C", "B", "A"]);
    });

    it("will add another keepOnTop item4 ", () => {
      item4.setTrait("definition", "keepOnTop", true);
      workbench.add(item4);
      expect(workbench.items).toEqual([item4, item3, item1, item2]);
      expect(workbench.itemIds).toEqual(["D", "C", "A", "B"]);
    });

    it("will add another item4", () => {
      workbench.add(item4);
      expect(workbench.items).toEqual([item3, item4, item1, item2]);
      expect(workbench.itemIds).toEqual(["C", "D", "A", "B"]);
    });
  });

  describe("will keep non layer-reordering layers at top of workbench list", function () {
    beforeEach(async () => {
      item3.setTrait("definition", "supportsReordering", false);

      await workbench.add([item1, item2, item3]);
    });

    it("will put item3 below ordering layers ", () => {
      expect(workbench.items).toEqual([item3, item1, item2]);
      expect(workbench.itemIds).toEqual(["C", "A", "B"]);
    });

    it("will move item1 ", () => {
      workbench.moveItemToIndex(item1, 2);
      expect(workbench.items).toEqual([item3, item2, item1]);
      expect(workbench.itemIds).toEqual(["C", "B", "A"]);
    });

    it("will not move item3 ", () => {
      workbench.moveItemToIndex(item3, 2);
      expect(workbench.items).toEqual([item3, item1, item2]);
      expect(workbench.itemIds).toEqual(["C", "A", "B"]);
    });

    it("will add another keepOnTop item4 ", () => {
      item4.setTrait("definition", "keepOnTop", true);
      workbench.add(item4);
      expect(workbench.items).toEqual([item3, item4, item1, item2]);
      expect(workbench.itemIds).toEqual(["C", "D", "A", "B"]);
    });

    it("will add another non layer-reordering item4 ", () => {
      item4.setTrait("definition", "supportsReordering", false);
      workbench.add(item4);
      expect(workbench.items).toEqual([item4, item3, item1, item2]);
      expect(workbench.itemIds).toEqual(["D", "C", "A", "B"]);
    });
  });

  it("add item", async function () {
    workbench.items = [item1, item2, item3];

    const wmsItem = item4 as WebMapServiceCatalogItem;

    await workbench.add(item4);

    expect(workbench.items).toEqual([item4, item1, item2, item3]);
    expect(workbench.itemIds).toEqual(["D", "A", "B", "C"]);

    expect(wmsItem.loadMetadataResult).toBeDefined();
    expect(wmsItem.loadMetadataResult?.error).toBeUndefined();
    expect(wmsItem.loadMapItemsResult).toBeDefined();
    expect(wmsItem.loadMapItemsResult?.error).toBeUndefined();
  });

  it("doesn't add item if Error occurs, but adds item in Warning occurs", async function () {
    workbench.items = [item1, item2];

    const wmsItem3 = item3 as WebMapServiceCatalogItem;
    const wmsItem4 = item4 as WebMapServiceCatalogItem;

    (wmsItem3 as any).loadMapItems = () =>
      Result.error(
        new TerriaError({
          message: "Failed to Load",
          severity: TerriaErrorSeverity.Error
        })
      );

    (wmsItem4 as any).loadMapItems = () =>
      Result.error(
        new TerriaError({
          message: "Some warning",
          severity: TerriaErrorSeverity.Warning
        })
      );

    const addResult1 = await workbench.add(wmsItem3);

    expect(addResult1.error).toBeDefined();
    expect(addResult1.error?.severity).toEqual(TerriaErrorSeverity.Error);
    expect(workbench.itemIds).toEqual(["A", "B"]);

    const addResult2 = await workbench.add(wmsItem4);

    expect(addResult2.error).toBeDefined();
    expect(addResult2.error?.severity).toEqual(TerriaErrorSeverity.Warning);
    expect(workbench.itemIds).toEqual(["D", "A", "B"]);
  });

  it("doesn't add duplicate model", async function () {
    workbench.items = [item1, item2, item3];

    await workbench.add(item1);
    expect(workbench.items).toEqual([item1, item2, item3]);
    expect(workbench.itemIds).toEqual(["A", "B", "C"]);

    await workbench.add(item2);
    expect(workbench.items).toEqual([item1, item2, item3]);
    expect(workbench.itemIds).toEqual(["A", "B", "C"]);
  });

  it("remove item", async function () {
    workbench.items = [item1, item2, item3];

    workbench.remove(item2);
    expect(workbench.items).toEqual([item1, item3]);
    expect(workbench.itemIds).toEqual(["A", "C"]);
  });

  it("add reference item", async function () {
    const model = new MagdaReference("magda-reference", terria);
    model.setTrait(CommonStrata.definition, "recordId", "test-group");
    model.setTrait(CommonStrata.definition, "magdaRecord", {
      id: "thing-in-group",
      name: "A thing in the group",
      aspects: {
        terria: {
          type: "wms",
          definition: {
            url: "test/WMS/single_metadata_url.xml"
          }
        }
      }
    });

    await workbench.add(model);

    const workbenchWithSingleModel = () => {
      expect(model.target).toBeDefined();
      expect(workbench.items).toEqual([model.target!]); // Note gets deferenced model
      expect(workbench.itemIds).toEqual(["magda-reference"]); // This just gets id of model
      expect(workbench.items[0].type).toBe(WebMapServiceCatalogItem.type);
    };

    workbenchWithSingleModel();

    // Re-add model, tests should be unchanged
    await workbench.add(model);
    workbenchWithSingleModel();

    // Try to add model.target, tests should be unchanged
    await workbench.add(model.target!);
    workbenchWithSingleModel();

    // Try to add model.target.sourceReference, tests should be unchanged
    await workbench.add(model.target!.sourceReference!);
    workbenchWithSingleModel();
  });
});
