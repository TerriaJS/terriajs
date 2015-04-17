'use strict';

/*global require,html2canvas,L*/
var Cartesian2 = require('../../third_party/cesium/Source/Core/Cartesian2');
var Cartographic = require('../../third_party/cesium/Source/Core/Cartographic');
var CesiumMath = require('../../third_party/cesium/Source/Core/Math');
var defined = require('../../third_party/cesium/Source/Core/defined');
var destroyObject = require('../../third_party/cesium/Source/Core/destroyObject');
var DeveloperError = require('../../third_party/cesium/Source/Core/DeveloperError');
var EasingFunction = require('../../third_party/cesium/Source/Core/EasingFunction');
var Ellipsoid = require('../../third_party/cesium/Source/Core/Ellipsoid');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');
var Rectangle = require('../../third_party/cesium/Source/Core/Rectangle');
var cesiumRequestAnimationFrame = require('../../third_party/cesium/Source/Core/requestAnimationFrame');
var TweenCollection = require('../../third_party/cesium/Source/Scene/TweenCollection');
var when = require('../../third_party/cesium/Source/ThirdParty/when');

var GlobeOrMap = require('./GlobeOrMap');
var inherit = require('../Core/inherit');
var LeafletScene = require('../Map/LeafletScene');
var PickedFeatures = require('../Map/PickedFeatures');
var rectangleToLatLngBounds = require('../Map/rectangleToLatLngBounds');
var runLater = require('../Core/runLater');

var Leaflet = function(application, map) {
    GlobeOrMap.call(this);

    this.application = application;

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
            html: '<img src="images/NM-LocationTarget.svg" width="50" height="50" alt="" />',
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

    this._selectedFeatureSubscription = knockout.getObservable(this.application, 'selectedFeature').subscribe(function() {
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
    leaflet._pickedFeatures.features.push(entity);
}

function prePickFeatures(leaflet) {
    leaflet._pickedFeatures = new PickedFeatures();
}

function pickFeatures(leaflet, latlng) {
    // We can't count on pickFeatures (triggered by click on the map) being called after before
    // featurePicked (triggered by click on an individual feature).  So don't resolve the pick
    // promise until we're sure all the click handlers have run, by waiting on a runLater.
    var promises = [];
    promises.push(runLater(function() {}));

    var dataSources = leaflet.application.nowViewing.items;

    var pickedLocation = Cartographic.fromDegrees(latlng.lng, latlng.lat);
    var pickPosition = Ellipsoid.WGS84.cartographicToCartesian(pickedLocation);
    leaflet._pickedFeatures.pickPosition = pickPosition;

    for (var i = 0; i < dataSources.length ; ++i) {
        var dataSource = dataSources[i];
        if (dataSource.isEnabled && dataSource.isShown && defined(dataSource._imageryLayer) && defined(dataSource._imageryLayer.pickFeatures)) {
            promises.push(dataSource._imageryLayer.pickFeatures(leaflet.map, CesiumMath.toRadians(latlng.lng), CesiumMath.toRadians(latlng.lat)));
        }
    }

    leaflet._pickedFeatures.allFeaturesAvailablePromise = when.all(promises, function(results) {
        leaflet._pickedFeatures.isLoading = false;
        
        for (var resultIndex = 0; resultIndex < results.length; ++resultIndex) {
            var result = results[resultIndex];

            if (defined(result) && result.length > 0) {
                for (var featureIndex = 0; featureIndex < result.length; ++featureIndex) {
                    var feature = result[featureIndex];

                    // For features without a position, use the picked location.
                    if (!defined(feature.position)) {
                        feature.position = pickedLocation;
                    }

                    leaflet._pickedFeatures.features.push(leaflet._createEntityFromImageryLayerFeature(feature));
                }
            }
        }
    }).otherwise(function() {
        leaflet._pickedFeatures.isLoading = false;
        leaflet._pickedFeatures.error = 'An unknown error occurred while picking features.';
    });

    leaflet.application.pickedFeatures = leaflet._pickedFeatures;
}

function selectFeature(leaflet) {
    var feature = leaflet.application.selectedFeature;
    if (defined(feature) && defined(feature.position)) {
        var cartographic = Ellipsoid.WGS84.cartesianToCartographic(feature.position.getValue(leaflet.application.clock.currentTime), cartographicScratch);
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
