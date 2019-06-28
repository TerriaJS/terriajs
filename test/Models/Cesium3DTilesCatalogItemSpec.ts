import { reaction, runInAction } from "mobx";
import IonResource from "terriajs-cesium/Source/Core/IonResource";
import Cesium3DTileset from "terriajs-cesium/Source/Scene/Cesium3DTileset";
import ShadowMode from "terriajs-cesium/Source/Scene/ShadowMode";
import Cesium3DTilesCatalogItem from "../../lib/Models/Cesium3DTilesCatalogItem";
import createStratumInstance from "../../lib/Models/createStratumInstance";
import Terria from "../../lib/Models/Terria";
import { OptionsTraits } from "../../lib/Traits/Cesium3DCatalogItemTraits";

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
  });

  describe("after loading", function() {
    beforeEach(async function() {
      await item.loadMapItems();
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
            expect(item.mapItems[0].url).toBe((<any>item).resource);
          });

          it("sets `show`", function() {
            runInAction(() => item.setTrait("definition", "show", false));
            expect(item.mapItems[0].show).toBe(false);
          });

          it("sets the shadow mode", function() {
            runInAction(() => item.setTrait("definition", "shadows", "cast"));
            expect(item.mapItems[0].shadows).toBe(ShadowMode.CAST_ONLY);
          });

          it("sets the extra options", function() {
            runInAction(() => {
              let options = createStratumInstance(OptionsTraits);
              options.maximumScreenSpaceError = 3;
              item.setTrait("definition", "options", options);
            });
            expect(item.mapItems[0].maximumScreenSpaceError).toBe(3);
          });
        });
      });

      describe("when the tileset is destroyed", function() {
        it("returns a new tileset", function() {
          const dispose = reaction(() => item.mapItems, () => {});
          const tileset = item.mapItems[0];
          expect(tileset === item.mapItems[0]).toBeTruthy();
          tileset.destroy();
          expect(tileset === item.mapItems[0]).toBeFalsy();
          dispose();
        });
      });
    });
  });
});
