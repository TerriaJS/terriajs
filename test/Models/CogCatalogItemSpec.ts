import { action } from "mobx";
import Terria from "../../lib/Models/Terria";
import CogCatalogItem, {
  CogImageryProvider
} from "../../lib/Models/Catalog/CatalogItems/CogCatalogItem";
import CommonStrata from "../../lib/Models/Definition/CommonStrata";
import { ImageryParts } from "../../lib/ModelMixins/MappableMixin";

const TEST_URLS = [
  "https://sentinel-cogs.s3.us-west-2.amazonaws.com/sentinel-s2-l2a-cogs/52/J/FS/2023/5/S2A_52JFS_20230501_0_L2A/TCI.tif",
  "https://oin-hotosm.s3.amazonaws.com/5b17d8822b6a08001185f75f/0/5b17d8822b6a08001185f760.tif",
  "https://prd-tnm.s3.amazonaws.com/StagedProducts/Elevation/13/TIFF/current/n32w100/USGS_13_n32w100.tif"
];

/**
 * Checks if a given URL returns a 200 status. This is used to determine which URLs are valid for testing, in case any are taken down in the future.
 * Tests fail if no URLS found to be valid, and pass if at least one can be used to run successful tests.
 *
 * @param url The URL to check.
 * @returns A promise that resolves to true if the URL returns a 200 status, otherwise false.
 */
async function urlExists(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok;
  } catch (error) {
    return false;
  }
}

describe("CogCatalogItem", function () {
  let terria: Terria;
  let validUrls: string[] = [];

  beforeAll(async function () {
    terria = new Terria();

    // Check which URLs are valid
    const results = await Promise.all(TEST_URLS.map(urlExists));
    validUrls = TEST_URLS.filter((url, index) => results[index]);

    // Fail the tests if no valid URLs are found
    if (validUrls.length === 0) {
      throw new Error("No valid test URLs found.");
    }
  });

  it("should have a type 'cog'", function () {
    const cogItem = new CogCatalogItem("test", terria);
    expect(cogItem.type).toEqual("cog");
  });

  it("can be instantiated", function () {
    const cogItem = new CogCatalogItem("test", terria);
    expect(cogItem).toBeDefined();
  });

  describe("mapItems", function () {
    // Test for each valid URL
    validUrls.forEach((url) => {
      it(
        `should return a CogImageryProvider for URL: ${url}`,
        action(async function () {
          const cogItem = new CogCatalogItem("test", terria);
          cogItem.setTrait(CommonStrata.user, "url", url);
          await cogItem.loadMapItems();
          const mapItem = cogItem.mapItems[0];
          expect(ImageryParts.is(mapItem)).toBe(true);
          if (ImageryParts.is(mapItem)) {
            expect(mapItem.imageryProvider instanceof CogImageryProvider).toBe(
              true
            );
          }
        })
      );
    });
  });

  describe("the constructed CogImageryProvider", function () {
    let item: CogCatalogItem;

    beforeEach(function () {
      item = new CogCatalogItem("test", terria);
    });

    // Test each valid URL for various properties and functions
    validUrls.forEach((url) => {
      it(`should set the URL from traits for URL: ${url}`, function () {
        item.setTrait(CommonStrata.user, "url", url);
        const imageryProvider = getImageryProvider(item);
        expect((imageryProvider as any).options.url.startsWith(url)).toBe(true);
      });

      it(`should set the nodata value from renderOptions for URL: ${url}`, function () {
        item.setTrait(CommonStrata.user, "url", url);
        const imageryProvider = getImageryProvider(item);
        expect((imageryProvider as any).options.renderOptions.nodata).toBe(0);
      });

      it(`should enable feature picking if allowFeaturePicking is true for URL: ${url}`, function () {
        item.setTrait(CommonStrata.user, "allowFeaturePicking", true);
        item.setTrait(CommonStrata.user, "url", url);
        const imageryProvider = getImageryProvider(item);
        expect((imageryProvider as any).options.enablePickFeatures).toBe(true);
      });

      it(`should set the correct projection function for URL: ${url}`, function () {
        item.setTrait(CommonStrata.user, "url", url);
        const imageryProvider = getImageryProvider(item);
        const projFunc = (imageryProvider as any).options.projFunc(32752);
        expect(projFunc).toBeDefined();
        expect(typeof projFunc.project).toBe("function");
        expect(typeof projFunc.unproject).toBe("function");
      });

      it(`should return undefined projFunc for native projections for URL: ${url}`, function () {
        item.setTrait(CommonStrata.user, "url", url);
        const imageryProvider = getImageryProvider(item);
        const projFunc = (imageryProvider as any).options.projFunc(4326);
        expect(projFunc).toBeUndefined();
      });

      it(`should return an empty array when imageryProvider is not defined for URL: ${url}`, function () {
        item.setTrait(CommonStrata.user, "url", url);
        expect(item.mapItems).toEqual([]);
      });
    });
  });
});

/**
 * Utility function to get the imagery provider from a CogCatalogItem.
 *
 * @param item The CogCatalogItem to get the imagery provider from.
 * @returns The CogImageryProvider if found, otherwise throws an error.
 */
function getImageryProvider(item: CogCatalogItem): CogImageryProvider {
  const mapItem = item.mapItems[0];
  if (
    ImageryParts.is(mapItem) &&
    mapItem.imageryProvider instanceof CogImageryProvider
  ) {
    return mapItem.imageryProvider;
  } else {
    throw new Error("Load failed");
  }
}
