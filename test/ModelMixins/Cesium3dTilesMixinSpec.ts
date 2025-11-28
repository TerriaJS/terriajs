import { runInAction } from "mobx";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Color from "terriajs-cesium/Source/Core/Color";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import Matrix4 from "terriajs-cesium/Source/Core/Matrix4";
import Cesium3DTileFeature from "terriajs-cesium/Source/Scene/Cesium3DTileFeature";
import Cesium3DTileset from "terriajs-cesium/Source/Scene/Cesium3DTileset";
import ClippingPlane from "terriajs-cesium/Source/Scene/ClippingPlane";
import ClippingPlaneCollection from "terriajs-cesium/Source/Scene/ClippingPlaneCollection";
import Cesium3DTilesCatalogItem from "../../lib/Models/Catalog/CatalogItems/Cesium3DTilesCatalogItem";
import CommonStrata from "../../lib/Models/Definition/CommonStrata";
import Terria from "../../lib/Models/Terria";

describe("Cesium3dTilesMixin", function () {
  let terria: Terria;
  let cesium3dTiles: Cesium3DTilesCatalogItem;

  describe(" - loadClippingPlanes", function () {
    beforeEach(async function () {
      terria = new Terria({
        baseUrl: "./"
      });
      cesium3dTiles = new Cesium3DTilesCatalogItem("test", terria);

      runInAction(() => {
        cesium3dTiles.setTrait(
          "definition",
          "url",
          "test/Cesium3DTiles/tileset.json"
        );

        cesium3dTiles.setTrait("definition", "clippingPlanes", {
          enabled: true,
          unionClippingRegions: false,
          planes: [
            {
              normal: [-1, 0.0, 0.0],
              distance: 40
            }
          ],
          modelMatrix: [
            1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0,
            0.0, 0.0, 1.0
          ],
          edgeColor: "blue",
          edgeWidth: 12.0
        });
      });

      await cesium3dTiles.loadMetadata();
    });

    it(" - Property ClippingPlaneCollection to be defined", function () {
      expect(cesium3dTiles.clippingPlaneCollection).toBeDefined();
    });

    it(" - Property ClippingPlaneCollection is a ClippingPlaneCollection type", function () {
      expect(
        cesium3dTiles.clippingPlaneCollection instanceof ClippingPlaneCollection
      ).toBe(true);
    });

    it(" - ClippingPlaneCollection must contain a ClippingPlane", function () {
      const cpc = cesium3dTiles.clippingPlaneCollection;
      expect(
        cpc?.contains(
          new ClippingPlane(Cartesian3.fromArray([-1, 0.0, 0.0]), 40)
        )
      ).toBe(true);
    });

    it(" - ClippingPlaneCollection must be enabled", function () {
      const cpc = cesium3dTiles.clippingPlaneCollection;
      expect(cpc?.enabled).toBe(true);
    });

    it(" - ClippingPlaneCollection unionClippingRegions must be false", function () {
      const cpc = cesium3dTiles.clippingPlaneCollection;
      expect(cpc?.unionClippingRegions).toBe(false);
    });

    it(" - ClippingPlaneCollection edgeWidth must be 12.0", function () {
      const cpc = cesium3dTiles.clippingPlaneCollection;
      expect(cpc?.edgeWidth).toBe(12.0);
    });

    it(" - ClippingPlaneCollection edgeColor must be Blue", function () {
      const cpc = cesium3dTiles.clippingPlaneCollection;
      expect(cpc?.edgeColor.equals(Color.BLUE)).toBe(true);
    });

    it(" - ClippingPlaneCollection must content Identity Matrix as modelMatrix", function () {
      const cpc = cesium3dTiles.clippingPlaneCollection;
      expect(cpc?.modelMatrix.equals(Matrix4.IDENTITY)).toBe(true);
    });
  });

  describe("tileset style", function () {
    describe("show expression from filter", function () {
      it("casts the property to number", async function () {
        terria = new Terria({
          baseUrl: "./"
        });
        cesium3dTiles = new Cesium3DTilesCatalogItem("test", terria);
        cesium3dTiles.setTrait(
          CommonStrata.user,
          "url",
          "test/Cesium3DTiles/tileset.json"
        );
        const filter = cesium3dTiles.addObject(
          CommonStrata.user,
          "filters",
          "level-filter"
        );
        filter?.setTrait(CommonStrata.user, "name", "Level filter");
        filter?.setTrait(CommonStrata.user, "property", "level");
        filter?.setTrait(CommonStrata.user, "minimumValue", 0);
        filter?.setTrait(CommonStrata.user, "maximumValue", 42);
        filter?.setTrait(CommonStrata.user, "minimumShown", 10);
        filter?.setTrait(CommonStrata.user, "maximumShown", 20);
        await cesium3dTiles.loadMapItems();
        const tileset = cesium3dTiles.mapItems[0] as Cesium3DTileset;
        const show = tileset.style?.show;
        const expr = (show as any)?.expression as string;
        expect(expr).toBeDefined();
        if (expr) {
          const [cond1, cond2] = expr.split("&&");
          expect(cond1.trim().startsWith("Number(${feature['level']})")).toBe(
            true
          );
          expect(cond2.trim().startsWith("Number(${feature['level']})")).toBe(
            true
          );
        }
      });
    });
  });

  describe("lightColor", function () {
    it("sets the light color of the tileset", async function () {
      terria = new Terria({
        baseUrl: "./"
      });
      cesium3dTiles = new Cesium3DTilesCatalogItem("test", terria);
      cesium3dTiles.setTrait(
        CommonStrata.user,
        "url",
        "test/Cesium3DTiles/tileset.json"
      );
      cesium3dTiles.setTrait(CommonStrata.user, "lightColor", [255, 0, 0]);
      await cesium3dTiles.loadMapItems();
      const tileset = cesium3dTiles.mapItems[0] as Cesium3DTileset;
      expect(tileset.lightColor).toEqual(new Cartesian3(255, 0, 0));
    });
  });

  describe("getSelectorForFeature", function () {
    it("returns a style expression for selecting the given feature if it can be constructed", function () {
      const item = new Cesium3DTilesCatalogItem("test", terria);
      item.setTrait(CommonStrata.user, "featureIdProperties", [
        "locality",
        "building-no"
      ]);
      const fakeTileFeature = new Cesium3DTileFeature();
      spyOn(fakeTileFeature, "getProperty").and.callFake((property: string) =>
        property === "locality"
          ? "foo"
          : property === "building-no"
          ? 4242
          : undefined
      );
      const selector = item.getSelectorForFeature(fakeTileFeature);
      expect(selector).toBe('${building-no} === 4242 && ${locality} === "foo"');
    });
  });

  describe("tileset modelMatrix", function () {
    describe("when no transformation traits are set", function () {
      it("should be same as the root transform", function () {
        expect(
          cesium3dTiles.modelMatrix.equalsEpsilon(
            Matrix4.fromArray([
              -0.0010050878773394923, -0.010020359590716663,
              0.00011650340166541126, 0, -0.006002102620114645,
              0.0006957193601463293, 0.008057426370782056, 0,
              -0.008024708312922119, 0.000734676293133252,
              -0.006041166133112854, 0, -5088199.73081417, 465822.6898719493,
              -3804844.213142962, 1
            ]),
            // Compare up to 6 digits precision
            CesiumMath.EPSILON6
          )
        ).toBe(true);
      });
    });
  });
});
