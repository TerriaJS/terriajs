import { runInAction } from "mobx";
import IonImageryProvider from "terriajs-cesium/Source/Scene/IonImageryProvider";
import { ImageryParts } from "../../../../lib/ModelMixins/MappableMixin";
import IonImageryCatalogItem from "../../../../lib/Models/Catalog/CatalogItems/IonImageryCatalogItem";
import Terria from "../../../../lib/Models/Terria";

describe("IonImageryCatalogItem", function () {
  const item = new IonImageryCatalogItem("test", new Terria());

  it("has a type", function () {
    expect(IonImageryCatalogItem.type).toBe("ion-imagery");
  });

  describe("the mapItem", function () {
    beforeEach(async function () {
      jasmine.Ajax.install();
      jasmine.Ajax.stubRequest(
        "https://example.com/v1/assets/12345/endpoint?access_token=fakeAccessToken"
      ).andReturn({
        responseText: JSON.stringify({
          type: "IMAGERY",
          url: "https://example.com",
          attributions: []
        })
      });

      const validSampleXmlString =
        '<TileMap version="1.0.0" tilemapservice="http://tms.osgeo.org/1.0.0">' +
        "    <Title>NE2_HR_LC_SR_W_DR_recolored.tif</Title>" +
        "   <Abstract></Abstract>" +
        "   <SRS>EPSG:4326</SRS>" +
        '   <BoundingBox miny="-90.00000000000000" minx="-180.00000000000000" maxy="90.00000000000000"' +
        '   maxx="180.00000000000000"/>' +
        '   <Origin y="-90.00000000000000" x="-180.00000000000000"/>' +
        '   <TileFormat width="256" height="256" mime-type="image/jpg" extension="jpg"/>' +
        '   <TileSets profile="geodetic">' +
        '       <TileSet href="0" units-per-pixel="0.70312500000000" order="0"/>' +
        '       <TileSet href="1" units-per-pixel="0.35156250000000" order="1"/>' +
        '       <TileSet href="2" units-per-pixel="0.17578125000000" order="2"/>' +
        "   </TileSets>" +
        "</TileMap>";

      jasmine.Ajax.stubRequest(
        "https://example.com/tilemapresource.xml"
      ).andReturn({
        responseText: validSampleXmlString,
        contentType: "text/xml"
      });

      runInAction(() => {
        item.setTrait("definition", "ionAssetId", 12345);
        item.setTrait("definition", "ionAccessToken", "fakeAccessToken");
        item.setTrait("definition", "ionServer", "https://example.com");
      });
      await item.loadMapItems();
    });

    afterEach(function () {
      jasmine.Ajax.uninstall();
    });

    it("correctly sets the `alpha` value", function () {
      if (!ImageryParts.is(item.mapItems[0]))
        throw new Error("Expected MapItem to be an ImageryParts");

      runInAction(() => item.setTrait("definition", "opacity", 0.42));
      expect(item.mapItems[0].alpha).toBe(0.42);
    });

    it("correctly sets `show`", function () {
      if (!ImageryParts.is(item.mapItems[0]))
        throw new Error("Expected MapItem to be an ImageryParts");

      runInAction(() => item.setTrait("definition", "show", false));
      expect(item.mapItems[0].show).toBe(false);
      runInAction(() => item.setTrait("definition", "show", true));
      expect(item.mapItems[0].show).toBe(true);
    });
  });

  describe("imageryProvider", function () {
    it("should be a UrlTemplateImageryProvider", function () {
      if (!ImageryParts.is(item.mapItems[0]))
        throw new Error("Expected MapItem to be an ImageryParts");
      const imageryProvider = item.mapItems[0].imageryProvider;
      expect(imageryProvider instanceof IonImageryProvider).toBeTruthy();
    });
  });
});
