'use strict';

/*global require,ga*/

var defined = require('../../third_party/cesium/Source/Core/defined');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');
var Cartesian3 = require('../../third_party/cesium/Source/Core/Cartesian3');
var Matrix4 = require('../../third_party/cesium/Source/Core/Matrix4');

var inherit = require('../Core/inherit');
var NavControl = require('./NavControl');
var rectangleToLatLngBounds = require('../Map/rectangleToLatLngBounds');

var svgReset = require('../SvgPaths/svgReset');

/**
 * The model for a zoom in control in the navigation control tool bar
 *
 * @alias ResetViewNavControl
 * @constructor
 * @abstract
 *
 * @param {Terria} terria The Terria instance.
 */
var ResetViewNavControl = function(terria) {
    NavControl.call(this, terria);

    /**
     * Gets or sets the name of the control which is set as the control's title.
     * This property is observable.
     * @type {String}
     */
    this.name = 'Reset View';

    /**
     * Gets or sets the svg icon of the control.  This property is observable.
     * @type {Object}
     */
    this.svgIcon = svgReset;

    /**
     * Gets or sets the height of the svg icon.  This property is observable.
     * @type {Integer}
     */
    this.svgHeight = 15;

    /**
     * Gets or sets the width of the svg icon.  This property is observable.
     * @type {Integer}
     */
    this.svgWidth = 15;

    /**
     * Gets or sets the CSS class of the control. This property is observable.
     * @type {String}
     */
    this.cssClass = "navigation-control-icon-reset";

};

inherit(NavControl, ResetViewNavControl);

ResetViewNavControl.prototype.resetView = function() {
    ga('send', 'event', 'navigation', 'click', 'reset');
    this.isActive = true;
    this.terria.currentViewer.zoomTo(this.terria.homeView, 1.5);
    this.isActive = false;
};

/**
 * When implemented in a derived class, performs an action when the user clicks
 * on this control
 * @abstract
 * @protected
 */
ResetViewNavControl.prototype.didClick = function() {
    this.resetView();
};

module.exports = ResetViewNavControl;