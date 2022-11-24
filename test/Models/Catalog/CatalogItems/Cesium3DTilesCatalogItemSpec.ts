import "../../../SpecMain";
import { reaction, runInAction } from "mobx";
import i18next from "i18next";
import Cartesian2 from "terriajs-cesium/Source/Core/Cartesian2";
import IonResource from "terriajs-cesium/Source/Core/IonResource";
import Cesium3DTileFeature from "terriajs-cesium/Source/Scene/Cesium3DTileFeature";
import Cesium3DTileset from "terriajs-cesium/Source/Scene/Cesium3DTileset";
import Cesium3DTileStyle from "terriajs-cesium/Source/Scene/Cesium3DTileStyle";
import Cesium3DTileColorBlendMode from "terriajs-cesium/Source/Scene/Cesium3DTileColorBlendMode";
import ShadowMode from "terriajs-cesium/Source/Scene/ShadowMode";
import Cesium3DTilesCatalogItem from "../../../../lib/Models/Catalog/CatalogItems/Cesium3DTilesCatalogItem";
import createStratumInstance from "../../../../lib/Models/Definition/createStratumInstance";
import Terria from "../../../../lib/Models/Terria";
import Matrix4 from "terriajs-cesium/Source/Core/Matrix4";
import HeadingPitchRollTraits from "../../../../lib/Traits/TraitsClasses/HeadingPitchRollTraits";
import LatLonHeightTraits from "../../../../lib/Traits/TraitsClasses/LatLonHeightTraits";
import CommonStrata from "../../../../lib/Models/Definition/CommonStrata";
import Quaternion from "terriajs-cesium/Source/Core/Quaternion";
import Matrix3 from "terriajs-cesium/Source/Core/Matrix3";
import HeadingPitchRoll from "terriajs-cesium/Source/Core/HeadingPitchRoll";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import {
  OptionsTraits,
  FilterTraits
} from "../../../../lib/Traits/TraitsClasses/Cesium3dTilesTraits";

describe("Cesium3DTilesCatalogItemSpec", function () {
  let item: Cesium3DTilesCatalogItem;
  const testUrl = "/test/Cesium3DTiles/tileset.json";

  beforeEach(function () {
    item = new Cesium3DTilesCatalogItem("test", new Terria());
    runInAction(() => {
      item.setTrait("definition", "url", testUrl);
    });
  });

  it("should have a type and a typeName", function () {
    expect(Cesium3DTilesCatalogItem.type).toBe("3d-tiles");
    expect(item.type).toBe("3d-tiles");
    expect(item.typeName).toBe(i18next.t("models.cesiumTerrain.name3D"));
  });

  it("supports zooming", function () {
    expect(item.disableZoomTo).toBeFalsy();
  });

  it("supports show info", function () {
    expect(item.disableAboutData).toBeFalsy();
  });

  it("is mappable", function () {
    expect(item.isMappable).toBeTruthy();
  });

  describe("showExpressionFromFilters", function () {
    it("correctly converts filters to show expression", function () {
      runInAction(() =>
        item.setTrait("definition", "filters", [
          createStratumLevelFilter(-2, 11, -1, 10)
        ])
      );
      let show: any = item.showExpressionFromFilters;
      expect(show).toBe(
        "Number(${feature['stratumlev']}) >= -1 && Number(${feature['stratumlev']}) <= 10"
      );
    });

    describe("when minimumShown and maximumShown are outside the value range", function () {
      it("should be undefined", function () {
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

  describe("cesiumTileStyle", function () {
    let style: any;
    beforeEach(async function () {
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

    it("is a Cesium3DTileStyle", function () {
      expect(style instanceof Cesium3DTileStyle).toBeTruthy();
    });

    it("creates the style correctly", function () {
      expect(style.show._expression).toBe("${Height} > 30");
      expect(style.color._expression).toBe("vec4(${Height})");
    });

    it("reflects changes to the catalog item's opacity in its style", async function () {
      item.setTrait("definition", "style", {
        color: "#ff0000"
      });

      item.setTrait("user", "opacity", 0.5);

      style = item.cesiumTileStyle;
      await item.loadMapItems();

      expect(style.color._expression).toBe("color('#ff0000', ${opacity})");
    });

    describe("when filters are specified", function () {
      it("adds the filters to the style", async function () {
        runInAction(() =>
          item.setTrait("definition", "filters", [
            createStratumLevelFilter(-2, 11, 5, 8)
          ])
        );

        style = item.cesiumTileStyle;
        await item.loadMapItems();

        expect(style.show._expression).toBe(item.showExpressionFromFilters);
      });
    });
  });

  describe("when loading", function () {
    describe("if ionAssetId is provided", function () {
      it("loads the IonResource", async function () {
        runInAction(() => {
          item.setTrait("definition", "ionAssetId", 4242);
          item.setTrait("definition", "ionAccessToken", "fakeToken");
          item.setTrait("definition", "ionServer", "fakeServer");
        });
        spyOn(IonResource, "fromAssetId").and.callThrough();
        try {
          await item.loadMapItems();
        } catch {}
        expect(IonResource.fromAssetId).toHaveBeenCalledWith(4242, {
          accessToken: "fakeToken",
          server: "fakeServer"
        });
      });
    });

    xit("sets the extra options", async function () {
      runInAction(() => {
        item.setTrait(
          "definition",
          "options",
          createStratumInstance(OptionsTraits, { maximumScreenSpaceError: 3 })
        );
      });
      try {
        await item.loadMapItems();
      } catch {}
      const tileset = item.mapItems[0] as Cesium3DTileset;
      expect(tileset.maximumScreenSpaceError).toBe(3);
    });
  });

  describe("after loading", function () {
    let dispose: () => void;
    beforeEach(async function () {
      try {
        await item.loadMapItems();
      } catch {}
      // observe mapItems
      dispose = reaction(
        () => item.mapItems,
        () => {}
      );
    });

    afterEach(function () {
      dispose();
    });

    describe("mapItems", function () {
      it("has exactly 1 mapItem", function () {
        expect(item.mapItems.length).toBe(1);
      });

      describe("the mapItem", function () {
        it("should be a Cesium3DTileset", function () {
          expect(item.mapItems[0] instanceof Cesium3DTileset).toBeTruthy();
        });

        describe("the tileset", function () {
          it("sets `show`", function () {
            runInAction(() => item.setTrait("definition", "show", false));
            expect(item.mapItems[0].show).toBe(false);
          });

          it("sets the shadow mode", function () {
            runInAction(() => item.setTrait("definition", "shadows", "CAST"));
            const tileset = item.mapItems[0] as Cesium3DTileset;
            expect(tileset.shadows).toBe(ShadowMode.CAST_ONLY);
          });

          it("sets the color blend mode", function () {
            runInAction(() => {
              item.setTrait("definition", "colorBlendMode", "REPLACE");
              const tileset = item.mapItems[0] as Cesium3DTileset;
              expect(tileset.colorBlendMode).toBe(
                Cesium3DTileColorBlendMode.REPLACE
              );
            });
          });

          it("sets the color blend amount", function () {
            runInAction(() => {
              item.setTrait("user", "colorBlendAmount", 0.42);
              const tileset = item.mapItems[0] as Cesium3DTileset;
              expect(tileset.colorBlendAmount).toBe(0.42);
            });
          });

          it("sets the shadow mode", function () {
            runInAction(() => item.setTrait("definition", "shadows", "CAST"));
            const tileset = item.mapItems[0] as Cesium3DTileset;
            expect(tileset.shadows).toBe(ShadowMode.CAST_ONLY);
          });

          it("sets the style", function () {
            runInAction(() =>
              item.setTrait("definition", "style", {
                show: "${ZipCode} === '19341'"
              })
            );
            const tileset = item.mapItems[0] as Cesium3DTileset;
            expect(tileset.style).toBe((<any>item).cesiumTileStyle);
          });

          // TODO: fix later
          // describe("when the item is reloaded after destroying the tileset", function() {
          //   it("generates a new tileset", async function() {
          //     const tileset = item.mapItems[0];
          //     await item.loadMapItems();
          //     expect(item.mapItems[0] === tileset).toBeTruthy();
          //     runInAction(() => {
          //       tileset.destroy();
          //     });
          //     await item.loadMapItems();
          //     expect(item.mapItems[0] === tileset).toBeFalsy();
          //   });
          // });

          it("sets the rootTransform to IDENTITY", function () {
            const tileset = item.mapItems[0] as Cesium3DTileset;
            expect(
              Matrix4.equals(tileset.root.transform, Matrix4.IDENTITY)
            ).toBeTruthy();
          });

          it("computes a new model matrix from the given transformations", async function () {
            item.setTrait(
              CommonStrata.user,
              "rotation",
              createStratumInstance(HeadingPitchRollTraits, {
                heading: 42,
                pitch: 42,
                roll: 42
              })
            );
            item.setTrait(
              CommonStrata.user,
              "origin",
              createStratumInstance(LatLonHeightTraits, {
                latitude: 10,
                longitude: 10
              })
            );
            item.setTrait(CommonStrata.user, "scale", 5);
            const tileset = item.mapItems[0] as Cesium3DTileset;
            const modelMatrix = tileset.modelMatrix;
            const rotation = HeadingPitchRoll.fromQuaternion(
              Quaternion.fromRotationMatrix(
                Matrix4.getMatrix3(modelMatrix, new Matrix3())
              )
            );
            expect(rotation.heading.toFixed(2)).toBe("-1.85");
            expect(rotation.pitch.toFixed(2)).toBe("0.89");
            expect(rotation.roll.toFixed(2)).toBe("2.40");

            const scale = Matrix4.getScale(modelMatrix, new Cartesian3());
            expect(scale.x.toFixed(2)).toEqual("5.00");
            expect(scale.y.toFixed(2)).toEqual("5.00");
            expect(scale.z.toFixed(2)).toEqual("5.00");

            const position = Matrix4.getTranslation(
              modelMatrix,
              new Cartesian3()
            );
            expect(position.x.toFixed(2)).toEqual("6186437.07");
            expect(position.y.toFixed(2)).toEqual("1090835.77");
            expect(position.z.toFixed(2)).toEqual("4081926.10");
          });
        });
      });
    });
  });

  it("correctly builds `Feature` from picked Cesium3DTileFeature", function () {
    const picked = new Cesium3DTileFeature();
    spyOn(picked, "getPropertyNames").and.returnValue([]);
    const feature = item.buildFeatureFromPickResult(Cartesian2.ZERO, picked);
    expect(feature).toBeDefined();
    if (feature) {
      expect(feature._cesium3DTileFeature).toBe(picked);
    }
  });

  it("can change the visibility of a feature", function () {
    const feature = new Cesium3DTileFeature();
    spyOn(feature, "getProperty").and.callFake((prop: string) => {
      const props: any = { doorNumber: 10, color: "red" };
      return props[prop];
    });
    item.setTrait(CommonStrata.user, "featureIdProperties", [
      "doorNumber",
      "color"
    ]);
    item.setFeatureVisibility(feature, false);
    // @ts-ignore
    expect(item.style.show.conditions).toEqual([
      ['${color} === "red" && ${doorNumber} === 10', false],
      ["true", true] // fallback rule
    ]);
  });
});

function createStratumLevelFilter(
  minimumValue: number,
  maximumValue: number,
  minimumValueShown: number,
  maximumValueShown: number
) {
  let filter = createStratumInstance(FilterTraits, {
    name: "Stratum Level",
    property: "stratumlev",
    minimumValue,
    maximumValue,
    minimumShown: minimumValueShown,
    maximumShown: maximumValueShown
  });
  return filter;
}
