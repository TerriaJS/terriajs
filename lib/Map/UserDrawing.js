'use strict';

/*global require*/
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var UserPoint = require('./UserPoint');

var offScreen = '-1000px';

var UserDrawing = function(cesium, terria) {
    //>>includeStart('debug', pragmas.debug);
    if (!defined(cesium)) {
        throw new DeveloperError('cesium is required.');
    }
    //>>includeEnd('debug')

    this._terria = terria;
    this._cesium = cesium;
    this._screenPositionX = offScreen;
    this._screenPositionY = offScreen;
    this._tweens = cesium.scene.tweens;
    this._container = cesium.viewer.container;

    this._points = {};

    /**
     * Gets or sets the visibility of the selection indicator.
     * @type {Boolean}
     */
    this.showSelection = true;

    this.transform = '';

    this.opacity = 1.0;

    knockout.track(this, ['position', '_screenPositionX', '_screenPositionY', '_scale', 'rotate', 'showSelection', 'transform', 'opacity']);

    /**
     * Gets the visibility of the position indicator.  This can be false even if an
     * object is selected, when the selected object has no position.
     * @type {Boolean}
     */
    this.isVisible = undefined;
    knockout.defineProperty(this, 'isVisible', {
        get : function() {
            return this.showSelection && defined(this.position);
        }
    });
};

UserDrawing.prototype.destroy = function() {
    for (var key in this._points)
    {
        this._points[key].destroy();
    }
    this._points = {};
};

UserDrawing.prototype.update = function() {
    for (var i = 0; i < this._terria.userSelectedPoints.length; ++i)
    {
        var pt = this._terria.userSelectedPoints[i];
        if (!(pt in this._points))
        {
            var userPoint = new UserPoint(this._cesium, this._terria);
            userPoint.position = pt;
            this._points[pt] = userPoint;
        }
        this._points[pt].update();
    }
};

defineProperties(UserDrawing.prototype, {
    /**
     * Gets the HTML element containing the selection indicator.
     * @memberof UserDrawing.prototype
     *
     * @type {Element}
     */
    container : {
        get : function() {
            return this._container;
        }
    },

    /**
     * Gets the HTML element that holds the selection indicator.
     * @memberof UserDrawing.prototype
     *
     * @type {Element}
     */
    selectionIndicatorElement : {
        get : function() {
            return this._selectionIndicatorElement;
        }
    },

    /**
     * Gets the scene being used.
     * @memberof UserDrawing.prototype
     *
     * @type {Scene}
     */
    scene : {
        get : function() {
            return this._scene;
        }
    }
});

module.exports = UserDrawing;
