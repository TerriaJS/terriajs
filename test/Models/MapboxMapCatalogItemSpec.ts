import { action } from "mobx";
import MapboxImageryProvider from "terriajs-cesium/Source/Scene/MapboxImageryProvider";
import URI from "urijs";
import { ImageryParts } from "../../lib/ModelMixins/MappableMixin";
import CommonStrata from "../../lib/Models/Definition/CommonStrata";
import Terria from "../../lib/Models/Terria";
import MapboxMapCatalogItem from "../../lib/Models/Catalog/CatalogItems/MapboxMapCatalogItem";

describe("MapboxMapCatalogItem", function () {
  let terria: Terria;

  beforeEach(function () {
    terria = new Terria();
  });

  it("has a type", function () {
    expect(MapboxMapCatalogItem.type).toEqual("mapbox-map");
    expect(new MapboxMapCatalogItem("test", terria).type).toEqual("mapbox-map");
  });

  it("can be created", function () {
    new MapboxMapCatalogItem("test", terria);
  });

  describe("mapItems", function () {
    it(
      "returns a MapboxImageryProvider",
      action(async function () {
        const mapboxItem = new MapboxMapCatalogItem("test", terria);
        mapboxItem.setTrait(CommonStrata.user, "mapId", "123");
        mapboxItem.setTrait(CommonStrata.user, "accessToken", "456");
        await mapboxItem.loadMapItems();
        const mapItem = mapboxItem.mapItems[0];
        expect(ImageryParts.is(mapItem)).toBe(true);
        if (ImageryParts.is(mapItem)) {
          expect(mapItem.imageryProvider instanceof MapboxImageryProvider).toBe(
            true
          );
        }
      })
    );
  });

  describe("the constructed MapboxImageryProvider", function () {
    let item: MapboxMapCatalogItem;

    beforeEach(function () {
      item = new MapboxMapCatalogItem("test", terria);
      item.setTrait(CommonStrata.user, "mapId", "123");
      item.setTrait(CommonStrata.user, "accessToken", "456");
    });

    it("sets the url from traits", function () {
      item.setTrait(CommonStrata.user, "url", "https://some.server.com/v4");
      const imageryProvider = getImageryProvider(item);
      expect(imageryProvider.url.startsWith("https://some.server.com/v4")).toBe(
        true
      );
    });

    it("sets the mapId from traits", function () {
      const imageryProvider = getImageryProvider(item);
      expect(
        imageryProvider.url.startsWith("https://api.mapbox.com/v4/123")
      ).toBe(true);
    });

    it("sets the accessToken from traits", function () {
      const imageryProvider = getImageryProvider(item);
      const uri = new URI(imageryProvider.url);
      expect(uri.search(true).access_token).toBe("456");
    });

    it("sets the format from traits", function () {
      item.setTrait(CommonStrata.user, "format", "jpg");
      const imageryProvider = getImageryProvider(item);
      const uri = new URI(imageryProvider.url);
      expect(uri.path().endsWith(".jpg")).toBe(true);
    });

    it("sets the maximumLevel from traits", function () {
      item.setTrait(CommonStrata.user, "maximumLevel", 30);
      const imageryProvider = getImageryProvider(item);
      expect(imageryProvider.maximumLevel).toBe(30);
    });
  });
});

function getImageryProvider(item: MapboxMapCatalogItem): MapboxImageryProvider {
  const mapItem = item.mapItems[0];
  if (
    ImageryParts.is(mapItem) &&
    mapItem.imageryProvider instanceof MapboxImageryProvider
  ) {
    return mapItem.imageryProvider;
  } else {
    throw new Error("Load failed");
  }
}
