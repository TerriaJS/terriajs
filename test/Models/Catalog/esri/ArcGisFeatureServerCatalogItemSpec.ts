import { configure, runInAction } from "mobx";
import _loadWithXhr from "../../../../lib/Core/loadWithXhr";
import Terria from "../../../../lib/Models/Terria";
import { getLineStyleCesium } from "../../../../lib/Models/Catalog/Esri/esriLineStyle";
import ArcGisFeatureServerCatalogItem, {
  convertEsriPointSizeToPixels,
  convertEsriColorToCesiumColor
} from "../../../../lib/Models/Catalog/Esri/ArcGisFeatureServerCatalogItem";
import CommonStrata from "../../../../lib/Models/Definition/CommonStrata";
import isDefined from "../../../../lib/Core/isDefined";
import { JsonArray } from "../../../../lib/Core/Json";
import i18next from "i18next";
import ColorMaterialProperty from "terriajs-cesium/Source/DataSources/ColorMaterialProperty";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import PolylineDashMaterialProperty from "terriajs-cesium/Source/DataSources/PolylineDashMaterialProperty";
import Color from "terriajs-cesium/Source/Core/Color";
import ConstantProperty from "terriajs-cesium/Source/DataSources/ConstantProperty";
import GeoJsonDataSource from "terriajs-cesium/Source/DataSources/GeoJsonDataSource";

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

  const featureServerUrlStyleLines =
    "http://example.com/arcgis/rest/services/styles/FeatureServer/0";
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
          /FeatureServer\/query\?f=json&layerDefs=%7B2%3A%22.*%22%7D&outSR=4326$/i,
          "layerDefs.json"
        );
        url = url.replace(/FeatureServer\/2\/?\?.*/i, "2.json");
        args[0] = "test/ArcGisFeatureServer/Water_Network/" + url;
      } else if (url.match("Parks/FeatureServer")) {
        url = url.replace(/^.*\/FeatureServer/, "FeatureServer");
        url = url.replace(
          /FeatureServer\/query\?f=json&layerDefs=%7B3%3A%22.*%22%7D&outSR=4326$/i,
          "layerDefs.json"
        );
        url = url.replace(/FeatureServer\/3\/?\?.*/i, "3.json");
        args[0] = "test/ArcGisFeatureServer/Parks/" + url;
      } else if (url.match("styles/FeatureServer")) {
        url = url.replace(/^.*\/FeatureServer/, "FeatureServer");
        url = url.replace(
          /FeatureServer\/query\?f=json&layerDefs=%7B0%3A%22.*%22%7D&outSR=4326$/i,
          "layerDefs.json"
        );
        url = url.replace(/FeatureServer\/0\/?\?.*/i, "lines.json");
        args[0] = "test/ArcGisFeatureServer/styles/" + url;
      }

      return realLoadWithXhr(...args);
    });
  });

  it("has a type and typeName", function() {
    expect(item.type).toBe("esri-featureServer");
    expect(item.typeName).toBe(
      i18next.t("models.arcGisFeatureServerCatalogItem.name")
    );
  });

  it("supports zooming to extent", function() {
    expect(item.disableZoomTo).toBeFalsy();
  });

  it("supports show info", function() {
    expect(item.disableAboutData).toBeFalsy();
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
    it("correctly uses symbol.outline.color to style polyline.", async function() {
      runInAction(() => {
        item.setTrait(CommonStrata.definition, "url", featureServerUrl2);
      });

      await item.loadMetadata();
      await item.loadMapItems();

      const expectedOutlineWidth = convertEsriPointSizeToPixels(1);
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
      const expectedPolylineColor = expectedPolygonOutlineColor;

      const aTime = new JulianDate();
      item.mapItems.map(mapItem => {
        (mapItem as GeoJsonDataSource).entities.values.map(entity => {
          expect(entity.polygon).toBeDefined();

          if (entity.polygon !== undefined) {
            // Waiting on better Cesium typings
            // entity.polygon.material.color returns a Property, but types
            //  suggest it returns a Color. Type casts are neccessary due to this.
            const actualPolygonOutlineWidth = (<ConstantProperty>(
              entity.polygon.outlineWidth
            )).getValue(aTime);
            expect(actualPolygonOutlineWidth).toEqual(expectedOutlineWidth);

            const acutualPolygonColor = (<ConstantProperty>(
              (<unknown>(<ColorMaterialProperty>entity.polygon.material).color)
            ))
              .getValue(aTime)
              .toRgba();
            expect(acutualPolygonColor).toEqual(expectedPolygonFilledColor);

            const actualPolygonOutlineColor = (<ConstantProperty>(
              (<unknown>(
                (<ColorMaterialProperty>entity.polygon.outlineColor).color
              ))
            ))
              .getValue(aTime)
              .toRgba();
            expect(actualPolygonOutlineColor).toEqual(
              expectedPolygonOutlineColor
            );
          }

          expect(entity.polyline).toBeDefined();

          if (entity.polyline !== undefined) {
            const acutalPolylineColor = (<ConstantProperty>(
              (<unknown>(
                (<ColorMaterialProperty>entity?.polyline?.material).color
              ))
            ))
              .getValue(aTime)
              .toRgba();
            expect(acutalPolylineColor).toEqual(expectedPolylineColor);
          }
        });
      });
    });
  });

  describe("esriSLS", function() {
    it("properly loads features", async function() {
      runInAction(() => {
        item.setTrait(
          CommonStrata.definition,
          "url",
          featureServerUrlStyleLines
        );
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

    it("properly styles features", async function() {
      runInAction(() => {
        item.setTrait(
          CommonStrata.definition,
          "url",
          featureServerUrlStyleLines
        );
      });
      await item.loadMapItems();

      expect(item.geoJsonItem).toBeDefined();
      expect(item.mapItems).toBeDefined();
      expect(item.mapItems.length).toEqual(1);

      const mapItem = item.mapItems[0];
      const entities = (mapItem as GeoJsonDataSource).entities.values;

      expect(entities).toBeDefined();
      expect(entities.length).toEqual(13);
      // first item
      const time = new JulianDate();

      expect(entities[0].polyline).toBeDefined();
      expect(
        entities[0]?.polyline?.material instanceof ColorMaterialProperty
      ).toBeTruthy();
      expect(entities[0]?.polyline?.width?.getValue(time)).toEqual(
        convertEsriPointSizeToPixels(1.5)
      );

      expect(entities[1].polyline).toBeDefined();
      expect(
        entities[1]?.polyline?.material instanceof PolylineDashMaterialProperty
      ).toBeTruthy();
      expect(
        (<PolylineDashMaterialProperty>(
          entities[1]?.polyline?.material
        )).dashPattern?.getValue(time)
      ).toEqual(getLineStyleCesium("esriSLSDot"));
      expect(
        (<ConstantProperty>(
          (<unknown>(
            (<PolylineDashMaterialProperty>entities[1]?.polyline?.material)
              .color
          ))
        )).getValue(time)
      ).toEqual(convertEsriColorToCesiumColor([20, 158, 206, 255]));
      expect(entities[1]?.polyline?.width?.getValue(time)).toEqual(
        convertEsriPointSizeToPixels(1.5)
      );

      expect(entities[2].polyline).toBeDefined();
      expect(
        entities[2]?.polyline?.material instanceof PolylineDashMaterialProperty
      ).toBeTruthy();
      expect(
        (<PolylineDashMaterialProperty>entities[2]?.polyline?.material)
          .dashPattern
      ).toBeUndefined();
      expect(entities[2]?.polyline?.width?.getValue(time)).toEqual(
        convertEsriPointSizeToPixels(1.5)
      );

      expect(entities[3].polyline).toBeDefined();
      expect(
        entities[3]?.polyline?.material instanceof PolylineDashMaterialProperty
      ).toBeTruthy();
      expect(
        (<PolylineDashMaterialProperty>(
          entities[3]?.polyline?.material
        )).dashPattern?.getValue(time)
      ).toEqual(getLineStyleCesium("esriSLSDashDot"));
      expect(entities[3]?.polyline?.width?.getValue(time)).toEqual(
        convertEsriPointSizeToPixels(1.5)
      );

      expect(entities[4].polyline).toBeDefined();
      expect(
        entities[4]?.polyline?.material instanceof PolylineDashMaterialProperty
      ).toBeTruthy();
      expect(
        (<PolylineDashMaterialProperty>(
          entities[4]?.polyline?.material
        )).dashPattern?.getValue(time)
      ).toEqual(getLineStyleCesium("esriSLSDashDotDot"));
      expect(entities[4]?.polyline?.width?.getValue(time)).toEqual(
        convertEsriPointSizeToPixels(1.5)
      );

      expect(entities[5].polyline).toBeDefined();
      expect(
        entities[5]?.polyline?.material instanceof PolylineDashMaterialProperty
      ).toBeTruthy();
      expect(
        (<PolylineDashMaterialProperty>(
          entities[5]?.polyline?.material
        )).dashPattern?.getValue(time)
      ).toEqual(getLineStyleCesium("esriSLSLongDash"));
      expect(entities[5]?.polyline?.width?.getValue(time)).toEqual(
        convertEsriPointSizeToPixels(1.5)
      );

      expect(entities[6].polyline).toBeDefined();
      expect(
        entities[6]?.polyline?.material instanceof PolylineDashMaterialProperty
      ).toBeTruthy();
      expect(
        (<PolylineDashMaterialProperty>(
          entities[6]?.polyline?.material
        )).dashPattern?.getValue(time)
      ).toEqual(getLineStyleCesium("esriSLSLongDashDot"));
      expect(entities[6]?.polyline?.width?.getValue(time)).toEqual(
        convertEsriPointSizeToPixels(1.5)
      );

      expect(entities[7].polyline).toBeDefined();
      expect(
        entities[7]?.polyline?.material instanceof PolylineDashMaterialProperty
      ).toBeTruthy();
      expect(
        (<PolylineDashMaterialProperty>(
          entities[7]?.polyline?.material
        )).dashPattern?.getValue(time)
      ).toEqual(getLineStyleCesium("esriSLSShortDash"));
      expect(entities[7]?.polyline?.width?.getValue(time)).toEqual(
        convertEsriPointSizeToPixels(1.5)
      );

      expect(entities[8].polyline).toBeDefined();
      expect(
        entities[8]?.polyline?.material instanceof PolylineDashMaterialProperty
      ).toBeTruthy();
      expect(
        (<PolylineDashMaterialProperty>(
          entities[8]?.polyline?.material
        )).dashPattern?.getValue(time)
      ).toEqual(getLineStyleCesium("esriSLSShortDot"));
      expect(entities[8]?.polyline?.width?.getValue(time)).toEqual(
        convertEsriPointSizeToPixels(1.5)
      );

      expect(entities[9].polyline).toBeDefined();
      expect(
        entities[9]?.polyline?.material instanceof PolylineDashMaterialProperty
      ).toBeTruthy();
      expect(
        (<PolylineDashMaterialProperty>(
          entities[9]?.polyline?.material
        )).dashPattern?.getValue(time)
      ).toEqual(getLineStyleCesium("esriSLSShortDashDot"));
      expect(entities[9]?.polyline?.width?.getValue(time)).toEqual(
        convertEsriPointSizeToPixels(1.5)
      );

      expect(entities[10].polyline).toBeDefined();
      expect(
        entities[10]?.polyline?.material instanceof PolylineDashMaterialProperty
      ).toBeTruthy();
      expect(
        (<PolylineDashMaterialProperty>(
          entities[10]?.polyline?.material
        )).dashPattern?.getValue(time)
      ).toEqual(getLineStyleCesium("esriSLSShortDashDotDot"));
      expect(entities[10]?.polyline?.width?.getValue(time)).toEqual(
        convertEsriPointSizeToPixels(1.5)
      );

      expect(entities[11].polyline).toBeDefined();
      expect(
        entities[11]?.polyline?.material instanceof ColorMaterialProperty
      ).toBeTruthy();
      expect(entities[11]?.polyline?.show?.getValue(time)).toBeFalsy();
      expect(entities[11]?.polyline?.width?.getValue(time)).toEqual(
        convertEsriPointSizeToPixels(1.5)
      );

      expect(entities[12].polyline).toBeDefined();
      expect(
        entities[12]?.polyline?.material instanceof PolylineDashMaterialProperty
      ).toBeTruthy();
      expect(
        (<PolylineDashMaterialProperty>entities[12]?.polyline?.material)
          .dashPattern
      ).toBeUndefined();
      expect(entities[12]?.polyline?.width?.getValue(time)).toEqual(
        convertEsriPointSizeToPixels(4.5)
      );
    });
  });
});
