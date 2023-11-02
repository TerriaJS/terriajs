import { configure, runInAction } from "mobx";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import UrlTemplateImageryProvider from "terriajs-cesium/Source/Scene/UrlTemplateImageryProvider";
import { ImageryParts } from "../../../../lib/ModelMixins/MappableMixin";
import Terria from "../../../../lib/Models/Terria";
import UrlTemplateImageryCatalogItem from "../../../../lib/Models/Catalog/CatalogItems/UrlTemplateImageryCatalogItem";

configure({
  enforceActions: "observed",
  computedRequiresReaction: true
});

describe("UrlTemplateImageryCatalogItem", function () {
  let item: UrlTemplateImageryCatalogItem;

  beforeEach(function () {
    item = new UrlTemplateImageryCatalogItem("test", new Terria());
    runInAction(() => item.setTrait("definition", "url", "some-url"));
  });

  it("has a type", function () {
    expect(UrlTemplateImageryCatalogItem.type).toBe(
      UrlTemplateImageryCatalogItem.type
    );
  });

  describe("when url has been set", function () {
    it("should create an imageryProvider with correct properties", function () {
      expect(
        item.imageryProvider instanceof UrlTemplateImageryProvider
      ).toBeTruthy();

      runInAction(() => {
        item.setTrait("definition", "attribution", "foo bar baz");
        item.setTrait("definition", "maximumLevel", 5);
        item.setTrait("definition", "minimumLevel", 1);
        item.setTrait("definition", "tileHeight", 200);
        item.setTrait("definition", "tileWidth", 200);
        item.setTrait(
          "definition",
          "pickFeaturesUrl",
          "some-feature-picking-url"
        );
        item.setTrait("definition", "allowFeaturePicking", false);
      });

      const imageryProvider = item.imageryProvider;
      expect(imageryProvider).toBeDefined();
      if (imageryProvider !== undefined) {
        expect(imageryProvider.url).toEqual(item.url ?? "");
        expect(imageryProvider.credit.html).toEqual(<string>item.attribution);
        expect(imageryProvider.minimumLevel).toEqual(
          item.minimumLevel ?? Infinity
        );
        expect(imageryProvider.maximumLevel).toEqual(
          item.maximumLevel ?? Infinity
        );
        expect(imageryProvider.tileHeight).toEqual(item.tileHeight ?? Infinity);
        expect(imageryProvider.tileWidth).toEqual(item.tileWidth ?? Infinity);
        expect(imageryProvider.pickFeaturesUrl).toEqual(
          item.pickFeaturesUrl ?? ""
        );
        expect(imageryProvider.enablePickFeatures).toEqual(
          item.allowFeaturePicking
        );
        expect((<any>imageryProvider)._subdomains).toEqual(item.subdomains);
      }
    });

    describe("mapItem", function () {
      it("has the correct `alpha` value", function () {
        if (!ImageryParts.is(item.mapItems[0]))
          throw new Error("Expected MapItem to be an ImageryParts");
        runInAction(() => item.setTrait("definition", "opacity", 0.42));
        expect(item.mapItems[0].alpha).toBe(0.42);
        runInAction(() => item.setTrait("definition", "opacity", 0.9));
        expect(item.mapItems[0].alpha).toBe(0.9);
      });

      it("has the correct `show` value", function () {
        if (!ImageryParts.is(item.mapItems[0]))
          throw new Error("Expected MapItem to be an ImageryParts");
        runInAction(() => item.setTrait("definition", "show", false));
        expect(item.mapItems[0].show).toBe(false);
        runInAction(() => item.setTrait("definition", "show", true));
        expect(item.mapItems[0].show).toBe(true);
      });

      it("has the correct `clippingRectangle` value", function () {
        const rectangleDegrees = {
          west: 10,
          south: -15,
          east: 20,
          north: 20
        };
        item.setTrait("definition", "rectangle", rectangleDegrees);
        if (!ImageryParts.is(item.mapItems[0]))
          throw new Error("Expected MapItem to be an ImageryParts");
        expect(item.mapItems[0].clippingRectangle).toBeDefined();

        if (item.mapItems[0].clippingRectangle !== undefined) {
          const rectangleRadians = Rectangle.fromDegrees(
            rectangleDegrees.west,
            rectangleDegrees.south,
            rectangleDegrees.east,
            rectangleDegrees.north
          );
          expect(item.mapItems[0].clippingRectangle.west).toBeCloseTo(
            rectangleRadians.west
          );
          expect(item.mapItems[0].clippingRectangle.south).toBeCloseTo(
            rectangleRadians.south
          );
          expect(item.mapItems[0].clippingRectangle.east).toBeCloseTo(
            rectangleRadians.east
          );
          expect(item.mapItems[0].clippingRectangle.north).toBeCloseTo(
            rectangleRadians.north
          );
        }
        runInAction(() =>
          item.setTrait("definition", "clipToRectangle", false)
        );
        expect(item.mapItems[0].clippingRectangle).toBe(undefined);
      });
    });
  });
});
