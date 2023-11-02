import CommonStrata from "../../lib/Models/Definition/CommonStrata";
import Terria from "../../lib/Models/Terria";
import WebMapServiceCatalogItem from "../../lib/Models/Catalog/Ows/WebMapServiceCatalogItem";

describe("DiscretelyTimeVaryingMixin", () => {
  let terria: Terria;
  let wmsItem: WebMapServiceCatalogItem;

  beforeEach(async function () {
    terria = new Terria({
      baseUrl: "./"
    });
  });

  it("ObjectifiedDates returns correct object", async function () {
    wmsItem = new WebMapServiceCatalogItem("mywms2", terria);
    wmsItem.setTrait(
      "definition",
      "url",
      "/test/WMS/period_datetimes_many_intervals.xml"
    );
    wmsItem.setTrait("definition", "layers", "single_period");
    await wmsItem.loadMapItems();

    const years = wmsItem.objectifiedDates[20];
    expect(years.dates.length).toBe(1000);
    expect(years.index[0]).toBe(2015);
    const months = years[years.index[0]];
    expect(months.dates.length).toBe(1000);
    expect(months.index[0]).toBe(3);
  });

  it("supports specifying a chartColor", async function () {
    wmsItem = new WebMapServiceCatalogItem("mywms2", terria);
    wmsItem.setTrait(
      "definition",
      "url",
      "/test/WMS/period_datetimes_many_intervals.xml"
    );
    wmsItem.setTrait(CommonStrata.definition, "layers", "single_period");
    wmsItem.setTrait(CommonStrata.user, "showInChartPanel", true);
    wmsItem.setTrait(CommonStrata.user, "chartColor", "#efefef");
    await wmsItem.loadMapItems();
    expect(wmsItem.chartItems[0].getColor()).toBe("#efefef");
  });

  it("sets multiplier correctly from multiplierDefaultDeltaStep", async function () {
    wmsItem = new WebMapServiceCatalogItem("mywms2", terria);
    wmsItem.setTrait(
      "definition",
      "url",
      "/test/WMS/period_datetimes_many_intervals.xml"
    );

    await wmsItem.loadMetadata();

    expect(wmsItem.multiplier).toBeDefined();
    expect(wmsItem.multiplierDefaultDeltaStep).toBeDefined();

    // This dataset has a timestep every minute
    expect(Math.round(wmsItem.multiplier!)).toBe(
      60 / wmsItem.multiplierDefaultDeltaStep!
    );
  });
});
