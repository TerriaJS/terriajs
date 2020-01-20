"use strict";

/*global require*/
var BoundingSphere = require("terriajs-cesium/Source/Core/BoundingSphere")
  .default;
var BoundingSphereState = require("terriajs-cesium/Source/DataSources/BoundingSphereState")
  .default;
var Cartesian2 = require("terriajs-cesium/Source/Core/Cartesian2").default;
var Cartesian3 = require("terriajs-cesium/Source/Core/Cartesian3").default;
var Cartographic = require("terriajs-cesium/Source/Core/Cartographic").default;
var CesiumMath = require("terriajs-cesium/Source/Core/Math").default;
var defaultValue = require("terriajs-cesium/Source/Core/defaultValue").default;
var defined = require("terriajs-cesium/Source/Core/defined").default;
var destroyObject = require("terriajs-cesium/Source/Core/destroyObject")
  .default;
var DeveloperError = require("terriajs-cesium/Source/Core/DeveloperError")
  .default;
var Ellipsoid = require("terriajs-cesium/Source/Core/Ellipsoid").default;
var Entity = require("terriajs-cesium/Source/DataSources/Entity").default;
var formatError = require("terriajs-cesium/Source/Core/formatError").default;
var getTimestamp = require("terriajs-cesium/Source/Core/getTimestamp").default;
var HeadingPitchRange = require("terriajs-cesium/Source/Core/HeadingPitchRange")
  .default;
var ImageryLayer = require("terriajs-cesium/Source/Scene/ImageryLayer").default;
var JulianDate = require("terriajs-cesium/Source/Core/JulianDate").default;
var knockout = require("terriajs-cesium/Source/ThirdParty/knockout").default;
var loadWithXhr = require("../Core/loadWithXhr");
var Matrix4 = require("terriajs-cesium/Source/Core/Matrix4").default;
var Rectangle = require("terriajs-cesium/Source/Core/Rectangle").default;
var sampleTerrain = require("terriajs-cesium/Source/Core/sampleTerrain")
  .default;
var SceneTransforms = require("terriajs-cesium/Source/Scene/SceneTransforms")
  .default;
var ScreenSpaceEventType = require("terriajs-cesium/Source/Core/ScreenSpaceEventType")
  .default;
var TaskProcessor = require("terriajs-cesium/Source/Core/TaskProcessor")
  .default;
var Transforms = require("terriajs-cesium/Source/Core/Transforms").default;
var when = require("terriajs-cesium/Source/ThirdParty/when").default;
var EventHelper = require("terriajs-cesium/Source/Core/EventHelper").default;
var ImagerySplitDirection = require("terriajs-cesium/Source/Scene/ImagerySplitDirection")
  .default;

var CesiumSelectionIndicator = require("../Map/CesiumSelectionIndicator");
var Feature = require("./Feature");
var GlobeOrMap = require("./GlobeOrMap");
var inherit = require("../Core/inherit");
var pollToPromise = require("../Core/pollToPromise");
var TerriaError = require("../Core/TerriaError");
var PickedFeatures = require("../Map/PickedFeatures");
var ViewerMode = require("./ViewerMode");
var i18next = require("i18next").default;

/**
 * The Cesium viewer component
 *
 * @alias Cesium
 * @constructor
 * @extends GlobeOrMap
 *
 * @param {Terria} terria The Terria instance.
 * @param {Viewer} viewer The Cesium viewer instance.
 */
var Cesium = function(terria, viewer) {
  GlobeOrMap.call(this, terria);

  /**
   * Gets or sets the Cesium {@link Viewer} instance.
   * @type {Viewer}
   */
  this.viewer = viewer;

  /**
   * Gets or sets the Cesium {@link Scene} instance.
   * @type {Scene}
   */
  this.scene = viewer.scene;

  /**
   * Gets or sets whether the viewer has stopped rendering since startup or last set to false.
   * @type {Boolean}
   */
  this.stoppedRendering = false;

  /**
   * Gets or sets whether to output info to the console when starting and stopping rendering loop.
   * @type {Boolean}
   */
  this.verboseRendering = false;

  /**
   * Gets or sets whether this viewer _can_ show a splitter.
   * @type {Boolean}
   */
  this.canShowSplitter = true;

  /**
   * Gets the {@link DataSourceDisplay} used to render a {@link DataSource}.
   * @type {DataSourceDisplay}
   */
  this.dataSourceDisplay = undefined;

  this._lastClockTime = new JulianDate(0, 0.0);
  this._lastCameraViewMatrix = new Matrix4();
  this._lastCameraMoveTime = 0;

  this._selectionIndicator = new CesiumSelectionIndicator(this);

  this._removePostRenderListener = this.scene.postRender.addEventListener(
    postRender.bind(undefined, this)
  );
  this._removeInfoBoxCloseListener = undefined;
  this._boundNotifyRepaintRequired = this.notifyRepaintRequired.bind(this);

  this._pauseMapInteractionCount = 0;

  this.scene.imagerySplitPosition = this.terria.splitPosition;

  this.supportsPolylinesOnTerrain = this.scene.context.depthTexture;

  // Handle left click by picking objects from the map.
  viewer.screenSpaceEventHandler.setInputAction(
    function(e) {
      this.pickFromScreenPosition(e.position);
    }.bind(this),
    ScreenSpaceEventType.LEFT_CLICK
  );

  // Force a repaint when the mouse moves or the window changes size.
  var canvas = this.viewer.canvas;
  canvas.addEventListener("mousemove", this._boundNotifyRepaintRequired, false);
  canvas.addEventListener("mousedown", this._boundNotifyRepaintRequired, false);
  canvas.addEventListener("mouseup", this._boundNotifyRepaintRequired, false);
  canvas.addEventListener(
    "touchstart",
    this._boundNotifyRepaintRequired,
    false
  );
  canvas.addEventListener("touchend", this._boundNotifyRepaintRequired, false);
  canvas.addEventListener("touchmove", this._boundNotifyRepaintRequired, false);

  if (defined(window.PointerEvent)) {
    canvas.addEventListener(
      "pointerdown",
      this._boundNotifyRepaintRequired,
      false
    );
    canvas.addEventListener(
      "pointerup",
      this._boundNotifyRepaintRequired,
      false
    );
    canvas.addEventListener(
      "pointermove",
      this._boundNotifyRepaintRequired,
      false
    );
  }

  // Detect available wheel event
  this._wheelEvent = undefined;
  if ("onwheel" in canvas) {
    // spec event type
    this._wheelEvent = "wheel";
  } else if (defined(document.onmousewheel)) {
    // legacy event type
    this._wheelEvent = "mousewheel";
  } else {
    // older Firefox
    this._wheelEvent = "DOMMouseScroll";
  }

  canvas.addEventListener(
    this._wheelEvent,
    this._boundNotifyRepaintRequired,
    false
  );

  window.addEventListener("resize", this._boundNotifyRepaintRequired, false);

  // Force a repaint when the feature info box is closed.  Cesium can't close its info box
  // when the clock is not ticking, for reasons that are not clear.
  if (defined(this.viewer.infoBox)) {
    this._removeInfoBoxCloseListener = this.viewer.infoBox.viewModel.closeClicked.addEventListener(
      this._boundNotifyRepaintRequired
    );
  }

  if (defined(this.viewer._clockViewModel)) {
    var clock = this.viewer._clockViewModel;
    this._shouldAnimateSubscription = knockout
      .getObservable(clock, "shouldAnimate")
      .subscribe(this._boundNotifyRepaintRequired);
    this._currentTimeSubscription = knockout
      .getObservable(clock, "currentTime")
      .subscribe(this._boundNotifyRepaintRequired);
  }

  if (defined(this.viewer.timeline)) {
    this.viewer.timeline.addEventListener(
      "settime",
      this._boundNotifyRepaintRequired,
      false
    );
  }

  this._selectedFeatureSubscription = knockout
    .getObservable(this.terria, "selectedFeature")
    .subscribe(function() {
      selectFeature(this);
    }, this);

  this._splitterPositionSubscription = knockout
    .getObservable(this.terria, "splitPosition")
    .subscribe(function() {
      if (this.scene) {
        this.scene.imagerySplitPosition = this.terria.splitPosition;
        this.notifyRepaintRequired();
      }
    }, this);

  this._showSplitterSubscription = knockout
    .getObservable(terria, "showSplitter")
    .subscribe(function() {
      this.updateAllItemsForSplitter();
    }, this);

  // Hacky way to force a repaint when an async load request completes
  var that = this;
  this._originalLoadWithXhr = loadWithXhr.load;
  loadWithXhr.load = function(
    url,
    responseType,
    method,
    data,
    headers,
    deferred,
    overrideMimeType,
    preferText,
    timeout
  ) {
    deferred.promise.always(that._boundNotifyRepaintRequired);
    that._originalLoadWithXhr(
      url,
      responseType,
      method,
      data,
      headers,
      deferred,
      overrideMimeType,
      preferText,
      timeout
    );
  };

  // Hacky way to force a repaint when a web worker sends something back.
  this._originalScheduleTask = TaskProcessor.prototype.scheduleTask;
  TaskProcessor.prototype.scheduleTask = function(
    parameters,
    transferableObjects
  ) {
    var result = that._originalScheduleTask.call(
      this,
      parameters,
      transferableObjects
    );

    if (!defined(this._originalWorkerMessageSinkRepaint)) {
      this._originalWorkerMessageSinkRepaint = this._worker.onmessage;

      var taskProcessor = this;
      this._worker.onmessage = function(event) {
        taskProcessor._originalWorkerMessageSinkRepaint(event);

        if (that.isDestroyed()) {
          taskProcessor._worker.onmessage =
            taskProcessor._originalWorkerMessageSinkRepaint;
          taskProcessor._originalWorkerMessageSinkRepaint = undefined;
        } else {
          that.notifyRepaintRequired();
        }
      };
    }

    return result;
  };

  this.eventHelper = new EventHelper();

  // If the render loop crashes, inform the user and then switch to 2D.
  this.eventHelper.add(
    this.scene.renderError,
    function(scene, error) {
      this.terria.error.raiseEvent(
        new TerriaError({
          sender: this,
          title: i18next.t("models.cesiumTerrain.errorRenderingTitle"),
          message:
            i18next.t("models.cesiumTerrain.errorRenderingTitle", {
              appName: terria.appName,
              email:
                '<a href="mailto:' +
                terria.supportEmail +
                '">' +
                terria.supportEmail +
                "</a>."
            }) +
            "<pre>" +
            formatError(error) +
            "</pre>"
        })
      );

      this.terria.viewerMode = ViewerMode.Leaflet;
    },
    this
  );

  this.eventHelper.add(
    this.scene.globe.tileLoadProgressEvent,
    this.updateTilesLoadingCount.bind(this)
  );

  selectFeature(this);
};

inherit(GlobeOrMap, Cesium);

Cesium.prototype.destroy = function() {
  if (defined(this._selectionIndicator)) {
    this._selectionIndicator.destroy();
    this._selectionIndicator = undefined;
  }

  if (defined(this._removePostRenderListener)) {
    this._removePostRenderListener();
    this._removePostRenderListener = undefined;
  }

  if (defined(this._removeInfoBoxCloseListener)) {
    this._removeInfoBoxCloseListener();
  }

  if (defined(this._shouldAnimateSubscription)) {
    this._shouldAnimateSubscription.dispose();
    this._shouldAnimateSubscription = undefined;
  }

  if (defined(this._currentTimeSubscription)) {
    this._currentTimeSubscription.dispose();
    this._currentTimeSubscription = undefined;
  }

  if (defined(this.viewer.timeline)) {
    this.viewer.timeline.removeEventListener(
      "settime",
      this._boundNotifyRepaintRequired,
      false
    );
  }

  if (defined(this._selectedFeatureSubscription)) {
    this._selectedFeatureSubscription.dispose();
    this._selectedFeatureSubscription = undefined;
  }

  if (defined(this._splitterPositionSubscription)) {
    this._splitterPositionSubscription.dispose();
    this._splitterPositionSubscription = undefined;
  }

  if (defined(this._showSplitterSubscription)) {
    this._showSplitterSubscription.dispose();
    this._showSplitterSubscription = undefined;
  }

  this.viewer.canvas.removeEventListener(
    "mousemove",
    this._boundNotifyRepaintRequired,
    false
  );
  this.viewer.canvas.removeEventListener(
    "mousedown",
    this._boundNotifyRepaintRequired,
    false
  );
  this.viewer.canvas.removeEventListener(
    "mouseup",
    this._boundNotifyRepaintRequired,
    false
  );
  this.viewer.canvas.removeEventListener(
    "touchstart",
    this._boundNotifyRepaintRequired,
    false
  );
  this.viewer.canvas.removeEventListener(
    "touchend",
    this._boundNotifyRepaintRequired,
    false
  );
  this.viewer.canvas.removeEventListener(
    "touchmove",
    this._boundNotifyRepaintRequired,
    false
  );

  if (defined(window.PointerEvent)) {
    this.viewer.canvas.removeEventListener(
      "pointerdown",
      this._boundNotifyRepaintRequired,
      false
    );
    this.viewer.canvas.removeEventListener(
      "pointerup",
      this._boundNotifyRepaintRequired,
      false
    );
    this.viewer.canvas.removeEventListener(
      "pointermove",
      this._boundNotifyRepaintRequired,
      false
    );
  }

  this.viewer.canvas.removeEventListener(
    this._wheelEvent,
    this._boundNotifyRepaintRequired,
    false
  );

  window.removeEventListener("resize", this._boundNotifyRepaintRequired, false);
  window.removeEventListener("resize", this._setViewerResolution, false);

  loadWithXhr.load = this._originalLoadWithXhr;
  TaskProcessor.prototype.scheduleTask = this._originalScheduleTask;

  this.eventHelper.removeAll();

  GlobeOrMap.disposeCommonListeners(this);

  return destroyObject(this);
};

Cesium.prototype.isDestroyed = function() {
  return false;
};

var cartesian3Scratch = new Cartesian3();
var enuToFixedScratch = new Matrix4();
var southwestScratch = new Cartesian3();
var southeastScratch = new Cartesian3();
var northeastScratch = new Cartesian3();
var northwestScratch = new Cartesian3();
var southwestCartographicScratch = new Cartographic();
var southeastCartographicScratch = new Cartographic();
var northeastCartographicScratch = new Cartographic();
var northwestCartographicScratch = new Cartographic();

/**
 * Gets the current extent of the camera.  This may be approximate if the viewer does not have a strictly rectangular view.
 * @return {Rectangle} The current visible extent.
 */
Cesium.prototype.getCurrentExtent = function() {
  var scene = this.scene;
  var camera = scene.camera;

  var width = scene.canvas.clientWidth;
  var height = scene.canvas.clientHeight;

  var centerOfScreen = new Cartesian2(width / 2.0, height / 2.0);
  var pickRay = scene.camera.getPickRay(centerOfScreen);
  var center = scene.globe.pick(pickRay, scene);

  if (!defined(center)) {
    // TODO: binary search to find the horizon point and use that as the center.
    return this.terria.homeView.rectangle;
  }

  var ellipsoid = this.scene.globe.ellipsoid;

  var fovy = scene.camera.frustum.fovy * 0.5;
  var fovx = Math.atan(Math.tan(fovy) * scene.camera.frustum.aspectRatio);

  var cameraOffset = Cartesian3.subtract(
    camera.positionWC,
    center,
    cartesian3Scratch
  );
  var cameraHeight = Cartesian3.magnitude(cameraOffset);
  var xDistance = cameraHeight * Math.tan(fovx);
  var yDistance = cameraHeight * Math.tan(fovy);

  var southwestEnu = new Cartesian3(-xDistance, -yDistance, 0.0);
  var southeastEnu = new Cartesian3(xDistance, -yDistance, 0.0);
  var northeastEnu = new Cartesian3(xDistance, yDistance, 0.0);
  var northwestEnu = new Cartesian3(-xDistance, yDistance, 0.0);

  var enuToFixed = Transforms.eastNorthUpToFixedFrame(
    center,
    ellipsoid,
    enuToFixedScratch
  );
  var southwest = Matrix4.multiplyByPoint(
    enuToFixed,
    southwestEnu,
    southwestScratch
  );
  var southeast = Matrix4.multiplyByPoint(
    enuToFixed,
    southeastEnu,
    southeastScratch
  );
  var northeast = Matrix4.multiplyByPoint(
    enuToFixed,
    northeastEnu,
    northeastScratch
  );
  var northwest = Matrix4.multiplyByPoint(
    enuToFixed,
    northwestEnu,
    northwestScratch
  );

  var southwestCartographic = ellipsoid.cartesianToCartographic(
    southwest,
    southwestCartographicScratch
  );
  var southeastCartographic = ellipsoid.cartesianToCartographic(
    southeast,
    southeastCartographicScratch
  );
  var northeastCartographic = ellipsoid.cartesianToCartographic(
    northeast,
    northeastCartographicScratch
  );
  var northwestCartographic = ellipsoid.cartesianToCartographic(
    northwest,
    northwestCartographicScratch
  );

  // Account for date-line wrapping
  if (southeastCartographic.longitude < southwestCartographic.longitude) {
    southeastCartographic.longitude += CesiumMath.TWO_PI;
  }
  if (northeastCartographic.longitude < northwestCartographic.longitude) {
    northeastCartographic.longitude += CesiumMath.TWO_PI;
  }

  var rect = new Rectangle(
    CesiumMath.convertLongitudeRange(
      Math.min(southwestCartographic.longitude, northwestCartographic.longitude)
    ),
    Math.min(southwestCartographic.latitude, southeastCartographic.latitude),
    CesiumMath.convertLongitudeRange(
      Math.max(northeastCartographic.longitude, southeastCartographic.longitude)
    ),
    Math.max(northeastCartographic.latitude, northwestCartographic.latitude)
  );
  rect.center = center;
  return rect;
};

/**
 * Gets the current container element.
 * @return {Element} The current container element.
 */
Cesium.prototype.getContainer = function() {
  return this.viewer.container;
};

/**
 * Zooms to a specified camera view or extent with a smooth flight animation.
 *
 * @param {CameraView|Rectangle|DataSource|Cesium3DTileset} target The view, extent, DataSource, or Cesium3DTileset to which to zoom.
 * @param {Number} [flightDurationSeconds=3.0] The length of the flight animation in seconds.
 */
Cesium.prototype.zoomTo = function(target, flightDurationSeconds) {
  if (!defined(target)) {
    throw new DeveloperError("target is required.");
  }

  flightDurationSeconds = defaultValue(flightDurationSeconds, 3.0);

  var that = this;
  that.lastTarget = target;
  return when()
    .then(function() {
      if (target instanceof Rectangle) {
        var camera = that.scene.camera;

        // Work out the destination that the camera would naturally fly to
        var destinationCartesian = camera.getRectangleCameraCoordinates(target);
        var destination = Ellipsoid.WGS84.cartesianToCartographic(
          destinationCartesian
        );

        var terrainProvider = that.scene.globe.terrainProvider;
        var level = 6; // A sufficiently coarse tile level that still has approximately accurate height
        var positions = [Rectangle.center(target)];

        // Perform an elevation query at the centre of the rectangle
        return sampleTerrain(terrainProvider, level, positions).then(function(
          results
        ) {
          if (that.lastTarget !== target) {
            return;
          }
          // Add terrain elevation to camera altitude
          var finalDestinationCartographic = {
            longitude: destination.longitude,
            latitude: destination.latitude,
            height: destination.height + results[0].height
          };

          var finalDestination = Ellipsoid.WGS84.cartographicToCartesian(
            finalDestinationCartographic
          );

          camera.flyTo({
            duration: flightDurationSeconds,
            destination: finalDestination
          });
        });
      } else if (defined(target.entities)) {
        // Zooming to a DataSource
        if (target.isLoading && defined(target.loadingEvent)) {
          var deferred = when.defer();
          var removeEvent = target.loadingEvent.addEventListener(function() {
            removeEvent();
            deferred.resolve();
          });
          return deferred.promise.then(function() {
            if (that.lastTarget !== target) {
              return;
            }
            return zoomToDataSource(that, target, flightDurationSeconds);
          });
        }
        return zoomToDataSource(that, target);
      } else if (defined(target.readyPromise)) {
        return target.readyPromise.then(function() {
          if (defined(target.boundingSphere) && that.lastTarget === target) {
            zoomToBoundingSphere(that, target, flightDurationSeconds);
          }
        });
      } else if (defined(target.boundingSphere)) {
        return zoomToBoundingSphere(that, target);
      } else if (defined(target.position)) {
        that.scene.camera.flyTo({
          duration: flightDurationSeconds,
          destination: target.position,
          orientation: {
            direction: target.direction,
            up: target.up
          }
        });
      } else {
        that.scene.camera.flyTo({
          duration: flightDurationSeconds,
          destination: target.rectangle
        });
      }
    })
    .then(function() {
      that.notifyRepaintRequired();
    });
};

var boundingSphereScratch = new BoundingSphere();

function zoomToDataSource(cesium, target, flightDurationSeconds) {
  return pollToPromise(
    function() {
      var dataSourceDisplay = cesium.dataSourceDisplay;
      var entities = target.entities.values;

      var boundingSpheres = [];
      for (var i = 0, len = entities.length; i < len; i++) {
        var state = BoundingSphereState.PENDING;
        try {
          state = dataSourceDisplay.getBoundingSphere(
            entities[i],
            false,
            boundingSphereScratch
          );
        } catch (e) {}

        if (state === BoundingSphereState.PENDING) {
          return false;
        } else if (state !== BoundingSphereState.FAILED) {
          boundingSpheres.push(BoundingSphere.clone(boundingSphereScratch));
        }
      }

      var boundingSphere = BoundingSphere.fromBoundingSpheres(boundingSpheres);
      cesium.scene.camera.flyToBoundingSphere(boundingSphere, {
        duration: flightDurationSeconds
      });
      return true;
    },
    {
      pollInterval: 100,
      timeout: 5000
    }
  );
}

function zoomToBoundingSphere(cesium, target, flightDurationSeconds) {
  var boundingSphere = target.boundingSphere;
  var modelMatrix = target.modelMatrix;
  if (modelMatrix) {
    boundingSphere = BoundingSphere.transform(boundingSphere, modelMatrix);
  }
  cesium.scene.camera.flyToBoundingSphere(boundingSphere, {
    offset: new HeadingPitchRange(0.0, -0.5, boundingSphere.radius),
    duration: flightDurationSeconds
  });
}

/**
 * Captures a screenshot of the map.
 * @return {Promise} A promise that resolves to a data URL when the screenshot is ready.
 */
Cesium.prototype.captureScreenshot = function() {
  var deferred = when.defer();

  var removeCallback = this.scene.postRender.addEventListener(function() {
    removeCallback();
    try {
      const cesiumCanvas = this.scene.canvas;

      // If we're using the splitter, draw the split position as a vertical white line.
      let canvas = cesiumCanvas;
      if (this.terria.showSplitter) {
        canvas = document.createElement("canvas");
        canvas.width = cesiumCanvas.width;
        canvas.height = cesiumCanvas.height;

        const context = canvas.getContext("2d");
        context.drawImage(cesiumCanvas, 0, 0);

        const x = this.terria.splitPosition * cesiumCanvas.width;
        context.strokeStyle = this.terria.baseMapContrastColor;
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, cesiumCanvas.height);
        context.stroke();
      }

      deferred.resolve(canvas.toDataURL("image/png"));
    } catch (e) {
      deferred.reject(e);
    }
  }, this);

  this.scene.render(this.terria.clock.currentTime);

  return deferred.promise;
};

/**
 * Notifies the viewer that a repaint is required.
 */
Cesium.prototype.notifyRepaintRequired = function() {
  if (this.verboseRendering && !this.viewer.useDefaultRenderLoop) {
    console.log("starting rendering @ " + getTimestamp());
  }
  this._lastCameraMoveTime = getTimestamp();
  this.viewer.useDefaultRenderLoop = true;
};

/**
 * Computes the screen position of a given world position.
 * @param  {Cartesian3} position The world position in Earth-centered Fixed coordinates.
 * @param  {Cartesian2} [result] The instance to which to copy the result.
 * @return {Cartesian2} The screen position, or undefined if the position is not on the screen.
 */
Cesium.prototype.computePositionOnScreen = function(position, result) {
  return SceneTransforms.wgs84ToWindowCoordinates(this.scene, position, result);
};

/**
 * Adds an attribution to the globe.
 * @param {Credit} attribution The attribution to add.
 */
Cesium.prototype.addAttribution = function(attribution) {
  if (attribution) {
    this.scene.frameState.creditDisplay.addDefaultCredit(attribution);
  }
};

/**
 * Removes an attribution from the globe.
 * @param {Credit} attribution The attribution to remove.
 */
Cesium.prototype.removeAttribution = function(attribution) {
  if (attribution) {
    this.scene.frameState.creditDisplay.removeDefaultCredit(attribution);
  }
};

/**
 * Gets all attribution currently active on the globe or map.
 * @returns {String[]} The list of current attributions, as HTML strings.
 */
Cesium.prototype.getAllAttribution = function() {
  const credits = this.scene.frameState.creditDisplay._currentFrameCredits.screenCredits.values.concat(
    this.scene.frameState.creditDisplay._currentFrameCredits.lightboxCredits
      .values
  );
  return credits.map(credit => credit.html);
};

/**
 * Updates the order of layers, moving layers where {@link CatalogItem#keepOnTop} is true to the top.
 */
Cesium.prototype.updateLayerOrderToKeepOnTop = function() {
  // move alwaysOnTop layers to the top
  var items = this.terria.nowViewing.items;
  var scene = this.scene;
  for (var l = items.length - 1; l >= 0; l--) {
    if (items[l].imageryLayer && items[l].keepOnTop) {
      scene.imageryLayers.raiseToTop(items[l].imageryLayer);
    }
  }
};

Cesium.prototype.updateLayerOrderAfterReorder = function() {
  // because this Cesium model does the reordering via raise and lower, no action needed.
};

// useful for counting the number of items in composite and non-composite items
function countNumberOfSubItems(item) {
  if (defined(item.items)) {
    return item.items.length;
  } else {
    return 1;
  }
}

/**
 * Raise an item's level in the viewer
 * This does not check that index is valid
 * @param {Number} index The index of the item to raise
 */
Cesium.prototype.raise = function(index) {
  var items = this.terria.nowViewing.items;
  var item = items[index];
  var itemAbove = items[index - 1];

  if (!defined(itemAbove.items) && !defined(itemAbove.imageryLayer)) {
    return;
  }

  // Both item and itemAbove may either have a single imageryLayer, or be a composite item
  // Composite items have an items array of further items.
  // Define n as the number of subitems in ItemAbove (1 except for composites)
  // if item is a composite, then raise each subitem in item n times,
  // starting with the one at the top - which is the last one in the list
  // if item is not a composite, just raise the item n times directly.

  var n = countNumberOfSubItems(itemAbove);
  var i, j, subItem;

  if (defined(item.items)) {
    for (i = item.items.length - 1; i >= 0; --i) {
      subItem = item.items[i];
      if (defined(subItem.imageryLayer)) {
        for (j = 0; j < n; ++j) {
          this.scene.imageryLayers.raise(subItem.imageryLayer);
        }
      }
    }
  }

  if (!defined(item.imageryLayer)) {
    return;
  }

  for (j = 0; j < n; ++j) {
    this.scene.imageryLayers.raise(item.imageryLayer);
  }
};

/**
 * Lower an item's level in the viewer
 * This does not check that index is valid
 * @param {Number} index The index of the item to lower
 */
Cesium.prototype.lower = function(index) {
  var items = this.terria.nowViewing.items;
  var item = items[index];
  var itemBelow = items[index + 1];
  if (!defined(itemBelow.items) && !defined(itemBelow.imageryLayer)) {
    return;
  }

  // same considerations as above, but lower composite subitems starting at the other end of the list

  var n = countNumberOfSubItems(itemBelow);
  var i, j, subItem;

  if (defined(item.items)) {
    for (i = 0; i < item.items.length; ++i) {
      subItem = item.items[i];
      if (defined(subItem.imageryLayer)) {
        for (j = 0; j < n; ++j) {
          this.scene.imageryLayers.lower(subItem.imageryLayer);
        }
      }
    }
  }

  if (!defined(item.imageryLayer)) {
    return;
  }

  for (j = 0; j < n; ++j) {
    this.scene.imageryLayers.lower(item.imageryLayer);
  }
};

/**
 * Lowers this imagery layer to the bottom, underneath all other layers.  If this item is not enabled or not shown,
 * this method does nothing.
 * @param {CatalogItem} item The item to lower to the bottom (usually a basemap)
 */
Cesium.prototype.lowerToBottom = function(item) {
  if (defined(item.items)) {
    // the front item is at the end of the list.
    // so to preserve order of any subitems, send any subitems to the bottom in order from the front
    for (var i = item.items.length - 1; i >= 0; --i) {
      var subItem = item.items[i];
      this.lowerToBottom(subItem); // recursive
    }
  }

  if (!defined(item._imageryLayer)) {
    return;
  }

  this.terria.cesium.scene.imageryLayers.lowerToBottom(item._imageryLayer);
};

Cesium.prototype.adjustDisclaimer = function() {};

/**
 * Picks features based off a latitude, longitude and (optionally) height.
 * @param {Object} latlng The position on the earth to pick.
 * @param {Object} imageryLayerCoords A map of imagery provider urls to the coords used to get features for those imagery
 *     providers - i.e. x, y, level
 * @param existingFeatures An optional list of existing features to concatenate the ones found from asynchronous picking to.
 * @param {Boolean} ignoreSplitter An optional arg to ignore the splitter and return all feature picking results. Defaults to false.
 */
Cesium.prototype.pickFromLocation = function(
  latlng,
  imageryLayerCoords,
  existingFeatures,
  ignoreSplitter
) {
  var pickPosition = this.scene.globe.ellipsoid.cartographicToCartesian(
    Cartographic.fromDegrees(latlng.lng, latlng.lat, latlng.height)
  );
  var pickPositionCartographic = Ellipsoid.WGS84.cartesianToCartographic(
    pickPosition
  );

  var promises = [];
  var imageryLayers = [];

  if (this.terria.allowFeatureInfoRequests) {
    for (var i = this.scene.imageryLayers.length - 1; i >= 0; i--) {
      var imageryLayer = this.scene.imageryLayers.get(i);
      var imageryProvider = imageryLayer._imageryProvider;

      if (imageryProvider.url && imageryLayerCoords[imageryProvider.url]) {
        var coords = imageryLayerCoords[imageryProvider.url];
        promises.push(
          imageryProvider.pickFeatures(
            coords.x,
            coords.y,
            coords.level,
            pickPositionCartographic.longitude,
            pickPositionCartographic.latitude
          )
        );
        imageryLayers.push(imageryLayer);
      }
    }
  }

  var result = this._buildPickedFeatures(
    imageryLayerCoords,
    pickPosition,
    existingFeatures,
    promises,
    imageryLayers,
    pickPositionCartographic.height,
    ignoreSplitter
  );

  var mapInteractionModeStack = this.terria.mapInteractionModeStack;
  if (defined(mapInteractionModeStack) && mapInteractionModeStack.length > 0) {
    mapInteractionModeStack[
      mapInteractionModeStack.length - 1
    ].pickedFeatures = result;
  } else {
    this.terria.pickedFeatures = result;
  }
};

/**
 * Picks features based on coordinates relative to the Cesium window. Will draw a ray from the camera through the point
 * specified and set terria.pickedFeatures based on this.
 *
 * @param {Cartesian3} screenPosition The position on the screen.
 * @param {Boolean} ignoreSplitter An optional arg to ignore the splitter and return all feature picking results. Defaults to false.
 */
Cesium.prototype.pickFromScreenPosition = function(
  screenPosition,
  ignoreSplitter
) {
  var pickRay = this.scene.camera.getPickRay(screenPosition);
  var pickPosition = this.scene.globe.pick(pickRay, this.scene);
  var pickPositionCartographic = Ellipsoid.WGS84.cartesianToCartographic(
    pickPosition
  );

  var vectorFeatures = this.pickVectorFeatures(screenPosition);

  var providerCoords = this._attachProviderCoordHooks();

  var pickRasterPromise = this.terria.allowFeatureInfoRequests
    ? this.scene.imageryLayers.pickImageryLayerFeatures(pickRay, this.scene)
    : Promise.resolve();

  var result = this._buildPickedFeatures(
    providerCoords,
    pickPosition,
    vectorFeatures,
    [pickRasterPromise],
    undefined,
    pickPositionCartographic.height,
    ignoreSplitter
  );
  var mapInteractionModeStack = this.terria.mapInteractionModeStack;
  if (defined(mapInteractionModeStack) && mapInteractionModeStack.length > 0) {
    mapInteractionModeStack[
      mapInteractionModeStack.length - 1
    ].pickedFeatures = result;
  } else {
    this.terria.pickedFeatures = result;
  }
};

/**
 * Picks all *vector* features (e.g. GeoJSON) shown at a certain position on the screen, ignoring raster features
 * (e.g. WFS). Because all vector features are already in memory, this is synchronous.
 *
 * @param {Cartesian2} screenPosition position on the screen to look for features
 * @returns {Feature[]} The features found.
 */
Cesium.prototype.pickVectorFeatures = function(screenPosition) {
  // Pick vector features
  var vectorFeatures = [];
  var pickedList = this.scene.drillPick(screenPosition);
  for (var i = 0; i < pickedList.length; ++i) {
    var picked = pickedList[i];
    var id = picked.id;

    if (
      id &&
      id.entityCollection &&
      id.entityCollection.owner &&
      id.entityCollection.owner.name === GlobeOrMap._featureHighlightName
    ) {
      continue;
    }

    if (!defined(id) && defined(picked.primitive)) {
      id = picked.primitive.id;
    }
    if (id instanceof Entity && vectorFeatures.indexOf(id) === -1) {
      var feature = Feature.fromEntityCollectionOrEntity(id);
      vectorFeatures.push(feature);
    } else if (
      picked.primitive &&
      picked.primitive._catalogItem &&
      picked.primitive._catalogItem.getFeaturesFromPickResult
    ) {
      var result = picked.primitive._catalogItem.getFeaturesFromPickResult(
        screenPosition,
        picked
      );
      if (result) {
        if (Array.isArray(result)) {
          vectorFeatures.push(...result);
        } else {
          vectorFeatures.push(result);
        }
      }
    }
  }

  return vectorFeatures;
};

/**
 * Hooks into the {@link ImageryProvider#pickFeatures} method of every imagery provider in the scene - when this method is
 * evaluated (usually as part of feature picking), it will record the tile coordinates used against the url of the
 * imagery provider in an object that is returned by this method. Hooks are removed immediately after being executed once.
 *
 * @returns {{x, y, level}} A map of urls to the coords used by the imagery provider when picking features. Will
 *     initially be empty but will be updated as the hooks are evaluated.
 * @private
 */
Cesium.prototype._attachProviderCoordHooks = function() {
  var providerCoords = {};

  var pickFeaturesHook = function(
    imageryProvider,
    oldPick,
    x,
    y,
    level,
    longitude,
    latitude
  ) {
    var featuresPromise = oldPick.call(
      imageryProvider,
      x,
      y,
      level,
      longitude,
      latitude
    );

    // Use url to uniquely identify providers because what else can we do?
    if (imageryProvider.url) {
      providerCoords[imageryProvider.url] = {
        x: x,
        y: y,
        level: level
      };
    }

    imageryProvider.pickFeatures = oldPick;
    return featuresPromise;
  };

  for (var j = 0; j < this.scene.imageryLayers.length; j++) {
    var imageryProvider = this.scene.imageryLayers.get(j).imageryProvider;
    imageryProvider.pickFeatures = pickFeaturesHook.bind(
      undefined,
      imageryProvider,
      imageryProvider.pickFeatures
    );
  }

  return providerCoords;
};

/**
 * Builds a {@link PickedFeatures} object from a number of inputs.
 *
 * @param {{x, y, level}} providerCoords A map of imagery provider urls to the coords used to get features for that provider.
 * @param {Cartesian3} pickPosition The position in the 3D model that has been picked.
 * @param {Entity[]} existingFeatures Existing features - the results of feature promises will be appended to this.
 * @param {Promise[]} featurePromises Zero or more promises that each resolve to a list of {@link ImageryLayerFeatureInfo}s
 *     (usually there will be one promise per ImageryLayer. These will be combined as part of
 *     {@link PickedFeatures#allFeaturesAvailablePromise} and their results used to build the final
 *     {@link PickedFeatures#features} array.
 * @param {ImageryLayer[]} imageryLayers An array of ImageryLayers that should line up with the one passed as featurePromises.
 * @param {number} defaultHeight The height to use for feature position heights if none is available when picking.
 * @param {Boolean} ignoreSplitter Ignore the splitter and return all feature picking results
 * @returns {PickedFeatures} A {@link PickedFeatures} object that is a combination of everything passed.
 * @private
 */
Cesium.prototype._buildPickedFeatures = function(
  providerCoords,
  pickPosition,
  existingFeatures,
  featurePromises,
  imageryLayers,
  defaultHeight,
  ignoreSplitter
) {
  ignoreSplitter = defaultValue(ignoreSplitter, false);
  var result = new PickedFeatures();

  result.providerCoords = providerCoords;
  result.pickPosition = pickPosition;

  result.allFeaturesAvailablePromise = when
    .all(featurePromises)
    .then(
      function(allFeatures) {
        result.isLoading = false;

        result.features = allFeatures.reduce(
          function(resultFeaturesSoFar, imageryLayerFeatures, i) {
            if (!defined(imageryLayerFeatures)) {
              return resultFeaturesSoFar;
            }

            var features = imageryLayerFeatures.map(
              function(feature) {
                if (defined(imageryLayers)) {
                  feature.imageryLayer = imageryLayers[i];
                }

                if (!defined(feature.position)) {
                  feature.position = Ellipsoid.WGS84.cartesianToCartographic(
                    pickPosition
                  );
                }

                // If the picked feature does not have a height, use the height of the picked location.
                // This at least avoids major parallax effects on the selection indicator.
                if (
                  !defined(feature.position.height) ||
                  feature.position.height === 0.0
                ) {
                  feature.position.height = defaultHeight;
                }
                return this._createFeatureFromImageryLayerFeature(feature);
              }.bind(this)
            );

            if (this.terria.showSplitter && !ignoreSplitter) {
              // Select only features from the same side or both sides of the splitter
              var screenPosition = this.computePositionOnScreen(
                result.pickPosition
              );
              var pickedSide = this.terria.getSplitterSideForScreenPosition(
                screenPosition
              );

              features = features.filter(function(feature) {
                var splitDirection = feature.imageryLayer.splitDirection;
                return (
                  splitDirection === pickedSide ||
                  splitDirection === ImagerySplitDirection.NONE
                );
              });
            }

            return resultFeaturesSoFar.concat(features);
          }.bind(this),
          defaultValue(existingFeatures, [])
        );
      }.bind(this)
    )
    .otherwise(function() {
      result.isLoading = false;
      result.error = "An unknown error occurred while picking features.";
    });

  return result;
};

/**
 * Returns a new layer using a provided ImageryProvider, and adds it to the scene.
 * Note the optional parameters are a superset of the Leaflet version of this function, with one deletion (onProjectionError).
 *
 * @param {Object} options Options
 * @param {ImageryProvider} options.imageryProvider The imagery provider to create a new layer for.
 * @param {Number} [layerIndex] The index to add the layer at.  If omitted, the layer will added on top of all existing layers.
 * @param {Rectangle} [options.rectangle=imageryProvider.rectangle] The rectangle of the layer.  This rectangle
 *        can limit the visible portion of the imagery provider.
 * @param {Number|Function} [options.opacity=1.0] The alpha blending value of this layer, from 0.0 to 1.0.
 *                          This can either be a simple number or a function with the signature
 *                          <code>function(frameState, layer, x, y, level)</code>.  The function is passed the
 *                          current frame state, this layer, and the x, y, and level coordinates of the
 *                          imagery tile for which the alpha is required, and it is expected to return
 *                          the alpha value to use for the tile.
 * @param {Boolean} [options.clipToRectangle]
 * @param {Boolean} [options.treat403AsError]
 * @param {Boolean} [options.treat403AsError]
 * @param {Boolean} [options.ignoreUnknownTileErrors]
 * @param {Function} [options.onLoadError]
 * @returns {ImageryLayer} The newly created layer.
 */
Cesium.prototype.addImageryProvider = function(options) {
  var scene = this.scene;

  var errorEvent = options.imageryProvider.errorEvent;

  if (defined(errorEvent)) {
    errorEvent.addEventListener(options.onLoadError);
  }

  var result = new ImageryLayer(options.imageryProvider, {
    show: false,
    alpha: options.opacity,
    rectangle: options.clipToRectangle ? options.rectangle : undefined,
    isRequired: options.isRequiredForRendering // TODO: This doesn't seem to be a valid option for ImageryLayer - remove (and upstream)?
  });

  // layerIndex is an optional parameter used when the imageryLayer corresponds to a CsvCatalogItem whose selected item has just changed
  // to ensure that the layer is re-added in the correct position
  scene.imageryLayers.add(result, options.layerIndex);

  this.updateLayerOrderToKeepOnTop();

  return result;
};

Cesium.prototype.removeImageryLayer = function(options) {
  var scene = this.scene;
  scene.imageryLayers.remove(options.layer);
};

Cesium.prototype.showImageryLayer = function(options) {
  options.layer.show = true;
};

Cesium.prototype.hideImageryLayer = function(options) {
  options.layer.show = false;
};

Cesium.prototype.isImageryLayerShown = function(options) {
  return options.layer.show;
};

Cesium.prototype.updateItemForSplitter = function(item) {
  if (!defined(item.splitDirection) || !defined(item.imageryLayer)) {
    return;
  }

  const terria = item.terria;

  if (terria.showSplitter) {
    item.imageryLayer.splitDirection = item.splitDirection;
  } else {
    item.imageryLayer.splitDirection = ImagerySplitDirection.NONE;
  }

  // Also update the next layer, if any.
  if (item._nextLayer) {
    item._nextLayer.splitDirection = item.imageryLayer.splitDirection;
  }

  this.notifyRepaintRequired();
};

Cesium.prototype.pauseMapInteraction = function() {
  ++this._pauseMapInteractionCount;
  if (this._pauseMapInteractionCount === 1) {
    this.scene.screenSpaceCameraController.enableInputs = false;
  }
};

Cesium.prototype.resumeMapInteraction = function() {
  --this._pauseMapInteractionCount;
  if (this._pauseMapInteractionCount === 0) {
    setTimeout(() => {
      if (this._pauseMapInteractionCount === 0) {
        this.scene.screenSpaceCameraController.enableInputs = true;
      }
    }, 0);
  }
};

function postRender(cesium, date) {
  // We can safely stop rendering when:
  //  - the camera position hasn't changed in over a second,
  //  - there are no tiles waiting to load, and
  //  - the clock is not animating
  //  - there are no tweens in progress

  var now = getTimestamp();

  var scene = cesium.scene;

  if (
    !Matrix4.equalsEpsilon(
      cesium._lastCameraViewMatrix,
      scene.camera.viewMatrix,
      1e-5
    )
  ) {
    cesium._lastCameraMoveTime = now;
  }

  var cameraMovedInLastSecond = now - cesium._lastCameraMoveTime < 1000;

  var surface = scene.globe._surface;
  var tilesWaiting =
    !surface._tileProvider.ready ||
    surface._tileLoadQueueHigh.length > 0 ||
    surface._tileLoadQueueMedium.length > 0 ||
    surface._tileLoadQueueLow.length > 0 ||
    surface._debug.tilesWaitingForChildren > 0;

  if (
    !cameraMovedInLastSecond &&
    !tilesWaiting &&
    !cesium.viewer.clock.shouldAnimate &&
    cesium.scene.tweens.length === 0
  ) {
    if (cesium.verboseRendering) {
      console.log("stopping rendering @ " + getTimestamp());
    }
    cesium.viewer.useDefaultRenderLoop = false;
    cesium.stoppedRendering = true;
  }

  Matrix4.clone(scene.camera.viewMatrix, cesium._lastCameraViewMatrix);

  var feature = cesium.terria.selectedFeature;
  if (defined(feature)) {
    var position;

    if (defined(cesium.dataSourceDisplay)) {
      var originalEntity = defined(feature.cesiumEntity)
        ? feature.cesiumEntity
        : feature;
      var state = cesium.dataSourceDisplay.getBoundingSphere(
        originalEntity,
        true,
        boundingSphereScratch
      );

      if (state === BoundingSphereState.DONE) {
        position = Cartesian3.clone(boundingSphereScratch.center);
      }
    }

    if (!defined(position) && defined(feature.position)) {
      position = feature.position.getValue(cesium.terria.clock.currentTime);
    }

    if (defined(position)) {
      cesium._selectionIndicator.position = position;
    }
  }

  cesium._selectionIndicator.update();
}

function selectFeature(cesium) {
  var feature = cesium.terria.selectedFeature;

  cesium._highlightFeature(feature);

  if (defined(feature) && defined(feature.position)) {
    cesium._selectionIndicator.position = feature.position.getValue(
      cesium.terria.clock.currentTime
    );
    cesium._selectionIndicator.animateAppear();
  } else {
    cesium._selectionIndicator.animateDepart();
  }

  cesium._selectionIndicator.update();
}

module.exports = Cesium;
