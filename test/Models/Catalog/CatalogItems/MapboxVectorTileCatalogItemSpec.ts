import { action } from "mobx";
import { LineSymbolizer, PolygonSymbolizer } from "protomaps";
import ProtomapsImageryProvider from "../../../../lib/Map/ImageryProvider/ProtomapsImageryProvider";
import { ImageryParts } from "../../../../lib/ModelMixins/MappableMixin";
import MapboxVectorTileCatalogItem from "../../../../lib/Models/Catalog/CatalogItems/MapboxVectorTileCatalogItem";
import CommonStrata from "../../../../lib/Models/Definition/CommonStrata";
import updateModelFromJson from "../../../../lib/Models/Definition/updateModelFromJson";
import Terria from "../../../../lib/Models/Terria";

describe("MapboxVectorTileCatalogItem", function () {
  let mvt: MapboxVectorTileCatalogItem;

  beforeEach(function () {
    mvt = new MapboxVectorTileCatalogItem("test", new Terria());
  });

  it("has a type", function () {
    expect(MapboxVectorTileCatalogItem.type).toBe("mvt");
    expect(mvt.type).toBe("mvt");
  });

  describe("imageryProvider", function () {
    let imageryProvider: ProtomapsImageryProvider;

    beforeEach(async function () {
      mvt.setTrait(CommonStrata.user, "url", "http://test");
      mvt.setTrait(CommonStrata.user, "layer", "test-layer");
    });

    it("is an instance of ProtomapsImageryProvider", async function () {
      await mvt.loadMapItems();
      if (!ImageryParts.is(mvt.mapItems[0]))
        throw new Error("Expected MapItem to be an ImageryParts");

      imageryProvider = mvt.mapItems[0]
        .imageryProvider as ProtomapsImageryProvider;

      expect(imageryProvider instanceof ProtomapsImageryProvider).toBeTruthy();
    });

    it("sets min/max/native zoom properties", async function () {
      mvt.setTrait(CommonStrata.user, "minimumZoom", 1);
      mvt.setTrait(CommonStrata.user, "maximumZoom", 20);
      mvt.setTrait(CommonStrata.user, "maximumNativeZoom", 10);

      await mvt.loadMapItems();
      if (!ImageryParts.is(mvt.mapItems[0]))
        throw new Error("Expected MapItem to be an ImageryParts");

      imageryProvider = mvt.mapItems[0]
        .imageryProvider as ProtomapsImageryProvider;

      expect(imageryProvider.minimumLevel).toBe(1);
      expect(imageryProvider.maximumLevel).toBe(20);
      expect(imageryProvider.maximumNativeZoom).toBe(10);
    });

    it("sets idProperty", async function () {
      mvt.setTrait(CommonStrata.user, "idProperty", "id");

      await mvt.loadMapItems();
      if (!ImageryParts.is(mvt.mapItems[0]))
        throw new Error("Expected MapItem to be an ImageryParts");

      imageryProvider = mvt.mapItems[0]
        .imageryProvider as ProtomapsImageryProvider;

      expect(imageryProvider.idProperty).toBe("id");
    });
  });

  describe("legends", function () {
    it(
      "constructs a default legend from the definition",
      action(async function () {
        mvt.setTrait(CommonStrata.user, "fillColor", "red");
        mvt.setTrait(CommonStrata.user, "lineColor", "yellow");
        mvt.setTrait(CommonStrata.user, "name", "Test");
        await mvt.loadMapItems();
        const legendItem = mvt.legends[0].items[0];
        expect(legendItem.color).toBe("red");
        expect(legendItem.outlineColor).toBe("yellow");
        expect(legendItem.outlineWidth).toBe(1);
        expect(legendItem.title).toBe("Test");
      })
    );
  });

  describe("paint rules", function () {
    it(
      "creates paint rules from simple styles",
      action(async function () {
        mvt.setTrait(CommonStrata.user, "fillColor", "red");
        mvt.setTrait(CommonStrata.user, "lineColor", "yellow");
        mvt.setTrait(CommonStrata.user, "layer", "Test");
        expect(mvt.paintRules.length).toBe(2);
        expect(mvt.paintRules[0].dataLayer).toBe("Test");
        expect(mvt.paintRules[1].dataLayer).toBe("Test");
        expect(
          mvt.paintRules[0].symbolizer instanceof PolygonSymbolizer
        ).toBeTruthy();
        expect(
          mvt.paintRules[1].symbolizer instanceof LineSymbolizer
        ).toBeTruthy();
      })
    );
  });

  describe("highlight features", function () {
    let imageryProvider: ProtomapsImageryProvider;

    beforeEach(async () => {
      updateModelFromJson(mvt, CommonStrata.definition, {
        name: "Mapbox vector tiles Test",
        type: "mvt",
        url: "/test/mvt/single-layer-mvt/{z}/{x}/{y}.pbf",
        minimumZoom: 0,
        maximumNativeZoom: 4,
        maximumZoom: 28,
        style: {
          layers: [
            {
              type: "fill",
              "source-layer": "layer",
              paint: {
                "fill-color": "blue"
              },
              filter: ["==", "idProperty", 0]
            },
            {
              type: "line",
              "source-layer": "layer",
              paint: {
                "line-color": "red",
                "line-width": 3
              },
              filter: ["==", "idProperty", 3]
            },
            {
              type: "circle",
              "source-layer": "layer",
              paint: {
                "circle-radius": 5,
                "circle-color": "#ffffff",
                "circle-stroke-color": "#000000",
                "circle-stroke-width": 1
              },
              filter: ["any", ["==", "idProperty", 1], ["==", "idProperty", 2]]
            }
          ]
        },
        idProperty: "idProperty"
      });

      await mvt.loadMapItems();

      if (!ImageryParts.is(mvt.mapItems[0]))
        throw new Error("Expected MapItem to be an ImageryParts");

      imageryProvider = mvt.mapItems[0]
        .imageryProvider as ProtomapsImageryProvider;
    });

    it("correctly picks and highlights features", async function () {
      // Get polygon
      await imageryProvider.requestImage(13, 9, 4);
      const polygon = await imageryProvider.pickFeatures(
        13,
        9,
        4,
        2.1093996348816555,
        -0.48928611518829473
      );
      expect(polygon.length).toBe(1);
      expect(polygon[0].properties.idProperty).toBe(0);

      // Select nothing
      await imageryProvider.requestImage(458, 300, 9);
      const nothingToSelect = await imageryProvider.pickFeatures(
        458,
        300,
        9,
        2.4844860088729597,
        -0.525333103119427
      );
      expect(nothingToSelect.length).toBe(0);

      // Select point
      await imageryProvider.requestImage(27, 17, 5);
      const point = await imageryProvider.pickFeatures(
        27,
        17,
        5,
        2.3530918644915615,
        -0.3478595760317724
      );
      expect(point.length).toBe(1);
      expect(point[0].properties.idProperty).toBe(1);

      // Select line
      await imageryProvider.requestImage(227, 159, 8);
      const line = await imageryProvider.pickFeatures(
        227,
        159,
        8,
        2.443403937856845,
        -0.6988029112353736
      );
      expect(line.length).toBe(1);
      expect(line[0].properties.idProperty).toBe(3);
    });
  });
});
