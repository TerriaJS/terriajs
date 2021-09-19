import { action } from "mobx";
import MapboxVectorTileImageryProvider from "../../../../lib/Map/MapboxVectorTileImageryProvider";
import { ImageryParts } from "../../../../lib/ModelMixins/MappableMixin";
import CommonStrata from "../../../../lib/Models/Definition/CommonStrata";
import MapboxVectorTileCatalogItem from "../../../../lib/Models/Catalog/CatalogItems/MapboxVectorTileCatalogItem";
import Terria from "../../../../lib/Models/Terria";

describe("MapboxVectorTileCatalogItem", function() {
  let mvt: MapboxVectorTileCatalogItem;

  beforeEach(function() {
    mvt = new MapboxVectorTileCatalogItem("test", new Terria());
  });

  it("has a type", function() {
    expect(MapboxVectorTileCatalogItem.type).toBe("mvt");
    expect(mvt.type).toBe("mvt");
  });

  describe("imageryProvider", function() {
    let imageryProvider: MapboxVectorTileImageryProvider;

    beforeEach(async function() {
      mvt.setTrait(CommonStrata.user, "url", "http://test");
      mvt.setTrait(CommonStrata.user, "layer", "test-layer");
      await mvt.loadMapItems();
      if (!ImageryParts.is(mvt.mapItems[0]))
        throw new Error("Expected MapItem to be an ImageryParts");

      imageryProvider = mvt.mapItems[0]
        .imageryProvider as MapboxVectorTileImageryProvider;
    });

    it("is an instance of MapboxVectorTileImageryProvider", function() {
      expect(
        imageryProvider instanceof MapboxVectorTileImageryProvider
      ).toBeTruthy();
    });

    it("has the correct url", function() {
      expect(imageryProvider.url).toBe("http://test");
    });
  });

  describe("legends", function() {
    it(
      "constructs a default legend from the definition",
      action(async function() {
        mvt.setTrait(CommonStrata.user, "fillColor", "red");
        mvt.setTrait(CommonStrata.user, "lineColor", "yellow");
        mvt.setTrait(CommonStrata.user, "name", "Test");
        await mvt.loadMapItems();
        const legendItem = mvt.legends[0].items[0];
        expect(legendItem.color).toBe("red");
        expect(legendItem.outlineColor).toBe("yellow");
        expect(legendItem.title).toBe("Test");
      })
    );
  });
});
