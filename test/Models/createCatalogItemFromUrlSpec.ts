import Terria from "../../lib/Models/Terria";
import createUrlReferenceFromUrl from "../../lib/Models/createUrlReferenceFromUrl";
import WebMapServiceCatalogGroup from "../../lib/Models/WebMapServiceCatalogGroup";
import GeoJsonCatalogItem from "../../lib/Models/GeoJsonCatalogItem";
import CatalogMemberFactory from "../../lib/Models/CatalogMemberFactory";
import { matchesExtension } from "../../lib/Models/registerCatalogMembers";
import UrlReference from "../../lib/Models/UrlReference";
import CsvCatalogItem from "../../lib/Models/CsvCatalogItem";
import ViewState from "../../lib/ReactViewModels/ViewState";
import createCatalogItemFromFileOrUrl from "../../lib/Models/createCatalogItemFromFileOrUrl";

describe("createUrlReferenceFromUrl", function() {
  let terria: Terria;
  let viewState: ViewState;

  beforeEach(function() {
    terria = new Terria();

    CatalogMemberFactory.register(
      WebMapServiceCatalogGroup.type,
      WebMapServiceCatalogGroup
    );
    CatalogMemberFactory.register(GeoJsonCatalogItem.type, GeoJsonCatalogItem);
    CatalogMemberFactory.register(CsvCatalogItem.type, CsvCatalogItem);
    CatalogMemberFactory.register(UrlReference.type, UrlReference);

    createUrlReferenceFromUrl.register(
      s => true,
      WebMapServiceCatalogGroup.type,
      true
    );

    createUrlReferenceFromUrl.register(
      matchesExtension("geojson"),
      GeoJsonCatalogItem.type
    );

    createUrlReferenceFromUrl.register(
      matchesExtension("csv"),
      CsvCatalogItem.type
    );
  });

  it("should create an item of the first registered type (WMSGroup)", function(done) {
    const url = "test/WMS/single_metadata_url.xml";
    createUrlReferenceFromUrl(url, terria, true).then(item => {
      expect(item).toBeDefined();

      if (item !== undefined) {
        expect(item instanceof UrlReference).toBe(true);
        expect(
          (<UrlReference>item).target instanceof WebMapServiceCatalogGroup
        ).toBe(true);
      }
      done();
    });
  });

  it("should create an item of the second registered type (GeoJSON)", function(done) {
    const url = "test/geoJSON/bike_racks.geojson";

    createUrlReferenceFromUrl(url, terria, true).then(item => {
      expect(item).toBeDefined();
      if (item !== undefined) {
        expect(item instanceof UrlReference).toBe(true);
        expect((<UrlReference>item).target instanceof GeoJsonCatalogItem).toBe(
          true
        );
      }
      done();
    });
  });

  it("should create an catalog item (CSVCatalogItem) from Url without specifying a dataType", function(done) {
    const url = "test/csv/lat_lon_val.csv";

    createCatalogItemFromFileOrUrl(terria, viewState, url).then(item => {
      expect(item).toBeDefined();
      if (item !== undefined) {
        expect(item instanceof CsvCatalogItem).toBe(true);
      }
      done();
    });
  });

  it("should create an catalog item (CSVCatalogItem) from File (csv) without specifying a dataType", function(done) {
    const fileUrl = "test/csv/lat_lon_val.csv";

    fetch(fileUrl)
      .then(res => res.blob())
      .then(blob => {
        let file: File = Object.assign(blob, {
          lastModified: 0,
          name: "lat_lon_val.csv"
        });
        createCatalogItemFromFileOrUrl(terria, viewState, file).then(item => {
          expect(item).toBeDefined();
          if (item !== undefined) {
            expect(item instanceof CsvCatalogItem).toBe(true);
          }
          done();
        });
      });
  });
});
