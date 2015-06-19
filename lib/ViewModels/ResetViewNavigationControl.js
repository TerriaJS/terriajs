'use strict';

/*global require,ga*/

var inherit = require('../Core/inherit');
var NavigationControl = require('./NavigationControl');

var svgReset = require('../SvgPaths/svgReset');

/**
 * The model for a zoom in control in the navigation control tool bar
 *
 * @alias ResetViewNavigationControl
 * @constructor
 * @abstract
 *
 * @param {Terria} terria The Terria instance.
 */
var ResetViewNavigationControl = function(terria) {
    NavigationControl.call(this, terria);

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

inherit(NavigationControl, ResetViewNavigationControl);

ResetViewNavigationControl.prototype.resetView = function() {
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
ResetViewNavigationControl.prototype.activate = function() {
    this.resetView();
};

module.exports = ResetViewNavigationControl;