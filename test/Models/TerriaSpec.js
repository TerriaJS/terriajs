"use strict";

/*global require*/
var Terria = require("../../lib/Models/Terria");
var WebMapServiceCatalogItem = require("../../lib/Models/WebMapServiceCatalogItem");

describe("Terria", function() {
  var terria;

  beforeEach(function() {
    terria = new Terria({
      baseUrl: "./"
    });
  });

  it("initializes proxy with parameters from config file", function(done) {
    terria
      .start({
        configUrl: "test/init/configProxy.json"
      })
      .then(function() {
        expect(terria.corsProxy.baseProxyUrl).toBe("/myproxy/");
        expect(terria.corsProxy.proxyDomains).toEqual([
          "example.com",
          "csiro.au"
        ]);
      })
      .then(done)
      .otherwise(done.fail);
  });
  it("tells us there's a time enabled WMS with `checkNowViewingForTimeWms()`", function(done) {
    terria
      .start({
        configUrl: "test/init/configProxy.json"
      })
      .then(function() {
        expect(terria.checkNowViewingForTimeWms()).toEqual(false);
      })
      .then(function() {
        const wmsItem = new WebMapServiceCatalogItem(terria);
        wmsItem.updateFromJson({
          url: "http://example.com",
          metadataUrl: "test/WMS/comma_sep_datetimes_inherited.xml",
          layers: "13_intervals",
          dataUrl: "" // to prevent a DescribeLayer request
        });
        wmsItem
          .load()
          .then(function() {
            terria.nowViewing.add(wmsItem);
            expect(terria.checkNowViewingForTimeWms()).toEqual(true);
          })
          .then(done)
          .otherwise(done.fail);
      })
      .otherwise(done.fail);
  });
});
