import TileMapServiceImageryProvider from "terriajs-cesium/Source/Scene/TileMapServiceImageryProvider";
import TileMapServiceCatalogItem from "../../../../lib/Models/Catalog/CatalogItems/TileMapServiceCatalogItem";
import CommonStrata from "../../../../lib/Models/Definition/CommonStrata";
import Terria from "../../../../lib/Models/Terria";
import { ImageryParts } from "../../../../lib/ModelMixins/MappableMixin";
import updateModelFromJson from "../../../../lib/Models/Definition/updateModelFromJson";

describe("TileMapServiceCatalogItem", function () {
  let item: TileMapServiceCatalogItem;

  beforeEach(function () {
    item = new TileMapServiceCatalogItem("test", new Terria());
    item.setTrait(CommonStrata.user, "url", "test/TMS");
  });

  it("can be loaded", async function () {
    await item.loadMapItems();
  });

  describe("when loaded", function () {
    it("returns the imageryProvider as mapItems", async function () {
      await item.loadMapItems();
      expect(
        (item.mapItems[0] as any).imageryProvider instanceof
          TileMapServiceImageryProvider
      ).toBe(true);
    });

    it("correctly sets the imagerProvider options", async function () {
      item.setTrait(CommonStrata.user, "minimumLevel", 1);
      item.setTrait(CommonStrata.user, "maximumLevel", 9);
      item.setTrait(CommonStrata.user, "attribution", "foo");
      await item.loadMapItems();
      const imageryProvider = (item.mapItems[0] as any)
        .imageryProvider as TileMapServiceImageryProvider;

      expect(imageryProvider.minimumLevel).toBe(1);
      expect(imageryProvider.maximumLevel).toBe(9);
      expect(imageryProvider.credit.html).toBe("foo");
    });

    it("correctly sets the imageryParts options", async function () {
      updateModelFromJson(item, CommonStrata.user, {
        show: false,
        opacity: 0.5,
        rectangle: {
          west: 80,
          north: 0,
          south: -10,
          east: 82
        }
      });
      await item.loadMapItems();
      const imageryParts = item.mapItems[0] as ImageryParts;

      expect(imageryParts.show).toBe(false);
      expect(imageryParts.alpha).toBe(0.5);
      expect(imageryParts.clippingRectangle).toBeDefined();
    });
  });
});
