"use strict";

/*global require,describe,xdescribe,it,expect,beforeAll*/
var Cartographic = require("terriajs-cesium/Source/Core/Cartographic").default;
var EarthGravityModel1996 = require("../../lib/Map/EarthGravityModel1996");

var describeIfSupported = EarthGravityModel1996.isSupported()
  ? describe
  : xdescribe;

describeIfSupported("EarthGravityModel1996", function() {
  var egm96;

  beforeAll(function() {
    egm96 = new EarthGravityModel1996(
      require("file-loader!../../wwwroot/data/WW15MGH.DAC")
    );
  });

  // NGA calculator is here: http://earth-info.nga.mil/GandG/wgs84/gravitymod/egm96/intpt.html

  it("produces a single result consistent with NGA calculator", function(done) {
    egm96.getHeight(0.0, 0.0).then(function(height) {
      expect(height).toBe(17.16);
      done();
    });
  });

  it("produces multiple results consistent with NGA calculator", function(done) {
    var testData = [
      // longitude, latitude, expected height
      0.0,
      89.74,
      13.92,
      180.0,
      89.74,
      13.49,
      -180.0,
      89.74,
      13.49,
      0.0,
      -89.74,
      -29.55,
      180.0,
      -89.74,
      -30.11,
      -180.0,
      -89.74,
      -30.11,
      0.15,
      0.0,
      17.12,
      -0.15,
      0.0,
      17.17
    ];

    var cartographics = [];
    var i;

    for (i = 0; i < testData.length; i += 3) {
      cartographics.push(
        Cartographic.fromDegrees(testData[i], testData[i + 1], 0.0)
      );
    }

    egm96.getHeights(cartographics).then(function() {
      for (var i = 0; i < cartographics.length; ++i) {
        expect(
          Math.abs(cartographics[i].height - testData[i * 3 + 2])
        ).toBeLessThan(0.01);
      }
      done();
    });
  });

  it("works at the north pole", function(done) {
    egm96.getHeight(0.0, Math.PI).then(function(height) {
      expect(height).toBe(13.61);
      done();
    });
  });

  it("works at the south pole", function(done) {
    egm96.getHeight(0.0, -Math.PI).then(function(height) {
      expect(height).toBe(-29.53);
      done();
    });
  });
});
