"use strict";

/*global require*/
var CkanCatalogItem = require("../../lib/Models/CkanCatalogItem");
var loadText = require("../../lib/Core/loadText");
var Terria = require("../../lib/Models/Terria");
var TerriaError = require("../../lib/Core/TerriaError");
var WebMapServiceCatalogItem = require("../../lib/Models/WebMapServiceCatalogItem");
var when = require("terriajs-cesium/Source/ThirdParty/when").default;

describe("CkanCatalogItem", function() {
  var terria;
  var ckan;
  var taxationStatisticsPackage;
  var taxationStatisticsWmsResource;

  beforeEach(function(done) {
    when
      .all([
        loadText("test/CKAN/taxation-statistics-package.json").then(function(
          text
        ) {
          taxationStatisticsPackage = text;
        }),
        loadText("test/CKAN/taxation-statistics-wms-resource.json").then(
          function(text) {
            taxationStatisticsWmsResource = text;
          }
        )
      ])
      .then(function() {
        jasmine.Ajax.install();

        terria = new Terria({
          baseUrl: "./"
        });
        ckan = new CkanCatalogItem(terria);

        // Fail all requests by default.
        jasmine.Ajax.stubRequest(/.*/).andError();
      })
      .then(done)
      .otherwise(done.fail);
  });

  afterEach(function() {
    jasmine.Ajax.uninstall();
  });

  it("creates a WMS catalog item when given a datasetId", function(done) {
    ckan.url = "http://example.com";
    ckan.datasetId = "taxation-statistics-2011-12";

    jasmine.Ajax.stubRequest(
      "http://example.com/api/3/action/package_show?id=taxation-statistics-2011-12"
    ).andReturn({
      responseText: taxationStatisticsPackage
    });

    ckan
      .load()
      .then(function() {
        expect(
          ckan.nowViewingCatalogItem instanceof WebMapServiceCatalogItem
        ).toBe(true);
        expect(ckan.nowViewingCatalogItem.url).toBe(
          "http://data.gov.au/geoserver/taxation-statistics-2011-12/wms"
        );
        expect(ckan.nowViewingCatalogItem.layers).toBe(
          "95d9e550_8b36_4273_8df7_2b76c140e73a"
        );
      })
      .then(done)
      .otherwise(done.fail);
  });

  it("creates a WMS catalog item when given a resourceId", function(done) {
    ckan.url = "http://example.com";
    ckan.resourceId = "205ef0d1-521b-4e3c-a26c-4e49e00f1a05";

    jasmine.Ajax.stubRequest(
      "http://example.com/api/3/action/resource_show?id=205ef0d1-521b-4e3c-a26c-4e49e00f1a05"
    ).andReturn({
      responseText: taxationStatisticsWmsResource
    });

    jasmine.Ajax.stubRequest(
      "http://example.com/api/3/action/package_show?id=95d9e550-8b36-4273-8df7-2b76c140e73a"
    ).andReturn({
      responseText: taxationStatisticsPackage
    });

    ckan
      .load()
      .then(function() {
        expect(
          ckan.nowViewingCatalogItem instanceof WebMapServiceCatalogItem
        ).toBe(true);
        expect(ckan.nowViewingCatalogItem.url).toBe(
          "http://data.gov.au/geoserver/taxation-statistics-2011-12/wms"
        );
        expect(ckan.nowViewingCatalogItem.layers).toBe(
          "95d9e550_8b36_4273_8df7_2b76c140e73a"
        );
      })
      .then(done)
      .otherwise(done.fail);
  });

  it("creates a WMS catalog item when given both datasetId and resourceId", function(done) {
    ckan.url = "http://example.com";
    ckan.datasetId = "taxation-statistics-2011-12";
    ckan.resourceId = "205ef0d1-521b-4e3c-a26c-4e49e00f1a05";

    jasmine.Ajax.stubRequest(
      "http://example.com/api/3/action/package_show?id=taxation-statistics-2011-12"
    ).andReturn({
      responseText: taxationStatisticsPackage
    });

    ckan
      .load()
      .then(function() {
        expect(
          ckan.nowViewingCatalogItem instanceof WebMapServiceCatalogItem
        ).toBe(true);
        expect(ckan.nowViewingCatalogItem.url).toBe(
          "http://data.gov.au/geoserver/taxation-statistics-2011-12/wms"
        );
        expect(ckan.nowViewingCatalogItem.layers).toBe(
          "95d9e550_8b36_4273_8df7_2b76c140e73a"
        );
      })
      .then(done)
      .otherwise(done.fail);
  });

  it("picks a compatible resource when given an invalid resourceId", function(done) {
    ckan.url = "http://example.com";
    ckan.datasetId = "taxation-statistics-2011-12";
    ckan.resourceId = "invalid!!";

    jasmine.Ajax.stubRequest(
      "http://example.com/api/3/action/package_show?id=taxation-statistics-2011-12"
    ).andReturn({
      responseText: taxationStatisticsPackage
    });

    ckan
      .load()
      .then(function() {
        expect(
          ckan.nowViewingCatalogItem instanceof WebMapServiceCatalogItem
        ).toBe(true);
        expect(ckan.nowViewingCatalogItem.url).toBe(
          "http://data.gov.au/geoserver/taxation-statistics-2011-12/wms"
        );
        expect(ckan.nowViewingCatalogItem.layers).toBe(
          "95d9e550_8b36_4273_8df7_2b76c140e73a"
        );
      })
      .then(done)
      .otherwise(done.fail);
  });

  it("raises an error when given an invalid resourceId and allowAnyResourceIfResourceIdNotFound is false", function(done) {
    ckan.url = "http://example.com";
    ckan.datasetId = "taxation-statistics-2011-12";
    ckan.resourceId = "invalid!!";
    ckan.allowAnyResourceIfResourceIdNotFound = false;

    jasmine.Ajax.stubRequest(
      "http://example.com/api/3/action/package_show?id=taxation-statistics-2011-12"
    ).andReturn({
      responseText: taxationStatisticsPackage
    });

    ckan
      .load()
      .then(done.fail)
      .otherwise(function(e) {
        expect(e instanceof TerriaError).toBe(true);
        done();
      });
  });
});
