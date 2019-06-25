import { configure, runInAction } from "mobx";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import WebMercatorTilingScheme from "terriajs-cesium/Source/Core/WebMercatorTilingScheme";
import UrlTemplateImageryProvider from "terriajs-cesium/Source/Scene/UrlTemplateImageryProvider";
import OpenStreetMapCatalogItem from "../../lib/Models/OpenStreetMapCatalogItem";
import Terria from "../../lib/Models/Terria";

configure({
  enforceActions: "observed",
  computedRequiresReaction: true
});

describe("OpenStreetMapCatalogItem", function() {
  const testUrl = "https://global.ssl.fastly.net/light_all/";
  let item: OpenStreetMapCatalogItem;

  beforeEach(function() {
    item = new OpenStreetMapCatalogItem("test", new Terria());
  });

  it("has a type", function() {
    expect(OpenStreetMapCatalogItem.type).toBe("open-street-map");
  });

  describe("templateUrl", function() {
    it("has placeholders for tile coordinates", function() {
      runInAction(() => item.setTrait("definition", "url", testUrl));
      expect(item.templateUrl).toBe(
        "https://global.ssl.fastly.net/light_all/{z}/{x}/{y}.png"
      );
    });

    it("has placeholder for subdomains", function() {
      runInAction(() => {
        item.setTrait("definition", "url", testUrl);
        item.setTrait("definition", "subdomains", ["a", "b"]);
      });

      expect(item.templateUrl).toBe(
        "https://{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png"
      );
    });
  });

  describe("after loading", function() {
    beforeEach(async function() {
      runInAction(() => {
        item.setTrait("definition", "url", testUrl);
      });
      return item.loadMapItems();
    });

    it("returns exactly 1 mapItem", function() {
      expect(item.mapItems.length).toBe(1);
    });

    describe("the mapItem", function() {
      it("correctly sets the `alpha` value", function() {
        runInAction(() => item.setTrait("definition", "opacity", 0.42));
        expect(item.mapItems[0].alpha).toBe(0.42);
      });

      it("correctly sets `show`", function() {
        runInAction(() => item.setTrait("definition", "show", false));
        expect(item.mapItems[0].show).toBe(false);
        runInAction(() => item.setTrait("definition", "show", true));
        expect(item.mapItems[0].show).toBe(true);
      });

      describe("imageryProvider", function() {
        it("should be a UrlTemplateImageryProvider", function() {
          let imageryProvider = item.mapItems[0].imageryProvider;
          expect(
            imageryProvider instanceof UrlTemplateImageryProvider
          ).toBeTruthy();
        });

        it("has the correct properties", function() {
          runInAction(() => {
            item.setTrait("definition", "attribution", "foo bar baz");
            item.setTrait("definition", "subdomains", ["a"]);
            item.setTrait("definition", "rectangle", {
              west: 0,
              south: -30,
              east: 30,
              north: 30
            });
          });

          let imageryProvider = item.mapItems[0].imageryProvider;
          expect({
            url: imageryProvider.url,
            attribution: imageryProvider.credit.html,
            tilingScheme: imageryProvider.tilingScheme,
            tileWidth: imageryProvider.tileWidth,
            tileHeight: imageryProvider.tileHeight,
            minimumLevel: imageryProvider.minimumLevel,
            maximumLevel: imageryProvider.maximumLevel,
            rectangle: imageryProvider.rectangle,
            subdomains: (<any>imageryProvider)._subdomains
          }).toEqual({
            url: "https://{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png",
            attribution: "foo bar baz",
            tilingScheme: new WebMercatorTilingScheme(),
            tileWidth: 256,
            tileHeight: 256,
            minimumLevel: 0,
            maximumLevel: item.maximumLevel,
            subdomains: ["a"],
            rectangle: new Rectangle(
              0,
              -0.5235987755982988,
              0.5235987755982983,
              0.5235987755982988
            )
          });
        });
      });
    });
  });
});
