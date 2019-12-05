/*global require*/
"use strict";
import i18next from "i18next";
var CallbackProperty = require("terriajs-cesium/Source/DataSources/CallbackProperty")
  .default;
var CesiumMath = require("terriajs-cesium/Source/Core/Math").default;
var Color = require("terriajs-cesium/Source/Core/Color").default;
var CustomDataSource = require("terriajs-cesium/Source/DataSources/CustomDataSource")
  .default;
var defaultValue = require("terriajs-cesium/Source/Core/defaultValue").default;
var defined = require("terriajs-cesium/Source/Core/defined").default;
var KeyboardEventModifier = require("terriajs-cesium/Source/Core/KeyboardEventModifier")
  .default;
var Rectangle = require("terriajs-cesium/Source/Core/Rectangle").default;
var ScreenSpaceEventHandler = require("terriajs-cesium/Source/Core/ScreenSpaceEventHandler")
  .default;
var ScreenSpaceEventType = require("terriajs-cesium/Source/Core/ScreenSpaceEventType")
  .default;

// -------------------------------------------
// DrawExtentHelper from the cesium sample code
// modified to be available with a keyboard modifier
// on left-click - default is SHIFT
// -------------------------------------------
var DrawExtentHelper = function(terria, scene, handler, keyboardModifier) {
  this._terria = terria;
  this._scene = scene;
  this._ellipsoid = scene.globe.ellipsoid;
  this._finishHandler = handler;
  this._mouseHandler = new ScreenSpaceEventHandler(scene.canvas, false);
  this._stopHandler = undefined;
  this._interHandler = undefined;
  this._dataSource = undefined;
  this._click1 = undefined;
  this._click2 = undefined;
  this.active = false;
  this.keyboardModifier = defaultValue(
    keyboardModifier,
    KeyboardEventModifier.SHIFT
  );
};

DrawExtentHelper.prototype.enableInput = function() {
  var controller = this._scene.screenSpaceCameraController;
  controller.enableInputs = true;
};

DrawExtentHelper.prototype.disableInput = function() {
  var controller = this._scene.screenSpaceCameraController;
  controller.enableInputs = false;
};

DrawExtentHelper.prototype.getExtent = function(mn, mx) {
  // Re-order south < north
  var south = Math.min(mn.latitude, mx.latitude);
  var north = Math.max(mn.latitude, mx.latitude);

  var west = Math.min(mn.longitude, mx.longitude);
  var east = Math.max(mn.longitude, mx.longitude);

  // If east-west is more than half the world, flip them.
  if (east - west > Math.PI) {
    west = Math.max(mn.longitude, mx.longitude);
    east = Math.min(mn.longitude, mx.longitude);
  }

  // Check for approx equal (shouldn't require abs due to re-order)
  var epsilon = CesiumMath.EPSILON6;

  if (Math.abs(east - west) < epsilon) {
    east += epsilon * 2.0;
  }

  if (Math.abs(north - south) < epsilon) {
    north += epsilon * 2.0;
  }

  return new Rectangle(west, south, east, north);
};

DrawExtentHelper.prototype.handleRegionStop = function(movement) {
  if (defined(this._dataSource)) {
    this._terria.dataSources.remove(this._dataSource, true);
    this._dataSource = undefined;
  }

  this._mouseHandler.removeInputAction(
    ScreenSpaceEventType.LEFT_UP,
    this.keyboardModifier
  );
  this._mouseHandler.removeInputAction(
    ScreenSpaceEventType.MOUSE_MOVE,
    this.keyboardModifier
  );
  this._mouseHandler.removeInputAction(ScreenSpaceEventType.LEFT_UP);
  this._mouseHandler.removeInputAction(ScreenSpaceEventType.MOUSE_MOVE);

  this.enableInput();
  var ext;
  if (movement) {
    var pickRay = this._scene.camera.getPickRay(movement.position);
    var cartesian = this._scene.globe.pick(pickRay, this._scene);
    if (cartesian) {
      this._click2 = this._ellipsoid.cartesianToCartographic(cartesian);
    }
    ext = this.getExtent(this._click1, this._click2);
  }
  this._scene.primitives.remove(this._extentPrimitive);
  this.active = false;
  this._finishHandler(ext);
};

DrawExtentHelper.prototype.handleRegionInter = function(movement) {
  var pickRay = this._scene.camera.getPickRay(movement.endPosition);
  var cartesian = this._scene.globe.pick(pickRay, this._scene);
  if (cartesian) {
    var cartographic = this._ellipsoid.cartesianToCartographic(cartesian);
    this._click2 = cartographic;
  }
};

DrawExtentHelper.prototype.handleRegionStart = function(movement) {
  var pickRay = this._scene.camera.getPickRay(movement.position);
  var cartesian = this._scene.globe.pick(pickRay, this._scene);
  if (cartesian) {
    this.disableInput();
    this.active = true;

    if (!defined(this._dataSource)) {
      var that = this;

      this._click1 = undefined;
      this._click2 = undefined;

      this._dataSource = new CustomDataSource(
        i18next.t("map.drawExtentHelper.drawExtent")
      );
      this._dataSource.entities.add({
        name: i18next.t("map.drawExtentHelper.extent"),
        rectangle: {
          coordinates: new CallbackProperty(function(date, result) {
            if (defined(that._click1) && defined(that._click2)) {
              return that.getExtent(that._click1, that._click2);
            }
          }, false),
          material: new Color(1.0, 1.0, 1.0, 0.5)
        }
      });
      this._terria.dataSources.add(this._dataSource);
    }

    this._click1 = this._ellipsoid.cartesianToCartographic(cartesian);

    this._mouseHandler.setInputAction(
      function(movement) {
        that.handleRegionStop(movement);
      },
      ScreenSpaceEventType.LEFT_UP,
      this.keyboardModifier
    );
    this._mouseHandler.setInputAction(
      function(movement) {
        that.handleRegionInter(movement);
      },
      ScreenSpaceEventType.MOUSE_MOVE,
      this.keyboardModifier
    );
    this._mouseHandler.setInputAction(function(movement) {
      that.handleRegionStop(movement);
    }, ScreenSpaceEventType.LEFT_UP);
    this._mouseHandler.setInputAction(function(movement) {
      that.handleRegionInter(movement);
    }, ScreenSpaceEventType.MOUSE_MOVE);
  }
};

DrawExtentHelper.prototype.start = function() {
  var that = this;

  // Now wait for start
  this._mouseHandler.setInputAction(
    function(movement) {
      that.handleRegionStart(movement);
    },
    ScreenSpaceEventType.LEFT_DOWN,
    this.keyboardModifier
  );
};

DrawExtentHelper.prototype.destroy = function() {
  this._mouseHandler.destroy();
  this._scene = undefined;
};

module.exports = DrawExtentHelper;
