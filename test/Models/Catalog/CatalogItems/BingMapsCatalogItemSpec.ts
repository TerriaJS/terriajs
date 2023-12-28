import { runInAction } from "mobx";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import BingMapsImageryProvider from "terriajs-cesium/Source/Scene/BingMapsImageryProvider";
import BingMapsStyle from "terriajs-cesium/Source/Scene/BingMapsStyle";
import { ImageryParts } from "../../../../lib/ModelMixins/MappableMixin";
import BingMapsCatalogItem from "../../../../lib/Models/Catalog/CatalogItems/BingMapsCatalogItem";
import Terria from "../../../../lib/Models/Terria";

describe("BingMapsCatalogItem", () => {
  let item: BingMapsCatalogItem;

  beforeEach(() => {
    item = new BingMapsCatalogItem("test", new Terria());
    runInAction(() => item.setTrait("definition", "key", "XXXXX"));
  });

  it("has a type", () => {
    expect(BingMapsCatalogItem.type).toBe("bing-maps");
  });

  describe("the mapItem", () => {
    it("correctly sets the `alpha` value", () => {
      if (!ImageryParts.is(item.mapItems[0]))
        throw new Error("Expected MapItem to be an ImageryParts");

      runInAction(() => item.setTrait("definition", "opacity", 0.42));
      expect(item.mapItems[0].alpha).toBe(0.42);
    });

    it("correctly sets `show`", () => {
      if (!ImageryParts.is(item.mapItems[0]))
        throw new Error("Expected MapItem to be an ImageryParts");

      runInAction(() => item.setTrait("definition", "show", false));
      expect(item.mapItems[0].show).toBe(false);
      runInAction(() => item.setTrait("definition", "show", true));
      expect(item.mapItems[0].show).toBe(true);
    });

    it("correctly sets `clippingRectangle`", function () {
      const rectangleDegrees = { west: 10, south: -15, east: 20, north: 20 };
      item.setTrait("definition", "rectangle", rectangleDegrees);
      if (!ImageryParts.is(item.mapItems[0]))
        throw new Error("Expected MapItem to be an ImageryParts");
      if (item.mapItems[0].clippingRectangle === undefined) {
        throw new Error("Expected clippingRectangle to be defined.");
      }

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
    });
  });

  describe("imageryProvider", () => {
    it("has the correct properties", () => {
      runInAction(() => {
        item.setTrait("definition", "mapStyle", BingMapsStyle.AERIAL);
        item.setTrait("definition", "culture", "fr");
      });

      if (!ImageryParts.is(item.mapItems[0]))
        throw new Error("Expected MapItem to be an ImageryParts");
      const imageryProvider = item.mapItems[0].imageryProvider;
      if (!(imageryProvider instanceof BingMapsImageryProvider))
        throw new Error(
          "Expected imageryProvider to be a BingMapsImageryProvider"
        );

      expect({
        mapStyle: imageryProvider.mapStyle,
        key: imageryProvider.key,
        culture: imageryProvider.culture
      }).toEqual({
        mapStyle: BingMapsStyle.AERIAL,
        key: "XXXXX",
        culture: "fr"
      });
    });
  });
});
