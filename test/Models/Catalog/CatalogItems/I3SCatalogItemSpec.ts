import "../../../SpecMain";
import { reaction, runInAction } from "mobx";
import i18next from "i18next";
import Cesium3DTileColorBlendMode from "terriajs-cesium/Source/Scene/Cesium3DTileColorBlendMode";
import ShadowMode from "terriajs-cesium/Source/Scene/ShadowMode";
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
import I3SCatalogItem from "../../../../lib/Models/Catalog/CatalogItems/I3SCatalogItem";
import I3SDataProvider from "terriajs-cesium/Source/Scene/I3SDataProvider";
import Cesium3DTileset from "terriajs-cesium/Source/Scene/Cesium3DTileset";
import I3SLayer from "terriajs-cesium/Source/Scene/I3SLayer";
import Resource from "terriajs-cesium/Source/Core/Resource";

const mockLayerData = {
  href: "layers/0/",
  layerType: "3DObject",
  attributeStorageInfo: [],
  store: { rootNode: "mockRootNodeUrl", version: "1.6" },
  fullExtent: { xmin: 0, ymin: 1, xmax: 2, ymax: 3 },
  spatialReference: { wkid: 4326 },
  id: 0
};

const mockProviderData = {
  name: "mockProviderName",
  serviceVersion: "1.6",
  layers: [mockLayerData]
};

describe("I3SCatalogItemSpec", function () {
  let item: I3SCatalogItem;
  const testUrl = "/test/Cesium3DTiles/tileset.json";

  beforeAll(function () {
    spyOn(Resource.prototype, "fetchJson").and.callFake(function fetch() {
      return Promise.resolve(mockProviderData);
    });
    spyOn(Cesium3DTileset, "fromUrl").and.callFake(async () => {
      const tileset = new Cesium3DTileset({});
      /* @ts-expect-error Mock the root tile so that i3s property can be appended */
      tileset._root = {};
      return tileset;
    });
  });

  beforeEach(function () {
    item = new I3SCatalogItem("test", new Terria());
    runInAction(() => {
      item.setTrait("definition", "url", testUrl);
    });
  });

  it("should have a type and a typeName", function () {
    expect(I3SCatalogItem.type).toBe("I3S");
    expect(item.type).toBe("I3S");
    expect(item.typeName).toBe(i18next.t("core.dataType.i3s"));
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

  describe("after loading", function () {
    let dispose: () => void;
    beforeEach(async function () {
      try {
        await item.loadMapItems();
      } catch {
        /* eslint-disable-line no-empty */
      }
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
        it("should be a I3SDataProvider", function () {
          expect(item.mapItems[0] instanceof I3SDataProvider).toBeTruthy();
        });

        describe("the tileset", function () {
          it("sets `show`", function () {
            runInAction(() => item.setTrait("definition", "show", false));
            expect(item.mapItems[0].show).toBe(false);
          });

          it("sets the shadow mode", function () {
            runInAction(() => item.setTrait("definition", "shadows", "CAST"));
            const tileset = item.mapItems[0].layers[0].tileset;
            expect(tileset?.shadows).toBe(ShadowMode.CAST_ONLY);
          });

          it("sets the color blend mode", function () {
            runInAction(() => {
              item.setTrait("definition", "colorBlendMode", "REPLACE");
              const tileset = item.mapItems[0].layers[0].tileset;
              expect(tileset?.colorBlendMode).toBe(
                Cesium3DTileColorBlendMode.REPLACE
              );
            });
          });

          it("sets the color blend amount", function () {
            runInAction(() => {
              item.setTrait("user", "colorBlendAmount", 0.42);
              const tileset = item.mapItems[0].layers[0].tileset;
              expect(tileset?.colorBlendAmount).toBe(0.42);
            });
          });

          it("sets the shadow mode", function () {
            runInAction(() => item.setTrait("definition", "shadows", "CAST"));
            const tileset = item.mapItems[0].layers[0].tileset;
            expect(tileset?.shadows).toBe(ShadowMode.CAST_ONLY);
          });

          it("sets the style", function () {
            runInAction(() =>
              item.setTrait("definition", "style", {
                show: "${ZipCode} === '19341'"
              })
            );
            const tileset = item.mapItems[0].layers[0].tileset;
            expect(tileset?.style).toBe(item.cesiumTileStyle);
          });

          xit("sets the rootTransform to IDENTITY", function () {
            const tileset = item.mapItems[0].layers[0].tileset;
            expect(
              Matrix4.equals(tileset?.root.transform, Matrix4.IDENTITY)
            ).toBeTruthy();
          });

          xit("computes a new model matrix from the given transformations", async function () {
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
            const tileset = item.mapItems[0].layers[0].tileset;
            const modelMatrix = tileset!.modelMatrix;
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
});
