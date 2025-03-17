import { runInAction } from "mobx";
import { USER_ADDED_CATEGORY_ID } from "../../../lib/Core/addedByUser";
import isDefined from "../../../lib/Core/isDefined";
import loadBlob from "../../../lib/Core/loadBlob";
import CsvCatalogItem from "../../../lib/Models/Catalog/CatalogItems/CsvCatalogItem";
import GeoJsonCatalogItem from "../../../lib/Models/Catalog/CatalogItems/GeoJsonCatalogItem";
import createUrlReferenceFromUrl from "../../../lib/Models/Catalog/CatalogReferences/createUrlReferenceFromUrl";
import UrlReference from "../../../lib/Models/Catalog/CatalogReferences/UrlReference";
import createCatalogItemFromFileOrUrl from "../../../lib/Models/Catalog/createCatalogItemFromFileOrUrl";
import ArcGisFeatureServerCatalogItem from "../../../lib/Models/Catalog/Esri/ArcGisFeatureServerCatalogItem";
import WebMapServiceCatalogGroup from "../../../lib/Models/Catalog/Ows/WebMapServiceCatalogGroup";
import CommonStrata from "../../../lib/Models/Definition/CommonStrata";
import Terria from "../../../lib/Models/Terria";

import waterNetworkLayer from "../../../wwwroot/test/ArcGisFeatureServer/Water_Network/layer.json";
import waterNetworkLayer2 from "../../../wwwroot/test/ArcGisFeatureServer/Water_Network/2.json";

describe("createUrlReferenceFromUrl", function () {
  let terria: Terria;

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });
  });

  it("should create an item of the first registered type (WMSGroup)", async function () {
    const url = "test/WMS/single_metadata_url.xml";
    const item = await createUrlReferenceFromUrl(url, terria, true);
    expect(item).toBeDefined();

    if (item !== undefined) {
      expect(item instanceof UrlReference).toBe(true);
      if (item instanceof UrlReference) {
        expect(item.target instanceof WebMapServiceCatalogGroup).toBe(true);
      }
    }
  });

  it("should create an item of the second registered type (GeoJSON)", async function () {
    const url = "test/geoJSON/bike_racks.geojson";

    const item = await createUrlReferenceFromUrl(url, terria, true);
    expect(item).toBeDefined();
    if (item !== undefined) {
      expect(item instanceof UrlReference).toBe(true);
      if (item instanceof UrlReference) {
        expect(item.target instanceof GeoJsonCatalogItem).toBe(true);
      }
    }
  });

  it("should create an catalog item (CSVCatalogItem) from Url without specifying a dataType", async function () {
    const url = "test/csv/lat_lon_val.csv";

    const item = await createCatalogItemFromFileOrUrl(terria, url);
    expect(item).toBeDefined();
    if (item !== undefined) {
      expect(item instanceof CsvCatalogItem).toBe(true);
    }
  });

  it("should create an catalog item (CSVCatalogItem) from File (csv) without specifying a dataType", async function () {
    const fileUrl = "test/csv/lat_lon_val.csv";

    const blob = await loadBlob(fileUrl);
    const file: File = Object.assign(blob, {
      lastModified: 0,
      name: "lat_lon_val.csv"
    }) as File;
    const item = await createCatalogItemFromFileOrUrl(terria, file);
    expect(item).toBeDefined();
    if (item !== undefined) {
      expect(item instanceof CsvCatalogItem).toBe(true);
    }
  });

  it("should create an item that has the USER_ADDED_CATEGORY_ID in its knownContainerUniqueIds", async function () {
    const url = "test/csv/lat_lon_val.csv";
    const item = await createUrlReferenceFromUrl(url, terria, true);
    expect(item).toBeDefined();
    if (item !== undefined) {
      expect(item.knownContainerUniqueIds.includes(USER_ADDED_CATEGORY_ID));
    }
  });

  describe("with a FeatureServer URL", function () {
    const featureServerUrl =
      "http://example.com/arcgis/rest/services/Water_Network/FeatureServer/2";

    let reference: UrlReference;
    beforeEach(async function () {
      jasmine.Ajax.install();
      // Fail all requests by default.
      jasmine.Ajax.stubRequest(/.*/).andError({});
      jasmine.Ajax.stubRequest(
        /http:\/\/example.com\/arcgis\/rest\/services\/Water_Network\/FeatureServer\/[0-9]+\/query\?f=json.*$/i
      ).andReturn({ responseJSON: waterNetworkLayer });
      jasmine.Ajax.stubRequest(
        /http:\/\/example.com\/arcgis\/rest\/services\/Water_Network\/FeatureServer\/2\/?\?.*/i
      ).andReturn({ responseJSON: waterNetworkLayer2 });

      const tempReference = await createUrlReferenceFromUrl(
        featureServerUrl,
        terria,
        true
      );
      if (!isDefined(tempReference)) {
        // Fail all following tests relying on reference
        throw new Error("Didn't successfully create a UrlReference");
      }
      reference = tempReference;
    });

    afterEach(function () {
      jasmine.Ajax.uninstall();
    });

    it("has a name and url on the reference", function () {
      expect(reference.name).toBe(featureServerUrl);
      expect(reference.url).toBe(featureServerUrl);
    });

    it("resolves to an ArcGisFeatureServerCatalogItem which can load map items", async function () {
      expect(reference.target).toBeDefined();
      if (isDefined(reference.target)) {
        expect(
          reference.target instanceof ArcGisFeatureServerCatalogItem
        ).toBeTruthy();
        if (reference.target instanceof ArcGisFeatureServerCatalogItem) {
          runInAction(() => {
            reference.target?.setTrait(
              CommonStrata.definition,
              "maxFeatures",
              20
            );
          });
          (await reference.target.loadMapItems()).logError();
          expect(reference.target.mapItems.length).toBe(1);
        }
      }
    });
  });
});
