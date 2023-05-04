import { action, observable } from "mobx";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import HeadingPitchRoll from "terriajs-cesium/Source/Core/HeadingPitchRoll";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import GltfMixin from "../../lib/ModelMixins/GltfMixin";
import CommonStrata from "../../lib/Models/Definition/CommonStrata";
import CreateModel from "../../lib/Models/Definition/CreateModel";
import updateModelFromJson from "../../lib/Models/Definition/updateModelFromJson";
import Terria from "../../lib/Models/Terria";
import GltfTraits from "../../lib/Traits/TraitsClasses/GltfTraits";

describe("GltfMixin", function () {
  let terria: Terria;

  beforeAll(function () {
    terria = new Terria();
  });

  it(
    "recomputes `mapItems` when `gltfModelUrl` changes",
    action(function () {
      const testItem = new TestGltfItem("test", terria);
      expect(testItem.mapItems).toEqual([]);
      testItem.gltfModelUrl = "http://example.org/test.glb";
      const dataSource = testItem.mapItems[0];
      expect(dataSource).toBeDefined();
      const entity = dataSource.entities.values[0];
      expect(entity?.model?.uri?.getValue(JulianDate.now())).toEqual(
        "http://example.org/test.glb"
      );
    })
  );

  it(
    "correctly sets the model parameters",
    action(function () {
      const testItem = new TestGltfItem("test", terria);
      expect(testItem.mapItems).toEqual([]);
      testItem.gltfModelUrl = "http://example.org/test.glb";
      updateModelFromJson(testItem, CommonStrata.user, {
        origin: {
          latitude: 42,
          longitude: 42,
          height: 42
        },
        rotation: {
          heading: 42,
          pitch: 42,
          roll: 42
        },
        scale: 42
      });
      const entity = testItem.mapItems[0]?.entities.values[0];
      const modelGraphics = entity.model;
      expect(modelGraphics).toBeDefined();
      if (modelGraphics) {
        expect(modelGraphics.scale?.getValue(JulianDate.now())).toBe(42);

        // Compare lat,lon,height in degrees
        const position = Cartographic.fromCartesian(
          entity.position?.getValue(JulianDate.now())!
        );
        const lat = CesiumMath.toDegrees(position.latitude),
          lon = CesiumMath.toDegrees(position.longitude),
          height = position.height;
        expect(lat).toBeCloseTo(42);
        expect(lon).toBeCloseTo(42);
        expect(height).toBeCloseTo(42);

        // Compare heading,pitch,roll in degrees. Note that the trait values
        // are specified in local co-ordinates but when we set the values for
        // the entity we add the rotation from the center of the earth at the
        // entity position.
        const hpr = HeadingPitchRoll.fromQuaternion(
          entity.orientation?.getValue(JulianDate.now())
        );
        const heading = CesiumMath.toDegrees(hpr.heading),
          pitch = CesiumMath.toDegrees(hpr.pitch),
          roll = CesiumMath.toDegrees(hpr.roll);
        expect(heading).toBeCloseTo(-75.6391, 3);
        expect(pitch).toBeCloseTo(4.485, 3);
        expect(roll).toBeCloseTo(75.6391, 3);
      }
    })
  );

  describe("disableZoomTo", function () {
    it("should disable zoom to when model position is not known", function () {
      const testItem = new TestGltfItem("test", terria);
      expect(testItem.disableZoomTo).toBeTruthy();
    });

    it("should enable zoom to when model position is known", function () {
      const testItem = new TestGltfItem("test", terria);
      updateModelFromJson(testItem, CommonStrata.user, {
        origin: {
          latitude: 42,
          longitude: 42,
          height: 42
        }
      });
      expect(testItem.disableZoomTo).toBeFalsy();
    });
  });
});

class TestGltfItem extends GltfMixin(CreateModel(GltfTraits)) {
  @observable gltfModelUrl: string | undefined = undefined;
}
