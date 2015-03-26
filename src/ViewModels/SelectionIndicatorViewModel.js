'use strict';

/*global require*/
var Cartesian2 = require('../../third_party/cesium/Source/Core/Cartesian2');
var defaultValue = require('../../third_party/cesium/Source/Core/defaultValue');
var defined = require('../../third_party/cesium/Source/Core/defined');
var DeveloperError = require('../../third_party/cesium/Source/Core/DeveloperError');
var getElement = require('../../third_party/cesium/Source/Widgets/getElement');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');

var loadView = require('../Core/loadView');

var screenSpacePos = new Cartesian2();
var offScreen = '-1000px';

/**
 * A UI element highlighting the selected feature.
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

    knockout.track(this, ['position', 'screenPositionX', 'screenPositionY', 'scale', 'isVisible', 'selectionIndicatorSvg']);

    this.selectionIndicatorElement = loadView(require('fs').readFileSync(__dirname + '/../Views/SelectionIndicator.html', 'utf8'), container, this)[0];

    this.application.mapViewChanged.addEventListener(function() {
        this.update();
    }, this);
};

/**
 * Updates the view of the selection indicator to match the position and content properties of the view model.
 * This function should be called as part of the render loop.
 */
SelectionIndicatorViewModel.prototype.update = function() {
    if (this.isVisible && defined(this.position)) {
        var screenPosition = this.application.currentViewer.computePositionOnScreen(this.position, screenSpacePos);
        if (!defined(screenPosition)) {
            this.screenPositionX = offScreen;
            this.screenPositionY = offScreen;
        } else {
            var container = this.container;
            var containerWidth = container.clientWidth;
            var containerHeight = container.clientHeight;
            var indicatorSize = this.selectionIndicatorElement.clientWidth;
            var halfSize = indicatorSize * 0.5;

            screenPosition.x = Math.min(Math.max(screenPosition.x, -indicatorSize), containerWidth + indicatorSize) - halfSize;
            screenPosition.y = Math.min(Math.max(screenPosition.y, -indicatorSize), containerHeight + indicatorSize) - halfSize;

            this.screenPositionX = Math.floor(screenPosition.x + 0.25) + 'px';
            this.screenPositionY = Math.floor(screenPosition.y + 0.25) + 'px';
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
