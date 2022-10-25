"use strict";

var CompositeCatalogItem = require("../../lib/Models/Catalog/CatalogItems/CompositeCatalogItem");
var TerrainCatalogItem = require("../../lib/Models/TerrainCatalogItem");
var Terria = require("../../lib/Models/Terria");

describe("TerrainCatalogItem", function () {
  var terria;
  var item;

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });
    item = new TerrainCatalogItem(terria);
  });

  it("sets terrainProvider on Cesium scene when enabled", function (done) {
    var fakeTerrainProvider = {};
    spyOn(item, "_createTerrainProvider").and.returnValue(fakeTerrainProvider);

    terria.cesium = {
      scene: {
        terrainProvider: undefined
      }
    };

    item.isEnabled = true;

    item
      .load()
      .then(function () {
        expect(terria.cesium.scene.terrainProvider).toBe(fakeTerrainProvider);
      })
      .then(done)
      .catch(done.fail);
  });

  it("restores previous terrainProvider when disabled", function (done) {
    var fakeTerrainProvider = {};
    spyOn(item, "_createTerrainProvider").and.returnValue(fakeTerrainProvider);

    var originalTerrainProvider = {};
    terria.cesium = {
      scene: {
        terrainProvider: originalTerrainProvider
      }
    };

    item.isEnabled = true;

    item
      .load()
      .then(function () {
        expect(terria.cesium.scene.terrainProvider).toBe(fakeTerrainProvider);

        item.isEnabled = false;
        expect(terria.cesium.scene.terrainProvider).toBe(
          originalTerrainProvider
        );
      })
      .then(done)
      .catch(done.fail);
  });

  it("hides other terrainProvider catalog items when enabled", function (done) {
    terria.cesium = {
      scene: {
        terrainProvider: undefined
      }
    };

    var enabledItem = new TerrainCatalogItem(terria);
    spyOn(enabledItem, "_createTerrainProvider").and.returnValue({});
    enabledItem.isEnabled = true;

    enabledItem
      .load()
      .then(function () {
        spyOn(item, "_createTerrainProvider").and.returnValue({});
        item.isEnabled = true;

        return item.load().then(function () {
          expect(enabledItem.isShown).toBe(false);
        });
      })
      .then(done)
      .catch(done.fail);
  });

  it("hides CompositeCatalogItem containing terrain when enabled", function (done) {
    terria.cesium = {
      scene: {
        terrainProvider: undefined
      }
    };

    var composite = new CompositeCatalogItem(terria);
    var enabledItem = new TerrainCatalogItem(terria);
    spyOn(enabledItem, "_createTerrainProvider").and.returnValue({});
    composite.add(enabledItem);

    composite.isEnabled = true;

    composite
      .load()
      .then(function () {
        spyOn(item, "_createTerrainProvider").and.returnValue({});
        item.isEnabled = true;

        return item.load().then(function () {
          expect(composite.isShown).toBe(false);
        });
      })
      .then(done)
      .catch(done.fail);
  });

  it("throws when shown in 2D", function (done) {
    terria.leaflet = {};
    spyOn(item, "_createTerrainProvider").and.returnValue({});
    spyOn(terria.error, "raiseEvent");

    item.isEnabled = true;

    item
      .load()
      .then(function () {
        expect(terria.raiseErrorToUser).toHaveBeenCalled();
        expect(item.isShown).toBe(false);
        item.isShown = true;
        expect(terria.raiseErrorToUser.calls.count()).toBe(2);
      })
      .then(done)
      .catch(done.fail);
  });
});
