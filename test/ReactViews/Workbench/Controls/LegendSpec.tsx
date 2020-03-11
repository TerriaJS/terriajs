const findAllWithType = require("react-shallow-testutils").findAllWithType;
import { getShallowRenderedOutput } from "../../MoreShallowTools";
import React from "react";

import Terria from "../../../../lib/Models/Terria";
import WebMapServiceCatalogItem from "../../../../lib/Models/WebMapServiceCatalogItem";
import Legend from "../../../../lib/ReactViews/Workbench/Controls/Legend";

describe("Legend", function() {
  let terria: Terria;
  let wmsItem: WebMapServiceCatalogItem;

  beforeEach(function() {
    terria = new Terria({
      baseUrl: "./"
    });

    wmsItem = new WebMapServiceCatalogItem('mywms' ,terria);
    wmsItem.setTrait("definition", "url", "/test/WMS/single_style_legend_url.xml");
  });

  it("A legend image can be rendered", async function(done) {
    wmsItem.loadMapItems().then(() => {
      // @ts-ignore
        const legendSection = <Legend item={wmsItem} />;
        const result = getShallowRenderedOutput(legendSection);
        const memberComponents = findAllWithType(result, "img");
        expect(memberComponents.length).toEqual(1);
      })
      .then(done)
  });


  it("A legend image can be hidden", async function(done) {
    wmsItem.setTrait("definition", "hideLegendInWorkbench", true);
    wmsItem.loadMapItems().then(() => {
        // @ts-ignore
        const legendSection = <Legend item={wmsItem} />;
        const result = getShallowRenderedOutput(legendSection);
        expect(result).toEqual(null)
      })
      .then(done)
  });

});
