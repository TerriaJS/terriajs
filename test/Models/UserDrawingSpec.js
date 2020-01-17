"use strict";

/*global require,describe,xdescribe,it,expect*/
var UserDrawing = require("../../lib/Models/UserDrawing");
var Terria = require("../../lib/Models/Terria");
var Cesium = require("../../lib/Models/Cesium");
var PickedFeatures = require("../../lib/Map/PickedFeatures");
var Cartesian3 = require("terriajs-cesium/Source/Core/Cartesian3").default;
var Ellipsoid = require("terriajs-cesium/Source/Core/Ellipsoid.js").default;
var CesiumWidget = require("terriajs-cesium/Source/Widgets/CesiumWidget/CesiumWidget")
  .default;
var TileCoordinatesImageryProvider = require("terriajs-cesium/Source/Scene/TileCoordinatesImageryProvider")
  .default;
var Cartographic = require("terriajs-cesium/Source/Core/Cartographic").default;
var CesiumMath = require("terriajs-cesium/Source/Core/Math").default;
var supportsWebGL = require("../../lib/Core/supportsWebGL");

var describeIfSupported = supportsWebGL() ? describe : xdescribe;

describeIfSupported("UserDrawing that requires WebGL", function() {
  var container;
  var widget;
  var cesium;
  var terria;

  beforeEach(function() {
    container = document.createElement("div");
    document.body.appendChild(container);

    widget = new CesiumWidget(container, {
      imageryProvider: new TileCoordinatesImageryProvider()
    });
    terria = new Terria({
      baseUrl: "./"
    });
  });

  afterEach(function() {
    if (widget && !widget.isDestroyed()) {
      widget = widget.destroy();
    }
    document.body.removeChild(container);
  });

  it("changes cursor to crosshair when entering drawing mode", function() {
    cesium = new Cesium(terria, widget);
    terria.currentViewer = cesium;
    terria.cesium = cesium;

    var options = { terria: terria };
    var userDrawing = new UserDrawing(options);
    expect(userDrawing.terria.cesium.viewer.canvas.style.cursor).toEqual("");
    userDrawing.enterDrawMode();
    expect(userDrawing.terria.cesium.viewer.canvas.style.cursor).toEqual(
      "crosshair"
    );
    userDrawing._cleanUp();
    expect(userDrawing.terria.cesium.viewer.canvas.style.cursor).toEqual(
      "auto"
    );
  });
});

describe("UserDrawing", function() {
  var terria;

  beforeEach(function() {
    terria = new Terria({
      baseUrl: "./"
    });
  });

  it("will use default options if options are not specified", function() {
    var options = { terria: terria };
    var userDrawing = new UserDrawing(options);

    expect(userDrawing._getDialogMessage()).toEqual(
      "<div><strong>Draw on Map</strong></br><i>Click to add a point</i></div>"
    );
  });

  it("getDialogMessage contains callback message if callback is specified", function() {
    var options = {
      terria: terria,
      onMakeDialogMessage: function() {
        return "HELLO";
      }
    };
    var userDrawing = new UserDrawing(options);

    expect(userDrawing._getDialogMessage()).toEqual(
      "<div><strong>Draw on Map</strong></br>HELLO</br><i>Click to add a point</i></div>"
    );
  });

  it("listens for user picks on map after entering drawing mode", function() {
    var options = { terria: terria };
    var userDrawing = new UserDrawing(options);
    expect(userDrawing.terria.mapInteractionModeStack.length).toEqual(0);
    userDrawing.enterDrawMode();
    expect(userDrawing.terria.mapInteractionModeStack.length).toEqual(1);
  });

  it("disables feature info requests when in drawing mode", function() {
    var options = { terria: terria };
    var userDrawing = new UserDrawing(options);
    expect(userDrawing.terria.allowFeatureInfoRequests).toEqual(true);
    userDrawing.enterDrawMode();
    expect(userDrawing.terria.allowFeatureInfoRequests).toEqual(false);
  });

  it("re-enables feature info requests on cleanup", function() {
    var options = { terria: terria };
    var userDrawing = new UserDrawing(options);
    userDrawing.enterDrawMode();
    expect(userDrawing.terria.allowFeatureInfoRequests).toEqual(false);
    userDrawing._cleanUp();
    expect(userDrawing.terria.allowFeatureInfoRequests).toEqual(true);
  });

  it("ensures onPointClicked callback is called when point is picked by user", function() {
    var Callback = function() {
      this.pointEntities = 0;
      var that = this;
      this.callback = function(pointEntities) {
        that.pointEntities = pointEntities.entities.values.length;
      };
    };
    var callback = new Callback();
    var options = { terria: terria, onPointClicked: callback.callback };
    var userDrawing = new UserDrawing(options);
    expect(callback.pointEntities).toEqual(0);
    userDrawing.enterDrawMode();
    var pickedFeatures = new PickedFeatures();
    // Auckland, in case you're wondering
    pickedFeatures.pickPosition = new Cartesian3(
      -5088454.576893678,
      465233.10329933715,
      -3804299.6786334896
    );
    pickedFeatures.allFeaturesAvailablePromise = true;
    userDrawing.terria.mapInteractionModeStack[0].pickedFeatures = pickedFeatures;
    expect(callback.pointEntities).toEqual(1);
  });

  it("ensures graphics are added when point is picked by user", function() {
    var options = { terria: terria };
    var userDrawing = new UserDrawing(options);
    expect(userDrawing.pointEntities.entities.values.length).toEqual(0);
    expect(userDrawing.otherEntities.entities.values.length).toEqual(0);
    userDrawing.enterDrawMode();
    var pickedFeatures = new PickedFeatures();
    // Auckland, in case you're wondering
    pickedFeatures.pickPosition = new Cartesian3(
      -5088454.576893678,
      465233.10329933715,
      -3804299.6786334896
    );
    pickedFeatures.allFeaturesAvailablePromise = true;
    userDrawing.terria.mapInteractionModeStack[0].pickedFeatures = pickedFeatures;
    expect(userDrawing.pointEntities.entities.values.length).toEqual(1);
    expect(userDrawing.otherEntities.entities.values.length).toEqual(1);
  });

  it("ensures graphics are updated when points change", function() {
    var options = { terria: terria };
    var userDrawing = new UserDrawing(options);
    expect(userDrawing.pointEntities.entities.values.length).toEqual(0);
    expect(userDrawing.otherEntities.entities.values.length).toEqual(0);

    userDrawing.enterDrawMode();
    var pickedFeatures = new PickedFeatures();
    // Auckland, in case you're wondering
    var x = -5088454.576893678;
    var y = 465233.10329933715;
    var z = -3804299.6786334896;

    pickedFeatures.pickPosition = new Cartesian3(x, y, z);
    pickedFeatures.allFeaturesAvailablePromise = true;
    userDrawing.terria.mapInteractionModeStack[0].pickedFeatures = pickedFeatures;

    // Check point
    var currentPoint = userDrawing.pointEntities.entities.values[0];
    var currentPointPos = currentPoint.position.getValue(
      terria.clock.currentTime
    );
    expect(currentPointPos.x).toEqual(x);
    expect(currentPointPos.y).toEqual(y);
    expect(currentPointPos.z).toEqual(z);

    // Check line as well
    var lineEntity = userDrawing.otherEntities.entities.values[0];
    currentPointPos = lineEntity.polyline.positions.getValue(
      terria.clock.currentTime
    )[0];
    expect(currentPointPos.x).toEqual(x);
    expect(currentPointPos.y).toEqual(y);
    expect(currentPointPos.z).toEqual(z);

    // Okay, now change points. LA.
    var newPickedFeatures = new PickedFeatures();
    var newX = -2503231.890682526;
    var newY = -4660863.528418564;
    var newZ = 3551306.84427321;
    newPickedFeatures.pickPosition = new Cartesian3(newX, newY, newZ);
    newPickedFeatures.allFeaturesAvailablePromise = true;
    userDrawing.terria.mapInteractionModeStack[0].pickedFeatures = newPickedFeatures;

    // Check point
    var newPoint = userDrawing.pointEntities.entities.values[1];
    var newPointPos = newPoint.position.getValue(terria.clock.currentTime);
    expect(newPointPos.x).toEqual(newX);
    expect(newPointPos.y).toEqual(newY);
    expect(newPointPos.z).toEqual(newZ);

    // Check line as well
    lineEntity = userDrawing.otherEntities.entities.values[0];
    newPointPos = lineEntity.polyline.positions.getValue(
      terria.clock.currentTime
    )[1];
    expect(newPointPos.x).toEqual(newX);
    expect(newPointPos.y).toEqual(newY);
    expect(newPointPos.z).toEqual(newZ);
  });

  it("returns correct button text for any given number of points on map", function() {
    var options = { terria: terria };
    var userDrawing = new UserDrawing(options);

    expect(userDrawing._getButtonText()).toEqual("Cancel");
    userDrawing.pointEntities.entities.values.push(1);
    expect(userDrawing._getButtonText()).toEqual("Cancel");
    userDrawing.pointEntities.entities.values.push(1);
    expect(userDrawing._getButtonText()).toEqual("Done");
  });

  it("cleans up when cleanup is called", function() {
    var options = { terria: terria };
    var userDrawing = new UserDrawing(options);
    expect(userDrawing.pointEntities.entities.values.length).toEqual(0);
    expect(userDrawing.otherEntities.entities.values.length).toEqual(0);
    userDrawing.enterDrawMode();

    var pickedFeatures = new PickedFeatures();
    // Auckland, in case you're wondering
    pickedFeatures.pickPosition = new Cartesian3(
      -5088454.576893678,
      465233.10329933715,
      -3804299.6786334896
    );
    pickedFeatures.allFeaturesAvailablePromise = true;
    userDrawing.terria.mapInteractionModeStack[0].pickedFeatures = pickedFeatures;

    expect(userDrawing.pointEntities.entities.values.length).toEqual(1);
    expect(userDrawing.otherEntities.entities.values.length).toEqual(1);

    userDrawing._cleanUp();
    expect(userDrawing.pointEntities.entities.values.length).toEqual(0);
    expect(userDrawing.otherEntities.entities.values.length).toEqual(0);
    expect(userDrawing.inDrawMode).toBeFalsy();
    expect(userDrawing.closeLoop).toBeFalsy();
  });

  it("ensures onCleanUp callback is called when clean up occurs", function() {
    var Callback = function() {
      this.called = false;
      var that = this;
      this.callback = function() {
        that.called = true;
      };
    };
    var callback = new Callback();
    var options = { terria: terria, onCleanUp: callback.callback };
    var userDrawing = new UserDrawing(options);
    userDrawing.enterDrawMode();
    expect(callback.called).toBeFalsy();
    userDrawing._cleanUp();
    expect(callback.called).toBeTruthy();
  });

  it("function clickedExistingPoint detects and handles if existing point is clicked", function() {
    var options = { terria: terria };
    var userDrawing = new UserDrawing(options);
    userDrawing.enterDrawMode();
    var pickedFeatures = new PickedFeatures();

    // First point
    // Points around Parliament house
    var pt1Position = new Cartographic(
      CesiumMath.toRadians(149.121),
      CesiumMath.toRadians(-35.309),
      CesiumMath.toRadians(0)
    );
    var pt1CartesianPosition = Ellipsoid.WGS84.cartographicToCartesian(
      pt1Position
    );
    pickedFeatures.pickPosition = pt1CartesianPosition;
    pickedFeatures.allFeaturesAvailablePromise = true;
    userDrawing.terria.mapInteractionModeStack[0].pickedFeatures = pickedFeatures;

    // Second point
    var pt2Position = new Cartographic(
      CesiumMath.toRadians(149.124),
      CesiumMath.toRadians(-35.311),
      CesiumMath.toRadians(0)
    );
    var pt2CartesianPosition = Ellipsoid.WGS84.cartographicToCartesian(
      pt2Position
    );
    pickedFeatures.pickPosition = pt2CartesianPosition;
    userDrawing.terria.mapInteractionModeStack[0].pickedFeatures = pickedFeatures;

    // Third point
    var pt3Position = new Cartographic(
      CesiumMath.toRadians(149.127),
      CesiumMath.toRadians(-35.308),
      CesiumMath.toRadians(0)
    );
    var pt3CartesianPosition = Ellipsoid.WGS84.cartographicToCartesian(
      pt3Position
    );
    pickedFeatures.pickPosition = pt3CartesianPosition;
    userDrawing.terria.mapInteractionModeStack[0].pickedFeatures = pickedFeatures;
    expect(userDrawing.closeLoop).toBeFalsy();

    // Now pick the first point
    pickedFeatures.pickPosition = pt1CartesianPosition;
    pickedFeatures.allFeaturesAvailablePromise = true;
    // If in the UI the user clicks on a point, it returns that entity, so we're pulling it out of userDrawing and
    // pretending the user actually clicked on it.
    var pt1Entity = userDrawing.pointEntities.entities.values[0];
    pickedFeatures.features = [pt1Entity];
    userDrawing.terria.mapInteractionModeStack[0].pickedFeatures = pickedFeatures;

    expect(userDrawing.closeLoop).toBeTruthy();
    expect(userDrawing.pointEntities.entities.values.length).toEqual(3);
  });

  it("loop does not close if polygon is not allowed", function() {
    var options = { terria: terria, allowPolygon: false };
    var userDrawing = new UserDrawing(options);
    userDrawing.enterDrawMode();
    var pickedFeatures = new PickedFeatures();

    // First point
    // Points around Parliament house
    var pt1Position = new Cartographic(
      CesiumMath.toRadians(149.121),
      CesiumMath.toRadians(-35.309),
      CesiumMath.toRadians(0)
    );
    var pt1CartesianPosition = Ellipsoid.WGS84.cartographicToCartesian(
      pt1Position
    );
    pickedFeatures.pickPosition = pt1CartesianPosition;
    pickedFeatures.allFeaturesAvailablePromise = true;
    userDrawing.terria.mapInteractionModeStack[0].pickedFeatures = pickedFeatures;

    // Second point
    var pt2Position = new Cartographic(
      CesiumMath.toRadians(149.124),
      CesiumMath.toRadians(-35.311),
      CesiumMath.toRadians(0)
    );
    var pt2CartesianPosition = Ellipsoid.WGS84.cartographicToCartesian(
      pt2Position
    );
    pickedFeatures.pickPosition = pt2CartesianPosition;
    userDrawing.terria.mapInteractionModeStack[0].pickedFeatures = pickedFeatures;

    // Third point
    var pt3Position = new Cartographic(
      CesiumMath.toRadians(149.127),
      CesiumMath.toRadians(-35.308),
      CesiumMath.toRadians(0)
    );
    var pt3CartesianPosition = Ellipsoid.WGS84.cartographicToCartesian(
      pt3Position
    );
    pickedFeatures.pickPosition = pt3CartesianPosition;
    userDrawing.terria.mapInteractionModeStack[0].pickedFeatures = pickedFeatures;
    expect(userDrawing.closeLoop).toBeFalsy();

    // Now pick the first point
    pickedFeatures.pickPosition = pt1CartesianPosition;
    pickedFeatures.allFeaturesAvailablePromise = true;
    // If in the UI the user clicks on a point, it returns that entity, so we're pulling it out of userDrawing and
    // pretending the user actually clicked on it.
    var pt1Entity = userDrawing.pointEntities.entities.values[0];
    pickedFeatures.features = [pt1Entity];
    userDrawing.terria.mapInteractionModeStack[0].pickedFeatures = pickedFeatures;

    expect(userDrawing.closeLoop).toBeFalsy();
    expect(userDrawing.pointEntities.entities.values.length).toEqual(2);
  });

  it("polygon is only drawn once", function() {
    var options = { terria: terria };
    var userDrawing = new UserDrawing(options);
    userDrawing.enterDrawMode();
    var pickedFeatures = new PickedFeatures();

    // First point
    // Points around Parliament house
    var pt1Position = new Cartographic(
      CesiumMath.toRadians(149.121),
      CesiumMath.toRadians(-35.309),
      CesiumMath.toRadians(0)
    );
    var pt1CartesianPosition = Ellipsoid.WGS84.cartographicToCartesian(
      pt1Position
    );
    pickedFeatures.pickPosition = pt1CartesianPosition;
    pickedFeatures.allFeaturesAvailablePromise = true;
    userDrawing.terria.mapInteractionModeStack[0].pickedFeatures = pickedFeatures;

    // Second point
    var pt2Position = new Cartographic(
      CesiumMath.toRadians(149.124),
      CesiumMath.toRadians(-35.311),
      CesiumMath.toRadians(0)
    );
    var pt2CartesianPosition = Ellipsoid.WGS84.cartographicToCartesian(
      pt2Position
    );
    pickedFeatures.pickPosition = pt2CartesianPosition;
    userDrawing.terria.mapInteractionModeStack[0].pickedFeatures = pickedFeatures;

    // Third point
    var pt3Position = new Cartographic(
      CesiumMath.toRadians(149.127),
      CesiumMath.toRadians(-35.308),
      CesiumMath.toRadians(0)
    );
    var pt3CartesianPosition = Ellipsoid.WGS84.cartographicToCartesian(
      pt3Position
    );
    pickedFeatures.pickPosition = pt3CartesianPosition;
    userDrawing.terria.mapInteractionModeStack[0].pickedFeatures = pickedFeatures;
    expect(userDrawing.closeLoop).toBeFalsy();
    expect(userDrawing.otherEntities.entities.values.length).toEqual(1);

    // Now pick the first point
    pickedFeatures.pickPosition = pt1CartesianPosition;
    pickedFeatures.allFeaturesAvailablePromise = true;
    // If in the UI the user clicks on a point, it returns that entity, so we're pulling it out of userDrawing and
    // pretending the user actually clicked on it.
    var pt1Entity = userDrawing.pointEntities.entities.values[0];
    pickedFeatures.features = [pt1Entity];
    userDrawing.terria.mapInteractionModeStack[0].pickedFeatures = pickedFeatures;
    expect(userDrawing.closeLoop).toBeTruthy();
    expect(userDrawing.otherEntities.entities.values.length).toEqual(2);

    // Another point. Polygon is still closed.
    var newPtPosition = new Cartographic(
      CesiumMath.toRadians(149.0),
      CesiumMath.toRadians(-35.0),
      CesiumMath.toRadians(0)
    );
    var newPtCartesianPosition = Ellipsoid.WGS84.cartographicToCartesian(
      newPtPosition
    );
    pickedFeatures.pickPosition = newPtCartesianPosition;
    userDrawing.terria.mapInteractionModeStack[0].pickedFeatures = pickedFeatures;

    expect(userDrawing.closeLoop).toBeTruthy();
    expect(userDrawing.otherEntities.entities.values.length).toEqual(2);
  });

  it("point is removed if it is clicked on and it is not the first point", function() {
    var options = { terria: terria };
    var userDrawing = new UserDrawing(options);
    userDrawing.enterDrawMode();
    var pickedFeatures = new PickedFeatures();

    // First point
    // Points around Parliament house
    var pt1Position = new Cartographic(
      CesiumMath.toRadians(149.121),
      CesiumMath.toRadians(-35.309),
      CesiumMath.toRadians(0)
    );
    var pt1CartesianPosition = Ellipsoid.WGS84.cartographicToCartesian(
      pt1Position
    );
    pickedFeatures.pickPosition = pt1CartesianPosition;
    pickedFeatures.allFeaturesAvailablePromise = true;
    userDrawing.terria.mapInteractionModeStack[0].pickedFeatures = pickedFeatures;

    // Second point
    var pt2Position = new Cartographic(
      CesiumMath.toRadians(149.124),
      CesiumMath.toRadians(-35.311),
      CesiumMath.toRadians(0)
    );
    var pt2CartesianPosition = Ellipsoid.WGS84.cartographicToCartesian(
      pt2Position
    );
    pickedFeatures.pickPosition = pt2CartesianPosition;
    userDrawing.terria.mapInteractionModeStack[0].pickedFeatures = pickedFeatures;

    // Third point
    var pt3Position = new Cartographic(
      CesiumMath.toRadians(149.127),
      CesiumMath.toRadians(-35.308),
      CesiumMath.toRadians(0)
    );
    var pt3CartesianPosition = Ellipsoid.WGS84.cartographicToCartesian(
      pt3Position
    );
    pickedFeatures.pickPosition = pt3CartesianPosition;
    userDrawing.terria.mapInteractionModeStack[0].pickedFeatures = pickedFeatures;
    expect(userDrawing.closeLoop).toBeFalsy();

    // Now pick the second point
    pickedFeatures.pickPosition = pt2CartesianPosition;
    pickedFeatures.allFeaturesAvailablePromise = true;
    // If in the UI the user clicks on a point, it returns that entity, so we're pulling it out of userDrawing and
    // pretending the user actually clicked on it.
    var pt2Entity = userDrawing.pointEntities.entities.values[1];
    pickedFeatures.features = [pt2Entity];
    userDrawing.terria.mapInteractionModeStack[0].pickedFeatures = pickedFeatures;

    expect(userDrawing.pointEntities.entities.values.length).toEqual(2);
  });
});
