import { reaction, runInAction } from "mobx";
import IonResource from "terriajs-cesium/Source/Core/IonResource";
import Cesium3DTileset from "terriajs-cesium/Source/Scene/Cesium3DTileset";
import Cesium3DTileStyle from "terriajs-cesium/Source/Scene/Cesium3DTileStyle";
import ShadowMode from "terriajs-cesium/Source/Scene/ShadowMode";
import Cesium3DTilesCatalogItem from "../../lib/Models/Cesium3DTilesCatalogItem";
import createStratumInstance from "../../lib/Models/createStratumInstance";
import Terria from "../../lib/Models/Terria";
import {
  OptionsTraits,
  FilterTraits
} from "../../lib/Traits/Cesium3DCatalogItemTraits";

describe("Cesium3DTilesCatalogItemSpec", function() {
  let item: Cesium3DTilesCatalogItem;
  const testUrl = "http://nosuchhost";

  beforeEach(function() {
    item = new Cesium3DTilesCatalogItem("test", new Terria());
    runInAction(() => {
      item.setTrait("definition", "url", testUrl);
    });
  });

  it("should have a type and a typeName", function() {
    expect(Cesium3DTilesCatalogItem.type).toBe("3d-tiles");
    expect(item.type).toBe("3d-tiles");
    expect(item.typeName).toBe("Cesium 3D Tiles");
  });

  it("supports zooming", function() {
    expect(item.canZoomTo).toBeTruthy();
  });

  it("supports show info", function() {
    expect(item.showsInfo).toBeTruthy();
  });

  it("is mappable", function() {
    expect(item.isMappable).toBeTruthy();
  });

  describe("showExpressionFromFilters", function() {
    it("correctly converts filters to show expression", function() {
      runInAction(() =>
        item.setTrait("definition", "filters", [
          createStratumLevelFilter(-2, 11, -1, 10)
        ])
      );
      let show: any = item.showExpressionFromFilters;
      expect(show).toBe(
        "${feature['stratumlev']} >= -1 && ${feature['stratumlev']} <= 10"
      );
    });

    describe("when minimumShown and maximumShown are outside the value range", function() {
      it("should be undefined", function() {
        runInAction(() =>
          item.setTrait("definition", "filters", [
            createStratumLevelFilter(-2, 11, -2, 11)
          ])
        );
        let show: any = item.showExpressionFromFilters;
        expect(show).toBeUndefined();
      });
    });
  });

  describe("cesiumTileStyle", function() {
    let style: any;
    beforeEach(function() {
      runInAction(() =>
        item.setTrait("definition", "style", {
          color: "vec4(${Height})",
          show: "${Height} > 30",
          meta: {
            description: '"Building id ${id} has height ${Height}."'
          }
        })
      );

      style = item.cesiumTileStyle;
    });

    it("is a Cesium3DTileStyle", function() {
      expect(style instanceof Cesium3DTileStyle).toBeTruthy();
    });

    it("creates the style correctly", function() {
      expect(style.show._expression).toBe("${Height} > 30");
      expect(style.color._expression).toBe("vec4(${Height})");
    });

    describe("when filters are specified", function() {
      it("adds the filters to the style", function() {
        runInAction(() =>
          item.setTrait("definition", "filters", [
            createStratumLevelFilter(-2, 11, 5, 8)
          ])
        );
        style = item.cesiumTileStyle;
        expect(style.show._expression).toBe(item.showExpressionFromFilters);
      });
    });
  });

  describe("when loading", function() {
    describe("if ionAssetId is provided", function() {
      it("loads the IonResource", async function() {
        runInAction(() => {
          item.setTrait("definition", "ionAssetId", 4242);
          item.setTrait("definition", "ionAccessToken", "fakeToken");
          item.setTrait("definition", "ionServer", "fakeServer");
        });
        spyOn(IonResource, "fromAssetId").and.callThrough();
        await item.loadMapItems();
        expect(IonResource.fromAssetId).toHaveBeenCalledWith(4242, {
          accessToken: "fakeToken",
          server: "fakeServer"
        });
      });
    });

    it("sets the extra options", async function() {
      runInAction(() => {
        let options = createStratumInstance(OptionsTraits);
        options.maximumScreenSpaceError = 3;
        item.setTrait("definition", "options", options);
      });
      await item.loadMapItems();
      expect(item.mapItems[0].maximumScreenSpaceError).toBe(3);
    });
  });

  describe("after loading", function() {
    let dispose: () => void;
    beforeEach(async function() {
      await item.loadMapItems();
      // observe mapItems
      dispose = reaction(() => item.mapItems, () => {});
    });

    afterEach(function() {
      dispose();
    });

    describe("mapItems", function() {
      it("has exactly 1 mapItem", function() {
        expect(item.mapItems.length).toBe(1);
      });

      describe("the mapItem", function() {
        it("should be a Cesium3DTileset", function() {
          expect(item.mapItems[0] instanceof Cesium3DTileset).toBeTruthy();
        });

        describe("the tileset", function() {
          it("has the correct url", function() {
            expect(item.mapItems[0].url).toBe((<any>item).url);
          });

          it("sets `show`", function() {
            runInAction(() => item.setTrait("definition", "show", false));
            expect(item.mapItems[0].show).toBe(false);
          });

          it("sets the shadow mode", function() {
            runInAction(() => item.setTrait("definition", "shadows", "cast"));
            expect(item.mapItems[0].shadows).toBe(ShadowMode.CAST_ONLY);
          });

          it("sets the style", function() {
            runInAction(() =>
              item.setTrait("definition", "style", {
                show: "${ZipCode} === '19341'"
              })
            );
            expect(item.mapItems[0].style).toBe((<any>item).cesiumTileStyle);
          });
        });
      });
    });
  });
});

function createStratumLevelFilter(
  minimumValue: number,
  maximumValue: number,
  minimumValueShown: number,
  maximumValueShown: number
) {
  let filter = createStratumInstance(FilterTraits);
  runInAction(() => {
    filter.name = "Stratum Level";
    filter.property = "stratumlev";
    filter.minimumValue = minimumValue;
    filter.maximumValue = maximumValue;
    filter.minimumShown = minimumValueShown;
    filter.maximumShown = maximumValueShown;
  });
  return filter;
}
