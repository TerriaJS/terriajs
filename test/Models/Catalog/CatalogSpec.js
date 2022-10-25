"use strict";

var Terria = require("../../../lib/Models/Terria");
var loadJson = require("../../../lib/Core/loadJson").default;
var CHART_DATA_CATEGORY_NAME =
  require("../../../lib/Core/addedForCharts").CHART_DATA_CATEGORY_NAME;

var Catalog = require("../../lib/Models/Catalog");
var CatalogItem = require("../../lib/Models/CatalogItem");
var createCatalogMemberFromType = require("../../../lib/Models/Catalog/createCatalogMemberFromType");
var CatalogGroup = require("../../lib/Models/CatalogGroup");
var GeoJsonCatalogItem = require("../../../lib/Models/Catalog/CatalogItems/GeoJsonCatalogItem");
var ImageryLayerCatalogItem = require("../../lib/Models/ImageryLayerCatalogItem");
var WebMapServiceCatalogItem = require("../../../lib/Models/Catalog/Ows/WebMapServiceCatalogItem");

describe("Catalog", function () {
  var terria;
  var catalog;

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });
    createCatalogMemberFromType.register("group", CatalogGroup);
    createCatalogMemberFromType.register("item", CatalogItem);
    createCatalogMemberFromType.register(
      "imageryLayerCatalogItem",
      ImageryLayerCatalogItem
    );
    createCatalogMemberFromType.register("wms", WebMapServiceCatalogItem);
    catalog = terria.catalog;
  });

  it("can register group and geojson, and update from json", function (done) {
    createCatalogMemberFromType.register("geojson", GeoJsonCatalogItem);

    loadJson("test/init/geojson-with-template.json")
      .then(function (json) {
        var catalog = new Catalog(terria);
        catalog
          .updateFromJson(json.catalog)
          .then(function () {
            expect(catalog.group.constructor).toEqual(CatalogGroup);
            expect(catalog.group.items[0].constructor).toEqual(CatalogGroup);
            expect(catalog.group.items[0].items[0].constructor).toEqual(
              GeoJsonCatalogItem
            );
            done();
          })
          .catch(done.fail);
      })
      .catch(done.fail);
  });

  describe("chartDataGroup", function () {
    it("returns the group used for chart data when retrieved via chartDataGroup", function () {
      const group = catalog.chartDataGroup;
      expect(group.name).toBe(CHART_DATA_CATEGORY_NAME);
      expect(group.type).toBe("group");
      expect(group.description).toBe("A group for chart data.");
      expect(group.isUserSupplied).toBe(true);
    });
  });

  describe("updateByShareKeys", function () {
    it("works when resolving by id", function (done) {
      catalog
        .updateFromJson([
          {
            name: "A",
            type: "group",
            items: [
              {
                id: "C",
                name: "C",
                type: "item",
                isEnabled: false
              }
            ]
          },
          {
            name: "B",
            type: "group"
          }
        ])
        .then(function () {
          expect(catalog.group.items[0].items[0].isEnabled).toBe(false);
          expect(catalog.group.items[0].isOpen).toBeFalsy();
          expect(catalog.group.isOpen).toBeFalsy();

          return catalog.updateByShareKeys({ C: {} });
        })
        .then(function () {
          expect(catalog.group.items[0].items[0].isEnabled).toBe(true);
          expect(catalog.group.items[0].isOpen).toBeTruthy();
          expect(catalog.group.isOpen).toBeTruthy();
          done();
        })
        .catch(fail);
    });

    it("works when resolving by shareKeys", function (done) {
      catalog
        .updateFromJson([
          {
            name: "A",
            type: "group",
            items: [
              {
                id: "blah",
                shareKeys: ["C"],
                name: "C",
                type: "item",
                isEnabled: false
              }
            ]
          },
          {
            name: "B",
            type: "group"
          }
        ])
        .then(function () {
          expect(catalog.group.items[0].items[0].isEnabled).toBe(false);
          expect(catalog.group.items[0].isOpen).toBeFalsy();
          expect(catalog.group.isOpen).toBeFalsy();

          return catalog.updateByShareKeys({ C: {} });
        })
        .then(function () {
          expect(catalog.group.items[0].items[0].isEnabled).toBe(true);
          expect(catalog.group.items[0].isOpen).toBeTruthy();
          expect(catalog.group.isOpen).toBeTruthy();
          done();
        })
        .catch(fail);
    });

    it("opens parent groups", function (done) {
      catalog
        .updateFromJson([
          {
            name: "A",
            type: "group",
            items: [
              {
                id: "C",
                name: "C",
                type: "item"
              }
            ]
          },
          {
            name: "B",
            type: "group"
          }
        ])
        .then(function () {
          return catalog.updateByShareKeys({ C: {} });
        })
        .then(function () {
          expect(catalog.group.items[0].isOpen).toBe(true);
          expect(catalog.group.isOpen).toBe(true);
          done();
        })
        .catch(fail);
    });

    it("works for multiple share keys", function (done) {
      catalog
        .updateFromJson([
          {
            name: "A",
            type: "group",
            items: [
              {
                id: "C",
                name: "C",
                type: "item"
              }
            ]
          },
          {
            name: "B",
            type: "group",
            items: [
              {
                id: "D",
                name: "D",
                type: "item"
              }
            ]
          }
        ])
        .then(function () {
          return catalog.updateByShareKeys({ C: {}, D: {} });
        })
        .then(function () {
          expect(catalog.group.items[0].items[0].isEnabled).toBe(true);
          expect(catalog.group.items[1].items[0].isEnabled).toBe(true);
          done();
        })
        .catch(fail);
    });

    it("only enabled a catalog member after all those before it have finished loading", function (done) {
      catalog
        .updateFromJson([
          {
            name: "A",
            type: "group"
          }
        ])
        .then(function () {
          expect(catalog.group.items[0].items.length).toBe(0);

          spyOn(catalog.group.items[0], "load").and.returnValue(
            catalog.group.items[0].updateFromJson({
              items: [
                {
                  id: "C",
                  name: "C",
                  type: "item"
                }
              ]
            })
          );

          return catalog.updateByShareKeys({ "Root Group/A": {}, C: {} });
        })
        .then(function () {
          expect(catalog.group.items[0].items[0].isEnabled).toBe(true);
          done();
        })
        .catch(fail);
    });

    it("updates associated shared data like opacity", function (done) {
      catalog
        .updateFromJson([
          {
            name: "A",
            type: "imageryLayerCatalogItem"
          }
        ])
        .then(function () {
          expect(catalog.group.items[0].opacity).not.toBe(0.3);

          return catalog.updateByShareKeys({
            "Root Group/A": {
              opacity: 0.3
            }
          });
        })
        .then(function () {
          expect(catalog.group.items[0].opacity).toBe(0.3);
          done();
        })
        .catch(fail);
    });
  });

  describe("serializeToJson", function () {
    beforeEach(function (done) {
      catalog
        .updateFromJson([
          {
            name: "A",
            type: "group",
            items: [
              {
                id: "C",
                name: "C",
                type: "wms"
              }
            ]
          },
          {
            name: "B",
            type: "group",
            items: [
              {
                id: "D",
                name: "D",
                type: "wms"
              }
            ]
          }
        ])
        .then(done);
    });

    it("serializes the catalog recursively", function () {
      var serialized = catalog.serializeToJson();

      expect(serialized.length).toBe(2);
      expect(serialized[0].name).toBe("A");
      expect(serialized[1].items.length).toBe(1);
      expect(serialized[1].items[0].name).toBe("D");
    });

    it("can round-trip a basic catalog", function (done) {
      var serialized = catalog.serializeToJson();
      var newCatalog = new Catalog(terria);
      newCatalog
        .updateFromJson(serialized)
        .then(function () {
          expect(newCatalog.items).toEqual(catalog.items);
          done();
        })
        .catch(fail);
    });

    it("ignores properties filtered out by propertyFilter", function () {
      var serialized = catalog.serializeToJson({
        propertyFilter: function (property, item) {
          return property !== "name";
        }
      });

      expect(serialized[0].name).toBeUndefined();
      expect(serialized[0].id).toBe("Root Group/A");
    });

    it("ignores items filtered out by itemFilter", function () {
      var serialized = catalog.serializeToJson({
        itemFilter: function (item) {
          return item.name !== "C";
        }
      });

      expect(serialized[0].items.length).toBe(0);
      expect(serialized[1].items.length).toBe(1);
    });
  });
});
