import CustomDataSource from "terriajs-cesium/Source/DataSources/CustomDataSource";
import ImageryLayer from "terriajs-cesium/Source/Scene/ImageryLayer";
import WebMapServiceImageryProvider from "terriajs-cesium/Source/Scene/WebMapServiceImageryProvider";
import { featureBelongsToCatalogItem } from "../../lib/Map/PickedFeatures/PickedFeatures";
import TerriaFeature from "../../lib/Models/Feature/Feature";
import Terria from "../../lib/Models/Terria";
import SimpleCatalogItem from "../Helpers/SimpleCatalogItem";

describe("featureBelongsToCatalogItem", function () {
  it("returns true if the `_catalogItem` property matches", function () {
    const item = new SimpleCatalogItem(undefined, new Terria());
    const feature = new TerriaFeature({});
    expect(featureBelongsToCatalogItem(feature, item)).toBe(false);
    feature._catalogItem = item;
    expect(featureBelongsToCatalogItem(feature, item)).toBe(true);
  });

  it("returns true if mapItems has the dataSource that owns the feature", function () {
    const item = new SimpleCatalogItem(undefined, new Terria());
    const feature = new TerriaFeature({});
    const dataSource = new CustomDataSource("testData");
    dataSource.entities.add(feature);
    expect(featureBelongsToCatalogItem(feature, item)).toBe(false);
    item.mapItems = [dataSource];
    expect(featureBelongsToCatalogItem(feature, item)).toBe(true);
  });

  it("returns true if mapItems has a matching imagery provider", function () {
    const item = new SimpleCatalogItem(undefined, new Terria());
    const feature = new TerriaFeature({});
    const imageryProvider = new WebMapServiceImageryProvider({
      url: "test",
      layers: "test"
    });
    feature.imageryLayer = new ImageryLayer(imageryProvider);

    expect(featureBelongsToCatalogItem(feature, item)).toBe(false);
    item.mapItems = [
      { imageryProvider, alpha: 0, show: false, clippingRectangle: undefined }
    ];
    expect(featureBelongsToCatalogItem(feature, item)).toBe(true);
  });
});
