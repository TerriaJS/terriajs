import CommonStrata from "../../lib/Models/CommonStrata";
import DiffableWebMapServiceCatalogItem from "../../lib/Models/DiffableWebMapServiceCatalogItem";
import Terria from "../../lib/Models/Terria";

describe("DiffableWebMapServiceCatalogItem", function() {
  let diffwms: DiffableWebMapServiceCatalogItem;

  beforeEach(async function() {
    diffwms = new DiffableWebMapServiceCatalogItem("test", new Terria());
    diffwms.setTrait(CommonStrata.user, "diffStyleId", "ndvi");
    diffwms.setTrait("definition", "url", "test/WMS/ncwms_service.xml");
    await diffwms.loadMapItems();
  });

  describe("when showing diff", function() {
    beforeEach(function() {
      diffwms.setTrait(CommonStrata.user, "firstDiffDate", "2020-01-01");
      diffwms.setTrait(CommonStrata.user, "secondDiffDate", "2020-10-30");
      diffwms.setTrait(CommonStrata.user, "isShowingDiff", true);
    });

    it("correctly sets the diff style parameter", function() {
      expect(diffwms.parameters.styles).toBe("ndvi");
    });

    it("generates a short report with the difference dates", function() {
      expect(diffwms.shortReport).toContain("2020/01/01");
      expect(diffwms.shortReport).toContain("2020/10/30");
    });

    it("disables the date time selector", function() {
      expect(diffwms.disableDateTimeSelector).toBe(true);
    });

    it("can generate a legend url for the diff style", function() {
      expect(diffwms.legends).toBeDefined();
      expect(diffwms.legends[0].url).toBe(
        "http://example.com/wms?REQUEST=GetLegendGraphic&LAYER=ncwms&PALETTE=ncview"
      );
    });

    it("disables styleSelectableDimensions", function() {
      diffwms.styleSelectableDimensions.forEach(dim =>
        expect(dim.disable).toBe(true)
      );
    });
  });
});
