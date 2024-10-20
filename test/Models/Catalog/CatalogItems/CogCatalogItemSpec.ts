import { reaction, when } from "mobx";
import { TIFFImageryProvider } from "terriajs-tiff-imagery-provider";
import { ImageryParts } from "../../../../lib/ModelMixins/MappableMixin";
import CogCatalogItem from "../../../../lib/Models/Catalog/CatalogItems/CogCatalogItem";
import CommonStrata from "../../../../lib/Models/Definition/CommonStrata";
import updateModelFromJson from "../../../../lib/Models/Definition/updateModelFromJson";
import Terria from "../../../../lib/Models/Terria";

const TEST_URLS = {
  "4326": "/test/cogs/4326.tif", // a 1x1 tif in native EPSG:4326 projection
  "32756": "/test/cogs/32756.tif" // a 1x1 tif in non-native 32756 projection
};

describe("CogCatalogItem", function () {
  let item: CogCatalogItem;

  beforeEach(function () {
    item = new CogCatalogItem("test", new Terria());
  });

  it("should have a type 'cog'", function () {
    expect(item.type).toEqual("cog");
  });

  it("can be instantiated", function () {
    expect(item).toBeDefined();
  });

  describe("mapItems", function () {
    // Test for each valid URL
    it(`should return a TIFFImageryProvider`, async function () {
      const testUrl = TEST_URLS["4326"];
      item.setTrait(CommonStrata.user, "url", testUrl);
      await item.loadMapItems();
      const mapItem = item.mapItems[0];
      expect(mapItem).toBeDefined();
      expect(ImageryParts.is(mapItem)).toBe(true);
      if (ImageryParts.is(mapItem)) {
        expect(mapItem.imageryProvider instanceof TIFFImageryProvider).toBe(
          true
        );
      }
    });
  });

  describe("TIFFImageryProvider initialization", function () {
    it("uses the correct url", async function () {
      const testUrl = TEST_URLS["4326"];
      item.setTrait(CommonStrata.user, "url", testUrl);

      const fromUrl = spyOn(TIFFImageryProvider, "fromUrl").and.callThrough();
      await item.loadMapItems();
      expect(item.mapItems[0]).toBeDefined();

      const [url] = fromUrl.calls.first().args;
      expect(url).toBe(testUrl);
    });

    it("correctly initializes the basic TIFFImageryProvider options", async function () {
      const testUrl = TEST_URLS["4326"];
      item.setTrait(CommonStrata.user, "url", testUrl);
      item.setTrait(CommonStrata.user, "credit", "Y");
      item.setTrait(CommonStrata.user, "tileSize", 1);
      item.setTrait(CommonStrata.user, "minimumLevel", 5);
      item.setTrait(CommonStrata.user, "maximumLevel", 10);
      item.setTrait(CommonStrata.user, "hasAlphaChannel", false);
      await item.loadMapItems();

      const imageryProvider = getImageryProvider(item);
      expect(imageryProvider).toBeDefined();
      expect(imageryProvider.credit.html).toBe("Y");
      expect(imageryProvider.tileSize).toBe(1);
      expect(imageryProvider.minimumLevel).toBe(5);
      expect(imageryProvider.maximumLevel).toBe(10);
      expect(imageryProvider.hasAlphaChannel).toBe(false);
    });

    describe("renderOptions", function () {
      it("is set correctly", async function () {
        const testUrl = TEST_URLS["4326"];
        item.setTrait(CommonStrata.user, "url", testUrl);
        updateModelFromJson(item.renderOptions, CommonStrata.user, {
          nodata: 42,
          convertToRGB: true,
          resampleMethod: "bilinear"
        });
        await item.loadMapItems();
        const renderOptions = getImageryProvider(item)?.renderOptions;
        expect(renderOptions).toBeDefined();

        expect(renderOptions.nodata).toBe(42);
        expect(renderOptions.convertToRGB).toBe(true);
        expect(renderOptions.resampleMethod).toBe("bilinear");
      });

      it("uses a default value of `bilinear` for `resampleMethod'", async function () {
        const testUrl = TEST_URLS["4326"];
        item.setTrait(CommonStrata.user, "url", testUrl);
        updateModelFromJson(item.renderOptions, CommonStrata.user, {});
        await item.loadMapItems();
        const renderOptions = getImageryProvider(item)?.renderOptions;
        expect(renderOptions).toBeDefined();
        expect(renderOptions.resampleMethod).toBe("nearest");
      });
    });
  });

  describe("reprojection", function () {
    it("reprojects non native projections", async function () {
      const testUrl = TEST_URLS["32756"];
      item.setTrait(CommonStrata.user, "url", testUrl);

      const mockReprojector = jasmine.createSpy();
      item.reprojector = () => mockReprojector;
      await item.loadMapItems();

      expect(mockReprojector.calls.count()).toBe(1);
      expect(mockReprojector.calls.first().args[0]).toBe(32756);
    });
  });

  describe("imageryProvider destruction", function () {
    it("destroys the imageryProvider when `mapItems` is no longer observed", async function () {
      const testUrl = TEST_URLS["4326"];
      item.setTrait(CommonStrata.user, "url", testUrl);
      const destroyReaction = reaction(
        () => item.mapItems,
        () => {},
        { fireImmediately: true }
      );
      await when(() => item.mapItems.length > 0);
      const imageryProvider = getImageryProvider(item);
      expect(imageryProvider).toBeDefined();
      const destroy = spyOn(imageryProvider, "destroy");

      destroyReaction();
      expect(destroy).toHaveBeenCalledTimes(1);
    });

    it("once destroyed, it re-creates imageryProvider if `mapItems` is observed again", async function () {
      const testUrl = TEST_URLS["4326"];
      item.setTrait(CommonStrata.user, "url", testUrl);
      const destroyReaction1 = reaction(
        () => item.mapItems,
        () => {},
        { fireImmediately: true }
      );
      await when(() => item.mapItems.length > 0);
      const imageryProvider1 = getImageryProvider(item);
      expect(imageryProvider1).toBeDefined();
      destroyReaction1();
      expect(item.mapItems.length).toBe(0);

      const destroyReaction2 = reaction(
        () => item.mapItems,
        () => {},
        { fireImmediately: true }
      );
      await when(() => item.mapItems.length > 0);
      const imageryProvider2 = getImageryProvider(item);
      expect(imageryProvider2).toBeDefined();
      destroyReaction2();
    });
  });
});

/**
 * Utility function to get the imagery provider from a CogCatalogItem.
 *
 * @param item The CogCatalogItem to get the imagery provider from.
 * @returns The TIFFImageryProvider if found, otherwise throws an error.
 */
function getImageryProvider(item: CogCatalogItem): TIFFImageryProvider {
  const mapItem = item.mapItems[0];
  if (
    ImageryParts.is(mapItem) &&
    mapItem.imageryProvider instanceof TIFFImageryProvider
  ) {
    return mapItem.imageryProvider;
  } else {
    throw new Error("Load failed");
  }
}
