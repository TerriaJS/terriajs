import MapboxStyleImageryProvider from "terriajs-cesium/Source/Scene/MapboxStyleImageryProvider";
import URI from "urijs";
import { ImageryParts } from "../../lib/ModelMixins/MappableMixin";
import CommonStrata from "../../lib/Models/Definition/CommonStrata";
import MapboxStyleCatalogItem from "../../lib/Models/Catalog/CatalogItems/MapboxStyleCatalogItem";
import Terria from "../../lib/Models/Terria";

describe("MapboxStyleCatalogItem", function () {
  let terria: Terria;

  beforeEach(function () {
    terria = new Terria();
  });

  it("defines a type", function () {
    expect(MapboxStyleCatalogItem.type).toBe("mapbox-style");
    expect(new MapboxStyleCatalogItem("test", terria).type).toBe(
      "mapbox-style"
    );
  });

  it("can be created", function () {
    new MapboxStyleCatalogItem("test", terria);
  });

  describe("mapItems ImageryPart", function () {
    it("has a MapboxStyleImageryProvider", function () {
      const item = new MapboxStyleCatalogItem("test", terria);
      item.setTrait(CommonStrata.user, "styleId", "123");
      item.setTrait(CommonStrata.user, "accessToken", "456");
      const mapItem = item.mapItems[0];
      expect(ImageryParts.is(mapItem)).toBe(true);
      if (ImageryParts.is(mapItem)) {
        expect(
          mapItem.imageryProvider instanceof MapboxStyleImageryProvider
        ).toBe(true);
      }
    });

    it("sets show from traits", function () {
      const item = new MapboxStyleCatalogItem("test", terria);
      item.setTrait(CommonStrata.user, "styleId", "123");
      item.setTrait(CommonStrata.user, "accessToken", "456");
      item.setTrait(CommonStrata.user, "show", false);
      const mapItem = item.mapItems[0];
      expect(ImageryParts.is(mapItem)).toBe(true);
      if (ImageryParts.is(mapItem)) {
        expect(mapItem.show).toEqual(false);
      }
    });

    it("sets opacity from traits", function () {
      const item = new MapboxStyleCatalogItem("test", terria);
      item.setTrait(CommonStrata.user, "styleId", "123");
      item.setTrait(CommonStrata.user, "accessToken", "456");
      item.setTrait(CommonStrata.user, "opacity", 0.42);
      const mapItem = item.mapItems[0];
      expect(ImageryParts.is(mapItem)).toBe(true);
      if (ImageryParts.is(mapItem)) {
        expect(mapItem.alpha).toEqual(0.42);
      }
    });
  });

  describe("the constructed MapboxStyleImageryProvider", function () {
    let item: MapboxStyleCatalogItem;

    beforeEach(function () {
      item = new MapboxStyleCatalogItem("test", terria);
      item.setTrait(CommonStrata.user, "styleId", "123");
      item.setTrait(CommonStrata.user, "accessToken", "456");
      item.setTrait(CommonStrata.user, "username", "foo");
      item.setTrait(CommonStrata.user, "tilesize", 128);
      item.setTrait(CommonStrata.user, "scaleFactor", true);
      item.setTrait(CommonStrata.user, "minimumLevel", 2);
      item.setTrait(CommonStrata.user, "maximumLevel", 64);
      item.setTrait(CommonStrata.user, "attribution", "&copy; Foo author");
    });

    it("sets the url from traits", function () {
      item.setTrait(
        CommonStrata.user,
        "url",
        "https://some.server.com/styles/v1"
      );
      const imageryProvider = getImageryProvider(item);
      expect(
        imageryProvider.url.startsWith("https://some.server.com/styles/v1")
      ).toBe(true);
    });

    it("sets the username from traits", function () {
      const imageryProvider = getImageryProvider(item);
      expect(
        imageryProvider.url.startsWith("https://api.mapbox.com/styles/v1/foo")
      ).toBe(true);
    });

    it("sets the styleId from traits", function () {
      const imageryProvider = getImageryProvider(item);
      expect(
        imageryProvider.url.startsWith(
          "https://api.mapbox.com/styles/v1/foo/123"
        )
      ).toBe(true);
    });

    it("sets the accessToken from traits", function () {
      const imageryProvider = getImageryProvider(item);
      const uri = new URI(imageryProvider.url);
      expect(uri.search(true).access_token).toBe("456");
    });

    it("sets the tilesize from traits", function () {
      const imageryProvider = getImageryProvider(item);
      expect(
        imageryProvider.url.startsWith(
          "https://api.mapbox.com/styles/v1/foo/123/tiles/128"
        )
      ).toBe(true);
    });

    it("sets the scaleFactor from traits", function () {
      const imageryProvider = getImageryProvider(item);
      expect(
        imageryProvider.url.startsWith(
          "https://api.mapbox.com/styles/v1/foo/123/tiles/128/{z}/{x}/{y}@2x"
        )
      ).toBe(true);
    });

    it("sets the minimumLevel from traits", function () {
      const imageryProvider = getImageryProvider(item);
      expect(imageryProvider.minimumLevel).toBe(2);
    });

    it("sets the maximumLevel from traits", function () {
      const imageryProvider = getImageryProvider(item);
      expect(imageryProvider.maximumLevel).toBe(64);
    });

    it("sets the credits from traits", function () {
      const imageryProvider = getImageryProvider(item);
      expect(imageryProvider.credit.html).toBe("&copy; Foo author");
    });
  });
});

function getImageryProvider(
  item: MapboxStyleCatalogItem
): MapboxStyleImageryProvider {
  const mapItem = item.mapItems[0];
  if (
    ImageryParts.is(mapItem) &&
    mapItem.imageryProvider instanceof MapboxStyleImageryProvider
  ) {
    return mapItem.imageryProvider;
  } else {
    throw new Error("Load failed");
  }
}
