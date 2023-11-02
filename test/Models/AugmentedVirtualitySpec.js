"use strict";

import defined from "terriajs-cesium/Source/Core/defined";
import Terria from "../../lib/Models/Terria";
import Cesium from "../../lib/Models/Cesium";
import CesiumWidget from "terriajs-cesium/Source/Widgets/CesiumWidget/CesiumWidget";
import TileCoordinatesImageryProvider from "terriajs-cesium/Source/Scene/TileCoordinatesImageryProvider";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import supportsWebGL from "../../lib/Core/supportsWebGL";
import AugmentedVirtuality from "../../lib/Models/AugmentedVirtuality";

var describeIfSupportsWebGL = supportsWebGL() ? describe : xdescribe;

describe("AugmentedVirtuality", function () {
  let terria;

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });
  });

  beforeEach(function () {
    jasmine.addMatchers(customMatchers);
  });

  it("check default values", function () {
    var av = new AugmentedVirtuality(terria);

    expect(av.enabled).toEqual(false);
    expect(av.manualAlignment).toEqual(false);
    expect(av.maximumUpdatesPerSecond).toEqual(10.0);
    expect(av.manualAlignmentSet).toEqual(false);
    expect(av.hoverLevel).toEqual(2);
  });

  it("check changing enabled", function () {
    var av = new AugmentedVirtuality(terria);

    // Verify inital state for test sanity.
    expect(av.enabled).toEqual(false);

    // Change the state and check true.
    av.enabled = true;
    expect(av.enabled).toEqual(true);
    // Change the state and check false.
    av.enabled = false;
    expect(av.enabled).toEqual(false);
  });

  it("check toggle enabled", function () {
    var av = new AugmentedVirtuality(terria);

    // Verify inital state for test sanity.
    expect(av.enabled).toEqual(false);

    // Toggle to true.
    av.toggleEnabled();
    expect(av.enabled).toEqual(true);
    // Toggle to false.
    av.toggleEnabled();
    expect(av.enabled).toEqual(false);
  });

  it("check manual align", function () {
    var av = new AugmentedVirtuality(terria);

    // Set inital state for test sanity.
    av.enabled = true;
    // Verify inital state for test sanity.
    expect(av.enabled).toEqual(true);
    expect(av.manualAlignment).toEqual(false);

    // Check start manual alignment.
    av.manualAlignment = true;
    expect(av.manualAlignment).toEqual(true);

    // Check stop manual alignment.
    av.manualAlignment = false;
    expect(av.manualAlignment).toEqual(false);

    // Check enabled whilst disabled.
    av.enabled = false;
    av.manualAlignment = true;
    expect(av.manualAlignment).toEqual(false);

    // Check manualAlignment on when enabled is turned off.
    av.enabled = true;
    av.manualAlignment = true;
    expect(av.manualAlignment).toEqual(true);
    av.enabled = false;
    expect(av.manualAlignment).toEqual(false);
    // Check that when reenabled it is still off.
    av.enabled = true;
    expect(av.manualAlignment).toEqual(false);
  });

  it("check toggle manual align", function () {
    var av = new AugmentedVirtuality(terria);

    // Set inital state for test sanity.
    av.enabled = true;
    // Verify inital state for test sanity.
    expect(av.enabled).toEqual(true);
    expect(av.manualAlignment).toEqual(false);

    // Toggle manual alignment to true.
    av.toggleManualAlignment();
    expect(av.manualAlignment).toEqual(true);
    // Toggle manual alignment to false.
    av.toggleManualAlignment();
    expect(av.manualAlignment).toEqual(false);
  });

  it("check updaing fps", function () {
    var av = new AugmentedVirtuality(terria);

    // Set inital state for test sanity.
    av.enabled = true;
    // Verify inital state for test sanity.
    expect(av.enabled).toEqual(true);
    expect(av.maximumUpdatesPerSecond).toEqual(10.0);

    // Check changing the FPS to a different value (whilst enabled).
    av.maximumUpdatesPerSecond = 15.0;
    expect(av.maximumUpdatesPerSecond).toEqual(15.0);

    // Check changing the FPS to a different value (whilst disabled).
    av.enabled = false;
    av.maximumUpdatesPerSecond = 7.5;
    expect(av.maximumUpdatesPerSecond).toEqual(7.5);
  });

  it("check toggle hover level state change", function () {
    var av = new AugmentedVirtuality(terria);

    // Set inital state for test sanity.
    av.enabled = true;
    // Verify inital state for test sanity.
    expect(av.enabled).toEqual(true);
    expect(av.hoverLevel).toEqual(2);

    // Toggle through hover levels and expect the hover level to change.
    av.toggleHoverHeight();
    expect(av.hoverLevel).toEqual(0);
    av.toggleHoverHeight();
    expect(av.hoverLevel).toEqual(1);
    av.toggleHoverHeight();
    expect(av.hoverLevel).toEqual(2);
  });

  it("check similar radians", function () {
    expect(similarRadians(0, 0, 0.001)).toBeTruthy();
    expect(similarRadians(0, 0.000999, 0.001)).toBeTruthy();
    expect(similarRadians(0, 0.001, 0.001)).toBeTruthy();
    expect(similarRadians(0, -0.000999, 0.001)).toBeTruthy();
    expect(similarRadians(0, -0.001, 0.001)).toBeTruthy();
    expect(similarRadians(0, 0.001001, 0.001)).toBeFalsy();
    expect(similarRadians(0, -0.001001, 0.001)).toBeFalsy();

    expect(similarRadians(Math.PI, Math.PI + 0, 0.001)).toBeTruthy();
    expect(similarRadians(Math.PI, Math.PI + 0.0009999, 0.001)).toBeTruthy();
    expect(similarRadians(Math.PI, Math.PI + -0.000999, 0.001)).toBeTruthy();
    expect(similarRadians(Math.PI, Math.PI + 0.001001, 0.001)).toBeFalsy();
    expect(similarRadians(Math.PI, Math.PI + -0.001001, 0.001)).toBeFalsy();

    expect(similarRadians(2 * Math.PI, 0, 0.001)).toBeTruthy();
    expect(similarRadians(2 * Math.PI, 0.000999, 0.001)).toBeTruthy();
    expect(similarRadians(2 * Math.PI, -0.000999, 0.001)).toBeTruthy();
    expect(similarRadians(2 * Math.PI, 0.001001, 0.001)).toBeFalsy();
    expect(similarRadians(2 * Math.PI, -0.001001, 0.001)).toBeFalsy();

    expect(similarRadians(0, 2 * Math.PI + 0, 0.001)).toBeTruthy();
    expect(similarRadians(0, 2 * Math.PI + 0.000999, 0.001)).toBeTruthy();
    expect(similarRadians(0, 2 * Math.PI + -0.000999, 0.001)).toBeTruthy();
    expect(similarRadians(0, 2 * Math.PI + 0.001001, 0.001)).toBeFalsy();
    expect(similarRadians(0, 2 * Math.PI + -0.001001, 0.001)).toBeFalsy();
  });

  it("check custom matcher", function () {
    // Check when they are the same.
    expect(bod(0, 0, 0)).closeOrientation(bod(0, 0, 0));
    expect(bod(90, 0, 0)).closeOrientation(bod(90, 0, 0));
    expect(bod(0, 90, 0)).closeOrientation(bod(0, 90, 0));
    expect(bod(0, 0, 90)).closeOrientation(bod(0, 0, 90));

    // Check when they differ by less then epsilon.
    expect(bod(0, 0, 0)).closeOrientation(bod(0.05, 0, 0));

    // Check when they differ by more then epsilon.
    expect(bod(0, 0, 0)).not.closeOrientation(bod(0.1, 0, 0));
    expect(bod(0, 0, 0)).not.closeOrientation(bod(0, 0.1, 0));
    expect(bod(0, 0, 0)).not.closeOrientation(bod(0, 0, 0.1));

    // Check when they are malformed.
    expect({}).not.closeOrientation(bod(0, 0, 0));
    expect(bod(0, 0, 0)).not.closeOrientation({});
    expect({
      orientation: { roll: 0, pitch: 0, heading: 0 }
    }).closeOrientation({ orientation: { roll: 0, pitch: 0, heading: 0 } });
    expect({ orientation: { pitch: 0, heading: 0 } }).not.closeOrientation({
      orientation: { roll: 0, pitch: 0, heading: 0 }
    });
    expect({
      orientation: { roll: 0, pitch: 0, heading: 0 }
    }).not.closeOrientation({ orientation: { pitch: 0, heading: 0 } });
    expect({ orientation: { roll: 0, heading: 0 } }).not.closeOrientation({
      orientation: { roll: 0, pitch: 0, heading: 0 }
    });
    expect({
      orientation: { roll: 0, pitch: 0, heading: 0 }
    }).not.closeOrientation({ orientation: { roll: 0, heading: 0 } });
    expect({ orientation: { roll: 0, pitch: 0 } }).not.closeOrientation({
      orientation: { roll: 0, pitch: 0, heading: 0 }
    });
    expect({
      orientation: { roll: 0, pitch: 0, heading: 0 }
    }).not.closeOrientation({ orientation: { roll: 0, pitch: 0 } });
  });

  it("check device to terria orientation", function () {
    // The test cases were generated using a seemingly working implementation since the test matcher is based on
    // values rather then using the true orientation matching in the device frame of reference.
    var av = new AugmentedVirtuality(terria);

    // Check the order of rotations in different quadrents for different angle orders.
    expect(av._computeTerriaOrientation(0, 0, 0, 0, 0, 0)).closeOrientation(
      bod(0, -90, 0)
    );

    expect(av._computeTerriaOrientation(45, 0, 0, 0, 0, 0)).closeOrientation(
      bod(0, -90, -45)
    );
    expect(av._computeTerriaOrientation(0, 45, 0, 0, 0, 0)).closeOrientation(
      bod(0, -45, 0)
    );
    expect(av._computeTerriaOrientation(0, 0, 45, 0, 0, 0)).closeOrientation(
      bod(90, -45, -90)
    );

    expect(av._computeTerriaOrientation(45, 15, 0, 0, 0, 0)).closeOrientation(
      bod(0, -75, -45)
    );
    expect(av._computeTerriaOrientation(-45, 15, 0, 0, 0, 0)).closeOrientation(
      bod(0, -75, 45)
    );
    expect(av._computeTerriaOrientation(45, -15, 0, 0, 0, 0)).closeOrientation(
      bod(180, -75, 135)
    );
    expect(av._computeTerriaOrientation(-45, -15, 0, 0, 0, 0)).closeOrientation(
      bod(180, -75, -135)
    );

    expect(av._computeTerriaOrientation(45, 0, 15, 0, 0, 0)).closeOrientation(
      bod(90, -75, -135)
    );
    expect(av._computeTerriaOrientation(-45, 0, 15, 0, 0, 0)).closeOrientation(
      bod(90, -75, -45)
    );
    expect(av._computeTerriaOrientation(45, 0, -15, 0, 0, 0)).closeOrientation(
      bod(-90, -75, 45)
    );
    expect(av._computeTerriaOrientation(-45, 0, -15, 0, 0, 0)).closeOrientation(
      bod(-90, -75, 135)
    );

    expect(av._computeTerriaOrientation(0, 45, 15, 0, 0, 0)).closeOrientation(
      bod(14.5, -43.1, -20.8)
    );
    expect(av._computeTerriaOrientation(0, -45, 15, 0, 0, 0)).closeOrientation(
      bod(165.5, -43.1, -159.2)
    );
    expect(av._computeTerriaOrientation(0, 45, -15, 0, 0, 0)).closeOrientation(
      bod(-14.5, -43.1, 20.8)
    );
    expect(av._computeTerriaOrientation(0, -45, -15, 0, 0, 0)).closeOrientation(
      bod(-165.5, -43.1, 159.2)
    );

    expect(av._computeTerriaOrientation(45, 15, 5, 0, 0, 0)).closeOrientation(
      bod(18.0, -74.2, -63.7)
    );
    expect(av._computeTerriaOrientation(-45, 15, 5, 0, 0, 0)).closeOrientation(
      bod(18.0, -74.2, 26.3)
    );
    expect(av._computeTerriaOrientation(45, -15, 5, 0, 0, 0)).closeOrientation(
      bod(162.0, -74.2, 153.7)
    );
    expect(av._computeTerriaOrientation(-45, -15, 5, 0, 0, 0)).closeOrientation(
      bod(162.0, -74.2, -116.3)
    );
    expect(av._computeTerriaOrientation(45, 15, -5, 0, 0, 0)).closeOrientation(
      bod(-18.0, -74.2, -26.3)
    );
    expect(av._computeTerriaOrientation(-45, 15, -5, 0, 0, 0)).closeOrientation(
      bod(-18.0, -74.2, 63.7)
    );
    expect(av._computeTerriaOrientation(45, -15, -5, 0, 0, 0)).closeOrientation(
      bod(-162.0, -74.2, 116.3)
    );
    expect(
      av._computeTerriaOrientation(-45, -15, -5, 0, 0, 0)
    ).closeOrientation(bod(-162.0, -74.2, -153.7));

    // Check when the screen is rotated in one direction (note because of the order of operations these are just
    // changing the roll by 90 degrees on the above tests).
    expect(av._computeTerriaOrientation(0, 0, 0, 90, 0, 0)).closeOrientation(
      bod(90, -90, 0)
    );

    expect(av._computeTerriaOrientation(45, 0, 0, 90, 0, 0)).closeOrientation(
      bod(90, -90, -45)
    );
    expect(av._computeTerriaOrientation(0, 45, 0, 90, 0, 0)).closeOrientation(
      bod(90, -45, 0)
    );
    expect(av._computeTerriaOrientation(0, 0, 45, 90, 0, 0)).closeOrientation(
      bod(180, -45, -90)
    );

    expect(av._computeTerriaOrientation(45, 15, 0, 90, 0, 0)).closeOrientation(
      bod(90, -75, -45)
    );
    expect(av._computeTerriaOrientation(-45, 15, 0, 90, 0, 0)).closeOrientation(
      bod(90, -75, 45)
    );
    expect(av._computeTerriaOrientation(45, -15, 0, 90, 0, 0)).closeOrientation(
      bod(-90, -75, 135)
    );
    expect(
      av._computeTerriaOrientation(-45, -15, 0, 90, 0, 0)
    ).closeOrientation(bod(-90, -75, -135));

    expect(av._computeTerriaOrientation(45, 0, 15, 90, 0, 0)).closeOrientation(
      bod(180, -75, -135)
    );
    expect(av._computeTerriaOrientation(-45, 0, 15, 90, 0, 0)).closeOrientation(
      bod(180, -75, -45)
    );
    expect(av._computeTerriaOrientation(45, 0, -15, 90, 0, 0)).closeOrientation(
      bod(0, -75, 45)
    );
    expect(
      av._computeTerriaOrientation(-45, 0, -15, 90, 0, 0)
    ).closeOrientation(bod(0, -75, 135));

    expect(av._computeTerriaOrientation(0, 45, 15, 90, 0, 0)).closeOrientation(
      bod(104.5, -43.1, -20.8)
    );
    expect(av._computeTerriaOrientation(0, -45, 15, 90, 0, 0)).closeOrientation(
      bod(-104.5, -43.1, -159.2)
    );
    expect(av._computeTerriaOrientation(0, 45, -15, 90, 0, 0)).closeOrientation(
      bod(75.5, -43.1, 20.8)
    );
    expect(
      av._computeTerriaOrientation(0, -45, -15, 90, 0, 0)
    ).closeOrientation(bod(-75.5, -43.1, 159.2));

    // Check when the screen is rotated in one direction (note because of the order of operations these are just
    // changing the roll by 90 degrees on the above tests - or 180 degrees on the screen rotated in the other direction).
    expect(av._computeTerriaOrientation(0, 0, 0, -90, 0, 0)).closeOrientation(
      bod(-90, -90, 0)
    );

    expect(av._computeTerriaOrientation(45, 0, 0, -90, 0, 0)).closeOrientation(
      bod(-90, -90, -45)
    );
    expect(av._computeTerriaOrientation(0, 45, 0, -90, 0, 0)).closeOrientation(
      bod(-90, -45, 0)
    );
    expect(av._computeTerriaOrientation(0, 0, 45, -90, 0, 0)).closeOrientation(
      bod(0, -45, -90)
    );

    expect(av._computeTerriaOrientation(45, 15, 0, -90, 0, 0)).closeOrientation(
      bod(-90, -75, -45)
    );
    expect(
      av._computeTerriaOrientation(-45, 15, 0, -90, 0, 0)
    ).closeOrientation(bod(-90, -75, 45));
    expect(
      av._computeTerriaOrientation(45, -15, 0, -90, 0, 0)
    ).closeOrientation(bod(90, -75, 135));
    expect(
      av._computeTerriaOrientation(-45, -15, 0, -90, 0, 0)
    ).closeOrientation(bod(90, -75, -135));

    expect(av._computeTerriaOrientation(45, 0, 15, -90, 0, 0)).closeOrientation(
      bod(0, -75, -135)
    );
    expect(
      av._computeTerriaOrientation(-45, 0, 15, -90, 0, 0)
    ).closeOrientation(bod(0, -75, -45));
    expect(
      av._computeTerriaOrientation(45, 0, -15, -90, 0, 0)
    ).closeOrientation(bod(180, -75, 45));
    expect(
      av._computeTerriaOrientation(-45, 0, -15, -90, 0, 0)
    ).closeOrientation(bod(180, -75, 135));

    expect(av._computeTerriaOrientation(0, 45, 15, -90, 0, 0)).closeOrientation(
      bod(-75.5, -43.1, -20.8)
    );
    expect(
      av._computeTerriaOrientation(0, -45, 15, -90, 0, 0)
    ).closeOrientation(bod(75.5, -43.1, -159.2));
    expect(
      av._computeTerriaOrientation(0, 45, -15, -90, 0, 0)
    ).closeOrientation(bod(-104.5, -43.1, 20.8));
    expect(
      av._computeTerriaOrientation(0, -45, -15, -90, 0, 0)
    ).closeOrientation(bod(104.5, -43.1, 159.2));

    // Check when a manual realignment is set (check each of the different quadrents and check both signs).
    expect(av._computeTerriaOrientation(45, 30, 0, 0, 10, 5)).closeOrientation(
      bod(0, -60, -30)
    );
    expect(av._computeTerriaOrientation(-45, 30, 0, 0, 10, 5)).closeOrientation(
      bod(0, -60, 60)
    );
    expect(av._computeTerriaOrientation(45, -30, 0, 0, 10, 5)).closeOrientation(
      bod(180, -60, 150)
    );
    expect(
      av._computeTerriaOrientation(-45, -30, 0, 0, 10, 5)
    ).closeOrientation(bod(180, -60, -120));
    expect(av._computeTerriaOrientation(45, 30, 0, 0, 10, -5)).closeOrientation(
      bod(0, -60, -40)
    );
    expect(
      av._computeTerriaOrientation(-45, 30, 0, 0, 10, -5)
    ).closeOrientation(bod(0, -60, 50));
    expect(
      av._computeTerriaOrientation(45, -30, 0, 0, 10, -5)
    ).closeOrientation(bod(180, -60, 140));
    expect(
      av._computeTerriaOrientation(-45, -30, 0, 0, 10, -5)
    ).closeOrientation(bod(180, -60, -130));
    expect(av._computeTerriaOrientation(45, 30, 0, 0, -10, 5)).closeOrientation(
      bod(0, -60, -50)
    );
    expect(
      av._computeTerriaOrientation(-45, 30, 0, 0, -10, 5)
    ).closeOrientation(bod(0, -60, 40));
    expect(
      av._computeTerriaOrientation(45, -30, 0, 0, -10, 5)
    ).closeOrientation(bod(180, -60, 130));
    expect(
      av._computeTerriaOrientation(-45, -30, 0, 0, -10, 5)
    ).closeOrientation(bod(180, -60, -140));
    expect(
      av._computeTerriaOrientation(45, 30, 0, 0, -10, -5)
    ).closeOrientation(bod(0, -60, -60));
    expect(
      av._computeTerriaOrientation(-45, 30, 0, 0, -10, -5)
    ).closeOrientation(bod(0, -60, 30));
    expect(
      av._computeTerriaOrientation(45, -30, 0, 0, -10, -5)
    ).closeOrientation(bod(180, -60, 120));
    expect(
      av._computeTerriaOrientation(-45, -30, 0, 0, -10, -5)
    ).closeOrientation(bod(180, -60, -150));
    // Check when a manual realignment is set (check when we pass go past a quadrent on realignment, +/- 90 degrees on the above).
    expect(av._computeTerriaOrientation(45, 30, 0, 0, 100, 5)).closeOrientation(
      bod(0, -60, 60)
    );
    expect(
      av._computeTerriaOrientation(-45, 30, 0, 0, 100, 5)
    ).closeOrientation(bod(0, -60, 150));
    expect(
      av._computeTerriaOrientation(45, -30, 0, 0, 100, 5)
    ).closeOrientation(bod(180, -60, -120));
    expect(
      av._computeTerriaOrientation(-45, -30, 0, 0, 100, 5)
    ).closeOrientation(bod(180, -60, -30));
    expect(
      av._computeTerriaOrientation(45, 30, 0, 0, 100, -5)
    ).closeOrientation(bod(0, -60, 50));
    expect(
      av._computeTerriaOrientation(-45, 30, 0, 0, 100, -5)
    ).closeOrientation(bod(0, -60, 140));
    expect(
      av._computeTerriaOrientation(45, -30, 0, 0, 100, -5)
    ).closeOrientation(bod(180, -60, 230));
    expect(
      av._computeTerriaOrientation(-45, -30, 0, 0, 100, -5)
    ).closeOrientation(bod(180, -60, -40));
    expect(
      av._computeTerriaOrientation(45, 30, 0, 0, -100, 5)
    ).closeOrientation(bod(0, -60, -140));
    expect(
      av._computeTerriaOrientation(-45, 30, 0, 0, -100, 5)
    ).closeOrientation(bod(0, -60, -50));
    expect(
      av._computeTerriaOrientation(45, -30, 0, 0, -100, 5)
    ).closeOrientation(bod(180, -60, 40));
    expect(
      av._computeTerriaOrientation(-45, -30, 0, 0, -100, 5)
    ).closeOrientation(bod(180, -60, -230));
    expect(
      av._computeTerriaOrientation(45, 30, 0, 0, -100, -5)
    ).closeOrientation(bod(0, -60, -150));
    expect(
      av._computeTerriaOrientation(-45, 30, 0, 0, -100, -5)
    ).closeOrientation(bod(0, -60, -60));
    expect(
      av._computeTerriaOrientation(45, -30, 0, 0, -100, -5)
    ).closeOrientation(bod(180, -60, 30));
    expect(
      av._computeTerriaOrientation(-45, -30, 0, 0, -100, -5)
    ).closeOrientation(bod(180, -60, 120));
    // Check when a manual realignment is set (check when we pass go past a quadrent on realignment, +/- add 110 degrees on the first block).
    expect(
      av._computeTerriaOrientation(45, 30, 0, 0, 10, 115)
    ).closeOrientation(bod(0, -60, 80));
    expect(
      av._computeTerriaOrientation(-45, 30, 0, 0, 10, 115)
    ).closeOrientation(bod(0, -60, 170));
    expect(
      av._computeTerriaOrientation(45, -30, 0, 0, 10, 115)
    ).closeOrientation(bod(180, -60, -100));
    expect(
      av._computeTerriaOrientation(-45, -30, 0, 0, 10, 115)
    ).closeOrientation(bod(180, -60, -10));
    expect(
      av._computeTerriaOrientation(45, 30, 0, 0, 10, -115)
    ).closeOrientation(bod(0, -60, -150));
    expect(
      av._computeTerriaOrientation(-45, 30, 0, 0, 10, -115)
    ).closeOrientation(bod(0, -60, -60));
    expect(
      av._computeTerriaOrientation(45, -30, 0, 0, 10, -115)
    ).closeOrientation(bod(180, -60, 30));
    expect(
      av._computeTerriaOrientation(-45, -30, 0, 0, 10, -115)
    ).closeOrientation(bod(180, -60, 120));
    expect(
      av._computeTerriaOrientation(45, 30, 0, 0, -10, 115)
    ).closeOrientation(bod(0, -60, 60));
    expect(
      av._computeTerriaOrientation(-45, 30, 0, 0, -10, 115)
    ).closeOrientation(bod(0, -60, 150));
    expect(
      av._computeTerriaOrientation(45, -30, 0, 0, -10, 115)
    ).closeOrientation(bod(180, -60, -120));
    expect(
      av._computeTerriaOrientation(-45, -30, 0, 0, -10, 115)
    ).closeOrientation(bod(180, -60, -30));
    expect(
      av._computeTerriaOrientation(45, 30, 0, 0, -10, -115)
    ).closeOrientation(bod(0, -60, -170));
    expect(
      av._computeTerriaOrientation(-45, 30, 0, 0, -10, -115)
    ).closeOrientation(bod(0, -60, -80));
    expect(
      av._computeTerriaOrientation(45, -30, 0, 0, -10, -115)
    ).closeOrientation(bod(180, -60, 10));
    expect(
      av._computeTerriaOrientation(-45, -30, 0, 0, -10, -115)
    ).closeOrientation(bod(180, -60, 100));
  });
});

describeIfSupportsWebGL(
  "AugmentedVirtuality tests that require WebGL",
  function () {
    var container;
    var widget;
    var cesium;
    var terria;

    beforeEach(function () {
      container = document.createElement("div");
      document.body.appendChild(container);

      widget = new CesiumWidget(container, {
        imageryProvider: new TileCoordinatesImageryProvider()
      });
      terria = new Terria({
        baseUrl: "./"
      });
    });

    afterEach(function () {
      if (widget && !widget.isDestroyed()) {
        widget = widget.destroy();
      }
      document.body.removeChild(container);
    });

    it("check manual align set", function () {
      cesium = new Cesium(terria, widget);
      terria.currentViewer = cesium;
      terria.cesium = cesium;

      var av = new AugmentedVirtuality(terria);

      // Set inital state for test sanity.
      av.enabled = true;
      // Verify inital state for test sanity.
      expect(av.enabled).toEqual(true);
      expect(av.manualAlignment).toEqual(false);
      expect(av.manualAlignmentSet).toEqual(false);

      // Check start/stop manual alignment.
      av.manualAlignment = true;
      //     Move the camera so that the alignment is manually set.
      terria.cesium.viewer.camera.lookLeft(45);
      av.manualAlignment = false;
      expect(av.manualAlignmentSet).toEqual(true);

      // Check stop manual alignment.
      av.resetAlignment();
      expect(av.manualAlignmentSet).toEqual(false);

      // Set enabled to false so that when the widget is torn down there are not errors in other components.
      // Detail: Currently CesiumWidget.camera returns this._scene.camera without checking ._scene is defined, which it is not during tear down, and so results in "Uncaught TypeError: Cannot read property 'camera' of undefined".
      av.enabled = false;
    });
  }
);

// Determines whether the values are within eps of each other ignoring cyclic shifts (mod 2*PI). Expects values to be in radians.
function similarRadians(expected, actual, eps) {
  return Math.abs(CesiumMath.negativePiToPi(expected - actual)) <= eps;
}

// Build orientation from Degrees.
function bod(roll, pitch, heading) {
  roll = CesiumMath.toRadians(roll);
  pitch = CesiumMath.toRadians(pitch);
  heading = CesiumMath.toRadians(heading);
  return { orientation: { roll: roll, pitch: pitch, heading: heading } };
}

// Determines whether two orientations (object with .orientation.roll, .orientation.pitch and .orientation.heading) with
// angles specified as radians are silimar or not.
// Note: This matcher is somewhat fragile in that is matches specific values and doesn't consider singularities (where
//       multiple values could have different number but correspond to the same orientation). If the implementation is
//       updated in the future should consider updating this function so that it treats singularites correctly and then
//       the tests can remain the same (this may need to be aware of the frame of reference...which might make this
//       option less practical).
var customMatchers = {
  closeOrientation: function (util, customEqualityTesters) {
    return {
      compare: function (actual, expected) {
        var result = {};
        result.pass = true;
        result.message = "";

        if (!defined(actual.orientation)) {
          result.pass = false;
          result.message += "Expected " + actual + " to contain .orientation. ";
        }
        if (!defined(expected.orientation)) {
          result.pass = false;
          result.message +=
            "Expected " + expected + " to contain .orientation. ";
        }

        if (result.pass) {
          if (!defined(actual.orientation.roll)) {
            result.pass = false;
            result.message +=
              "Expected " + actual + " to contain .orientation.roll. ";
          }
          if (!defined(actual.orientation.pitch)) {
            result.pass = false;
            result.message +=
              "Expected " + actual + " to contain .orientation.pitch. ";
          }
          if (!defined(actual.orientation.heading)) {
            result.pass = false;
            result.message +=
              "Expected " + actual + " to contain .orientation.heading. ";
          }

          if (!defined(expected.orientation.roll)) {
            result.pass = false;
            result.message +=
              "Expected " + expected + " to contain .orientation.roll. ";
          }
          if (!defined(expected.orientation.pitch)) {
            result.pass = false;
            result.message +=
              "Expected " + expected + " to contain .orientation.pitch. ";
          }
          if (!defined(expected.orientation.heading)) {
            result.pass = false;
            result.message +=
              "Expected " + expected + " to contain .orientation.heading. ";
          }
        }

        if (result.pass) {
          for (let i = 0; i < 3; i++) {
            let expectedValue;
            let actualValue;

            switch (i) {
              case 0:
                expectedValue = expected.orientation.roll;
                actualValue = actual.orientation.roll;
                break;
              case 1:
                expectedValue = expected.orientation.pitch;
                actualValue = actual.orientation.pitch;
                break;
              case 2:
                expectedValue = expected.orientation.heading;
                actualValue = actual.orientation.heading;
                break;
            }

            if (!similarRadians(actualValue, expectedValue, 0.001)) {
              result.pass = false;
              const difference = CesiumMath.negativePiToPi(
                expectedValue - actualValue
              );
              result.message +=
                "Expected roll value " +
                actualValue +
                " to be " +
                expectedValue +
                " (difference was " +
                difference +
                " radians, " +
                CesiumMath.toDegrees(difference) +
                " degrees). ";
            }
          }
        }

        return result;
      }
    };
  }
};
