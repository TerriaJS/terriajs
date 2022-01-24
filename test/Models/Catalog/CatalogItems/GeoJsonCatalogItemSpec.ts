import { runInAction } from "mobx";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import createGuid from "terriajs-cesium/Source/Core/createGuid";
import Iso8601 from "terriajs-cesium/Source/Core/Iso8601";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import GeoJsonDataSource from "terriajs-cesium/Source/DataSources/GeoJsonDataSource";
import HeightReference from "terriajs-cesium/Source/Scene/HeightReference";
import {
  CircleSymbolizer,
  GeomType,
  LineSymbolizer,
  PolygonSymbolizer
} from "terriajs-protomaps";
import { JsonObject } from "../../../../lib/Core/Json";
import loadJson from "../../../../lib/Core/loadJson";
import loadText from "../../../../lib/Core/loadText";
import ContinuousColorMap from "../../../../lib/Map/ContinuousColorMap";
import ProtomapsImageryProvider, {
  GEOJSON_SOURCE_LAYER_NAME
} from "../../../../lib/Map/ProtomapsImageryProvider";
import { getColor } from "../../../../lib/ModelMixins/GeojsonMixin";
import GeoJsonCatalogItem from "../../../../lib/Models/Catalog/CatalogItems/GeoJsonCatalogItem";
import SplitItemReference from "../../../../lib/Models/Catalog/CatalogReferences/SplitItemReference";
import CommonStrata from "../../../../lib/Models/Definition/CommonStrata";
import updateModelFromJson from "../../../../lib/Models/Definition/updateModelFromJson";
import Terria from "../../../../lib/Models/Terria";

describe("GeoJsonCatalogItemSpec", () => {
  describe("- with cesium primitives", function() {
    let terria: Terria;
    let geojson: GeoJsonCatalogItem;

    beforeEach(function() {
      terria = new Terria({
        baseUrl: "./"
      });
      geojson = new GeoJsonCatalogItem("test-geojson", terria);
      geojson.setTrait(CommonStrata.user, "forceCesiumPrimitives", true);
    });

    describe("GeoJsonCatalogItem", function() {
      it("reloads when the URL is changed", async function() {
        geojson.setTrait(
          CommonStrata.user,
          "url",
          "data:application/json;base64,eyJ0eXBlIjoiRmVhdHVyZUNvbGxlY3Rpb24iLCJmZWF0dXJlcyI6W3sidHlwZSI6IkZlYXR1cmUiLCJwcm9wZXJ0aWVzIjp7fSwiZ2VvbWV0cnkiOnsidHlwZSI6IlBvaW50IiwiY29vcmRpbmF0ZXMiOlsxNDgsLTMxLjNdfX1dfQ=="
        );
        await geojson.loadMapItems();
        expect(geojson.mapItems.length).toEqual(1);
        expect(
          (geojson.mapItems[0] as GeoJsonDataSource).entities.values.length
        ).toEqual(1);
        expect(
          (geojson.mapItems[0] as GeoJsonDataSource).entities.values[0].position
        ).toBeDefined();
        expect(
          (geojson.mapItems[0] as GeoJsonDataSource).entities.values[0].position
            ?.getValue(JulianDate.now())
            .equalsEpsilon(Cartesian3.fromDegrees(148.0, -31.3), 0.0001)
        ).toBeTruthy("Doesn't match first location");

        geojson.setTrait(
          CommonStrata.user,
          "url",
          "data:application/json;base64,eyJ0eXBlIjoiRmVhdHVyZUNvbGxlY3Rpb24iLCJmZWF0dXJlcyI6W3sidHlwZSI6IkZlYXR1cmUiLCJwcm9wZXJ0aWVzIjp7fSwiZ2VvbWV0cnkiOnsidHlwZSI6IlBvaW50IiwiY29vcmRpbmF0ZXMiOlsxNTEsLTMzLjhdfX1dfQ=="
        );
        await geojson.loadMapItems();
        expect(geojson.mapItems.length).toEqual(1);
        expect(
          (geojson.mapItems[0] as GeoJsonDataSource).entities.values.length
        ).toEqual(1);
        expect(
          (geojson.mapItems[0] as GeoJsonDataSource).entities.values[0].position
        ).toBeDefined();
        expect(
          (geojson.mapItems[0] as GeoJsonDataSource).entities.values[0].position
            ?.getValue(JulianDate.now())
            .equalsEpsilon(Cartesian3.fromDegrees(151.0, -33.8), 0.0001)
        ).toBeTruthy("Doesn't match updated location");
      });
    });

    describe("loading in EPSG:28356", function() {
      it("works by URL", async function() {
        geojson.setTrait(
          CommonStrata.user,
          "url",
          "test/GeoJSON/bike_racks.geojson"
        );
        await geojson.loadMapItems();
        expect(geojson.mapItems.length).toEqual(1);
        expect(
          (geojson.mapItems[0] as GeoJsonDataSource).entities.values.length
        ).toBeGreaterThan(0);
        expect(
          (geojson.mapItems[0] as GeoJsonDataSource).entities.values[0].position
        ).toBeDefined();
      });

      it("works by string", async function() {
        const geojsonString = await loadText("test/GeoJSON/bike_racks.geojson");
        geojson.setTrait(CommonStrata.user, "geoJsonString", geojsonString);
        await geojson.loadMapItems();
        expect(geojson.mapItems.length).toEqual(1);
        expect(
          (geojson.mapItems[0] as GeoJsonDataSource).entities.values.length
        ).toBeGreaterThan(0);
        expect(
          (geojson.mapItems[0] as GeoJsonDataSource).entities.values[0].position
        ).toBeDefined();
      });

      it("works by data object", async function() {
        const geojsonObject = await loadJson("test/GeoJSON/bike_racks.geojson");
        geojson.setTrait(CommonStrata.user, "geoJsonData", geojsonObject);
        await geojson.loadMapItems();
        expect(geojson.mapItems.length).toEqual(1);
        expect(
          (geojson.mapItems[0] as GeoJsonDataSource).entities.values.length
        ).toBeGreaterThan(0);
        expect(
          (geojson.mapItems[0] as GeoJsonDataSource).entities.values[0].position
        ).toBeDefined();
      });

      it("works with zip", async function() {
        geojson.setTrait(
          CommonStrata.user,
          "url",
          "test/GeoJSON/bike_racks.zip"
        );
        await geojson.loadMapItems();
        expect(geojson.mapItems.length).toEqual(1);
        expect(
          (geojson.mapItems[0] as GeoJsonDataSource).entities.values.length
        ).toBeGreaterThan(0);
        expect(
          (geojson.mapItems[0] as GeoJsonDataSource).entities.values[0].position
        ).toBeDefined();
      });
      /* it("have default dataUrl and dataUrlType", function() {
         geojson.updateFromJson({
           url: "test/GeoJSON/bike_racks.geojson"
         });
         expect(geojson.dataUrl).toBe("test/GeoJSON/bike_racks.geojson");
         expect(geojson.dataUrlType).toBe("direct");
       })
       it("use provided dataUrl", function(done) {
         geojson.url = "test/GeoJSON/bike_racks.geojson";
         geojson.dataUrl = "test/test.html";
         geojson.dataUrlType = "fake type";
         geojson.load().then(function() {
           expect(geojson.dataSource.entities.values.length).toBeGreaterThan(0);
           expect(geojson.dataUrl).toBe("test/test.html");
           expect(geojson.dataUrlType).toBe("fake type");
           done();
         });
       })

       it("works by blob", function(done) {
         loadBlob("test/GeoJSON/bike_racks.geojson").then(function(blob) {
           geojson.data = blob;
           geojson.dataSourceUrl = "anything.geojson";
           geojson.load().then(function() {
             expect(geojson.dataSource.entities.values.length).toBeGreaterThan(0);
             done();
           });
         });
       }); */
    });

    describe("loading in CRS:84", function() {
      it("works by URL", async function() {
        geojson.setTrait(
          CommonStrata.user,
          "url",
          "test/GeoJSON/cemeteries.geojson"
        );
        await geojson.loadMapItems();
        expect(geojson.mapItems.length).toEqual(1);
        expect(
          (geojson.mapItems[0] as GeoJsonDataSource).entities.values.length
        ).toBeGreaterThan(0);
        expect(
          (geojson.mapItems[0] as GeoJsonDataSource).entities.values[0].position
        ).toBeDefined();
      });

      it("works by string", async function() {
        const geojsonString = await loadText("test/GeoJSON/cemeteries.geojson");
        geojson.setTrait(CommonStrata.user, "geoJsonString", geojsonString);
        await geojson.loadMapItems();
        expect(geojson.mapItems.length).toEqual(1);
        expect(
          (geojson.mapItems[0] as GeoJsonDataSource).entities.values.length
        ).toBeGreaterThan(0);
        expect(
          (geojson.mapItems[0] as GeoJsonDataSource).entities.values[0].position
        ).toBeDefined();
      });

      it("works by blob", async function() {
        const blob = await loadJson("test/GeoJSON/cemeteries.geojson");
        geojson.setTrait(CommonStrata.user, "geoJsonData", <JsonObject>blob);
        await geojson.loadMapItems();
        expect(geojson.mapItems.length).toEqual(1);
        expect(
          (geojson.mapItems[0] as GeoJsonDataSource).entities.values.length
        ).toBeGreaterThan(0);
        expect(
          (geojson.mapItems[0] as GeoJsonDataSource).entities.values[0].position
        ).toBeDefined();
      });

      it("works with zip", async function() {
        geojson.setTrait(
          CommonStrata.user,
          "url",
          "test/GeoJSON/cemeteries.zip"
        );
        await geojson.loadMapItems();
        expect(geojson.mapItems.length).toEqual(1);
        expect(
          (geojson.mapItems[0] as GeoJsonDataSource).entities.values.length
        ).toBeGreaterThan(0);
        expect(
          (geojson.mapItems[0] as GeoJsonDataSource).entities.values[0].position
        ).toBeDefined();
      });
    });

    describe("loading without specified CRS (assumes EPSG:4326)", function() {
      it("works by URL", async function() {
        geojson.setTrait(CommonStrata.user, "url", "test/GeoJSON/gme.geojson");
        await geojson.loadMapItems();
        expect(geojson.mapItems.length).toEqual(1);
        expect(
          (geojson.mapItems[0] as GeoJsonDataSource).entities.values.length
        ).toBeGreaterThan(0);
        expect(
          (geojson.mapItems[0] as GeoJsonDataSource).entities.values[0].position
        ).toBeDefined();
      });

      it("works by string", async function() {
        const geojsonString = await loadText("test/GeoJSON/gme.geojson");
        geojson.setTrait(CommonStrata.user, "geoJsonString", geojsonString);
        await geojson.loadMapItems();
        expect(geojson.mapItems.length).toEqual(1);
        expect(
          (geojson.mapItems[0] as GeoJsonDataSource).entities.values.length
        ).toBeGreaterThan(0);
        expect(
          (geojson.mapItems[0] as GeoJsonDataSource).entities.values[0].position
        ).toBeDefined();
      });

      it("works by blob", async function() {
        const blob = await loadJson("test/GeoJSON/gme.geojson");
        geojson.setTrait(CommonStrata.user, "geoJsonData", <JsonObject>blob);
        await geojson.loadMapItems();
        expect(geojson.mapItems.length).toEqual(1);
        expect(
          (geojson.mapItems[0] as GeoJsonDataSource).entities.values.length
        ).toBeGreaterThan(0);
        expect(
          (geojson.mapItems[0] as GeoJsonDataSource).entities.values[0].position
        ).toBeDefined();
      });

      it("works with zip", async function() {
        geojson.setTrait(
          CommonStrata.user,
          "url",
          "test/GeoJSON/cemeteries.zip"
        );
        await geojson.loadMapItems();
        expect(geojson.mapItems.length).toEqual(1);
        expect(
          (geojson.mapItems[0] as GeoJsonDataSource).entities.values.length
        ).toBeGreaterThan(0);
        expect(
          (geojson.mapItems[0] as GeoJsonDataSource).entities.values[0].position
        ).toBeDefined();
      });
    });

    // describe('loading Esri-style GeoJSON with an "envelope"', function() {
    //   it("works by URL", async function() {
    //     geojson.setTrait(
    //       CommonStrata.user,
    //       "url",
    //       "test/GeoJSON/EsriEnvelope.geojson"
    //     );
    //     await geojson.loadMapItems();
    //     expect(geojson.mapItems.length).toEqual(1);
    //     expect((geojson.mapItems[0] as GeoJsonDataSource).entities.values.length).toBeGreaterThan(0);
    //     expect((geojson.mapItems[0] as GeoJsonDataSource).entities.values[0].position).toBeDefined();
    //   });
    //
    //   it("works by string", async function() {
    //     const geojsonString = await loadText("test/GeoJSON/EsriEnvelope.geojson");
    //     geojson.setTrait(CommonStrata.user, "geoJsonString", geojsonString);
    //     await geojson.loadMapItems();
    //     expect(geojson.mapItems.length).toEqual(1);
    //     expect((geojson.mapItems[0] as GeoJsonDataSource).entities.values.length).toBeGreaterThan(0);
    //     expect((geojson.mapItems[0] as GeoJsonDataSource).entities.values[0].position).toBeDefined();
    //   });
    //
    //   it("works by blob", async function() {
    //     const blob = await loadJson("test/GeoJSON/EsriEnvelope.geojson");
    //     geojson.setTrait(CommonStrata.user, "geoJsonData", <JsonObject>blob);
    //     await geojson.loadMapItems();
    //     expect(geojson.mapItems.length).toEqual(1);
    //     expect((geojson.mapItems[0] as GeoJsonDataSource).entities.values.length).toBeGreaterThan(0);
    //     expect((geojson.mapItems[0] as GeoJsonDataSource).entities.values[0].position).toBeDefined();
    //   });
    // });

    describe("error handling", function() {
      it("fails gracefully when the data at a URL is not JSON", async () => {
        geojson.setTrait(CommonStrata.user, "url", "test/KML/vic_police.kml");

        const error = (await geojson.loadMapItems()).error;

        expect(error).toBeDefined("Load should not succeed");
      });

      it("fails gracefully when the provided string is not JSON", async () => {
        const s = await loadText("test/KML/vic_police.kml");
        geojson.setTrait(CommonStrata.user, "geoJsonString", s);

        const error = (await geojson.loadMapItems()).error;

        expect(error).toBeDefined("Load should not succeed");
      });

      it("fails gracefully when the data at a URL is JSON but not GeoJSON", async () => {
        geojson.setTrait(CommonStrata.user, "url", "test/CZML/verysimple.czml");

        const error = (await geojson.loadMapItems()).error;

        expect(error).toBeDefined("Load should not succeed");
      });

      it("fails gracefully when the provided string is JSON but not GeoJSON", async () => {
        const s = await loadText("test/CZML/verysimple.czml");
        geojson.setTrait(CommonStrata.user, "geoJsonString", s);

        const error = (await geojson.loadMapItems()).error;

        expect(error).toBeDefined("Load should not succeed");
      });
      /*
      it("fails gracefully when the provided blob is JSON but not GeoJSON", function(done) {
        loadBlob("test/CZML/verysimple.czml").then(function(blob) {
          geojson.data = blob;
          geojson.dataSourceUrl = "anything.czml";
          geojson
            .load()
            .then(function() {
              done.fail("Load should not succeed.");
            })
            .otherwise(function(e) {
              expect(e instanceof TerriaError).toBe(true);
              done();
            });
        });
      }); */
    });

    // describe("Adding and removing attribution", function() {
    //   var currentViewer;
    //   beforeEach(function() {
    //     currentViewer = geojson.terria.currentViewer;
    //     geojson.url = "test/GeoJSON/polygon.topojson";
    //     terria.disclaimerListener = function(member, callback) {
    //       callback();
    //     };
    //     geojson.isEnabled = true;
    //   });

    //   it("can add attribution", function(done) {
    //     spyOn(currentViewer, "addAttribution");
    //     geojson.load();
    //     geojson._loadForEnablePromise.then(function() {
    //       expect(currentViewer.addAttribution).toHaveBeenCalled();
    //       done();
    //     });
    //   });

    //   it("can remove attribution", function(done) {
    //     spyOn(currentViewer, "removeAttribution");
    //     geojson.load();
    //     geojson._loadForEnablePromise.then(function() {
    //       geojson.isEnabled = false;
    //       expect(currentViewer.removeAttribution).toHaveBeenCalled();
    //       done();
    //     });
    //   });
    // });

    describe("Support for time-varying geojson", () => {
      it("Associates features with discrete times", async () => {
        geojson.setTrait(
          CommonStrata.user,
          "url",
          "test/GeoJSON/time-based.geojson"
        );
        geojson.setTrait(CommonStrata.user, "timeProperty", "year");
        await geojson.loadMapItems();
        expect(geojson.mapItems.length).toEqual(1);
        const entities = (geojson.mapItems[0] as GeoJsonDataSource).entities
          .values;
        expect(entities.length).toEqual(2);

        const entity1 = entities[0];
        expect(
          entity1.availability?.start.equals(
            JulianDate.fromDate(new Date("2021"))
          )
        ).toBeTruthy();
        expect(
          entity1.availability?.stop.equals(Iso8601.MAXIMUM_VALUE)
        ).toBeTruthy();

        const entity2 = entities[1];
        expect(
          entity2.availability?.start.equals(
            JulianDate.fromDate(new Date("2019"))
          )
        ).toBeTruthy();
        expect(
          entity2.availability?.stop.equals(
            JulianDate.fromDate(new Date("2021"))
          )
        ).toBeTruthy();
      });
    });

    describe("Support for geojson with extruded heights", () => {
      it("Sets polygon height properties correctly", async () => {
        geojson.setTrait(
          CommonStrata.user,
          "url",
          "test/GeoJSON/height.geojson"
        );
        geojson.setTrait(CommonStrata.user, "heightProperty", "someProperty");
        await geojson.loadMapItems();
        expect(geojson.mapItems.length).toEqual(1);
        const entities = (geojson.mapItems[0] as GeoJsonDataSource).entities
          .values;
        expect(entities.length).toEqual(2);

        const entity1 = entities[0];
        expect(
          entity1.polygon?.extrudedHeight?.getValue(
            terria.timelineClock.currentTime
          )
        ).toBe(10);
        expect(
          entity1.polygon?.heightReference?.getValue(
            terria.timelineClock.currentTime
          )
        ).toBe(HeightReference.CLAMP_TO_GROUND);

        const entity2 = entities[1];
        expect(
          entity2.polygon?.extrudedHeight?.getValue(
            terria.timelineClock.currentTime
          )
        ).toBe(20);
        expect(
          entity2.polygon?.heightReference?.getValue(
            terria.timelineClock.currentTime
          )
        ).toBe(HeightReference.CLAMP_TO_GROUND);
        expect(
          entity2.polygon?.extrudedHeightReference?.getValue(
            terria.timelineClock.currentTime
          )
        ).toBe(HeightReference.RELATIVE_TO_GROUND);
      });
    });

    describe("Per features styling", function() {
      it("Applies styles to features according to their properties, respecting string case", async function() {
        const name = "PETER FAGANS GRAVE";
        const fill = "#0000ff";
        runInAction(() => {
          updateModelFromJson(geojson, CommonStrata.override, {
            name: "test",
            type: "geojson",
            url: "test/GeoJSON/cemeteries.geojson",
            perPropertyStyles: [
              {
                properties: { NAME: name },
                style: {
                  fill: fill
                },
                caseSensitive: true
              }
            ]
          });
        });

        await geojson.loadMapItems();
        const entity = (geojson
          .mapItems[0] as GeoJsonDataSource).entities.values.find(
          e => e.properties?.getValue(JulianDate.now()).NAME === name
        );
        expect(entity).toBeDefined();
        expect(entity?.properties?.getValue(JulianDate.now())?.fill).toEqual(
          fill
        );
      });
    });
  });

  describe("- with CZML template", function() {
    let terria: Terria;
    let geojson: GeoJsonCatalogItem;

    beforeEach(function() {
      terria = new Terria({
        baseUrl: "./"
      });
      geojson = new GeoJsonCatalogItem("test-geojson", terria);
    });

    describe("Support for czml templating", () => {
      it("Sets polygon height properties correctly", async () => {
        geojson.setTrait(
          CommonStrata.user,
          "url",
          "test/GeoJSON/points.geojson"
        );
        geojson.setTrait(CommonStrata.user, "czmlTemplate", {
          cylinder: {
            length: {
              reference: "#properties.height"
            },
            topRadius: {
              reference: "#properties.radius"
            },
            bottomRadius: {
              reference: "#properties.radius"
            },
            material: {
              solidColor: {
                color: {
                  rgba: [0, 200, 0, 20]
                }
              }
            }
          }
        });
        await geojson.loadMapItems();

        const entities = (geojson.mapItems[0] as GeoJsonDataSource).entities
          .values;
        expect(entities.length).toEqual(5);

        const entity1 = entities[0];
        expect(
          entity1.cylinder?.length?.getValue(terria.timelineClock.currentTime)
        ).toBe(10);
        expect(
          entity1.cylinder?.bottomRadius?.getValue(
            terria.timelineClock.currentTime
          )
        ).toBe(10);
        expect(entity1.properties?.someOtherProp?.getValue()).toBe("what");

        const entity2 = entities[1];
        expect(
          entity2.cylinder?.length?.getValue(terria.timelineClock.currentTime)
        ).toBe(20);
        expect(
          entity2.cylinder?.bottomRadius?.getValue(
            terria.timelineClock.currentTime
          )
        ).toBe(5);
        expect(entity2.properties?.someOtherProp?.getValue()).toBe("ok");
      });
    });
  });

  describe("- with geojson-vt and protomaps", function() {
    let terria: Terria;
    let geojson: GeoJsonCatalogItem;

    beforeEach(async function() {
      terria = new Terria({
        baseUrl: "./"
      });
      geojson = new GeoJsonCatalogItem("test-geojson", terria);

      geojson.setTrait(
        CommonStrata.user,
        "url",
        "test/GeoJSON/bike_racks.geojson"
      );
    });

    it("Creates ProtomapsImageryProvider - with simple styles", async () => {
      geojson.setTrait(CommonStrata.user, "disableTableStyle", true);
      geojson.style.setTrait(CommonStrata.user, "fill", "#00ff00");
      geojson.style.setTrait(CommonStrata.user, "fill-opacity", 0.7);
      geojson.style.setTrait(CommonStrata.user, "stroke", "#ff0000");
      geojson.style.setTrait(CommonStrata.user, "stroke-opacity", 0.5);
      geojson.style.setTrait(CommonStrata.user, "stroke-width", 5);
      geojson.style.setTrait(CommonStrata.user, "marker-size", "medium");
      geojson.style.setTrait(CommonStrata.user, "marker-color", "#0000ff");
      geojson.style.setTrait(CommonStrata.user, "marker-opacity", 0.3);

      await geojson.loadMapItems();

      const mapItem = geojson.mapItems[0];

      expect(
        "imageryProvider" in mapItem &&
          mapItem.imageryProvider instanceof ProtomapsImageryProvider
      ).toBeTruthy();

      const protomaps =
        "imageryProvider" in mapItem
          ? (mapItem.imageryProvider as ProtomapsImageryProvider)
          : undefined;

      if (!protomaps) throw "protomaps should be defined";

      expect(protomaps.paintRules.length).toBe(4);
      expect(protomaps.paintRules[0].dataLayer).toBe(GEOJSON_SOURCE_LAYER_NAME);
      expect(protomaps.paintRules[1].dataLayer).toBe(GEOJSON_SOURCE_LAYER_NAME);
      expect(protomaps.paintRules[2].dataLayer).toBe(GEOJSON_SOURCE_LAYER_NAME);
      expect(protomaps.paintRules[3].dataLayer).toBe(GEOJSON_SOURCE_LAYER_NAME);

      expect(
        protomaps.paintRules[0].symbolizer instanceof PolygonSymbolizer
      ).toBeTruthy();
      expect(
        protomaps.paintRules[1].symbolizer instanceof LineSymbolizer
      ).toBeTruthy();
      expect(
        protomaps.paintRules[2].symbolizer instanceof LineSymbolizer
      ).toBeTruthy();
      expect(
        protomaps.paintRules[3].symbolizer instanceof CircleSymbolizer
      ).toBeTruthy();

      const polygonSymbo = protomaps.paintRules[0]
        .symbolizer as PolygonSymbolizer;
      const polygonLineSymbo = protomaps.paintRules[1]
        .symbolizer as LineSymbolizer;
      const polylineSymbo = protomaps.paintRules[2]
        .symbolizer as LineSymbolizer;
      const pointSymbo = protomaps.paintRules[3].symbolizer as CircleSymbolizer;

      expect(polygonSymbo.fill.get(1)).toBe("rgba(0,255,0,0.7)");
      expect(polygonLineSymbo.color.get(1)).toBe("rgba(255,0,0,0.5)");
      expect(polygonLineSymbo.width.get(1)).toBe(5);
      expect(polylineSymbo.color.get(1)).toBe("rgba(255,0,0,0.5)");
      expect(polylineSymbo.width.get(1)).toBe(5);
      expect(pointSymbo.fill.get(1)).toBe("rgb(0,0,255)");
      expect(pointSymbo.stroke.get(1)).toBe("rgba(255,0,0,0.5)");
      expect(pointSymbo.width.get(1)).toBe(5);
      expect(pointSymbo.radius.get(1)).toBe(10);
      expect(pointSymbo.opacity.get(1)).toBe(0.3);
    });

    it("Creates ProtomapsImageryProvider - with table styles", async () => {
      await geojson.loadMapItems();

      const mapItem = geojson.mapItems[0];

      expect(
        "imageryProvider" in mapItem &&
          mapItem.imageryProvider instanceof ProtomapsImageryProvider
      ).toBeTruthy();

      const protomaps =
        "imageryProvider" in mapItem
          ? (mapItem.imageryProvider as ProtomapsImageryProvider)
          : undefined;

      if (!protomaps) throw "protomaps should be defined";

      expect(geojson.activeStyle).toBe("number_of_");
      expect(geojson.activeTableStyle.colorColumn?.name).toBe("number_of_");
      expect(geojson.activeTableStyle.tableColorMap.minimumValue).toBe(0);
      expect(geojson.activeTableStyle.tableColorMap.maximumValue).toBe(20);
      expect(
        geojson.activeTableStyle.tableColorMap.colorMap instanceof
          ContinuousColorMap
      ).toBeTruthy();

      const polygonSymbo = protomaps.paintRules[0]
        .symbolizer as PolygonSymbolizer;
      const polygonLineSymbo = protomaps.paintRules[1]
        .symbolizer as LineSymbolizer;
      const polylineSymbo = protomaps.paintRules[2]
        .symbolizer as LineSymbolizer;
      const pointSymbo = protomaps.paintRules[3].symbolizer as CircleSymbolizer;

      const testFeature = {
        props: {},
        geomType: GeomType.Polygon,
        numVertices: 0,
        geom: [],
        bbox: { minX: 0, minY: 0, maxX: 0, maxY: 0 }
      };

      const rowIdToColor: [number, string][] = [
        [10, "rgb(254,227,214)"],
        [20, "rgb(103,0,13)"]
      ];

      rowIdToColor.forEach(([rowId, col]) => {
        expect(
          geojson.activeTableStyle.colorMap
            .mapValueToColor(
              geojson.activeTableStyle.colorColumn?.valuesForType?.[rowId]
            )
            ?.toCssColorString()
        ).toBe(col);

        expect(
          polygonSymbo.fill.get(1, {
            ...testFeature,
            geomType: GeomType.Polygon,
            props: { _id_: rowId }
          })
        ).toBe(col);

        expect(
          polygonLineSymbo.color.get(1, {
            ...testFeature,
            geomType: GeomType.Polygon,
            props: { _id_: rowId }
          })
        ).toBe(getColor(terria.baseMapContrastColor).toCssColorString());

        expect(
          polylineSymbo.color.get(1, {
            ...testFeature,
            geomType: GeomType.Line,
            props: { _id_: rowId }
          })
        ).toBe(col);

        expect(
          pointSymbo.fill.get(1, {
            ...testFeature,
            geomType: GeomType.Point,
            props: { _id_: rowId }
          })
        ).toBe(col);
      });
    });

    it("Supports LegendOwnerTraits to override TableMixin.legends", async () => {
      await geojson.loadMapItems();

      expect(
        "imageryProvider" in geojson.mapItems[0] &&
          geojson.mapItems[0].imageryProvider instanceof
            ProtomapsImageryProvider
      ).toBeTruthy();

      expect(geojson.legends.length).toBe(1);
      expect(geojson.legends[0].items.map(i => i.color)).toEqual([
        "rgb(103,0,13)",
        "rgb(176,18,24)",
        "rgb(226,48,40)",
        "rgb(249,105,76)",
        "rgb(252,160,130)",
        "rgb(253,211,193)",
        "rgb(255,245,240)"
      ]);

      runInAction(() =>
        updateModelFromJson(geojson, CommonStrata.definition, {
          legends: [
            {
              url: "some-url"
            }
          ]
        })
      );

      expect(geojson.legends.length).toBe(1);
      expect(geojson.legends[0].url).toBe("some-url");
    });

    it("Supports LegendOwnerTraits to override TableMixin.legends - with style disabled", async () => {
      await geojson.loadMapItems();

      expect(
        "imageryProvider" in geojson.mapItems[0] &&
          geojson.mapItems[0].imageryProvider instanceof
            ProtomapsImageryProvider
      ).toBeTruthy();

      geojson.setTrait("user", "activeStyle", "");

      expect(geojson.legends.length).toBe(1);
      expect(geojson.legends[0].items.length).toBe(1);
      expect(geojson.legends[0].items.map(i => i.color)).toEqual([
        "rgb(102,194,165)"
      ]);

      runInAction(() =>
        updateModelFromJson(geojson, CommonStrata.definition, {
          legends: [
            {
              url: "some-url"
            }
          ]
        })
      );

      expect(geojson.legends.length).toBe(1);
      expect(geojson.legends[0].url).toBe("some-url");
    });
  });

  describe("Disables protomaps (mvt) if geoJson simple styling is detected", () => {
    let terria: Terria;
    let geojson: GeoJsonCatalogItem;

    beforeEach(async function() {
      terria = new Terria({
        baseUrl: "./"
      });
      geojson = new GeoJsonCatalogItem("test-geojson", terria);
    });

    it("Unchanged - less than 50% features detected", async () => {
      geojson.setTrait(CommonStrata.user, "url", "test/GeoJSON/api.geojson");
      geojson.setTrait(
        CommonStrata.user,
        "geoJsonString",
        `{"type":"FeatureCollection","features":[{"type":"Feature","properties":{"stroke":"#555555","stroke-width":2,"stroke-opacity":1,"fill":"#ff0051","fill-opacity":0.5},"geometry":{"type":"Polygon","coordinates":[[[35.859375,53.54030739150022],[11.25,40.17887331434696],[15.1171875,14.604847155053898],[53.4375,44.84029065139799],[35.859375,53.54030739150022]]]}},{"type":"Feature","properties":{},"geometry":{"type":"Polygon","coordinates":[[[85.4296875,66.93006025862448],[53.4375,43.83452678223682],[89.296875,34.88593094075317],[91.40625,50.958426723359935],[85.4296875,66.93006025862448]]]}},{"type":"Feature","properties":{},"geometry":{"type":"Polygon","coordinates":[[[119.17968749999999,66.79190947341796],[100.1953125,53.74871079689897],[109.3359375,47.517200697839414],[119.17968749999999,66.79190947341796]]]}},{"type":"Feature","properties":{},"geometry":{"type":"Point","coordinates":[30.585937499999996,-2.108898659243126]}},{"type":"Feature","properties":{},"geometry":{"type":"Polygon","coordinates":[[[71.015625,-2.811371193331128],[99.49218749999999,-2.811371193331128],[99.49218749999999,18.646245142670608],[71.015625,18.646245142670608],[71.015625,-2.811371193331128]]]}},{"type":"Feature","properties":{},"geometry":{"type":"LineString","coordinates":[[140.9765625,19.642587534013032],[134.296875,-17.978733095556155],[88.9453125,-36.597889133070204],[119.53125,15.961329081596647],[130.078125,27.371767300523047]]}}]}`
      );
      await geojson.loadMapItems();
      expect(geojson.mapItems[0] instanceof GeoJsonDataSource).toBeFalsy();
      expect(geojson.useMvt).toBeTruthy();
      expect(geojson.legends.length).toBe(1);
    });

    it("Disabled protomaps - More than 50% features detected", async () => {
      geojson.setTrait(CommonStrata.user, "url", "test/GeoJSON/api.geojson");
      geojson.setTrait(
        CommonStrata.user,
        "geoJsonString",
        `{"type":"FeatureCollection","features":[{"type":"Feature","properties":{"stroke":"#555555","stroke-width":2,"stroke-opacity":1,"fill":"#ff0051","fill-opacity":0.5},"geometry":{"type":"Polygon","coordinates":[[[35.859375,53.54030739150022],[11.25,40.17887331434696],[15.1171875,14.604847155053898],[53.4375,44.84029065139799],[35.859375,53.54030739150022]]]}},{"type":"Feature","properties":{},"geometry":{"type":"Polygon","coordinates":[[[85.4296875,66.93006025862448],[53.4375,43.83452678223682],[89.296875,34.88593094075317],[91.40625,50.958426723359935],[85.4296875,66.93006025862448]]]}},{"type":"Feature","properties":{},"geometry":{"type":"Polygon","coordinates":[[[119.17968749999999,66.79190947341796],[100.1953125,53.74871079689897],[109.3359375,47.517200697839414],[119.17968749999999,66.79190947341796]]]}},{"type":"Feature","properties":{"marker-color":"#e000ff","marker-size":"large"},"geometry":{"type":"Point","coordinates":[30.585937499999996,-2.108898659243126]}},{"type":"Feature","properties":{"stroke":"#feff00","stroke-width":4,"stroke-opacity":1,"fill":"#fcffff","fill-opacity":0.5},"geometry":{"type":"Polygon","coordinates":[[[71.015625,-2.811371193331128],[99.49218749999999,-2.811371193331128],[99.49218749999999,18.646245142670608],[71.015625,18.646245142670608],[71.015625,-2.811371193331128]]]}},{"type":"Feature","properties":{"stroke":"#00ff02","stroke-width":2,"stroke-opacity":1},"geometry":{"type":"LineString","coordinates":[[140.9765625,19.642587534013032],[134.296875,-17.978733095556155],[88.9453125,-36.597889133070204],[119.53125,15.961329081596647],[130.078125,27.371767300523047]]}}]}`
      );
      await geojson.loadMapItems();
      expect(geojson.mapItems[0] instanceof GeoJsonDataSource).toBeTruthy();
      expect(geojson.useMvt).toBeFalsy();

      expect(geojson.legends.length).toBe(0);
    });
  });

  describe("Support geojson through apis", () => {
    let terria: Terria;
    let geojson: GeoJsonCatalogItem;

    beforeEach(async function() {
      terria = new Terria({
        baseUrl: "./"
      });
      geojson = new GeoJsonCatalogItem("test-geojson", terria);
    });

    it("Extracts geojson nested in a json object", async () => {
      geojson.setTrait(CommonStrata.user, "url", "test/GeoJSON/api.geojson");
      geojson.setTrait(CommonStrata.user, "responseDataPath", "nested.data");
      await geojson.loadMapItems();
      expect(geojson.mapItems.length).toEqual(1);
    });

    it("Extracts geojson from an array of json objects", async () => {
      geojson.setTrait(
        CommonStrata.user,
        "url",
        "test/GeoJSON/api-list.geojson"
      );
      geojson.setTrait(CommonStrata.user, "responseGeoJsonPath", "nested.data");
      await geojson.loadMapItems();
      expect(geojson.mapItems.length).toEqual(1);
    });
  });

  describe("geojson can be split", function() {
    let terria: Terria;
    let geojson: GeoJsonCatalogItem;

    beforeEach(async function() {
      terria = new Terria({
        baseUrl: "./"
      });
      geojson = new GeoJsonCatalogItem("test-geojson", terria);
    });

    it("protomaps-mvt", async function() {
      terria.addModel(geojson);
      const geojsonString = await loadText("test/GeoJSON/cemeteries.geojson");
      geojson.setTrait(CommonStrata.user, "geoJsonString", geojsonString);
      await geojson.loadMapItems();

      const split = new SplitItemReference(createGuid(), terria);
      split.setTrait(
        CommonStrata.definition,
        "splitSourceItemId",
        geojson.uniqueId
      );

      const loadReferenceResult = await split.loadReference();

      expect(loadReferenceResult.error).toBeUndefined();

      expect(split.target instanceof GeoJsonCatalogItem).toBeTruthy();

      expect(
        (await (split.target as GeoJsonCatalogItem).loadMapItems()).error
      ).toBeUndefined();
    });
  });
});
