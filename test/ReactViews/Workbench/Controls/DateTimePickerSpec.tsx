import { act } from "react-dom/test-utils";
import TestRenderer, { ReactTestRenderer } from "react-test-renderer";

import React from "react";

import Terria from "../../../../lib/Models/Terria";
import WebMapServiceCatalogItem from "../../../../lib/Models/WebMapServiceCatalogItem";
import DateTimePicker from "../../../../lib/ReactViews/BottomDock/Timeline/DateTimePicker";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";

import Styles from "../../../../lib/ReactViews/BottomDock/Timeline/timeline.scss";

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

    const dates = testRenderer.root
      .findAllByType("div")
      .filter(d => d.props.className === Styles.gridRow);
    expect(dates.length).toBe(13);

    let firstDate = dates[0].children[0];

    expect(typeof firstDate !== "string" && firstDate.children[0]).toBe("2002");
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

    const dates = testRenderer.root.findAllByProps({
      className: Styles.dateBtn
    });
    expect(dates.length).toBe(
      wmsItem.objectifiedDates[20][2015][3][28].indice.length
    );
  });
});
