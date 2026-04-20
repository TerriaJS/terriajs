import { render, screen } from "@testing-library/react";
import WebMapServiceCatalogItem from "../../../../lib/Models/Catalog/Ows/WebMapServiceCatalogItem";
import Terria from "../../../../lib/Models/Terria";
import { formatDateTime } from "../../../../lib/ReactViews/BottomDock/Timeline/DateFormats";
import { terriaTheme } from "../../../../lib/ReactViews/StandardUserInterface";
import DateTimeSelectorSection from "../../../../lib/ReactViews/Workbench/Controls/DateTimeSelectorSection";

describe("DateTimeSelectorSection", function () {
  let terria: Terria;
  let wmsItem: WebMapServiceCatalogItem;

  beforeEach(async function () {
    terria = new Terria({
      baseUrl: "./"
    });

    wmsItem = new WebMapServiceCatalogItem("mywms", terria);
    wmsItem.setTrait("definition", "url", "/test/WMS/comma_sep_datetimes.xml");
    wmsItem.setTrait("definition", "layers", "13_intervals");
    await wmsItem.loadMapItems();
  });

  it("A datetime selector is rendered", function () {
    render(<DateTimeSelectorSection theme={terriaTheme} item={wmsItem} />);
    // Need to do it the longer way because Travis runs in a diff locale
    const expectedDateStr = formatDateTime(
      new Date("2014-01-01T00:00:00.000Z")
    );

    expect(
      screen.getByRole("button", { name: "dateTime.previous" })
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "dateTime.next" })).toBeVisible();
    expect(
      screen.getByRole("button", { name: "dateTime.useTimeline" })
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "dateTime.availableTimeChart" })
    ).toBeVisible();
    expect(screen.getByRole("button", { name: expectedDateStr })).toBeVisible();

    expect(screen.getByText("dateTime.selectorLabel")).toBeVisible();
  });

  it("A datetime selector uses timeLabel", function () {
    wmsItem.setTrait("definition", "timeLabel", "Some Label");

    render(<DateTimeSelectorSection theme={terriaTheme} item={wmsItem} />);

    expect(screen.getByText("Some Label")).toBeVisible();
  });

  it("A datetime selector can be formatted", function () {
    wmsItem.setTrait("definition", "dateFormat", "yyyy");
    render(<DateTimeSelectorSection theme={terriaTheme} item={wmsItem} />);

    screen.getByRole("button", { name: "2014" });
  });
});
