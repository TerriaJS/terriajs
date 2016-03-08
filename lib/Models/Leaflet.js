'use strict';

/*global require*/
var L = require('leaflet');
var html2canvas = require('html2canvas');

var Cartesian2 = require('terriajs-cesium/Source/Core/Cartesian2');
var Cartographic = require('terriajs-cesium/Source/Core/Cartographic');
var CesiumMath = require('terriajs-cesium/Source/Core/Math');
var defined = require('terriajs-cesium/Source/Core/defined');
var destroyObject = require('terriajs-cesium/Source/Core/destroyObject');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var EasingFunction = require('terriajs-cesium/Source/Core/EasingFunction');
var Ellipsoid = require('terriajs-cesium/Source/Core/Ellipsoid');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var Rectangle = require('terriajs-cesium/Source/Core/Rectangle');
var cesiumRequestAnimationFrame = require('terriajs-cesium/Source/Core/requestAnimationFrame');
var TweenCollection = require('terriajs-cesium/Source/Scene/TweenCollection');
var when = require('terriajs-cesium/Source/ThirdParty/when');

var featureDataToGeoJson = require('../Map/featureDataToGeoJson');
var GeoJsonCatalogItem = require('./GeoJsonCatalogItem');
var GlobeOrMap = require('./GlobeOrMap');
var inherit = require('../Core/inherit');
var LeafletScene = require('../Map/LeafletScene');
var PickedFeatures = require('../Map/PickedFeatures');
var rectangleToLatLngBounds = require('../Map/rectangleToLatLngBounds');
var runLater = require('../Core/runLater');

// Work around broken html2canvas 0.5.0-alpha2
window.html2canvas = html2canvas;

/**
 * The Leaflet viewer component
 *
 * @alias Leaflet
 * @constructor
 * @extends GlobeOrMap
 *
 * @param {Terria} terria The Terria instance.
 * @param {Viewer} map The leaflet viewer instance.
 */
var Leaflet = function(terria, map) {
    GlobeOrMap.call(this, terria);

    /**
     * Gets or sets the Leaflet {@link Map} instance.
     * @type {Map}
     */
    this.map = map;

    this.scene = new LeafletScene(map);

    this._tweens = new TweenCollection();
    this._tweensAreRunning = false;
    this._selectionIndicatorTween = undefined;
    this._selectionIndicatorIsAppearing = undefined;
    this._selectedFeatureCatalogItem = undefined;

    this._pickedFeatures = undefined;
    this._selectionIndicator = L.marker([0, 0], {
        icon: L.divIcon({
            className: '',
            html: '<img src="' + this.terria.baseUrl + 'images/NM-LocationTarget.svg" width="50" height="50" alt="" />',
            iconSize: L.point(50, 50)
        }),
        clickable: false,
        keyboard: false
    });
    this._selectionIndicator.addTo(this.map);
    this._selectionIndicatorDomElement = this._selectionIndicator._icon.children[0];


    this.scene.featureClicked.addEventListener(featurePicked.bind(undefined, this));

    var that = this;
    map.on('preclick', function() {
        prePickFeatures(that);
    });

    map.on('click', function(e) {
        pickFeatures(that, e.latlng);
    });

    this._selectedFeatureSubscription = knockout.getObservable(this.terria, 'selectedFeature').subscribe(function() {
        selectFeature(this);
    }, this);

    this._initProgressEvent();
};

inherit(GlobeOrMap, Leaflet);

Leaflet.prototype._initProgressEvent = function() {
    var onTileLoadChange = function() {
        var tilesLoadingCount = 0;

        this.map.eachLayer(function(layer) {
            if (layer._tilesToLoad) {
                tilesLoadingCount += layer._tilesToLoad;
            }
        });

        this.updateTilesLoadingCount(Math.max(tilesLoadingCount - 1, 0));// -1 because _tilesToLoad doesn't update until after this runs
    }.bind(this);

    this.map.on('layeradd', function(evt) {
        // This check makes sure we only watch tile layers, and also protects us if this private variable gets removed.
        if (typeof evt.layer._tilesToLoad !== 'undefined') {
            evt.layer.on('tileloadstart tileload loaded', onTileLoadChange);
        }
    }.bind(this));
};

Leaflet.prototype.destroy = function() {
    if (defined(this._selectedFeatureSubscription)) {
        this._selectedFeatureSubscription.dispose();
        this._selectedFeatureSubscription = undefined;
    }

    return destroyObject(this);
};

/**
 * Gets the current extent of the camera.  This may be approximate if the viewer does not have a strictly rectangular view.
 * @return {Rectangle} The current visible extent.
 */
Leaflet.prototype.getCurrentExtent = function() {
    var bounds = this.map.getBounds();
    return Rectangle.fromDegrees(bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth());
};

/**
 * Gets the current container element.
 * @return {Element} The current container element.
 */
Leaflet.prototype.getContainer = function() {
    return this.map.getContainer();
};

/**
 * Zooms to a specified camera view or extent.
 *
 * @param {CameraView|Rectangle} viewOrExtent The view or extent to which to zoom.
 * @param {Number} [flightDurationSeconds=3.0] The length of the flight animation in seconds.  Leaflet ignores the actual value,
 *                                             but will use an animated transition when this value is greater than 0.
 */
Leaflet.prototype.zoomTo = function(viewOrExtent, flightDurationSeconds) {
    if (!defined(viewOrExtent)) {
        throw new DeveloperError('viewOrExtent is required.');
    }

    var extent;
    if (viewOrExtent instanceof Rectangle) {
        extent = viewOrExtent;
    } else {
        extent = viewOrExtent.rectangle;
    }

    // Account for a bounding box crossing the date line.
    if (extent.east < extent.west) {
        extent = Rectangle.clone(extent);
        extent.east += CesiumMath.TWO_PI;
    }

    this.map.fitBounds(rectangleToLatLngBounds(extent), {
        animate: flightDurationSeconds > 0.0
    });
};

/**
 * Captures a screenshot of the map.
 * @return {Promise} A promise that resolves to a data URL when the screenshot is ready.
 */
Leaflet.prototype.captureScreenshot = function() {
    var deferred = when.defer();

    // Temporarily hide the map credits.
    this.map.attributionControl.removeFrom(this.map);

    var that = this;

    try {
        html2canvas(this.map.getContainer(), {
            useCORS: true,
            onrendered: function(canvas) {
                var dataUrl;

                try {
                    dataUrl = canvas.toDataURL("image/jpeg");
                } catch (e) {
                    deferred.reject(e);
                }

                that.map.attributionControl.addTo(that.map);

                deferred.resolve(dataUrl);
            }
        });
    } catch (e) {
        that.map.attributionControl.addTo(that.map);
        deferred.reject(e);
    }

    return deferred.promise;
};

/**
 * Notifies the viewer that a repaint is required.
 */
Leaflet.prototype.notifyRepaintRequired = function() {
    // Leaflet doesn't need to do anything with this notification.
};

var cartographicScratch = new Cartographic();

/**
 * Computes the screen position of a given world position.
 * @param  {Cartesian3} position The world position in Earth-centered Fixed coordinates.
 * @param  {Cartesian2} [result] The instance to which to copy the result.
 * @return {Cartesian2} The screen position, or undefined if the position is not on the screen.
 */
Leaflet.prototype.computePositionOnScreen = function(position, result) {
    var cartographic = Ellipsoid.WGS84.cartesianToCartographic(position, cartographicScratch);
    var point = this.map.latLngToContainerPoint(L.latLng(CesiumMath.toDegrees(cartographic.latitude), CesiumMath.toDegrees(cartographic.longitude)));

    if (defined(result)) {
        result.x = point.x;
        result.y = point.y;
    } else {
        result = new Cartesian2(point.x, point.y);
    }
    return result;
};

/**
 * Adds an attribution to the map.
 * @param {Credit} attribution The attribution to add.
 */
Leaflet.prototype.addAttribution = function(attribution) {
    if (attribution) {
        this.map.attributionControl.addAttribution(createLeafletCredit(attribution));
    }
};

/**
 * Removes an attribution from the map.
 * @param {Credit} attribution The attribution to remove.
 */
Leaflet.prototype.removeAttribution = function(attribution) {
    if (attribution) {
        this.map.attributionControl.removeAttribution(createLeafletCredit(attribution));
    }
};

// this private function is called by updateLayerOrder
function updateOneLayer(item, currZIndex) {
    if (defined(item.imageryLayer) && defined(item.imageryLayer.setZIndex)) {
        if (item.supportsReordering) {
            item.imageryLayer.setZIndex(currZIndex.reorderable++);
        } else {
            item.imageryLayer.setZIndex(currZIndex.fixed++);
        }
    }
}
/**
 * Updates the order of layers on the Leaflet map to match the order in the Now Viewing pane.
 */
Leaflet.prototype.updateLayerOrder = function() {
    // Set the current z-index of all layers.
    var items = this.terria.nowViewing.items;
    var currZIndex = {
        reorderable: 100, // an arbitrary place to start
        fixed: 1000000 // fixed layers go on top of reorderable ones
    };
    var i, j, currentItem, subItem;

    for (i = items.length - 1; i >= 0; --i) {
        currentItem = items[i];
        if (defined(currentItem.items)) {
            for (j = currentItem.items.length - 1; j >= 0; --j) {
                subItem = currentItem.items[j];
                updateOneLayer(subItem, currZIndex);
            }
        }
        updateOneLayer(currentItem, currZIndex);
    }
};

/**
 * Because Leaflet doesn't actually do raise/lower, just reset the orders after every raise/lower
 */
Leaflet.prototype.updateLayerOrderAfterReorder = function() {
    this.updateLayerOrder();
};

Leaflet.prototype.raise = function(index) {
    // raising and lowering is instead handled by updateLayerOrderAfterReorder
};

Leaflet.prototype.lower = function(index) {
    // raising and lowering is instead handled by updateLayerOrderAfterReorder
};

/**
 * Lowers this imagery layer to the bottom, underneath all other layers.  If this item is not enabled or not shown,
 * this method does nothing.
 * @param {CatalogItem} item The item to lower to the bottom (usually a basemap)
 */
Leaflet.prototype.lowerToBottom = function(item) {
    if (defined(item.items)) {
        for (var i = item.items.length - 1; i >= 0; --i) {
            var subItem = item.items[i];
            this.lowerToBottom(subItem);  // recursive
        }
    }

    if (!defined(item._imageryLayer)) {
        return;
    }

    item._imageryLayer.setZIndex(0);
};

/**
 * A convenient function for handling leaflet credit display
 * @param {Credit} attribution the original attribution object for leaflet to display as text or link
 * @return {String} The sanitized HTML for the credit.
 */
function createLeafletCredit(attribution) {
    var element;

    if (defined(attribution.link)) {
        element = document.createElement('a');
        element.href = attribution.link;
    } else {
        element = document.createElement('span');
    }

    element.textContent = attribution.text;
    return element.outerHTML;
}

function featurePicked(leaflet, entity) {
    // Leaflet's event handling is... interesting.  When the user clicks on an
    // L.circleMarker, we see these events (before the dot is the receiver of the event):
    //   map.preclick
    //   map.click
    //   feature.click
    // However, for an L.marker, we only see:
    //   feature.click
    //
    // So, call prePickFeatures here.  prePickFeatures will only do anything the first time it is
    // called since the last pickFeatures and it will arrange, using runLater, for pickFeatures
    // to be called after all related events have been raised.  pickFeatures may be called multiple
    // times as a result, but, again, only the first invocation will do anything.
    prePickFeatures(leaflet);
    leaflet._pickedFeatures.features.push(entity);
}

function prePickFeatures(leaflet) {
    if (!defined(leaflet._pickedFeatures)) {
        leaflet._pickedFeatures = new PickedFeatures();
        runLater(function() {
            pickFeatures(leaflet);
        });
    }
}

function pickFeatures(leaflet, latlng) {
    if (!defined(leaflet._pickedFeatures)) {
        return;
    }

    // We can't count on pickFeatures (triggered by click on the map) being called after
    // featurePicked (triggered by click on an individual feature).  So don't resolve the pick
    // promise until we're sure all the click handlers have run, by waiting on a runLater.
    var promises = [];
    var imageryLayers = [];
    promises.push(runLater(function() {
    }));
    imageryLayers.push(" ");

    if (defined(latlng)) {
        var dataSources = leaflet.terria.nowViewing.items;

        var pickedLocation = Cartographic.fromDegrees(latlng.lng, latlng.lat);
        var pickPosition = Ellipsoid.WGS84.cartographicToCartesian(pickedLocation);
        leaflet._pickedFeatures.pickPosition = pickPosition;

        for (var i = 0; i < dataSources.length; ++i) {
            var dataSource = dataSources[i];
            if (dataSource.isEnabled && dataSource.isShown && defined(dataSource.imageryLayer) && defined(dataSource.imageryLayer.pickFeatures)) {
                promises.push(dataSource.imageryLayer.pickFeatures(leaflet.map, CesiumMath.toRadians(latlng.lng), CesiumMath.toRadians(latlng.lat)));
                imageryLayers.push(dataSource.imageryLayer);
            }
        }
    }

    var pickedFeatures = leaflet._pickedFeatures;
    leaflet._pickedFeatures.allFeaturesAvailablePromise = when.all(promises, function(results) {
        pickedFeatures.isLoading = false;

        for (var resultIndex = 0; resultIndex < results.length; ++resultIndex) {
            var result = results[resultIndex];

            if (defined(result) && result.length > 0) {
                for (var featureIndex = 0; featureIndex < result.length; ++featureIndex) {
                    var feature = result[featureIndex];
                    feature.imageryLayer = imageryLayers[resultIndex];

                    // For features without a position, use the picked location.
                    if (!defined(feature.position)) {
                        feature.position = pickedLocation;
                    }

                    pickedFeatures.features.push(leaflet._createEntityFromImageryLayerFeature(feature));
                }
            }
        }
    }).otherwise(function() {
        pickedFeatures.isLoading = false;
        pickedFeatures.error = 'An unknown error occurred while picking features.';
    });

    leaflet.terria.pickedFeatures = leaflet._pickedFeatures;
    leaflet._pickedFeatures = undefined;
}

function selectFeature(leaflet) {
    var feature = leaflet.terria.selectedFeature;

    if (defined(leaflet._selectedFeatureCatalogItem)) {
        leaflet._selectedFeatureCatalogItem._hide();
        leaflet._selectedFeatureCatalogItem._disable();
        leaflet._selectedFeatureCatalogItem = undefined;
    }

    if (defined(feature) && defined(feature.position)) {
        var cartographic = Ellipsoid.WGS84.cartesianToCartographic(feature.position.getValue(leaflet.terria.clock.currentTime), cartographicScratch);
        leaflet._selectionIndicator.setLatLng([CesiumMath.toDegrees(cartographic.latitude), CesiumMath.toDegrees(cartographic.longitude)]);
        animateSelectionIndicatorAppear(leaflet);

        var geoJson = featureDataToGeoJson(feature.data);

        // Show geometry associated with the feature.
        // Don't show points; the targeting cursor is sufficient.
        if (defined(geoJson) && defined(geoJson.geometry) && geoJson.geometry.type !== 'Point') {
            var catalogItem = leaflet._selectedFeatureCatalogItem = new GeoJsonCatalogItem(leaflet.terria);
            catalogItem.data = geoJson;
            catalogItem.style = {
              'stroke-width': 2,
              'stroke': '#ffffff',
              'fill-opacity': 0,
              'marker-color': '#ffffff'
            };

            catalogItem.load().then(function() {
                if (catalogItem !== leaflet._selectedFeatureCatalogItem) {
                    return;
                }

                catalogItem._enable();
                catalogItem._show();
            });
        }
    } else {
        animateSelectionIndicatorDepart(leaflet);
    }
}

function startTweens(leaflet) {
    if (leaflet._tweensAreRunning) {
        return;
    }

    if (leaflet._tweens.length === 0) {
        return;
    }

    leaflet._tweens.update();

    if (leaflet._tweens.length !== 0) {
        cesiumRequestAnimationFrame(startTweens.bind(undefined, leaflet));
    }
}

function animateSelectionIndicatorAppear(leaflet) {
    if (defined(leaflet._selectionIndicatorTween)) {
        if (leaflet._selectionIndicatorIsAppearing) {
            // Already appearing; don't restart the animation.
            return;
        }
        leaflet._selectionIndicatorTween.cancelTween();
        leaflet._selectionIndicatorTween = undefined;
    }

    var style = leaflet._selectionIndicatorDomElement.style;

    leaflet._selectionIndicatorIsAppearing = true;
    leaflet._selectionIndicatorTween = leaflet._tweens.add({
        startObject: {
            scale: 2.0,
            opacity: 0.0,
            rotate: -180
        },
        stopObject: {
            scale: 1.0,
            opacity: 1.0,
            rotate: 0
        },
        duration: 0.8,
        easingFunction: EasingFunction.EXPONENTIAL_OUT,
        update: function(value) {
            style.opacity = value.opacity;
            style.transform = 'scale(' + (value.scale) + ') rotate(' + value.rotate + 'deg)';
        },
        complete: function() {
            leaflet._selectionIndicatorTween = undefined;
        },
        cancel: function() {
            leaflet._selectionIndicatorTween = undefined;
        }
    });

    startTweens(leaflet);
}

function animateSelectionIndicatorDepart(leaflet) {
    if (defined(leaflet._selectionIndicatorTween)) {
        if (!leaflet._selectionIndicatorIsAppearing) {
            // Already disappearing, dont' restart the animation.
            return;
        }
        leaflet._selectionIndicatorTween.cancelTween();
        leaflet._selectionIndicatorTween = undefined;
    }

    var style = leaflet._selectionIndicatorDomElement.style;

    leaflet._selectionIndicatorIsAppearing = false;
    leaflet._selectionIndicatorTween = leaflet._tweens.add({
        startObject: {
            scale: 1.0,
            opacity: 1.0
        },
        stopObject: {
            scale: 1.5,
            opacity: 0.0
        },
        duration: 0.8,
        easingFunction: EasingFunction.EXPONENTIAL_OUT,
        update: function(value) {
            style.opacity = value.opacity;
            style.transform = 'scale(' + value.scale + ') rotate(0deg)';
        },
        complete: function() {
            leaflet._selectionIndicatorTween = undefined;
        },
        cancel: function() {
            leaflet._selectionIndicatorTween = undefined;
        }
    });

    startTweens(leaflet);
}

module.exports = Leaflet;
