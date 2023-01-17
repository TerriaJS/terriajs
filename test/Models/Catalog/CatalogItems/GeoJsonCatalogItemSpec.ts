import { runInAction } from "mobx";
import { GeomType, LineSymbolizer, PolygonSymbolizer } from "protomaps";
import { CustomDataSource } from "terriajs-cesium";
import Cartesian2 from "terriajs-cesium/Source/Core/Cartesian2";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import createGuid from "terriajs-cesium/Source/Core/createGuid";
import Iso8601 from "terriajs-cesium/Source/Core/Iso8601";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import Entity from "terriajs-cesium/Source/DataSources/Entity";
import GeoJsonDataSource from "terriajs-cesium/Source/DataSources/GeoJsonDataSource";
import HeightReference from "terriajs-cesium/Source/Scene/HeightReference";
import { JsonObject } from "../../../../lib/Core/Json";
import loadJson from "../../../../lib/Core/loadJson";
import loadText from "../../../../lib/Core/loadText";
import ContinuousColorMap from "../../../../lib/Map/ColorMap/ContinuousColorMap";
import ProtomapsImageryProvider, {
  GEOJSON_SOURCE_LAYER_NAME
} from "../../../../lib/Map/ImageryProvider/ProtomapsImageryProvider";
import {
  FEATURE_ID_PROP,
  getColor
} from "../../../../lib/ModelMixins/GeojsonMixin";
import { isDataSource } from "../../../../lib/ModelMixins/MappableMixin";
import GeoJsonCatalogItem from "../../../../lib/Models/Catalog/CatalogItems/GeoJsonCatalogItem";
import SplitItemReference from "../../../../lib/Models/Catalog/CatalogReferences/SplitItemReference";
import CommonStrata from "../../../../lib/Models/Definition/CommonStrata";
import updateModelFromJson from "../../../../lib/Models/Definition/updateModelFromJson";
import TerriaFeature from "../../../../lib/Models/Feature/Feature";
import Terria from "../../../../lib/Models/Terria";

describe("GeoJsonCatalogItemSpec", () => {
  describe("- with cesium primitives", function () {
    let terria: Terria;
    let geojson: GeoJsonCatalogItem;

    beforeEach(function () {
      terria = new Terria({
        baseUrl: "./"
      });
      geojson = new GeoJsonCatalogItem("test-geojson", terria);
      geojson.setTrait(CommonStrata.user, "forceCesiumPrimitives", true);
    });

    describe("GeoJsonCatalogItem", function () {
      it("handles features with null geom", async () => {
        geojson.setTrait(CommonStrata.user, "geoJsonData", {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: {
                LGA_CODE19: "19499",
                LGA_NAME19: "No usual address (NSW)",
                STE_CODE16: "1",
                STE_NAME16: "New South Wales",
                AREASQKM19: 0.0
              },
              geometry: null
            },
            {
              type: "Feature",
              properties: {},
              geometry: {
                type: "Polygon",
                coordinates: [
                  [
                    [144.80667114257812, -32.96258644191746],
                    [145.008544921875, -33.19273094190691],
                    [145.557861328125, -32.659031913817685],
                    [145.04287719726562, -32.375322284319346],
                    [144.7998046875, -32.96719522935591],
                    [144.80667114257812, -32.96258644191746]
                  ]
                ]
              }
            }
          ]
        });

        await geojson.loadMapItems();
        expect(geojson.readyData?.features.length).toBe(1);
      });

      it("reloads when the URL is changed", async function () {
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

    describe("loading in EPSG:28356", function () {
      it("works by URL", async function () {
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

      it("works by string", async function () {
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

      it("works by data object", async function () {
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

      it("works with zip", async function () {
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

    describe("loading in CRS:84", function () {
      it("works by URL", async function () {
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

      it("works by string", async function () {
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

      it("works by blob", async function () {
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

      it("works with zip", async function () {
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

    describe("loading without specified CRS (assumes EPSG:4326)", function () {
      it("works by URL", async function () {
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

      it("works by string", async function () {
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

      it("works by blob", async function () {
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

      it("works with zip", async function () {
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

    describe("error handling", function () {
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
            .catch(function(e) {
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

    describe("Support for filterByProperties", () => {
      it("Filters correct features", async () => {
        geojson.setTrait(
          CommonStrata.user,
          "url",
          "test/GeoJSON/time-based.geojson"
        );
        geojson.setTrait(CommonStrata.user, "filterByProperties", {
          year: 2019
        });
        await geojson.loadMapItems();
        expect(geojson.mapItems.length).toEqual(1);
        const entities = (geojson.mapItems[0] as GeoJsonDataSource).entities
          .values;
        expect(entities.length).toEqual(1);

        const entity1 = entities[0];
        console.log(
          entity1.properties?.getValue(terria.timelineClock.currentTime).year
        );
        expect(
          entity1.properties?.getValue(terria.timelineClock.currentTime).year
        ).toBe(2019);
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

    describe("Per features styling", function () {
      it("Applies styles to features according to their properties, respecting string case", async function () {
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
        const entity = (
          geojson.mapItems[0] as GeoJsonDataSource
        ).entities.values.find(
          (e) => e.properties?.getValue(JulianDate.now()).NAME === name
        );
        expect(entity).toBeDefined();
        expect(entity?.properties?.getValue(JulianDate.now())?.fill).toEqual(
          fill
        );
      });
    });
  });

  describe("- with CZML template", function () {
    let terria: Terria;
    let geojson: GeoJsonCatalogItem;

    beforeEach(function () {
      terria = new Terria({
        baseUrl: "./"
      });
      geojson = new GeoJsonCatalogItem("test-geojson", terria);
    });

    describe("Support for czml templates", () => {
      it("supports points", async () => {
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
        ).toBe("10");
        expect(
          entity1.cylinder?.bottomRadius?.getValue(
            terria.timelineClock.currentTime
          )
        ).toBe("10");
        expect(entity1.properties?.someOtherProp?.getValue()).toBe("what");

        const entity2 = entities[1];
        expect(
          entity2.cylinder?.length?.getValue(terria.timelineClock.currentTime)
        ).toBe("20");
        expect(
          entity2.cylinder?.bottomRadius?.getValue(
            terria.timelineClock.currentTime
          )
        ).toBe("5");
        expect(entity2.properties?.someOtherProp?.getValue()).toBe("ok");
      });

      it("supports polygons", async () => {
        geojson.setTrait(
          CommonStrata.user,
          "url",
          "test/GeoJSON/polygon.geojson"
        );
        geojson.setTrait(CommonStrata.user, "czmlTemplate", {
          polygon: {
            height: 10,
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
        expect(entities.length).toEqual(1);

        const entity1 = entities[0];
        expect(
          entity1.polygon?.height?.getValue(terria.timelineClock.currentTime)
        ).toBe(10);
        expect(entity1.properties?.foo?.getValue()).toBe("hi");
        expect(entity1.properties?.bar?.getValue()).toBe("bye");
      });
    });
  });

  describe("- tablestyling - with geojson-vt and protomaps", function () {
    let terria: Terria;
    let geojson: GeoJsonCatalogItem;

    beforeEach(async function () {
      terria = new Terria({
        baseUrl: "./"
      });
      geojson = new GeoJsonCatalogItem("test-geojson", terria);
    });

    it("Creates ProtomapsImageryProvider - with table styles", async () => {
      geojson.setTrait(CommonStrata.user, "url", "test/GeoJSON/height.geojson");

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

      expect(geojson.activeStyle).toBe("someProperty");
      expect(geojson.activeTableStyle.colorColumn?.name).toBe("someProperty");
      expect(geojson.activeTableStyle.tableColorMap.minimumValue).toBe(10);
      expect(geojson.activeTableStyle.tableColorMap.maximumValue).toBe(20);
      expect(
        geojson.activeTableStyle.tableColorMap.colorMap instanceof
          ContinuousColorMap
      ).toBeTruthy();

      const polygonSymbol = protomaps.paintRules[0]
        .symbolizer as PolygonSymbolizer;
      const polylineSymbol = protomaps.paintRules[1]
        .symbolizer as LineSymbolizer;

      const testFeature = {
        props: {},
        geomType: GeomType.Polygon,
        numVertices: 0,
        geom: [],
        bbox: { minX: 0, minY: 0, maxX: 0, maxY: 0 }
      };

      const rowIdToColor: [number, string][] = [
        [0, "rgb(255,245,240)"],
        [1, "rgb(103,0,13)"]
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
          polygonSymbol.fill.get(1, {
            ...testFeature,
            geomType: GeomType.Polygon,
            props: { _id_: rowId }
          })
        ).toBe(col);

        expect(
          polygonSymbol.stroke.get(1, {
            ...testFeature,
            geomType: GeomType.Polygon,
            props: { _id_: rowId }
          })
        ).toBe(getColor(terria.baseMapContrastColor).toCssHexString());

        expect(
          polygonSymbol.width.get(1, {
            ...testFeature,
            geomType: GeomType.Polygon,
            props: { _id_: rowId }
          })
        ).toBe(
          geojson.activeTableStyle.outlineStyleMap.traitValues.null.width ??
            Infinity
        );

        expect(
          polylineSymbol.color.get(1, {
            ...testFeature,
            geomType: GeomType.Line,
            props: { _id_: rowId }
          })
        ).toBe(col);
      });
    });

    it("Creates table features for points", async () => {
      geojson.setTrait(
        CommonStrata.user,
        "url",
        "test/GeoJSON/bike_racks.geojson"
      );

      await geojson.loadMapItems();

      const mapItem = geojson.mapItems[0] as CustomDataSource;

      expect(isDataSource(mapItem)).toBeTruthy();

      expect(geojson.activeStyle).toBe("number_of_");
      expect(geojson.activeTableStyle.colorColumn?.name).toBe("number_of_");
      expect(geojson.activeTableStyle.tableColorMap.minimumValue).toBe(0);
      expect(geojson.activeTableStyle.tableColorMap.maximumValue).toBe(20);
      expect(
        geojson.activeTableStyle.tableColorMap.colorMap instanceof
          ContinuousColorMap
      ).toBeTruthy();

      // Test some colors
      expect(
        mapItem.entities.values[10].point?.color
          ?.getValue(terria.timelineClock.currentTime)
          ?.toCssColorString()
      ).toBe("rgb(254,227,214)");
      expect(
        mapItem.entities.values[20].point?.color
          ?.getValue(terria.timelineClock.currentTime)
          ?.toCssColorString()
      ).toBe("rgb(103,0,13)");
    });

    it("Supports LegendOwnerTraits to override TableMixin.legends", async () => {
      geojson.setTrait(CommonStrata.user, "url", "test/GeoJSON/height.geojson");
      await geojson.loadMapItems();

      expect(
        "imageryProvider" in geojson.mapItems[0] &&
          geojson.mapItems[0].imageryProvider instanceof
            ProtomapsImageryProvider
      ).toBeTruthy();

      expect(geojson.legends.length).toBe(1);
      expect(geojson.legends[0].items.map((i) => i.color)).toEqual([
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
      geojson.setTrait(CommonStrata.user, "url", "test/GeoJSON/height.geojson");

      await geojson.loadMapItems();

      expect(
        "imageryProvider" in geojson.mapItems[0] &&
          geojson.mapItems[0].imageryProvider instanceof
            ProtomapsImageryProvider
      ).toBeTruthy();

      geojson.setTrait("user", "activeStyle", "");

      expect(geojson.legends.length).toBe(1);
      expect(geojson.legends[0].items.length).toBe(1);
      expect(geojson.legends[0].items.map((i) => i.color)).toEqual([
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

    it("correctly builds `Feature` from picked Entity", function () {
      const picked = new Entity();
      const feature = geojson.buildFeatureFromPickResult(
        Cartesian2.ZERO,
        picked
      );
      expect(feature).toBeDefined();
      if (feature) {
        expect(feature.cesiumEntity).toBe(picked);
      }
    });
  });

  describe("Disables protomaps (mvt) if geoJson simple styling is detected", () => {
    let terria: Terria;
    let geojson: GeoJsonCatalogItem;

    beforeEach(async function () {
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
      expect(geojson.useTableStylingAndProtomaps).toBeTruthy();
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
      expect(geojson.useTableStylingAndProtomaps).toBeFalsy();

      expect(geojson.legends.length).toBe(0);
    });
  });

  describe("Support geojson through apis", () => {
    let terria: Terria;
    let geojson: GeoJsonCatalogItem;

    beforeEach(async function () {
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

  describe("geojson can be split", function () {
    let terria: Terria;
    let geojson: GeoJsonCatalogItem;

    beforeEach(async function () {
      terria = new Terria({
        baseUrl: "./"
      });
      geojson = new GeoJsonCatalogItem("test-geojson", terria);
    });

    it("protomaps-mvt", async function () {
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

  describe("geojson handles reprojection", function () {
    let terria: Terria;
    let geojson: GeoJsonCatalogItem;

    beforeEach(async function () {
      terria = new Terria({
        baseUrl: "./"
      });
      geojson = new GeoJsonCatalogItem("test-geojson", terria);
    });

    it("feature collection", async function () {
      geojson.setTrait(
        CommonStrata.user,
        "geoJsonString",
        `{
          "type": "FeatureCollection",
          "features": [
            {
              "type": "Feature",
              "id": "DigitalEarthAustraliaWaterbodies_v2.323183",
              "geometry": {
                "type": "MultiPolygon",
                "coordinates": [
                  [
                    [
                      [
                        16344453.39652363,
                        -5168812.43146947
                      ],
                      [
                        16344531.47850556,
                        -5168802.80795983
                      ],
                      [
                        16344545.13149061,
                        -5168926.64661882
                      ],
                      [
                        16344506.09019498,
                        -5168931.45855288
                      ],
                      [
                        16344510.64113426,
                        -5168972.73862808
                      ],
                      [
                        16344471.59970792,
                        -5168977.55049352
                      ],
                      [
                        16344453.39652363,
                        -5168812.43146947
                      ]
                    ]
                  ]
                ]
              }
            }
          ],
          "crs": {
            "type": "name",
            "properties": {
              "name": "urn:ogc:def:crs:EPSG::3857"
            }
          }
        }`
      );
      await geojson.loadMapItems();
      expect(geojson.readyData).toEqual({
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            id: "DigitalEarthAustraliaWaterbodies_v2.323183",
            geometry: {
              type: "MultiPolygon",
              coordinates: [
                [
                  [
                    [146.82472296676403, -42.05226984176366],
                    [146.82542438914183, -42.0522056500624],
                    [146.8255470359933, -42.053031686178954],
                    [146.8251963220675, -42.05306378281588],
                    [146.82523720385066, -42.053339129144845],
                    [146.8248864887507, -42.05337122516867],
                    [146.82472296676403, -42.05226984176366]
                  ]
                ]
              ]
            },
            properties: { _id_: 0 }
          }
        ],
        crs: { type: "EPSG", properties: { code: "4326" } }
      } as any);
    });

    it("feature", async function () {
      geojson.setTrait(
        CommonStrata.user,
        "geoJsonString",
        `{
          "type": "Feature",
          "id": "DigitalEarthAustraliaWaterbodies_v2.308678",
          "geometry": {
              "type": "MultiPolygon",
              "coordinates": [
                  [
                      [
                          [
                              16465357.77780054,
                              -4492530.25036082
                          ],
                          [
                              16465432.27212674,
                              -4492520.79949369
                          ],
                          [
                              16465441.59842631,
                              -4492596.29102978
                          ],
                          [
                              16465367.10371601,
                              -4492605.74203159
                          ],
                          [
                              16465357.77780054,
                              -4492530.25036082
                          ]
                      ]
                  ]
              ]
          },
          "crs": {
              "type": "name",
              "properties": {
                  "name": "urn:ogc:def:crs:EPSG::3857"
              }
          }
      }`
      );
      await geojson.loadMapItems();
      expect(geojson.readyData).toEqual({
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            id: "DigitalEarthAustraliaWaterbodies_v2.308678",
            geometry: {
              type: "MultiPolygon",
              coordinates: [
                [
                  [
                    [147.91082550294465, -37.38230684638059],
                    [147.9114946968627, -37.382239385753564],
                    [147.91157847643717, -37.38277824533993],
                    [147.9109092790687, -37.382845706443504],
                    [147.91082550294465, -37.38230684638059]
                  ]
                ]
              ]
            },
            properties: { _id_: 0 }
          }
        ],
        crs: { type: "EPSG", properties: { code: "4326" } }
      });
    });
  });

  describe("pick features", function () {
    let terria: Terria;
    let geojson: GeoJsonCatalogItem;

    beforeEach(async function () {
      terria = new Terria({
        baseUrl: "./"
      });
      geojson = new GeoJsonCatalogItem("test-geojson", terria);
    });

    it("ProtomapsImageryProvider.createHighlightImageryProvider", async function () {
      geojson.setTrait(
        CommonStrata.definition,
        "geoJsonString",
        `{"type":"FeatureCollection","features":[{"type":"Feature","properties":{},"geometry":{"type":"Polygon","coordinates":[[[145.5908203125,-40.17887331434695],[143.349609375,-42.08191667830631],[146.35986328124997,-44.040218713142124],[149.08447265625,-42.859859815062784],[148.55712890625,-41.36031866306708],[145.5908203125,-40.17887331434695]]]}},{"type":"Feature","properties":{},"geometry":{"type":"Polygon","coordinates":[[[75.9375,51.069016659603896],[59.94140624999999,39.095962936305476],[79.453125,42.032974332441405],[80.15625,46.800059446787316],[75.673828125,51.45400691005982],[75.9375,51.069016659603896]]]}}]}`
      );

      (await geojson.loadMapItems()).throwIfError();

      const imagery = geojson.mapItems[0];

      if ("imageryProvider" in imagery) {
        const highlight =
          imagery.imageryProvider.createHighlightImageryProvider(
            new TerriaFeature({ properties: { [FEATURE_ID_PROP]: "0" } })
          );
        expect(highlight).toBeDefined();

        expect(highlight?.paintRules[0].dataLayer).toBe(
          GEOJSON_SOURCE_LAYER_NAME
        );
      } else {
        throw "Invalid geojson.mapItems";
      }
    });
  });
});
