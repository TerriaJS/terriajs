import CsvCatalogItem from "../../../lib/Models/Catalog/CatalogItems/CsvCatalogItem";
import CommonStrata from "../../../lib/Models/Definition/CommonStrata";
import updateModelFromJson from "../../../lib/Models/Definition/updateModelFromJson";
import Terria from "../../../lib/Models/Terria";
import TableStylingWorkflow from "../../../lib/Models/Workflows/TableStylingWorkflow";

describe("TableStylingWorkflow", function () {
  let item: CsvCatalogItem;
  let workflow: TableStylingWorkflow;

  beforeEach(function () {
    item = new CsvCatalogItem("test", new Terria(), undefined);
    // In the user stratum, which is the one the workflow edits
    updateModelFromJson(item, CommonStrata.user, {
      csvString: "lat,lon,fruit\n-35,149,a\n-35,150,b",
      activeStyle: "fruit",
      styles: [
        {
          id: "fruit",
          color: {
            colorColumn: "fruit",
            mapType: "enum",
            enumColors: [
              { value: "a", color: "#ff0000", legendTitle: "Apples" },
              { value: "b", color: "#0000ff", legendTitle: "Bananas" }
            ]
          }
        }
      ]
    });
    workflow = new TableStylingWorkflow(item);
  });

  afterEach(function () {
    workflow.onClose();
  });

  describe("setEnumColorTrait", function () {
    const enumColors = () => item.activeTableStyle.colorTraits.enumColors;

    it("keeps the legend title when only the color changes", function () {
      workflow.setEnumColorTrait(CommonStrata.user, 0, "a", "#00ff00");
      expect(enumColors()?.[0].color).toBe("#00ff00");
      expect(enumColors()?.[0].legendTitle).toBe("Apples");
      expect(enumColors()?.[1].legendTitle).toBe("Bananas");
    });

    it("drops the legend title when the value changes", function () {
      workflow.setEnumColorTrait(CommonStrata.user, 0, "c", "#ff0000");
      const changed = enumColors()?.find(
        (enumColor) => enumColor.value === "c"
      );
      expect(changed?.legendTitle).toBeUndefined();
      expect(
        enumColors()?.find((enumColor) => enumColor.value === "a")
      ).toBeUndefined();
    });
  });
});
