import Terria from "../../lib/Models/Terria";
import createUrlReferenceFromUrl from "../../lib/Models/createUrlReferenceFromUrl";
import WebMapServiceCatalogGroup from "../../lib/Models/WebMapServiceCatalogGroup";
import GeoJsonCatalogItem from "../../lib/Models/GeoJsonCatalogItem";
import CatalogMemberFactory from "../../lib/Models/CatalogMemberFactory";
import { matchesExtension } from "../../lib/Models/registerCatalogMembers";
import UrlReference from "../../lib/Models/UrlReference";

describe("createUrlReferenceFromUrl", function() {
  let terria: Terria;

  beforeEach(function() {
    terria = new Terria();

    CatalogMemberFactory.register(
      WebMapServiceCatalogGroup.type,
      WebMapServiceCatalogGroup
    );
    CatalogMemberFactory.register(GeoJsonCatalogItem.type, GeoJsonCatalogItem);
    CatalogMemberFactory.register(UrlReference.type, UrlReference);

    createUrlReferenceFromUrl.register(
      s => true,
      WebMapServiceCatalogGroup.type,
      true
    );
    createUrlReferenceFromUrl.register(
      matchesExtension("geojson"),
      GeoJsonCatalogItem.type,
      true
    );
  });

  it("should create an item of the first registered type", function(done) {
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

  it("should create an item of the second registered type", function(done) {
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
});
