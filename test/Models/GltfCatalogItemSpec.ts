import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import MappableMixin from "../../lib/ModelMixins/MappableMixin";
import CommonStrata from "../../lib/Models/CommonStrata";
import createStratumInstance from "../../lib/Models/createStratumInstance";
import GltfCatalogItem from "../../lib/Models/GltfCatalogItem";
import Terria from "../../lib/Models/Terria";
import HeadingPitchRollTraits from "../../lib/Traits/TraitsClasses/HeadingPitchRollTraits";

describe("GltfCatalogItem", function() {
  let gltf: GltfCatalogItem;

  beforeEach(function() {
    gltf = new GltfCatalogItem("test", new Terria());
    gltf.setTrait("definition", "url", "test/gltf/Cesium_Air.glb");
  });

  it("is Mappable", function() {
    expect(MappableMixin.isMixedInto(gltf)).toBeTruthy();
  });

  it("creates a DataSource with a model", async function() {
    await gltf.loadMapItems();
    expect(gltf.mapItems.length).toBe(1);
    expect(gltf.mapItems[0].entities.values.length).toBe(1);
    expect(gltf.mapItems[0].entities.values[0].polygon).toBeUndefined();
    expect(gltf.mapItems[0].entities.values[0].model).toBeDefined();
  });

  describe("orientation", function() {
    describe("when no rotation is defined", function() {
      it("defaults to Quatenrion.IDENTITY", async function() {
        await gltf.loadMapItems();
        const entity = gltf.mapItems[0]?.entities.values[0];
        expect(entity.orientation).toBeDefined();

        if (entity.orientation !== undefined) {
          const orientation = entity?.orientation.getValue(JulianDate.now());
          expect(orientation).toBeDefined();
          expect(orientation.x).toEqual(0);
          expect(orientation.y).toEqual(0);
          expect(orientation.z).toEqual(0);
          expect(orientation.w).toEqual(1);
        }
      });
    });

    describe("when rotation is defined", function() {
      it("correctly sets the orientation", async function() {
        gltf.setTrait(
          CommonStrata.user,
          "rotation",
          createStratumInstance(HeadingPitchRollTraits, {
            heading: 30,
            pitch: 40,
            roll: 50
          })
        );
        await gltf.loadMapItems();
        const entity = gltf.mapItems[0]?.entities.values[0];
        expect(entity.orientation).toBeDefined();

        if (entity.orientation !== undefined) {
          const orientation = entity?.orientation.getValue(JulianDate.now());
          expect(orientation.x.toFixed(2)).toEqual("0.50");
          expect(orientation.y.toFixed(2)).toEqual("-0.07");
          expect(orientation.z.toFixed(2)).toEqual("0.55");
          expect(orientation.w.toFixed(2)).toEqual("0.67");
        }
      });
    });
  });

  describe("hasLocalData", function() {
    it("should be false by default", function() {
      expect(gltf.hasLocalData).toBeFalsy();
    });

    it("should be true if the catalog item has local file data", function() {
      gltf.setFileInput(new Blob());
      expect(gltf.hasLocalData).toBeTruthy();
    });
  });
});
