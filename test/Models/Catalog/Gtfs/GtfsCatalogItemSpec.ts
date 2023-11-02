import Color from "terriajs-cesium/Source/Core/Color";
import MappableMixin from "../../../../lib/ModelMixins/MappableMixin";
import GtfsCatalogItem from "../../../../lib/Models/Catalog/Gtfs/GtfsCatalogItem";
import CommonStrata from "../../../../lib/Models/Definition/CommonStrata";
import updateModelFromJson from "../../../../lib/Models/Definition/updateModelFromJson";
import Terria from "../../../../lib/Models/Terria";

describe("GtfsCatalogItem", function () {
  let item: GtfsCatalogItem;

  beforeEach(function () {
    item = new GtfsCatalogItem("test", new Terria({ baseUrl: "./" }));
    item.setTrait(
      CommonStrata.definition,
      "url",
      "test/gtfs/vic-metro-vehicle-positions.pbf"
    );
  });

  it("is Mappable", function () {
    expect(MappableMixin.isMixedInto(item)).toBeTruthy();
  });

  it("creates a DataSource with points", async function () {
    await item.loadMapItems();
    expect(item.mapItems.length).toBe(1);
    expect(item.mapItems[0].entities.values.length).toBe(123);
    expect(item.mapItems[0].entities.values[0].point).toBeDefined();
    expect(item.mapItems[0].entities.values[0].model).toBeUndefined();
    expect(item.mapItems[0].entities.values[0].billboard).toBeUndefined();
    expect(item.mapItems[0].entities.values[0].polygon).toBeUndefined();
  });

  it("creates a DataSource with billboards when an image is given", async function () {
    item.setTrait(CommonStrata.definition, "image", "test/gtfs/bus.png");
    await item.loadMapItems();
    expect(item.mapItems.length).toBe(1);
    expect(item.mapItems[0].entities.values.length).toBe(123);
    expect(item.mapItems[0].entities.values[0].billboard).toBeDefined();
    expect(item.mapItems[0].entities.values[0].point).toBeUndefined();
    expect(item.mapItems[0].entities.values[0].model).toBeUndefined();
    expect(item.mapItems[0].entities.values[0].polygon).toBeUndefined();
  });

  it("creates a DataSource with billboards and models when an image and a model is given", async function () {
    item.setTrait(CommonStrata.definition, "image", "test/gtfs/bus.png");
    updateModelFromJson(item, CommonStrata.definition, {
      model: { url: "models/prism-train.glb" }
    }).throwIfError();
    await item.loadMapItems();
    expect(item.mapItems.length).toBe(1);
    expect(item.mapItems[0].entities.values.length).toBe(123);
    expect(item.mapItems[0].entities.values[0].billboard).toBeDefined();
    expect(item.mapItems[0].entities.values[0].model).toBeDefined();
    expect(item.mapItems[0].entities.values[0].point).toBeUndefined();
    expect(item.mapItems[0].entities.values[0].polygon).toBeUndefined();
  });

  it("creates a Datasource with multiple models coloured by attribute when model.colorModelsByProperty is used", async function () {
    updateModelFromJson(item, CommonStrata.definition, {
      model: {
        url: "models/prism-train.glb",
        colorModelsByProperty: {
          property: "vehicle.trip.trip_id",
          colorGroups: [
            {
              color: "#FF0000",
              regExp: "2-ALM"
            },
            {
              color: "#00FF00",
              regExp: "2-B31"
            },
            {
              color: "#0000FF",
              regExp: "2-BEL"
            }
          ]
        }
      }
    }).throwIfError();
    await item.loadMapItems();
    expect(item.mapItems.length).toBe(1);
    expect(
      item.mapItems[0].entities.values.filter(
        ({ model }) => model !== undefined
      ).length
    ).toBe(
      22,
      "Expected only 22 vehicles matching given colorGroups to have models"
    );

    const expectedColors = [
      { index: 9, color: "#00ff00" },
      { index: 114, color: "#00ff00" },
      { index: 20, color: "#0000ff" },
      { index: 67, color: "#0000ff" },
      { index: 58, color: "#ff0000" },
      { index: 60, color: "#ff0000" }
    ];

    expectedColors.forEach(({ index, color }) => {
      const modelColor = item.mapItems[0].entities.values[
        index
      ].model?.color?.getValue(item.terria.timelineClock.currentTime);
      expect(modelColor.equals(Color.fromCssColorString(color))).toBe(
        true,
        `Expected ${modelColor.toCssHexString()} to equal color ${color} at index ${index}`
      );
    });
  });
});
