import i18next from "i18next";
import DataSource from "terriajs-cesium/Source/DataSources/DataSource";
import loadText from "../../../../lib/Core/loadText";
import CommonStrata from "../../../../lib/Models/Definition/CommonStrata";
import GpxCatalogItem from "../../../../lib/Models/Catalog/CatalogItems/GpxCatalogItem";
import Terria from "../../../../lib/Models/Terria";

describe("GpxCatalogItem", function() {
  let terria;
  let item: GpxCatalogItem;

  beforeEach(function() {
    terria = new Terria();
    item = new GpxCatalogItem("test", terria);
  });

  it("has type and type name", function() {
    expect(item.type).toBe("gpx");
    expect(item.typeName).toBe(i18next.t("models.gpx.name"));
  });

  it("supports zooming to extent", function() {
    expect(item.disableZoomTo).toBeFalsy();
  });

  it("supports show info", function() {
    expect(item.disableAboutData).toBeFalsy();
  });

  it("can load a GPX file by URL", function(done) {
    item.setTrait(CommonStrata.definition, "url", "test/gpx/example.gpx");
    item
      .loadMapItems()
      .then(function() {
        expect(item.mapItems.length).toEqual(1);
        const mapItem = item.mapItems[0];
        const entities = (<DataSource>mapItem).entities.values;
        expect(entities.length).toEqual(2);
      })
      .then(done);
  });

  it("can load a GPX file by string", function(done) {
    loadText("test/gpx/example.gpx").then(function(s: string) {
      item.setTrait(CommonStrata.definition, "gpxString", s);
      item
        .loadMapItems()
        .then(function() {
          expect(item.mapItems.length).toEqual(1);

          const mapItem = item.mapItems[0];
          const entities = (<DataSource>mapItem).entities.values;
          expect(entities.length).toEqual(2);
        })
        .then(done);
    });
  });
});
