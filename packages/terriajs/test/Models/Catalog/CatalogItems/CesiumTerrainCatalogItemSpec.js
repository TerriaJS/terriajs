"use strict";

import { http, HttpResponse } from "msw";
import CesiumTerrainCatalogItem from "../../../../lib/Models/Catalog/CatalogItems/CesiumTerrainCatalogItem";
import CesiumTerrainProvider from "terriajs-cesium/Source/Core/CesiumTerrainProvider";
import Terria from "../../../../lib/Models/Terria";
import { worker } from "../../../mocks/browser";

describe("CesiumTerrainCatalogItem", function () {
  var terria;
  var item;

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });
    item = new CesiumTerrainCatalogItem(terria);
  });

  it("has correct type", function () {
    expect(item.type).toBe("cesium-terrain");
    expect(item.typeName).toContain("Cesium");
  });

  it("creates imagery provider with correct URL", async function () {
    worker.use(
      http.get("http://example.com/foo/bar/layer.json", () =>
        HttpResponse.json({
          tilejson: "2.1.0",
          format: "heightmap-1.0",
          version: "1.0.0",
          scheme: "tms",
          tiles: ["{z}/{x}/{y}.terrain?v={version}"]
        })
      )
    );

    item.url = "http://example.com/foo/bar";
    var terrainProvider = item._createTerrainProvider();
    expect(terrainProvider instanceof CesiumTerrainProvider).toBe(true);
    await terrainProvider.readyPromise;
  });
});
