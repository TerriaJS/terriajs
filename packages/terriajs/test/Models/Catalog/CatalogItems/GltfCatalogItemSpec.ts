import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import Transforms from "terriajs-cesium/Source/Core/Transforms";
import Entity from "terriajs-cesium/Source/DataSources/Entity";
import MappableMixin from "../../../../lib/ModelMixins/MappableMixin";
import GltfCatalogItem from "../../../../lib/Models/Catalog/Gltf/GltfCatalogItem";
import CommonStrata from "../../../../lib/Models/Definition/CommonStrata";
import createStratumInstance from "../../../../lib/Models/Definition/createStratumInstance";
import Terria from "../../../../lib/Models/Terria";
import HeadingPitchRollTraits from "../../../../lib/Traits/TraitsClasses/HeadingPitchRollTraits";
import LatLonHeightTraits from "../../../../lib/Traits/TraitsClasses/LatLonHeightTraits";

describe("GltfCatalogItem", function () {
  let gltf: GltfCatalogItem;

  beforeEach(function () {
    gltf = new GltfCatalogItem("test", new Terria());
    gltf.setTrait("definition", "url", "test/gltf/Cesium_Air.glb");
  });

  it("is Mappable", function () {
    expect(MappableMixin.isMixedInto(gltf)).toBeTruthy();
  });

  it("creates a DataSource with a model", async function () {
    await gltf.loadMapItems();
    expect(gltf.mapItems.length).toBe(1);
    expect(gltf.mapItems[0].entities.values.length).toBe(1);
    expect(gltf.mapItems[0].entities.values[0].polygon).toBeUndefined();
    expect(gltf.mapItems[0].entities.values[0].model).toBeDefined();
  });

  describe("orientation", function () {
    describe("when no rotation is defined", function () {
      it("defaults to zero rotation", async function () {
        gltf.setTrait(
          CommonStrata.user,
          "origin",
          createStratumInstance(LatLonHeightTraits, {
            longitude: -123.0744619,
            latitude: 44.0503706,
            height: 0
          })
        );

        await gltf.loadMapItems();
        const entity = gltf.mapItems[0]?.entities.values[0];
        const orientation = entity.orientation;
        expect(orientation).toBeDefined();

        if (orientation !== undefined) {
          const { heading, pitch, roll } = getEntityHprInDegrees(entity);
          expect(heading).toEqual(0);
          expect(pitch).toEqual(0);
          expect(roll).toEqual(0);
        }
      });
    });

    describe("when rotation is defined", function () {
      it("correctly sets the orientation", async function () {
        gltf.setTrait(
          CommonStrata.user,
          "rotation",
          createStratumInstance(HeadingPitchRollTraits, {
            heading: 30,
            pitch: 40,
            roll: 50
          })
        );

        gltf.setTrait(
          CommonStrata.user,
          "origin",
          createStratumInstance(LatLonHeightTraits, {
            longitude: -123.0744619,
            latitude: 44.0503706,
            height: 0
          })
        );
        await gltf.loadMapItems();
        const entity = gltf.mapItems[0]?.entities.values[0];
        const orientation = entity.orientation?.getValue(JulianDate.now());
        expect(orientation).toBeDefined();

        if (orientation !== undefined) {
          const { heading, pitch, roll } = getEntityHprInDegrees(entity);
          expect(heading).toEqual(30);
          expect(pitch).toEqual(40);
          expect(roll).toEqual(50);
        }
      });
    });
  });

  describe("hasLocalData", function () {
    it("should be false by default", function () {
      expect(gltf.hasLocalData).toBeFalsy();
    });

    it("should be true if the catalog item has local file data", function () {
      gltf.setFileInput(new Blob());
      expect(gltf.hasLocalData).toBeTruthy();
    });
  });
});

/**
 * Returns the current entity rotation HPR in degrees.
 */
function getEntityHprInDegrees(entity: Entity) {
  const modelMatrix = entity.computeModelMatrix(JulianDate.now());
  const hpr = Transforms.fixedFrameToHeadingPitchRoll(modelMatrix);
  return {
    heading: Math.round(CesiumMath.toDegrees(hpr.heading)),
    pitch: Math.round(CesiumMath.toDegrees(hpr.pitch)),
    roll: Math.round(CesiumMath.toDegrees(hpr.roll))
  };
}
