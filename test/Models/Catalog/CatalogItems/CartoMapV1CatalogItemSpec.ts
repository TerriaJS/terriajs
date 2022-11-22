import { configure, runInAction } from "mobx";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import UrlTemplateImageryProvider from "terriajs-cesium/Source/Scene/UrlTemplateImageryProvider";
import { ImageryParts } from "../../../../lib/ModelMixins/MappableMixin";
import CartoMapV1CatalogItem, {
  CartoLoadableStratum
} from "../../../../lib/Models/Catalog/CatalogItems/CartoMapV1CatalogItem";
import Terria from "../../../../lib/Models/Terria";

configure({
  enforceActions: "observed",
  computedRequiresReaction: true
});

describe("CartoMapV1CatalogItem", function () {
  let item: CartoMapV1CatalogItem;

  beforeEach(function () {
    item = new CartoMapV1CatalogItem("test", new Terria());
  });

  it("has a type", function () {
    expect(CartoMapV1CatalogItem.type).toBe("carto");
  });

  describe("when tileUrl has been set", function () {
    beforeEach(function () {
      const tileUrl = "abc";
      item.strata.set(
        CartoLoadableStratum.stratumName,
        new CartoLoadableStratum(item, tileUrl, [])
      );
    });

    it("should create an imageryProvider with correct properties", function () {
      const stratum = <CartoLoadableStratum>item.strata.get("cartoLoadable");

      expect(
        item.imageryProvider instanceof UrlTemplateImageryProvider
      ).toBeTruthy();

      runInAction(() => {
        item.setTrait("definition", "attribution", "foo bar baz");
      });

      const imageryProvider = item.imageryProvider;
      expect(imageryProvider).toBeDefined();
      if (imageryProvider !== undefined) {
        expect(imageryProvider.url).toEqual(<string>stratum.tileUrl);
        expect(imageryProvider.credit.html).toEqual(<string>item.attribution);
        expect(imageryProvider.minimumLevel).toEqual(0);
        expect(imageryProvider.maximumLevel).toEqual(25);
        expect((<any>imageryProvider)._subdomains).toEqual(
          stratum.tileSubdomains
        );
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
