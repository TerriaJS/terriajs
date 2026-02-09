"use strict";

import CompositeCatalogItem from "../../lib/Models/Catalog/CatalogItems/CompositeCatalogItem";
import TerrainCatalogItem from "../../lib/Models/TerrainCatalogItem";
import Terria from "../../lib/Models/Terria";

describe("TerrainCatalogItem", function () {
  var terria;
  var item;

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });
    item = new TerrainCatalogItem(terria);
  });

  it("sets terrainProvider on Cesium scene when enabled", async function () {
    var fakeTerrainProvider = {};
    vi.spyOn(item, "_createTerrainProvider").mockReturnValue(fakeTerrainProvider);

    terria.cesium = {
      scene: {
        terrainProvider: undefined
      }
    };

    item.isEnabled = true;

    await item.load();
    expect(terria.cesium.scene.terrainProvider).toBe(fakeTerrainProvider);
  });

  it("restores previous terrainProvider when disabled", async function () {
    var fakeTerrainProvider = {};
    vi.spyOn(item, "_createTerrainProvider").mockReturnValue(fakeTerrainProvider);

    var originalTerrainProvider = {};
    terria.cesium = {
      scene: {
        terrainProvider: originalTerrainProvider
      }
    };

    item.isEnabled = true;

    await item.load();
    expect(terria.cesium.scene.terrainProvider).toBe(fakeTerrainProvider);

    item.isEnabled = false;
    expect(terria.cesium.scene.terrainProvider).toBe(originalTerrainProvider);
  });

  it("hides other terrainProvider catalog items when enabled", async function () {
    terria.cesium = {
      scene: {
        terrainProvider: undefined
      }
    };

    var enabledItem = new TerrainCatalogItem(terria);
    vi.spyOn(enabledItem, "_createTerrainProvider").mockReturnValue({});
    enabledItem.isEnabled = true;

    await enabledItem.load();
    vi.spyOn(item, "_createTerrainProvider").mockReturnValue({});
    item.isEnabled = true;

    await item.load();
    expect(enabledItem.isShown).toBe(false);
  });

  it("hides CompositeCatalogItem containing terrain when enabled", async function () {
    terria.cesium = {
      scene: {
        terrainProvider: undefined
      }
    };

    var composite = new CompositeCatalogItem(terria);
    var enabledItem = new TerrainCatalogItem(terria);
    vi.spyOn(enabledItem, "_createTerrainProvider").mockReturnValue({});
    composite.add(enabledItem);

    composite.isEnabled = true;

    await composite.load();
    vi.spyOn(item, "_createTerrainProvider").mockReturnValue({});
    item.isEnabled = true;

    await item.load();
    expect(composite.isShown).toBe(false);
  });

  it("throws when shown in 2D", async function () {
    terria.leaflet = {};
    vi.spyOn(item, "_createTerrainProvider").mockReturnValue({});
    vi.spyOn(terria.error, "raiseEvent");

    item.isEnabled = true;

    await item.load();
    expect(terria.raiseErrorToUser).toHaveBeenCalled();
    expect(item.isShown).toBe(false);
    item.isShown = true;
    expect(terria.raiseErrorToUser.mock.calls.length).toBe(2);
  });
});
