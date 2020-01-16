import { configure, runInAction } from "mobx";
import CartoMapCatalogItem from "../../lib/Models/CartoMapCatalogItem";
import Terria from "../../lib/Models/Terria";
import UrlTemplateImageryProvider from "terriajs-cesium/Source/Scene/UrlTemplateImageryProvider";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";

configure({
  enforceActions: "observed",
  computedRequiresReaction: true
});

describe("CartoMapCatalogItem", function() {
  let item: CartoMapCatalogItem;

  beforeEach(function() {
    item = new CartoMapCatalogItem("test", new Terria());
  });

  it("has a type", function() {
    expect(CartoMapCatalogItem.type).toBe("carto");
  });

  describe("when tileUrl has been set", function() {
    beforeEach(function() {
      runInAction(() => {
        item.setTrait("user", "tileUrl", "ABC");
      });
    });

    it("should create an imageryProvider with correct properties", function() {
      expect(
        item.imageryProvider instanceof UrlTemplateImageryProvider
      ).toBeTruthy();

      runInAction(() => {
        item.setTrait(
          "definition",
          "rectangle",
          item.traits["rectangle"].fromJson(item, "definition", {
            west: 10,
            south: -15,
            east: 20,
            north: 20
          })
        );
        item.setTrait("definition", "tileSubdomains", ["a", "b"]);
        item.setTrait("definition", "attribution", "foo bar baz");
      });

      const imageryProvider = item.imageryProvider;
      expect(imageryProvider).toBeDefined();
      if (imageryProvider !== undefined) {
        expect(imageryProvider.url).toEqual(<string>item.tileUrl);
        expect(imageryProvider.credit.html).toEqual(<string>item.attribution);
        expect(imageryProvider.minimumLevel).toEqual(item.minimumLevel);
        expect(imageryProvider.maximumLevel).toEqual(item.maximumLevel);
        expect((<any>imageryProvider)._subdomains).toEqual(item.tileSubdomains);
        const { west, south, east, north } = item.rectangle;
        let rectangle = Rectangle.fromDegrees(west, south, east, north);
        expect(imageryProvider.rectangle.west).toBeCloseTo(rectangle.west);
        expect(imageryProvider.rectangle.south).toBeCloseTo(rectangle.south);
        expect(imageryProvider.rectangle.east).toBeCloseTo(rectangle.east);
        expect(imageryProvider.rectangle.north).toBeCloseTo(rectangle.north);
      }
    });

    describe("mapItem", function() {
      it("has the correct `alpha` value", function() {
        runInAction(() => item.setTrait("definition", "opacity", 0.42));
        expect(item.mapItems[0].alpha).toBe(0.42);
        runInAction(() => item.setTrait("definition", "opacity", 0.9));
        expect(item.mapItems[0].alpha).toBe(0.9);
      });

      it("has the correct `show` value", function() {
        runInAction(() => item.setTrait("definition", "show", false));
        expect(item.mapItems[0].show).toBe(false);
        runInAction(() => item.setTrait("definition", "show", true));
        expect(item.mapItems[0].show).toBe(true);
      });
    });
  });
});
