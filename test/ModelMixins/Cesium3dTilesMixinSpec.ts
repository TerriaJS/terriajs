import { runInAction } from "mobx";
import Terria from "../../lib/Models/Terria";
import Cesium3DTilesCatalogItem from "../../lib/Models/Catalog/CatalogItems/Cesium3DTilesCatalogItem";
import ClippingPlaneCollection from "terriajs-cesium/Source/Scene/ClippingPlaneCollection";
import ClippingPlane from "terriajs-cesium/Source/Scene/ClippingPlane";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Color from "terriajs-cesium/Source/Core/Color";
import Matrix4 from "terriajs-cesium/Source/Core/Matrix4";

describe("Cesium3dTilesMixin", function() {
  describe(" - loadClippingPlanes", function() {
    let terria: Terria;
    let cesium3dTiles: Cesium3DTilesCatalogItem;

    beforeEach(async function() {
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
            1.0,
            0.0,
            0.0,
            0.0,
            0.0,
            1.0,
            0.0,
            0.0,
            0.0,
            0.0,
            1.0,
            0.0,
            0.0,
            0.0,
            0.0,
            1.0
          ],
          edgeColor: "blue",
          edgeWidth: 12.0
        });
      });

      await cesium3dTiles.loadMetadata();
    });

    it(" - Property ClippingPlaneCollection to be defined", function() {
      expect(cesium3dTiles.cesiumTileClippingPlaneCollection).toBeDefined();
    });

    it(" - Property ClippingPlaneCollection is a ClippingPlaneCollection type", function() {
      expect(
        cesium3dTiles.cesiumTileClippingPlaneCollection instanceof
          ClippingPlaneCollection
      ).toBe(true);
    });

    it(" - ClippingPlaneCollection must contain a ClippingPlane", function() {
      const cpc = cesium3dTiles.cesiumTileClippingPlaneCollection;
      expect(
        cpc?.contains(
          new ClippingPlane(Cartesian3.fromArray([-1, 0.0, 0.0]), 40)
        )
      ).toBe(true);
    });

    it(" - ClippingPlaneCollection must be enabled", function() {
      const cpc = cesium3dTiles.cesiumTileClippingPlaneCollection;
      expect(cpc?.enabled).toBe(true);
    });

    it(" - ClippingPlaneCollection unionClippingRegions must be false", function() {
      const cpc = cesium3dTiles.cesiumTileClippingPlaneCollection;
      expect(cpc?.unionClippingRegions).toBe(false);
    });

    it(" - ClippingPlaneCollection edgeWidth must be 12.0", function() {
      const cpc = cesium3dTiles.cesiumTileClippingPlaneCollection;
      expect(cpc?.edgeWidth).toBe(12.0);
    });

    it(" - ClippingPlaneCollection edgeColor must be Blue", function() {
      const cpc = cesium3dTiles.cesiumTileClippingPlaneCollection;
      expect(cpc?.edgeColor.equals(Color.BLUE)).toBe(true);
    });

    it(" - ClippingPlaneCollection must content Identity Matrix as modelMatrix", function() {
      const cpc = cesium3dTiles.cesiumTileClippingPlaneCollection;
      expect(cpc?.modelMatrix.equals(Matrix4.IDENTITY)).toBe(true);
    });
  });
});
