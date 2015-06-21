'use strict';

/*global require*/

var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');

/**
 * The model for a control in the user interface.
 *
 * @alias UIControl
 * @constructor
 * @abstract
 *
 * @param {Terria} terria The Terria instance.
 */
var UIControl = function(terria) {
    if (!defined(terria)) {
        throw new DeveloperError('terria is required');
    }

    this._terria = terria;

    /**
     * Gets or sets the name of the control which should be set as the control's title.
     * This property is observable.
     * @type {String}
     */
    this.name = 'Unnamed Control';

    /**
     * Gets or sets the text to be displayed in the nav control.
     * This property is observable.
     * @type {String}
     */
    this.text = undefined;

    /**
     * Gets or sets the svg icon of the control.  This property is observable.
     * @type {Object}
     */
    this.svgIcon = undefined;

    /**
     * Gets or sets the height of the svg icon.  This property is observable.
     * @type {Integer}
     */
    this.svgHeight = undefined;

    /**
     * Gets or sets the width of the svg icon.  This property is observable.
     * @type {Integer}
     */
    this.svgWidth = undefined;

    /**
     * Gets or sets the CSS class of the control. This property is observable.
     * @type {String}
     */
    this.cssClass = undefined;

    /**
     * Gets or sets the property describing whether or not the control is in the active state.
     * This property is observable.
     * @type {Boolean}
     */
    this.isActive = false;

    knockout.track(this, ['name', 'svgIcon', 'svgHeight', 'svgWidth', 'cssClass', 'isActive']);
};

defineProperties(UIControl.prototype, {

    /**
      * Gets the Terria instance.
     * @memberOf UIControl.prototype
     * @type {Terria}
     */
    terria : {
        get : function() {
            return this._terria;
        }
    }

});

/**
 * When implemented in a derived class, performs an action when the user clicks
 * on this control
 * @abstract
 * @protected
 */
UIControl.prototype.didClick = function() {
    throw new DeveloperError('diClick must be implemented in the derived class.');
};

/**
 * Detects whether or not text is set
 * @protected
 */
UIControl.prototype.hasText = function() {
    return defined(this.text) && typeof this.text === "string";
};

module.exports = UIControl;