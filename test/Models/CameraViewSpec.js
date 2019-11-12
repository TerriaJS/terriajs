"use strict";

/*global require*/
var CameraView = require("../../lib/Models/CameraView");
var Cartesian3 = require("terriajs-cesium/Source/Core/Cartesian3").default;
var Cartographic = require("terriajs-cesium/Source/Core/Cartographic").default;
var CesiumMath = require("terriajs-cesium/Source/Core/Math").default;
var CustomMatchers = require("../Utility/CustomMatchers");
var Ellipsoid = require("terriajs-cesium/Source/Core/Ellipsoid").default;
var HeadingPitchRange = require("terriajs-cesium/Source/Core/HeadingPitchRange")
  .default;
var Rectangle = require("terriajs-cesium/Source/Core/Rectangle").default;

describe("CameraView", function() {
  describe("fromJson", function() {
    it("can deserialize rectangle alone", function() {
      var view = CameraView.fromJson({
        west: 45,
        south: -20,
        east: 55,
        north: -10
      });

      expect(view.rectangle).toEqual(Rectangle.fromDegrees(45, -20, 55, -10));
    });

    it("can deserialize rectangle plus position/direction/up", function() {
      var view = CameraView.fromJson({
        west: 45,
        south: -20,
        east: 55,
        north: -10,
        position: {
          x: 10000000,
          y: 10.0,
          z: 20.0
        },
        direction: {
          x: -1.0,
          y: 0.1,
          z: 0.2
        },
        up: {
          x: 0.0,
          y: 1.0,
          z: 0.1
        }
      });

      expect(view.rectangle).toEqual(Rectangle.fromDegrees(45, -20, 55, -10));
      expect(view.position).toEqual(new Cartesian3(10000000, 10, 20));
      expect(view.direction).toEqual(new Cartesian3(-1.0, 0.1, 0.2));
      expect(view.up).toEqual(new Cartesian3(0.0, 1.0, 0.1));
    });

    it("can deserialize lookAt", function() {
      var view = CameraView.fromJson({
        lookAt: {
          targetLongitude: 45,
          targetLatitude: -20,
          targetHeight: 100,
          heading: 10,
          pitch: -25,
          range: 10000
        }
      });

      expect(view).toEqual(
        CameraView.fromLookAt(
          Cartographic.fromDegrees(45, -20, 100),
          new HeadingPitchRange(
            (10 * Math.PI) / 180,
            (-25 * Math.PI) / 180,
            10000
          )
        )
      );
    });

    it("can deserialize position/heading/pitch/roll", function() {
      var view = CameraView.fromJson({
        positionHeadingPitchRoll: {
          cameraLongitude: 45,
          cameraLatitude: -20,
          cameraHeight: 100,
          heading: 10,
          pitch: -25,
          roll: 15
        }
      });

      expect(view).toEqual(
        CameraView.fromPositionHeadingPitchRoll(
          Cartographic.fromDegrees(45, -20, 100),
          (10 * Math.PI) / 180,
          (-25 * Math.PI) / 180,
          (15 * Math.PI) / 180
        )
      );
    });
  });

  describe("fromLookAt", function() {
    it("throws when targetPosition is not specified", function() {
      expect(function() {
        return CameraView.fromLookAt(
          undefined,
          new HeadingPitchRange(
            (10 * Math.PI) / 180,
            (-25 * Math.PI) / 180,
            10000
          )
        );
      }).toThrow();
    });

    it("throws when headingPitchRange is not specified", function() {
      expect(function() {
        return CameraView.fromLookAt(
          Cartographic.fromDegrees(45, -20, 100),
          undefined
        );
      }).toThrow();
    });

    it("can look straight down at a point on the equator", function() {
      jasmine.addMatchers(CustomMatchers);

      var view = CameraView.fromLookAt(
        Cartographic.fromDegrees(45, 0, 100),
        new HeadingPitchRange(0, CesiumMath.toRadians(90), 10000)
      );

      var cartographic = Ellipsoid.WGS84.cartesianToCartographic(view.position);
      expect(cartographic.longitude).toEqualEpsilon(
        CesiumMath.toRadians(45),
        1e-5
      );
      expect(cartographic.latitude).toEqualEpsilon(
        CesiumMath.toRadians(0),
        1e-5
      );
      expect(cartographic.height).toEqualEpsilon(10000 + 100, 1);

      var surfaceNormal = Ellipsoid.WGS84.geodeticSurfaceNormalCartographic(
        cartographic
      );
      expect(
        Cartesian3.equalsEpsilon(
          view.direction,
          Cartesian3.negate(surfaceNormal, new Cartesian3()),
          1e-7
        )
      ).toBe(true);
      expect(Cartesian3.equalsEpsilon(view.up, Cartesian3.UNIT_Z, 1e-7)).toBe(
        true
      );
    });

    it("can look north at a point on the equator", function() {
      jasmine.addMatchers(CustomMatchers);

      var view = CameraView.fromLookAt(
        Cartographic.fromDegrees(45, 0, 100),
        new HeadingPitchRange(0, 0, 10000)
      );

      var cartographic = Ellipsoid.WGS84.cartesianToCartographic(view.position);
      expect(cartographic.longitude).toEqualEpsilon(
        CesiumMath.toRadians(45),
        1e-5
      );
      expect(cartographic.latitude).toBeLessThan(0);
      expect(cartographic.height).toBeGreaterThan(100.0);

      var surfaceNormal = Ellipsoid.WGS84.geodeticSurfaceNormalCartographic(
        cartographic
      );
      expect(Cartesian3.equalsEpsilon(view.up, surfaceNormal, 1e-2)).toBe(true);
      expect(
        Cartesian3.equalsEpsilon(view.direction, Cartesian3.UNIT_Z, 1e-7)
      ).toBe(true);
    });

    it("can look east at a point on the equator", function() {
      jasmine.addMatchers(CustomMatchers);

      var view = CameraView.fromLookAt(
        Cartographic.fromDegrees(45, 0, 100),
        new HeadingPitchRange(CesiumMath.toRadians(90), 0, 10000)
      );

      var cartographic = Ellipsoid.WGS84.cartesianToCartographic(view.position);
      expect(cartographic.longitude).toBeLessThan(CesiumMath.toRadians(45));
      expect(cartographic.latitude).toEqualEpsilon(0, 1e-7);
      expect(cartographic.height).toBeGreaterThan(100.0);

      var targetSurfaceNormal = Ellipsoid.WGS84.geodeticSurfaceNormalCartographic(
        Cartographic.fromDegrees(45, 0)
      );
      expect(Cartesian3.equalsEpsilon(view.up, targetSurfaceNormal, 1e-7)).toBe(
        true
      );
      expect(
        Cartesian3.equalsEpsilon(
          Cartesian3.cross(
            Cartesian3.UNIT_Z,
            targetSurfaceNormal,
            new Cartesian3()
          ),
          view.direction,
          1e-7
        )
      ).toBe(true);
    });
  });

  describe("fromPositionHeadingPitchRoll", function() {
    it("throws when cameraPosition is not specified", function() {
      expect(function() {
        return CameraView.fromPositionHeadingPitchRoll(undefined, 0, 0, 0);
      }).toThrow();
    });

    it("throws when heading is not specified", function() {
      expect(function() {
        return CameraView.fromPositionHeadingPitchRoll(
          Cartographic.fromDegrees(45, -20, 100),
          undefined,
          0,
          0
        );
      }).toThrow();
    });

    it("throws when pitch is not specified", function() {
      expect(function() {
        return CameraView.fromPositionHeadingPitchRoll(
          Cartographic.fromDegrees(45, -20, 100),
          0,
          undefined,
          0
        );
      }).toThrow();
    });

    it("throws when roll is not specified", function() {
      expect(function() {
        return CameraView.fromPositionHeadingPitchRoll(
          Cartographic.fromDegrees(45, -20, 100),
          0,
          0,
          undefined
        );
      }).toThrow();
    });

    it("can look straight down from a point on the equator", function() {
      jasmine.addMatchers(CustomMatchers);

      var view = CameraView.fromPositionHeadingPitchRoll(
        Cartographic.fromDegrees(45, 0, 100),
        0,
        CesiumMath.toRadians(-90),
        0
      );

      var cartographic = Ellipsoid.WGS84.cartesianToCartographic(view.position);
      expect(cartographic.longitude).toEqualEpsilon(
        CesiumMath.toRadians(45),
        1e-5
      );
      expect(cartographic.latitude).toEqualEpsilon(
        CesiumMath.toRadians(0),
        1e-5
      );
      expect(cartographic.height).toEqualEpsilon(100, 1);

      var surfaceNormal = Ellipsoid.WGS84.geodeticSurfaceNormalCartographic(
        cartographic
      );
      expect(
        Cartesian3.equalsEpsilon(
          view.direction,
          Cartesian3.negate(surfaceNormal, new Cartesian3()),
          1e-7
        )
      ).toBe(true);
      expect(Cartesian3.equalsEpsilon(view.up, Cartesian3.UNIT_Z, 1e-7)).toBe(
        true
      );
    });

    it("can look north from a point on the equator", function() {
      jasmine.addMatchers(CustomMatchers);

      var view = CameraView.fromPositionHeadingPitchRoll(
        Cartographic.fromDegrees(45, 0, 100),
        0,
        0,
        0
      );

      var cartographic = Ellipsoid.WGS84.cartesianToCartographic(view.position);
      expect(cartographic.longitude).toEqualEpsilon(
        CesiumMath.toRadians(45),
        1e-10
      );
      expect(cartographic.latitude).toEqualEpsilon(0, 1e-10);
      expect(cartographic.height).toEqualEpsilon(100.0, 1e-9);

      var surfaceNormal = Ellipsoid.WGS84.geodeticSurfaceNormalCartographic(
        cartographic
      );
      expect(Cartesian3.equalsEpsilon(view.up, surfaceNormal, 1e-7)).toBe(true);
      expect(
        Cartesian3.equalsEpsilon(view.direction, Cartesian3.UNIT_Z, 1e-7)
      ).toBe(true);
    });

    it("can look east from a point on the equator", function() {
      jasmine.addMatchers(CustomMatchers);

      var view = CameraView.fromPositionHeadingPitchRoll(
        Cartographic.fromDegrees(45, 0, 100),
        CesiumMath.toRadians(90),
        0,
        0
      );

      var cartographic = Ellipsoid.WGS84.cartesianToCartographic(view.position);
      expect(cartographic.longitude).toEqualEpsilon(
        CesiumMath.toRadians(45),
        1e-10
      );
      expect(cartographic.latitude).toEqualEpsilon(0, 1e-10);
      expect(cartographic.height).toEqualEpsilon(100.0, 1e-9);

      var targetSurfaceNormal = Ellipsoid.WGS84.geodeticSurfaceNormalCartographic(
        Cartographic.fromDegrees(45, 0)
      );
      expect(Cartesian3.equalsEpsilon(view.up, targetSurfaceNormal, 1e-7)).toBe(
        true
      );
      expect(
        Cartesian3.equalsEpsilon(
          Cartesian3.cross(
            Cartesian3.UNIT_Z,
            targetSurfaceNormal,
            new Cartesian3()
          ),
          view.direction,
          1e-7
        )
      ).toBe(true);
    });
  });
});
