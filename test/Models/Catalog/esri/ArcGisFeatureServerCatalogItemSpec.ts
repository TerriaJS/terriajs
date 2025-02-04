import i18next from "i18next";
import { configure, runInAction } from "mobx";
import Color from "terriajs-cesium/Source/Core/Color";
import _loadWithXhr from "../../../../lib/Core/loadWithXhr";
import ProtomapsImageryProvider from "../../../../lib/Map/ImageryProvider/ProtomapsImageryProvider";
import { ProtomapsArcGisPbfSource } from "../../../../lib/Map/Vector/Protomaps/ProtomapsArcGisPbfSource";
import { isDataSource } from "../../../../lib/ModelMixins/MappableMixin";
import ArcGisFeatureServerCatalogItem, {
  convertEsriPointSizeToPixels
} from "../../../../lib/Models/Catalog/Esri/ArcGisFeatureServerCatalogItem";
import CommonStrata from "../../../../lib/Models/Definition/CommonStrata";
import Terria from "../../../../lib/Models/Terria";
import TableColumnType from "../../../../lib/Table/TableColumnType";

configure({
  enforceActions: "observed",
  computedRequiresReaction: true
});

interface ExtendedLoadWithXhr {
  (): any;
  load: { (...args: any[]): any; calls: any };
}

const loadWithXhr: ExtendedLoadWithXhr = _loadWithXhr as any;

describe("ArcGisFeatureServerCatalogItem", function () {
  const featureServerUrl =
    "http://example.com/arcgis/rest/services/Water_Network/FeatureServer/2";

  const featureServerUrl2 =
    "http://example.com/arcgis/rest/services/Parks/FeatureServer/3";

  const featureServerUrlStyleLines =
    "http://example.com/arcgis/rest/services/styles/FeatureServer/0";

  const featureServerUrlTiled =
    "http://example.com/arcgis/rest/services/tiled/FeatureServer/0";

  const featureServerUrlMulti =
    "http://example.com/arcgis/rest/services/Water_Network_Multi/FeatureServer/2";

  let terria: Terria;
  let item: ArcGisFeatureServerCatalogItem;

  let xhrSpy: jasmine.Spy;

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });
    item = new ArcGisFeatureServerCatalogItem("test", terria);

    let multiCallCount = 0;

    const realLoadWithXhr = loadWithXhr.load;
    // We replace calls to real servers with pre-captured JSON files so our testing is isolated, but reflects real data.
    // NOTE: When writing tests for this catalog item, you will always need to specify a `maxFeatures` trait or ensure
    // that once all feature data has been requested, the mock server below returns 0 features.
    xhrSpy = spyOn(loadWithXhr, "load").and.callFake((...args: any[]) => {
      let url = args[0];
      const originalUrl = url;
      url = url.replace(/^.*\/FeatureServer/, "FeatureServer");
      url = url.replace(
        /FeatureServer\/[0-9]+\/query\?f=json.*$/i,
        "layer.json"
      );

      if (originalUrl.match("Water_Network/FeatureServer")) {
        url = url.replace(/FeatureServer\/2\/?\?.*/i, "2.json");
        args[0] = "test/ArcGisFeatureServer/Water_Network/" + url;
      } else if (originalUrl.match("Parks/FeatureServer")) {
        url = url.replace(/FeatureServer\/3\/?\?.*/i, "3.json");
        args[0] = "test/ArcGisFeatureServer/Parks/" + url;
      } else if (originalUrl.match("styles/FeatureServer")) {
        url = url.replace(/FeatureServer\/0\/?\?.*/i, "lines.json");
        args[0] = "test/ArcGisFeatureServer/styles/" + url;
      } else if (originalUrl.match("tiled/FeatureServer")) {
        url = url.replace(/FeatureServer\/0\/?\?.*/i, "act-veg-map.json");
        args[0] = "test/ArcGisFeatureServer/Tiled/" + url;
      } else if (originalUrl.match("Water_Network_Multi/FeatureServer")) {
        // We're getting this feature service in multiple requests, so we need to return different data on subsequent
        // calls
        console.log("multicall count", multiCallCount, originalUrl);
        if (url.includes("layer")) {
          multiCallCount++;
        }
        if (url.includes("layer") && multiCallCount > 1) {
          url = url.replace("layer.json", "layerB.json");
        }
        url = url.replace(/FeatureServer\/2\/?\?.*/i, "2.json");
        args[0] = "test/ArcGisFeatureServer/Water_Network_Multi/" + url;
      }

      return realLoadWithXhr(...args);
    });
  });

  it("has a type and typeName", function () {
    expect(item.type).toBe("esri-featureServer");
    expect(item.typeName).toBe(
      i18next.t("models.arcGisFeatureServerCatalogItem.name")
    );
  });

  it("supports show info", function () {
    expect(item.disableAboutData).toBeFalsy();
  });

  describe("after loading metadata", function () {
    beforeEach(async function () {
      runInAction(() => {
        item.setTrait("definition", "url", featureServerUrl);
      });
      await item.loadMetadata();
    });

    it("defines a rectangle", function () {
      expect(item.rectangle).toBeDefined();
      if (item.rectangle) {
        expect(item.rectangle.west).toEqual(-179.999987937519);
        expect(item.rectangle.south).toEqual(-55.90222504885724);
        expect(item.rectangle.east).toEqual(179.999987937519);
        expect(item.rectangle.north).toEqual(81.29054454173075);
      }
    });

    it("defines min/max scale denominator", function () {
      expect(item.minScaleDenominator).toEqual(0);
      expect(item.maxScaleDenominator).toEqual(0);
    });

    it("supports zooming to extent", function () {
      expect(item.disableZoomTo).toBeFalsy();
    });

    it("defines info", function () {
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

  describe("after loading metadata - layer with min/max extent", function () {
    beforeEach(async function () {
      runInAction(() => {
        item.setTrait("definition", "url", featureServerUrl2);
      });
      await item.loadMetadata();
    });

    it("defines a rectangle", function () {
      expect(item.rectangle).toBeDefined();
      if (item.rectangle) {
        expect(item.rectangle.west).toEqual(150.01467801477867);
        expect(item.rectangle.south).toEqual(-34.33741590494015);
        expect(item.rectangle.east).toEqual(151.34389995591835);
        expect(item.rectangle.north).toEqual(-32.99606922215397);
      }
    });

    it("defines min/max scale denominator", function () {
      expect(item.minScaleDenominator).toEqual(36111);
      expect(item.maxScaleDenominator).toEqual(18489298);
    });
  });

  describe("loadMapItems - geojson query", function () {
    it("properly loads a single layer", async function () {
      runInAction(() => {
        item.setTrait(CommonStrata.definition, "url", featureServerUrl);
        item.setTrait(CommonStrata.definition, "maxFeatures", 20);
        item.setTrait(CommonStrata.definition, "tileRequests", false);
      });

      await item.loadMapItems();

      expect(item.mapItems.length).toEqual(1);
      const mapItem = item.mapItems[0];

      console.log(item.mapItems);
      expect(isDataSource(mapItem)).toBeTruthy();
      expect(
        isDataSource(mapItem) ? mapItem.entities.values.length : 0
      ).toEqual(13);

      // 1 call for metadata, and 1 call for features
      expect(xhrSpy).toHaveBeenCalledTimes(2);
    });

    it("properly loads a single layer with multiple requests", async function () {
      runInAction(() => {
        item.setTrait(CommonStrata.definition, "url", featureServerUrlMulti);
        item.setTrait(CommonStrata.definition, "featuresPerRequest", 10);
        item.setTrait(CommonStrata.definition, "tileRequests", false);
      });

      await item.loadMapItems();

      expect(item.mapItems.length).toEqual(1);

      const mapItem = item.mapItems[0];
      expect(isDataSource(mapItem)).toBeTruthy();
      expect(
        isDataSource(mapItem) ? mapItem.entities.values.length : 0
      ).toEqual(13);

      // 1 call for metadata, and 2 calls for features
      expect(xhrSpy).toHaveBeenCalledTimes(3);
    });
  });

  describe("loadMapItems - tiled query", function () {
    it("properly loads a layer", async function () {
      runInAction(() => {
        item.setTrait(CommonStrata.definition, "url", featureServerUrlTiled);
      });

      await item.loadMapItems();

      expect(item.tileRequests).toBeTruthy();
      expect(item.maxTiledFeatures).toEqual(100000);
      expect(item.featuresPerTileRequest).toEqual(4000);
      expect(item.maxRecordCountFactor).toEqual(1);
      expect(item.supportsQuantization).toEqual(true);
      expect(item.objectIdField).toEqual("OBJECTID");
      expect(item.outFields).toEqual(["OBJECTID", "class"]);

      expect(item.mapItems.length).toEqual(1);
      const mapItem = item.mapItems[0];

      expect("imageryProvider" in mapItem).toBeTruthy();
      if ("imageryProvider" in mapItem) {
        const imageryProvider =
          mapItem.imageryProvider as ProtomapsImageryProvider;

        expect(
          imageryProvider.source instanceof ProtomapsArcGisPbfSource
        ).toBeTruthy();
      }

      expect(item.dataColumnMajor).toEqual([
        ["OBJECTID"],
        ["GlobalID"],
        ["actGUID"],
        ["vegCommunity"],
        ["umcID"],
        ["tecACT"],
        ["tecEPBC"],
        ["tecID"],
        ["actConservationStatus"],
        ["nationalConservationStatus"],
        ["treesp1"],
        ["treesp2"],
        ["treesp3"],
        ["shrubsp1"],
        ["shrubsp2"],
        ["shrubsp3"],
        ["groundsp1"],
        ["groundsp2"],
        ["groundsp3"],
        ["hectares"],
        ["height_mean"],
        ["height_stdev"],
        ["canopyCover"],
        ["underCover"],
        ["structure"],
        ["formation"],
        ["class"],
        ["grassyStructure"],
        ["lastVegCommunity"],
        ["landscape"],
        ["lossReason"],
        ["lossYear"],
        ["Shape__Area"],
        ["Shape__Length"]
      ]);
      expect(item.activeTableStyle.colorColumn?.name).toEqual("class");
      expect(item.activeTableStyle.colorColumn?.type).toEqual(
        TableColumnType.text
      );
      expect(item.activeTableStyle.tableColorMap.type).toEqual("enum");
    });

    it("ProtomapsImageryProvider - ArcGisPbfSource", async function () {
      runInAction(() => {
        item.setTrait(CommonStrata.definition, "url", featureServerUrlTiled);
      });

      await item.loadMapItems();

      const mapItem = item.mapItems[0];

      expect("imageryProvider" in mapItem).toBeTruthy();
      if ("imageryProvider" in mapItem) {
        const imageryProvider =
          mapItem.imageryProvider as ProtomapsImageryProvider;

        expect(
          imageryProvider.source instanceof ProtomapsArcGisPbfSource
        ).toBeTruthy();

        // TODO
        // Test get tile - with single request
        // Test get tile - with multiple requests
        // Test get tile - look at process features...
        // Test pickFeautres
      }
    });
  });

  describe("updateEntityWithEsriStyle", function () {
    it("correctly uses symbol.outline.color to style polyline.", async function () {
      runInAction(() => {
        item.setTrait(CommonStrata.definition, "url", featureServerUrl2);
        item.setTrait(CommonStrata.definition, "maxFeatures", 20);
      });

      await item.loadMetadata();
      await item.loadMapItems();

      const outlineWidth = convertEsriPointSizeToPixels(1);
      const fillColor = Color.fromBytes(215, 203, 247, 255).toCssColorString();
      const outlineColor = Color.fromBytes(
        110,
        110,
        110,
        255
      ).toCssColorString();

      expect(item.activeTableStyle.outlineStyleMap.traitValues.null.color).toBe(
        outlineColor
      );
      expect(item.activeTableStyle.outlineStyleMap.traitValues.null.width).toBe(
        outlineWidth
      );
      expect(item.activeTableStyle.colorTraits.nullColor).toBe(fillColor);
    });
  });

  describe("esriSLS", function () {
    it("properly loads features", async function () {
      runInAction(() => {
        item.setTrait(
          CommonStrata.definition,
          "url",
          featureServerUrlStyleLines
        );
        item.setTrait(CommonStrata.definition, "maxFeatures", 20);
        item.setTrait(CommonStrata.definition, "tileRequests", false);
      });
      await item.loadMapItems();

      expect(item.mapItems.length).toEqual(1);
      const dataSource = item.mapItems[0];
      expect(
        !isDataSource(dataSource) && dataSource.imageryProvider
      ).toBeTruthy();
      expect(item.featureCounts.line).toEqual(13);
    });

    it("properly styles features", async function () {
      runInAction(() => {
        item.setTrait(
          CommonStrata.definition,
          "url",
          featureServerUrlStyleLines
        );
        item.setTrait(CommonStrata.definition, "maxFeatures", 20);
      });
      await item.loadMapItems();

      expect(item.mapItems).toBeDefined();
      expect(item.mapItems.length).toEqual(1);

      const tableStyle = item.activeTableStyle;
      expect(tableStyle.colorColumn?.name).toBe("id1");
      expect(tableStyle.colorTraits.nullColor).toBe("rgb(252,146,31)");
      expect(
        tableStyle.colorTraits.enumColors.map((col) => ({
          value: col.value,
          color: col.color
        }))
      ).toEqual([
        {
          value: "1",
          color: "rgb(237,81,81)"
        },
        {
          value: "2",
          color: "rgb(20,158,206)"
        },
        {
          value: "3",
          color: "rgb(167,198,54)"
        },
        {
          value: "4",
          color: "rgb(158,85,156)"
        },
        {
          value: "5",
          color: "rgb(252,146,31)"
        },
        {
          value: "6",
          color: "rgb(255,222,62)"
        },
        {
          value: "7",
          color: "rgb(247,137,216)"
        },
        {
          value: "8",
          color: "rgb(183,129,74)"
        },
        {
          value: "9",
          color: "rgb(60,175,153)"
        },
        {
          value: "10",
          color: "rgb(107,107,214)"
        },
        {
          value: "11",
          color: "rgb(181,71,121)"
        },
        {
          value: "12",
          color: "#ffffff"
        }
      ]);

      expect(tableStyle.pointStyleMap.column?.name).toBe("id1");

      expect(tableStyle.pointStyleMap.traitValues.null).toEqual({
        marker: "point",
        pixelOffset: [0, 0],
        width: 6,
        height: 16,
        rotation: 0,
        scaleByDistance: { near: 0, nearValue: 1, far: 1, farValue: 1 }
      });

      expect(tableStyle.pointStyleMap.traitValues.enum).toEqual([
        {
          legendTitle: "1",
          marker: "point",
          pixelOffset: [0, 0],
          width: 2,
          height: 16,
          value: "1",
          rotation: 0,
          scaleByDistance: { near: 0, nearValue: 1, far: 1, farValue: 1 }
        },
        {
          legendTitle: "2",
          marker: "point",
          pixelOffset: [0, 0],
          width: 2,
          height: 16,
          value: "2",
          rotation: 0,
          scaleByDistance: { near: 0, nearValue: 1, far: 1, farValue: 1 }
        },
        {
          legendTitle: "3",
          marker: "point",
          pixelOffset: [0, 0],
          width: 2,
          height: 16,
          value: "3",
          rotation: 0,
          scaleByDistance: { near: 0, nearValue: 1, far: 1, farValue: 1 }
        },
        {
          legendTitle: "4",
          marker: "point",
          pixelOffset: [0, 0],
          width: 2,
          height: 16,
          value: "4",
          rotation: 0,
          scaleByDistance: { near: 0, nearValue: 1, far: 1, farValue: 1 }
        },
        {
          legendTitle: "5",
          marker: "point",
          pixelOffset: [0, 0],
          width: 2,
          height: 16,
          value: "5",
          rotation: 0,
          scaleByDistance: { near: 0, nearValue: 1, far: 1, farValue: 1 }
        },
        {
          legendTitle: "6",
          marker: "point",
          pixelOffset: [0, 0],
          width: 2,
          height: 16,
          value: "6",
          rotation: 0,
          scaleByDistance: { near: 0, nearValue: 1, far: 1, farValue: 1 }
        },
        {
          legendTitle: "7",
          marker: "point",
          pixelOffset: [0, 0],
          width: 2,
          height: 16,
          value: "7",
          rotation: 0,
          scaleByDistance: { near: 0, nearValue: 1, far: 1, farValue: 1 }
        },
        {
          legendTitle: "8",
          marker: "point",
          pixelOffset: [0, 0],
          width: 2,
          height: 16,
          value: "8",
          rotation: 0,
          scaleByDistance: { near: 0, nearValue: 1, far: 1, farValue: 1 }
        },
        {
          legendTitle: "9",
          marker: "point",
          pixelOffset: [0, 0],
          width: 2,
          height: 16,
          value: "9",
          rotation: 0,
          scaleByDistance: { near: 0, nearValue: 1, far: 1, farValue: 1 }
        },
        {
          legendTitle: "10",
          marker: "point",
          pixelOffset: [0, 0],
          width: 2,
          height: 16,
          value: "10",
          rotation: 0,
          scaleByDistance: { near: 0, nearValue: 1, far: 1, farValue: 1 }
        },
        {
          legendTitle: "11",
          marker: "point",
          pixelOffset: [0, 0],
          width: 2,
          height: 16,
          value: "11",
          rotation: 0,
          scaleByDistance: { near: 0, nearValue: 1, far: 1, farValue: 1 }
        },
        {
          legendTitle: "12",
          marker: "point",
          pixelOffset: [0, 0],
          width: 2,
          height: 16,
          value: "12",
          rotation: 0,
          scaleByDistance: { near: 0, nearValue: 1, far: 1, farValue: 1 }
        }
      ]);

      expect(tableStyle.outlineStyleMap.column?.name).toBe("id1");

      expect(tableStyle.outlineStyleMap.traitValues.null).toEqual({
        color: "rgb(252,146,31)",
        dash: [6, 6],
        width: 6
      });

      expect(tableStyle.outlineStyleMap.traitValues.enum).toEqual([
        {
          color: "rgb(237,81,81)",
          dash: [],
          legendTitle: "1",
          width: 2,
          value: "1"
        },
        {
          color: "rgb(20,158,206)",
          dash: [2, 4],
          legendTitle: "2",
          width: 2,
          value: "2"
        },
        {
          color: "rgb(167,198,54)",
          dash: [6, 6],
          legendTitle: "3",
          width: 2,
          value: "3"
        },
        {
          color: "rgb(158,85,156)",
          dash: [6, 3, 1, 3],
          legendTitle: "4",
          width: 2,
          value: "4"
        },
        {
          color: "rgb(252,146,31)",
          dash: [6, 3, 1, 3, 1, 3],
          legendTitle: "5",
          width: 2,
          value: "5"
        },
        {
          color: "rgb(255,222,62)",
          dash: [8, 4],
          legendTitle: "6",
          width: 2,
          value: "6"
        },
        {
          color: "rgb(247,137,216)",
          dash: [8, 3, 1, 3],
          legendTitle: "7",
          width: 2,
          value: "7"
        },
        {
          color: "rgb(183,129,74)",
          dash: [4, 4],
          legendTitle: "8",
          width: 2,
          value: "8"
        },
        {
          color: "rgb(60,175,153)",
          dash: [1, 2],
          legendTitle: "9",
          width: 2,
          value: "9"
        },
        {
          color: "rgb(107,107,214)",
          dash: [4, 2, 1, 2],
          legendTitle: "10",
          width: 2,
          value: "10"
        },
        {
          color: "rgb(181,71,121)",
          dash: [4, 2, 1, 2, 1, 2],
          legendTitle: "11",
          width: 2,
          value: "11"
        },
        {
          dash: [],
          legendTitle: "12",
          width: 2,
          value: "12"
        }
      ]);
    });
  });
});
