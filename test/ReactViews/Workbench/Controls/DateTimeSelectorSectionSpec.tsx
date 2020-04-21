const create: any = require("react-test-renderer").create;
import { act } from "react-dom/test-utils";
const findAllWithType = require("react-shallow-testutils").findAllWithType;
import { getShallowRenderedOutput } from "../../MoreShallowTools";
import React from "react";

import Terria from "../../../../lib/Models/Terria";
import WebMapServiceCatalogItem from "../../../../lib/Models/WebMapServiceCatalogItem";
import DateTimeSelectorSection from "../../../../lib/ReactViews/Workbench/Controls/DateTimeSelectorSection";

describe("DateTimeSelectorSection", function() {
  let terria: Terria;
  let wmsItem: WebMapServiceCatalogItem;
  let testRenderer: any;
  let buttons: any;
  let currentDateBtn: any;

  beforeEach(async function() {
    terria = new Terria({
      baseUrl: "./"
    });

    wmsItem = new WebMapServiceCatalogItem("mywms", terria);
    wmsItem.setTrait("definition", "url", "/test/WMS/comma_sep_datetimes.xml");
    wmsItem.setTrait("definition", "layers", "13_intervals");
    await wmsItem.loadMapItems();
    act(() => {
      testRenderer = create(
        <DateTimeSelectorSection t={() => {}} item={wmsItem} />
      );
    });
    buttons = testRenderer.root.findAllByType("button");
    currentDateBtn = buttons.filter((b: any) => {
      if (b.props.className.indexOf("currentDate") > -1) return true;
      return false;
    })[0];
  });

  it("A datetime selector is rendered", function() {
    expect(buttons).toBeDefined();
    expect(buttons.length).toEqual(5);
    expect(currentDateBtn.children[0]).toEqual("01/01/2014, 11:00:00");
  });

  it("A datetime selector can be formatted", async function() {
    wmsItem.setTrait("definition", "dateFormat", "yyyy");
    expect(buttons).toBeDefined();
    expect(buttons.length).toEqual(5);
    expect(currentDateBtn.children[0]).toEqual("2014");
  });
});
