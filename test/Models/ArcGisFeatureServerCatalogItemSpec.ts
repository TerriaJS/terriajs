import { configure, runInAction } from "mobx";
import _loadWithXhr from "../../lib/Core/loadWithXhr";
import Terria from "../../lib/Models/Terria";
import ArcGisFeatureServerCatalogItem from "../../lib/Models/ArcGisFeatureServerCatalogItem";
import CommonStrata from "../../lib/Models/CommonStrata";
import isDefined from "../../lib/Core/isDefined";
import { JsonArray } from "../../lib/Core/Json";
import i18next from "i18next";

import Color from "terriajs-cesium/Source/Core/Color";
import ColorMaterialProperty from "terriajs-cesium/Source/DataSources/ColorMaterialProperty";
import ConstantProperty from "terriajs-cesium/Source/DataSources/ConstantProperty";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";

configure({
  enforceActions: "observed",
  computedRequiresReaction: true
});

interface ExtendedLoadWithXhr {
  (): any;
  load: { (...args: any[]): any; calls: any };
}

const loadWithXhr: ExtendedLoadWithXhr = <any>_loadWithXhr;

describe("ArcGisFeatureServerCatalogItem", function() {
  const featureServerUrl =
    "http://example.com/arcgis/rest/services/Water_Network/FeatureServer/2";

  const featureServerUrl2 =
    "http://example.com/arcgis/rest/services/Parks/FeatureServer/3";

  let terria: Terria;
  let item: ArcGisFeatureServerCatalogItem;

  beforeEach(function() {
    terria = new Terria({
      baseUrl: "./"
    });
    item = new ArcGisFeatureServerCatalogItem("test", terria);

    const realLoadWithXhr = loadWithXhr.load;
    // We replace calls to real servers with pre-captured JSON files so our testing is isolated, but reflects real data.
    spyOn(loadWithXhr, "load").and.callFake(function(...args: any[]) {
      let url = args[0];
      if (url.match("Water_Network/FeatureServer")) {
        url = url.replace(/^.*\/FeatureServer/, "FeatureServer");
        url = url.replace(
          /FeatureServer\/query\?f=json&layerDefs=%7B2%3A%22.*%22%7D$/i,
          "layerDefs.json"
        );
        url = url.replace(/FeatureServer\/2\/?\?.*/i, "2.json");
        args[0] = "test/ArcGisFeatureServer/Water_Network/" + url;
      } else if (url.match("Parks/FeatureServer")) {
        url = url.replace(/^.*\/FeatureServer/, "FeatureServer");
        url = url.replace(
          /FeatureServer\/query\?f=json&layerDefs=%7B3%3A%22.*%22%7D$/i,
          "layerDefs.json"
        );
        url = url.replace(/FeatureServer\/3\/?\?.*/i, "3.json");
        args[0] = "test/ArcGisFeatureServer/Parks/" + url;
      }

      return realLoadWithXhr(...args);
    });
  });

  it("has a type and typeName", function() {
    expect(item.type).toBe("esri-featureServer");
    expect(item.typeName).toBe("Esri ArcGIS FeatureServer");
  });

  it("supports zooming to extent", function() {
    expect(item.canZoomTo).toBeTruthy();
  });

  it("supports show info", function() {
    expect(item.showsInfo).toBeTruthy();
  });

  describe("after loading metadata", function() {
    beforeEach(async function() {
      runInAction(() => {
        item.setTrait("definition", "url", featureServerUrl);
      });
      await item.loadMetadata();
    });

    it("defines a rectangle", function() {
      expect(item.rectangle).toBeDefined();
      if (item.rectangle) {
        expect(item.rectangle.west).toEqual(-179.999987937519);
        expect(item.rectangle.south).toEqual(-55.90222504885724);
        expect(item.rectangle.east).toEqual(179.999987937519);
        expect(item.rectangle.north).toEqual(81.29054454173075);
      }
    });

    it("defines info", function() {
      const dataDescription = i18next.t(
        "models.arcGisMapServerCatalogItem.dataDescription"
      );
      const copyrightText = i18next.t(
        "models.arcGisMapServerCatalogItem.copyrightText"
      );

      expect(item.info.map(({ name }) => name)).toEqual([
        dataDescription,
        copyrightText
      ]);
      expect(item.info.map(({ content }) => content)).toEqual([
        "Water Data",
        "Water Copyright"
      ]);
    });
  });

  describe("loadMapItems", function() {
    it("properly loads a single layer", async function() {
      runInAction(() => {
        item.setTrait(CommonStrata.definition, "url", featureServerUrl);
      });

      await item.loadMapItems();

      expect(item.geoJsonItem).toBeDefined();
      if (isDefined(item.geoJsonItem)) {
        const geoJsonData = item.geoJsonItem.geoJsonData;
        expect(geoJsonData).toBeDefined();
        if (isDefined(geoJsonData)) {
          expect(geoJsonData.type).toEqual("FeatureCollection");

          const features = <JsonArray>geoJsonData.features;
          expect(features.length).toEqual(13);
        }
      }
    });
  });

  describe("updateEntityWithEsriStyle", function() {
    it("does not style polyline if polygon outline has style.", async function() {
      runInAction(() => {
        item.setTrait(CommonStrata.definition, "url", featureServerUrl2);
      });

      await item.loadMetadata();
      await item.loadMapItems();

      const expectedOutlineWidth = 0.4;
      const expectedPolygonFilledColor: number = Color.fromBytes(
        215,
        203,
        247,
        255
      ).toRgba();
      const expectedPolygonOutlineColor: number = Color.fromBytes(
        110,
        110,
        110,
        255
      ).toRgba();
      const expectedPolylineColor: number = Color.fromBytes(
        0,
        0,
        0,
        255
      ).toRgba();

      const aTime = new JulianDate();
      item.mapItems.map(mapItem => {
        mapItem.entities.values.map(entity => {
          const actualPolygonOutlineWidth = (<ConstantProperty>(
            entity.polygon.outlineWidth
          )).getValue(aTime);
          expect(actualPolygonOutlineWidth).toEqual(expectedOutlineWidth);

          const acutualPolygonColor = (<ConstantProperty>(
            (<unknown>(
              (<Cesium.ColorMaterialProperty>entity.polygon.material).color
            ))
          ))
            .getValue(aTime)
            .toRgba();
          expect(acutualPolygonColor).toEqual(expectedPolygonFilledColor);

          const actualPolygonOutlineColor = (<ConstantProperty>(
            (<unknown>entity.polygon.outlineColor)
          ))
            .getValue(aTime)
            .toRgba();
          expect(actualPolygonOutlineColor).toEqual(
            expectedPolygonOutlineColor
          );

          const acutalPolylineColor = (<ConstantProperty>(
            (<unknown>(
              (<Cesium.ColorMaterialProperty>entity.polyline.material).color
            ))
          ))
            .getValue(aTime)
            .toRgba();
          expect(acutalPolylineColor).toEqual(expectedPolylineColor);
        });
      });

      expect(item.geoJsonItem).toBeDefined();
      if (isDefined(item.geoJsonItem)) {
        const geoJsonData = item.geoJsonItem.geoJsonData;
        expect(geoJsonData).toBeDefined();
        if (isDefined(geoJsonData)) {
          expect(geoJsonData.type).toEqual("FeatureCollection");

          const features = <JsonArray>geoJsonData.features;
          expect(features.length).toEqual(2);
        }
      }
    });
  });
});
