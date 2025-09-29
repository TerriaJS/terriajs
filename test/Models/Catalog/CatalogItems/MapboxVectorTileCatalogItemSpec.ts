import { action } from "mobx";
import { LineSymbolizer, PolygonSymbolizer } from "protomaps-leaflet";
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

    beforeEach(function () {
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

      // Note: ProtomapsImageryProvider uses softMinimumLevel instead of minimumLevel
      expect(imageryProvider.minimumLevel).toBe(0);
      expect(imageryProvider.softMinimumLevel).toBe(1);
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
      action(function () {
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
        url: "/test/mvt/nsw-lga-mvt/{z}/{x}/{y}.pbf",
        fillColor: "#ff0000",
        lineColor: "#ffff00",
        minimumZoom: 0,
        maximumNativeZoom: 11,
        maximumZoom: 28,
        idProperty: "LGA_CODE13",
        layer: "FID_LGA_2013_AUST"
      });

      await mvt.loadMapItems();

      if (!ImageryParts.is(mvt.mapItems[0]))
        throw new Error("Expected MapItem to be an ImageryParts");

      imageryProvider = mvt.mapItems[0]
        .imageryProvider as ProtomapsImageryProvider;
    });

    it("correctly picks features", async function () {
      // Get polygon
      const polygon = await imageryProvider.pickFeatures(
        1881,
        1229,
        11,
        2.630470869072516,
        -0.5932730847619763
      );
      expect(polygon.length).toBe(1);
      expect(polygon[0]?.properties?.LGA_CODE13).toBe("11450");

      // Select nothing
      const nothingToSelect = await imageryProvider.pickFeatures(
        1884,
        1230,
        11,
        2.6387404164527286,
        -0.5945282912087255
      );
      expect(nothingToSelect.length).toBe(0);
    });
  });
});
