'use strict';

/*global require,L*/
var Cartesian2 = require('../../third_party/cesium/Source/Core/Cartesian2');
var Cartographic = require('../../third_party/cesium/Source/Core/Cartographic');
var CesiumMath = require('../../third_party/cesium/Source/Core/Math');
var defaultValue = require('../../third_party/cesium/Source/Core/defaultValue');
var defined = require('../../third_party/cesium/Source/Core/defined');
var DeveloperError = require('../../third_party/cesium/Source/Core/DeveloperError');
var Ellipsoid = require('../../third_party/cesium/Source/Core/Ellipsoid');
var getElement = require('../../third_party/cesium/Source/Widgets/getElement');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');

var loadView = require('../Core/loadView');

var screenSpacePos = new Cartesian2();
var offScreen = '-1000px';

/**
 * A UI element highlighting the selected feature.  This is implemented in Cesium as a manual DOM element and in Leaflet as a L.marker
 * (which is also a DOM element, of course).
 *
 * @alias SelectionIndicatorViewModel
 * @constructor
 *
 * @param {Application} application The application.
 * @param {Element} selectionIndicatorElement The element containing all elements that make up the selection indicator.
 * @param {Element} container The DOM element that contains the widget.
 */
var SelectionIndicatorViewModel = function(application, container) {
    //>>includeStart('debug', pragmas.debug);
    if (!defined(application)) {
        throw new DeveloperError('application is required.');
    }

    if (!defined(container)) {
        throw new DeveloperError('container is required.');
    }
    //>>includeEnd('debug')

    this.application = application;
    this.screenPositionX = offScreen;
    this.screenPositionY = offScreen;
    //this.tweens = scene.tweens;
    
    this.container = getElement(defaultValue(container, document.body));
    this.scale = 1;

    /**
     * Gets or sets the world position of the object for which to display the selection indicator.
     * @type {Cartesian3}
     */
    this.position = undefined;

    /**
     * Gets or sets the visibility of the selection indicator.
     * @type {Boolean}
     */
    this.isVisible = false;

    this.isCesium = false;

    knockout.track(this, ['position', 'screenPositionX', 'screenPositionY', 'scale', 'isVisible', 'isCesium']);

    this.selectionIndicatorElements = loadView(require('fs').readFileSync(__dirname + '/../Views/SelectionIndicator.html', 'utf8'), container, this);
    this.selectionIndicatorMarker = undefined;

    var that = this;
    this.application.beforeViewerChanged.addEventListener(function() {
        if (defined(that._removeSubscription)) {
            that._removeSubscription();
            that._removeSubscription = undefined;
        }

        if (defined(that.selectionIndicatorMarker)) {
            if (defined(that.application.leaflet)) {
                that.application.leaflet.map.removeLayer(that.selectionIndicatorMarker);
            }
            that.selectionIndicatorMarker = undefined;
        }
    });

    function addUpdateSubscription() {
        if (defined(that.application.cesium)) {
            that.isCesium = true;
            var scene = that.application.cesium.scene;
            that._removeSubscription = scene.postRender.addEventListener(function() {
                this.update();
            }, that);
        } else {
            that.isCesium = false;
        }
    }

    addUpdateSubscription();

    this.application.afterViewerChanged.addEventListener(function() {
        addUpdateSubscription();
        that.update();
    });
};

var cartographicScratch = new Cartographic();

/**
 * Updates the view of the selection indicator to match the position and content properties of the view model.
 * This function should be called as part of the render loop.
 */
SelectionIndicatorViewModel.prototype.update = function() {
    if (this.isVisible && defined(this.position)) {
        if (defined(this.application.cesium)) {
            var screenPosition = this.application.cesium.computePositionOnScreen(this.position, screenSpacePos);
            if (!defined(screenPosition)) {
                this.screenPositionX = offScreen;
                this.screenPositionY = offScreen;
            } else {
                var container = this.container;
                var containerWidth = container.clientWidth;
                var containerHeight = container.clientHeight;
                var indicatorSize = this.selectionIndicatorElements[0].clientWidth;
                var halfSize = indicatorSize * 0.5;

                screenPosition.x = Math.min(Math.max(screenPosition.x, -indicatorSize), containerWidth + indicatorSize) - halfSize;
                screenPosition.y = Math.min(Math.max(screenPosition.y, -indicatorSize), containerHeight + indicatorSize) - halfSize;

                this.screenPositionX = Math.floor(screenPosition.x + 0.25) + 'px';
                this.screenPositionY = Math.floor(screenPosition.y + 0.25) + 'px';
            }
        } else if (defined(this.application.leaflet)) {
            var cartographic = Ellipsoid.WGS84.cartesianToCartographic(this.position, cartographicScratch);
            var latlng = L.latLng(CesiumMath.toDegrees(cartographic.latitude), CesiumMath.toDegrees(cartographic.longitude));
            if (!defined(this.selectionIndicatorMarker)) {
                this.selectionIndicatorMarker = L.marker(latlng, {
                    icon: L.icon({
                        iconUrl: 'images/NM-LocationTarget.svg',
                        iconSize: L.point(50, 50)
                    })
                });
                this.selectionIndicatorMarker.addTo(this.application.leaflet.map);
            } else {
                this.selectionIndicatorMarker.setLatLng(latlng);
            }
        }
    } else {
        if (defined(this.selectionIndicatorMarker)) {

        }
    }
};

/**
 * Animate the indicator to draw attention to the selection.
 */
// SelectionIndicatorViewModel.prototype.animateAppear = function() {
//     this.tweens.addProperty({
//         object : this,
//         property : '_scale',
//         startValue : 2,
//         stopValue : 1,
//         duration : 0.8,
//         easingFunction : EasingFunction.EXPONENTIAL_OUT
//     });
// };

/**
 * Animate the indicator to release the selection.
 */
// SelectionIndicatorViewModel.prototype.animateDepart = function() {
//     this.tweens.addProperty({
//         object : this,
//         property : '_scale',
//         startValue : this.scale,
//         stopValue : 1.5,
//         duration : 0.8,
//         easingFunction : EasingFunction.EXPONENTIAL_OUT
//     });
// };

module.exports = SelectionIndicatorViewModel;
