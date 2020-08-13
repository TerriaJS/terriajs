import React from "react";
import { act } from "react-dom/test-utils";
import TestRenderer, { ReactTestRenderer } from "react-test-renderer";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import Terria from "../../../../lib/Models/Terria";
import WebMapServiceCatalogItem from "../../../../lib/Models/WebMapServiceCatalogItem";
import { formatDateTime } from "../../../../lib/ReactViews/BottomDock/Timeline/DateFormats";
import DateTimePicker from "../../../../lib/ReactViews/BottomDock/Timeline/DateTimePicker";

const DateButton = require("../../../../lib/ReactViews/BottomDock/Timeline/DateTimePicker")
  .DateButton;
const GridRow = require("../../../../lib/ReactViews/BottomDock/Timeline/DateTimePicker")
  .GridRow;

describe("DateTimePicker", function() {
  let terria: Terria;
  let wmsItem: WebMapServiceCatalogItem;
  let testRenderer: ReactTestRenderer;

  beforeEach(async function() {
    terria = new Terria({
      baseUrl: "./"
    });
  });

  it("A datetime selector is rendered for WMS with not many dates", async function() {
    wmsItem = new WebMapServiceCatalogItem("mywms", terria);
    wmsItem.setTrait("definition", "url", "/test/WMS/comma_sep_datetimes.xml");
    wmsItem.setTrait("definition", "layers", "13_intervals");
    await wmsItem.loadMapItems();
    act(() => {
      testRenderer = TestRenderer.create(
        <DateTimePicker
          currentDate={
            wmsItem.currentDiscreteJulianDate === undefined
              ? undefined
              : JulianDate.toDate(wmsItem.currentDiscreteJulianDate)
          }
          dates={wmsItem.objectifiedDates}
          onChange={() => {}}
          openDirection="down"
          isOpen={true}
          showCalendarButton={false}
          onOpen={() => {}}
          onClose={() => {}}
        />
      );
    });

    const dates = testRenderer.root.findAllByType(GridRow);
    expect(dates.length).toBe(13);

    expect(
      // ಠ_ಥ
      (dates[0] as any).children[0].children[0].children[0].children[0]
    ).toBe("2002");
  });

  it("A datetime selector is rendered for WMS with many dates", async function() {
    wmsItem = new WebMapServiceCatalogItem("mywms2", terria);
    wmsItem.setTrait(
      "definition",
      "url",
      "/test/WMS/period_datetimes_many_intervals.xml"
    );
    wmsItem.setTrait("definition", "layers", "single_period");
    await wmsItem.loadMapItems();
    act(() => {
      testRenderer = TestRenderer.create(
        <DateTimePicker
          currentDate={
            wmsItem.currentDiscreteJulianDate === undefined
              ? undefined
              : JulianDate.toDate(wmsItem.currentDiscreteJulianDate)
          }
          dates={wmsItem.objectifiedDates}
          onChange={() => {}}
          openDirection="down"
          isOpen={true}
          showCalendarButton={false}
          onOpen={() => {}}
          onClose={() => {}}
        />
      );
    });

    const dates = testRenderer.root.findAllByType(DateButton);

    const expectedDate = formatDateTime(new Date("2015-03-28T00:00:00.000Z"));

    console.log(expectedDate);

    const dateSplit = expectedDate.split("/");

    expect(dates.length).toBe(
      wmsItem.objectifiedDates[20][parseInt(dateSplit[2])][
        parseInt(dateSplit[1])
      ][parseInt(dateSplit[0])].indice.length
    );
  });
});
