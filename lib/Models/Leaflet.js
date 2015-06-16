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
 * @param {Viewer} viewer The leaflet viewer instance.
 */
var Leaflet = function(terria, map) {
    GlobeOrMap.call(this);

    this.terria = terria;

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

    this._pickedFeatures = undefined;
    this._selectionIndicator = L.marker([0,0], {
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

    this._selectedFeatureSubscription = knockout.getObservable( this.terria, 'selectedFeature').subscribe(function() {
        selectFeature(this);
    }, this);
};

inherit(GlobeOrMap, Leaflet);

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
    promises.push(runLater(function() {}));

    if (defined(latlng)) {
        var dataSources = leaflet.terria.nowViewing.items;

        var pickedLocation = Cartographic.fromDegrees(latlng.lng, latlng.lat);
        var pickPosition = Ellipsoid.WGS84.cartographicToCartesian(pickedLocation);
        leaflet._pickedFeatures.pickPosition = pickPosition;

        for (var i = 0; i < dataSources.length ; ++i) {
            var dataSource = dataSources[i];
            if (dataSource.isEnabled && dataSource.isShown && defined(dataSource.imageryLayer) && defined(dataSource.imageryLayer.pickFeatures)) {
                promises.push(dataSource.imageryLayer.pickFeatures(leaflet.map, CesiumMath.toRadians(latlng.lng), CesiumMath.toRadians(latlng.lat)));
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
    if (defined(feature) && defined(feature.position)) {
        var cartographic = Ellipsoid.WGS84.cartesianToCartographic(feature.position.getValue(leaflet.terria.clock.currentTime), cartographicScratch);
        leaflet._selectionIndicator.setLatLng([CesiumMath.toDegrees(cartographic.latitude), CesiumMath.toDegrees(cartographic.longitude)]);
        animateSelectionIndicatorAppear(leaflet);
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
