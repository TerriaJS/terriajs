import { render, screen } from "@testing-library/react";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import WebMapServiceCatalogItem from "../../../../lib/Models/Catalog/Ows/WebMapServiceCatalogItem";
import Terria from "../../../../lib/Models/Terria";
import DateTimePicker from "../../../../lib/ReactViews/BottomDock/Timeline/DateTimePicker";

describe("DateTimePicker", function () {
  let terria: Terria;
  let wmsItem: WebMapServiceCatalogItem;

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });
  });

  it("A datetime selector is rendered for WMS with not many dates", async function () {
    wmsItem = new WebMapServiceCatalogItem("mywms", terria);
    wmsItem.setTrait("definition", "url", "/test/WMS/comma_sep_datetimes.xml");
    wmsItem.setTrait("definition", "layers", "13_intervals");
    await wmsItem.loadMapItems();
    render(
      <DateTimePicker
        currentDate={
          wmsItem.currentDiscreteJulianDate === undefined
            ? undefined
            : JulianDate.toDate(wmsItem.currentDiscreteJulianDate)
        }
        dates={wmsItem.objectifiedDates}
        onChange={() => {}}
        openDirection="down"
        isOpen
        onClose={() => {}}
      />
    );

    // The year selection view is shown (13 dates span 2002-2014)
    expect(screen.getByText("Select a year")).toBeTruthy();

    // Each year renders as a label in the grid
    const yearLabels = screen.getAllByText(/^\d{4}$/);
    expect(yearLabels.length).toBe(13);

    // The first year should be 2002
    expect(yearLabels[0].textContent).toContain("2002");
  });
});
