import { runInAction } from "mobx";
import createGuid from "terriajs-cesium/Source/Core/createGuid";
import CommonStrata from "../../../../lib/Models/Definition/CommonStrata";
import SplitItemReference from "../../../../lib/Models/Catalog/CatalogReferences/SplitItemReference";
import Terria from "../../../../lib/Models/Terria";
import WebMapServiceCatalogItem from "../../../../lib/Models/Catalog/Ows/WebMapServiceCatalogItem";
import GeoJsonCatalogItem from "../../../../lib/Models/Catalog/CatalogItems/GeoJsonCatalogItem";
import HasLocalData from "../../../../lib/Models/HasLocalData";

describe("SplitItemReference", function () {
  it("can dereference the source item", async function () {
    const terria = new Terria();
    const splitRef = new SplitItemReference(createGuid(), terria);
    const sourceItem = new WebMapServiceCatalogItem(createGuid(), terria);
    terria.addModel(splitRef);
    terria.addModel(sourceItem);
    runInAction(() => {
      splitRef.setTrait(
        CommonStrata.user,
        "splitSourceItemId",
        sourceItem.uniqueId
      );
    });
    await splitRef.loadReference();
    expect(splitRef.target instanceof WebMapServiceCatalogItem).toBe(true);
  });

  it("transfers local file data to the cloned item", async function () {
    const terria = new Terria();
    const sourceItem = new GeoJsonCatalogItem(createGuid(), terria);
    const file = new File(
      ['{"type":"FeatureCollection","features":[]}'],
      "test.geojson",
      {
        type: "application/json"
      }
    );
    sourceItem.setFileInput(file);

    const splitRef = new SplitItemReference(createGuid(), terria);
    terria.addModel(sourceItem);
    terria.addModel(splitRef);
    runInAction(() => {
      splitRef.setTrait(
        CommonStrata.user,
        "splitSourceItemId",
        sourceItem.uniqueId
      );
    });

    await splitRef.loadReference();

    const clone = splitRef.target;
    expect(clone).toBeDefined();
    expect(HasLocalData.is(clone)).toBe(true);
    if (HasLocalData.is(clone)) {
      expect(clone.hasLocalData).toBe(true);
      expect(clone.fileInput).toBe(file);
    }
  });
});
