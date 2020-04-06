"use strict";

/*global require*/
var Color = require("terriajs-cesium/Source/Core/Color").default;
var defined = require("terriajs-cesium/Source/Core/defined").default;
var DeveloperError = require("terriajs-cesium/Source/Core/DeveloperError")
  .default;
var Ellipsoid = require("terriajs-cesium/Source/Core/Ellipsoid").default;
var featureDataToGeoJson = require("../Map/featureDataToGeoJson");
var clone = require("terriajs-cesium/Source/Core/clone").default;
var MapboxVectorTileImageryProvider = require("../Map/MapboxVectorTileImageryProvider");
var MapboxVectorCanvasTileLayer = require("../Map/MapboxVectorCanvasTileLayer");
var GeoJsonCatalogItem = require("./GeoJsonCatalogItem");

var Feature = require("./Feature");
var ImageryLayer = require("terriajs-cesium/Source/Scene/ImageryLayer").default;
var rectangleToLatLngBounds = require("../Map/rectangleToLatLngBounds");

require("./ImageryLayerFeatureInfo"); // overrides Cesium's prototype.configureDescriptionFromProperties

/**
 * The base class for map/globe viewers.
 *
 * @constructor
 * @alias GlobeOrMap
 *
 * @param {Terria} terria The Terria instance.
 * @param {String} disclaimerClass Class of a disclaimer element that should be shifted upwards to make room for other ui elements.
 *
 * @see Cesium
 * @see Leaflet
 */
var GlobeOrMap = function(terria) {
  /**
   * Gets or sets the Terria instance.
   * @type {Terria}
   */
  this.terria = terria;

  /**
   * Gets or sets whether this viewer _can_ show a splitter. Default false.
   * @type {Boolean}
   */
  this.canShowSplitter = false;

  this._tilesLoadingCountMax = 0;
  this._removeHighlightCallback = undefined;
  this._highlightPromise = undefined;
};

GlobeOrMap._featureHighlightName = "___$FeatureHighlight&__";

/**
 * Creates a {@see Feature} (based on an {@see Entity}) from a {@see ImageryLayerFeatureInfo}.
 * @param {ImageryLayerFeatureInfo} imageryFeature The imagery layer feature for which to create an entity-based feature.
 * @return {Feature} The created feature.
 * @protected
 */
GlobeOrMap.prototype._createFeatureFromImageryLayerFeature = function(
  imageryFeature
) {
  var feature = new Feature({
    id: imageryFeature.name
  });
  feature.name = imageryFeature.name;
  feature.description = imageryFeature.description; // already defined by the new Entity
  feature.properties = imageryFeature.properties;
  feature.data = imageryFeature.data;

  feature.imageryLayer = imageryFeature.imageryLayer;
  feature.position = Ellipsoid.WGS84.cartographicToCartesian(
    imageryFeature.position
  );
  feature.coords = imageryFeature.coords;

  return feature;
};

GlobeOrMap.prototype.updateTilesLoadingCount = function(tilesLoadingCount) {
  if (tilesLoadingCount > this._tilesLoadingCountMax) {
    this._tilesLoadingCountMax = tilesLoadingCount;
  } else if (tilesLoadingCount === 0) {
    this._tilesLoadingCountMax = 0;
  }

  this.terria.tileLoadProgressEvent.raiseEvent(
    tilesLoadingCount,
    this._tilesLoadingCountMax
  );
};

GlobeOrMap.prototype.isDestroyed = function() {
  return false;
};

/**
 * Picks features based off a latitude, longitude and (optionally) height.
 * @param {Object} latlng The position on the earth to pick.
 * @param {Object} imageryLayerCoords A map of imagery provider urls to the coords used to get features for those imagery
 *     providers - i.e. x, y, level
 * @param existingFeatures An optional list of existing features to concatenate the ones found from asynchronous picking to.
 */
GlobeOrMap.prototype.pickFromLocation = function(
  latlng,
  imageryLayerCoords,
  existingFeatures
) {
  throw new DeveloperError(
    "pickFromLocation must be implemented in the derived class."
  );
};

GlobeOrMap.prototype.destroy = function() {
  throw new DeveloperError("destroy must be implemented in the derived class.");
};

/**
 * Gets the current extent of the camera.  This may be approximate if the viewer does not have a strictly rectangular view.
 * @return {Rectangle} The current visible extent.
 */
GlobeOrMap.prototype.getCurrentExtent = function() {
  throw new DeveloperError(
    "getCurrentExtent must be implemented in the derived class."
  );
};

/**
 * Gets the current container element.
 * @return {Element} The current container element.
 */
GlobeOrMap.prototype.getContainer = function() {
  throw new DeveloperError(
    "getContainer must be implemented in the derived class."
  );
};

/**
 * Zooms to a specified camera view or extent with a smooth flight animation.
 *
 * @param {CameraView|Rectangle} viewOrExtent The view or extent to which to zoom.
 * @param {Number} [flightDurationSeconds=3.0] The length of the flight animation in seconds.
 */
GlobeOrMap.prototype.zoomTo = function(viewOrExtent, flightDurationSeconds) {
  throw new DeveloperError("zoomTo must be implemented in the derived class.");
};

/**
 * Captures a screenshot of the map.
 * @return {Promise<string>} A promise that resolves to a data URL when the screenshot is ready.
 */
GlobeOrMap.prototype.captureScreenshot = function() {
  throw new DeveloperError(
    "captureScreenshot must be implemented in the derived class."
  );
};

/**
 * Notifies the viewer that a repaint is required.
 */
GlobeOrMap.prototype.notifyRepaintRequired = function() {
  throw new DeveloperError(
    "notifyRepaintRequired must be implemented in the derived class."
  );
};

/**
 * Computes the screen position of a given world position.
 * @param  {Cartesian3} position The world position in Earth-centered Fixed coordinates.
 * @param  {Cartesian2} [result] The instance to which to copy the result.
 * @return {Cartesian2} The screen position, or undefined if the position is not on the screen.
 */
GlobeOrMap.prototype.computePositionOnScreen = function(position, result) {
  throw new DeveloperError(
    "computePositionOnScreen must be implemented in the derived class."
  );
};

/**
 * Adds an attribution to the globe or map.
 * @param {Credit} attribution The attribution to add.
 */
GlobeOrMap.prototype.addAttribution = function(attribution) {
  throw new DeveloperError(
    "addAttribution must be implemented in the derived class."
  );
};

/**
 * Removes an attribution from the globe or map.
 * @param {Credit} attribution The attribution to remove.
 */
GlobeOrMap.prototype.removeAttribution = function(attribution) {
  throw new DeveloperError(
    "removeAttribution must be implemented in the derived class."
  );
};

/**
 * Gets all attribution currently active on the globe or map.
 * @returns {String[]} The list of current attributions, as HTML strings.
 */
GlobeOrMap.prototype.getAllAttribution = function() {
  return [];
};

/**
 * Perform any updates to the order of layers required by raise and lower,
 * but after the items have been reordered.
 * This allows for the possibility that raise and lower do nothing, and instead we
 * call updateLayerOrder
 */
GlobeOrMap.prototype.updateLayerOrderAfterReorder = function() {
  throw new DeveloperError(
    "updateLayerOrderAfterReorder must be implemented in the derived class."
  );
};

/**
 * Raise an item's level in the viewer
 * This does not check that index is valid
 * @param {Number} index The index of the item to raise
 */
GlobeOrMap.prototype.raise = function(index) {
  throw new DeveloperError("raise must be implemented in the derived class.");
};

/**
 * Lower an item's level in the viewer
 * This does not check that index is valid
 * @param {Number} index The index of the item to lower
 */
GlobeOrMap.prototype.lower = function(index) {
  throw new DeveloperError("lower must be implemented in the derived class.");
};

/**
 * Lowers this imagery layer to the bottom, underneath all other layers.  If this item is not enabled or not shown,
 * this method does nothing.
 * @param {CatalogItem} item The item to lower to the bottom (usually a basemap)
 */
GlobeOrMap.prototype.lowerToBottom = function(item) {
  throw new DeveloperError(
    "lowerToBottom must be implemented in the derived class."
  );
};

GlobeOrMap.prototype._highlightFeature = function(feature) {
  if (defined(this._removeHighlightCallback)) {
    this._removeHighlightCallback();
    this._removeHighlightCallback = undefined;
    this._highlightPromise = undefined;
  }

  if (defined(feature)) {
    var hasGeometry = false;

    if (defined(feature.polygon)) {
      hasGeometry = true;

      var cesiumPolygon = feature.cesiumEntity || feature;

      var polygonOutline = cesiumPolygon.polygon.outline;
      var polygonOutlineColor = cesiumPolygon.polygon.outlineColor;
      var polygonMaterial = cesiumPolygon.polygon.material;

      cesiumPolygon.polygon.outline = true;
      cesiumPolygon.polygon.outlineColor = Color.fromCssColorString(
        this.terria.baseMapContrastColor
      );
      const currentColor = polygonMaterial.getValue().color;
      cesiumPolygon.polygon.material = Color.fromCssColorString(
        this.terria.baseMapContrastColor
      ).withAlpha(currentColor.alpha);

      this._removeHighlightCallback = function() {
        const highlightFeatureColor = cesiumPolygon.polygon.material.getValue()
          .color;
        cesiumPolygon.polygon.outline = polygonOutline;
        cesiumPolygon.polygon.outlineColor = polygonOutlineColor
          .getValue()
          .withAlpha(highlightFeatureColor.alpha);
        cesiumPolygon.polygon.material.color = currentColor.withAlpha(
          highlightFeatureColor.alpha
        );
      };
    }

    if (defined(feature.polyline)) {
      hasGeometry = true;

      var cesiumPolyline = feature.cesiumEntity || feature;

      var polylineMaterial = cesiumPolyline.polyline.material;
      var polylineWidth = cesiumPolyline.polyline.width;

      cesiumPolyline.polyline.material = Color.fromCssColorString(
        this.terria.baseMapContrastColor
      );
      cesiumPolyline.polyline.width = 2;

      this._removeHighlightCallback = function() {
        cesiumPolyline.polyline.material = polylineMaterial;
        cesiumPolyline.polyline.width = polylineWidth;
      };
    }

    if (!hasGeometry) {
      if (
        feature.imageryLayer &&
        feature.imageryLayer.imageryProvider instanceof
          MapboxVectorTileImageryProvider
      ) {
        if (defined(this.terria.cesium)) {
          var result = new ImageryLayer(
            feature.imageryLayer.imageryProvider.createHighlightImageryProvider(
              feature.data.id
            ),
            {
              show: true,
              alpha: 1
            }
          );
          var scene = this.terria.cesium.scene;
          scene.imageryLayers.add(result);

          this._removeHighlightCallback = function() {
            scene.imageryLayers.remove(result);
          };
        } else if (defined(this.terria.leaflet)) {
          var map = this.terria.leaflet.map;
          var options = {
            async: true,
            opacity: 1,
            bounds: rectangleToLatLngBounds(
              feature.imageryLayer.imageryProvider.rectangle
            )
          };

          if (defined(map.options.maxZoom)) {
            options.maxZoom = map.options.maxZoom;
          }

          var layer = new MapboxVectorCanvasTileLayer(
            feature.imageryLayer.imageryProvider.createHighlightImageryProvider(
              feature.data.id
            ),
            options
          );
          layer.addTo(map);
          layer.bringToFront();

          this._removeHighlightCallback = function() {
            map.removeLayer(layer);
          };
        }
      } else if (
        !defined(this.supportsPolylinesOnTerrain) ||
        this.supportsPolylinesOnTerrain
      ) {
        var geoJson = featureDataToGeoJson(feature.data);

        // Show geometry associated with the feature.
        // Don't show points; the targeting cursor is sufficient.
        if (geoJson && geoJson.geometry && geoJson.geometry.type !== "Point") {
          // Turn Polygons into MultiLineStrings, because we're only showing the outline.
          if (
            geoJson.geometry.type === "Polygon" ||
            geoJson.geometry.type === "MultiPolygon"
          ) {
            geoJson = clone(geoJson);
            geoJson.geometry = clone(geoJson.geometry);

            if (geoJson.geometry.type === "MultiPolygon") {
              const newCoordinates = [];
              geoJson.geometry.coordinates.forEach(polygon => {
                newCoordinates.push(...polygon);
              });
              geoJson.geometry.coordinates = newCoordinates;
            }

            geoJson.geometry.type = "MultiLineString";
          }

          var catalogItem = new GeoJsonCatalogItem(this.terria);
          catalogItem.name = GlobeOrMap._featureHighlightName;
          catalogItem.data = geoJson;
          catalogItem.clampToGround = true;
          catalogItem.style = {
            "stroke-width": 2,
            stroke: this.terria.baseMapContrastColor,
            "fill-opacity": 0,
            "marker-color": this.terria.baseMapContrastColor
          };

          var that = this;
          var removeCallback = (this._removeHighlightCallback = function() {
            that._highlightPromise
              .then(function() {
                if (removeCallback !== that._removeHighlightCallback) {
                  return;
                }
                catalogItem._hide();
                catalogItem._disable();
              })
              .otherwise(function() {});
          });

          that._highlightPromise = catalogItem.load().then(function() {
            if (removeCallback !== that._removeHighlightCallback) {
              return;
            }

            catalogItem._enable();
            catalogItem._show();
          });
        }
      }
    }
  }
};

GlobeOrMap.prototype.addImageryProvider = function(options) {
  throw new DeveloperError(
    "addImageryProvider must be implemented in the derived class."
  );
};

GlobeOrMap.prototype.removeImageryLayer = function(options) {
  throw new DeveloperError(
    "removeImageryLayer must be implemented in the derived class."
  );
};

GlobeOrMap.prototype.showImageryLayer = function(options) {
  throw new DeveloperError(
    "showImageryLayer must be implemented in the derived class."
  );
};

GlobeOrMap.prototype.hideImageryLayer = function(options) {
  throw new DeveloperError(
    "hideImageryLayer must be implemented in the derived class."
  );
};

GlobeOrMap.prototype.isImageryLayerShown = function(options) {
  throw new DeveloperError(
    "isImageryLayerShown must be implemented in the derived class."
  );
};

GlobeOrMap.prototype.addDataSource = function(options) {
  this.terria.dataSources.add(options.dataSource);
};

GlobeOrMap.prototype.removeDataSource = function(options) {
  this.terria.dataSources.remove(options.dataSource, false);
};

GlobeOrMap.prototype.updateAllItemsForSplitter = function() {
  this.terria.nowViewing.items.forEach(item => {
    this.updateItemForSplitter(item);
  });
  this.notifyRepaintRequired();
};

GlobeOrMap.prototype.updateItemForSplitter = function(item) {};

GlobeOrMap.prototype.pauseMapInteraction = function() {};

GlobeOrMap.prototype.resumeMapInteraction = function() {};

GlobeOrMap.disposeCommonListeners = function(globeOrMap) {
  if (defined(globeOrMap._removeHighlightCallback)) {
    globeOrMap._removeHighlightCallback();
    globeOrMap._removeHighlightCallback = undefined;
    globeOrMap._highlightPromise = undefined;
  }

  if (defined(globeOrMap._disclaimerShiftSubscription)) {
    globeOrMap._disclaimerShiftSubscription.dispose();
    globeOrMap._disclaimerShiftSubscription = undefined;
  }
};

module.exports = GlobeOrMap;
