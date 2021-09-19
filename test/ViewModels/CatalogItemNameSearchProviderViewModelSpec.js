"use strict";

var CatalogGroup = require("../../lib/Models/CatalogGroup");
var CatalogItem = require("../../lib/Models/CatalogItem");
var WebMapServiceCatalogItem = require("../../lib/Models/Catalog/Ows/WebMapServiceCatalogItem");
var GeoJsonCatalogItem = require("../../lib/Models/Catalog/CatalogItems/GeoJsonCatalogItem");
var CatalogItemNameSearchProviderViewModel = require("../../lib/ViewModels/CatalogItemNameSearchProviderViewModel");
var inherit = require("../../lib/Core/inherit");
var runLater = require("../../lib/Core/runLater");
var Terria = require("../../lib/Models/Terria");

describe("CatalogItemNameSearchProviderViewModel", function() {
  var terria;
  var searchProvider;

  beforeEach(function() {
    terria = new Terria({
      baseUrl: "./"
    });

    searchProvider = new CatalogItemNameSearchProviderViewModel({
      terria: terria
    });
  });

  it("finds catalog items in a case-insensitive manner", function(done) {
    var catalogGroup = terria.catalog.group;

    var item = new CatalogItem(terria);
    item.name = "Thing to find";
    catalogGroup.add(item);

    searchProvider
      .search("thing")
      .then(function() {
        expect(searchProvider.searchResults.length).toBe(1);
        expect(searchProvider.searchResults[0].name).toBe("Thing to find");
      })
      .then(done)
      .otherwise(done.fail);
  });

  it("finds catalog groups in a case-insensitive manner", function(done) {
    var catalogGroup = terria.catalog.group;

    var item = new CatalogGroup(terria);
    item.name = "Group to find";
    catalogGroup.add(item);

    searchProvider
      .search("to")
      .then(function() {
        expect(searchProvider.searchResults.length).toBe(1);
        expect(searchProvider.searchResults[0].name).toBe("Group to find");
      })
      .then(done)
      .otherwise(done.fail);
  });

  it("does not find catalog items if they do not match", function(done) {
    var catalogGroup = terria.catalog.group;

    var item = new CatalogItem(terria);
    item.name = "Thing to find";
    catalogGroup.add(item);

    searchProvider
      .search("foo")
      .then(function() {
        expect(searchProvider.searchResults.length).toBe(0);
      })
      .then(done)
      .otherwise(done.fail);
  });

  it("finds items in asynchronously-loaded groups", function(done) {
    var DelayedGroup = function() {
      CatalogGroup.call(this, terria);

      this.name = "Delayed Group";
      this._load = function() {
        var that = this;
        return runLater(function() {
          var item = new CatalogItem(terria);
          item.name = "Thing to find";
          that.add(item);
        });
      };
    };
    inherit(CatalogGroup, DelayedGroup);

    terria.catalog.group.add(new DelayedGroup());
    searchProvider
      .search("thing")
      .then(function() {
        expect(searchProvider.searchResults.length).toBe(1);
        expect(searchProvider.searchResults[0].name).toBe("Thing to find");
      })
      .then(done)
      .otherwise(done.fail);
  });

  it("finds results of a certain type in a case-insensitive manner", function(done) {
    var catalogGroup = terria.catalog.group;

    var item1 = new WebMapServiceCatalogItem(terria);
    item1.name = "WMS item to find";
    catalogGroup.add(item1);

    var item2 = new GeoJsonCatalogItem(terria, "");
    item2.name = "GeoJson item to find";
    catalogGroup.add(item2);

    searchProvider
      .search("to is:wMs")
      .then(function() {
        expect(searchProvider.searchResults.length).toBe(1);
        expect(searchProvider.searchResults[0].name).toBe("WMS item to find");
      })
      .then(done)
      .otherwise(done.fail);
  });

  it("finds results not of a certain type in a case-insensitive manner", function(done) {
    var catalogGroup = terria.catalog.group;

    var item1 = new WebMapServiceCatalogItem(terria);
    item1.name = "WMS item to find";
    catalogGroup.add(item1);

    var item2 = new GeoJsonCatalogItem(terria, "");
    item2.name = "GeoJson item to find";
    catalogGroup.add(item2);

    searchProvider
      .search("to -is:wMs")
      .then(function() {
        expect(searchProvider.searchResults.length).toBe(1);
        expect(searchProvider.searchResults[0].name).toBe(
          "GeoJson item to find"
        );
      })
      .then(done)
      .otherwise(done.fail);
  });

  it("finds results having a certain url", function(done) {
    var catalogGroup = terria.catalog.group;

    var item1 = new CatalogItem(terria);
    item1.name = "Server 1 item to find";
    item1.url = "http://server1.gov.au/page";
    catalogGroup.add(item1);

    var item2 = new CatalogItem(terria);
    item2.name = "Server 2 item to find";
    item2.url = "http://server2.gov.au/page";
    catalogGroup.add(item2);

    searchProvider
      .search("to url:server1.gov")
      .then(function() {
        expect(searchProvider.searchResults.length).toBe(1);
        expect(searchProvider.searchResults[0].name).toBe(
          "Server 1 item to find"
        );
      })
      .then(done)
      .otherwise(done.fail);
  });

  it("finds results that do not have a certain url", function(done) {
    var catalogGroup = terria.catalog.group;

    var item1 = new CatalogItem(terria);
    item1.name = "Server 1 item to find";
    item1.url = "http://server1.gov.au/page";
    catalogGroup.add(item1);

    var item2 = new CatalogItem(terria);
    item2.name = "Server 2 item to find";
    item2.url = "http://server2.gov.au/page";
    catalogGroup.add(item2);

    searchProvider
      .search("to -url:server1.gov")
      .then(function() {
        expect(searchProvider.searchResults.length).toBe(1);
        expect(searchProvider.searchResults[0].name).toBe(
          "Server 2 item to find"
        );
      })
      .then(done)
      .otherwise(done.fail);
  });

  it("stops searching after the specified number of items", function(done) {
    var catalogGroup = terria.catalog.group;

    var maxResults = 9;

    // Add items matching the query.
    for (var i = 0; i < maxResults; ++i) {
      var item = new CatalogItem(terria);
      item.name = "Thing to find " + i;
      catalogGroup.add(item);
    }

    // Add an 11th item that will flip out if asked to load.
    var FlipOutGroup = function(terria) {
      CatalogGroup.call(this, terria);

      this.name = "Flip Out Group";
      this._load = function() {
        done.fail("This item should not be asked to load.");
      };
    };
    inherit(CatalogGroup, FlipOutGroup);
    catalogGroup.add(new FlipOutGroup(terria));

    searchProvider.maxResults = maxResults;
    searchProvider
      .search("thing")
      .then(function() {
        expect(searchProvider.searchResults.length).toBe(maxResults);
      })
      .then(done)
      .otherwise(done.fail);
  });

  it("combines duplicate search entries of the same item in different groups", function(done) {
    var catalogGroup = terria.catalog.group;

    var group1 = new CatalogGroup(terria);
    group1.name = "Group1";
    catalogGroup.add(group1);

    var item = new CatalogItem(terria);
    item.name = "Thing to find";
    catalogGroup.add(item);
    group1.add(item);

    searchProvider
      .search("to")
      .then(function() {
        expect(searchProvider.searchResults.length).toBe(1);
        expect(searchProvider.searchResults[0].name).toBe("Thing to find");
        expect(searchProvider.searchResults[0].tooltip).toMatch(
          /^In multiple locations including: /
        );
      })
      .then(done)
      .otherwise(done.fail);
  });

  it("does not combine different items with the same item name", function(done) {
    var catalogGroup = terria.catalog.group;

    var item1 = new CatalogItem(terria);
    item1.name = "Thing to find";
    item1.id = "thing1";
    catalogGroup.add(item1);

    var item2 = new CatalogItem(terria);
    item2.name = "Thing to find";
    item2.id = "thing2";
    catalogGroup.add(item2);

    searchProvider
      .search("to")
      .then(function() {
        expect(searchProvider.searchResults.length).toBe(2);
        expect(searchProvider.searchResults[0].name).toBe("Thing to find");
        expect(searchProvider.searchResults[1].name).toBe("Thing to find");
      })
      .then(done)
      .otherwise(done.fail);
  });
});
