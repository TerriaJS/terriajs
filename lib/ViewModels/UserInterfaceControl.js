'use strict';

/*global require*/

var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');


/**
 * The view-model for a control in the user interface
 *
 * @alias UserInterfaceControl
 * @constructor
 * @abstract
 *
 * @param {Terria} terria The Terria instance.
 */
var UserInterfaceControl = function(terria) {
    if (!defined(terria)) {
        throw new DeveloperError('terria is required');
    }

    this._terria = terria;

    /**
     * Gets or sets the name of the control which is set as the control's title.
     * This property is observable.
     * @type {String}
     */
    this.name = 'Unnamed Control';

    /**
     * Gets or sets the text to be displayed in the UI control.
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

defineProperties(UserInterfaceControl.prototype, {

    /**
     * Gets the Terria instance.
     * @memberOf UserInterfaceControl.prototype
     * @type {Terria}
     */
    terria : {
        get : function() {
            return this._terria;
        }
    },

    /**
     * Gets a value indicating whether this button has text associated with it.
     * @type {Object}
     */
    hasText : {
        get : function() {
            return defined(this.text) && typeof this.text === 'string';
        }
    }

});

/**
 * When implemented in a derived class, performs an action when the user clicks
 * on this control.
 * @abstract
 * @protected
 */
UserInterfaceControl.prototype.activate = function() {
    throw new DeveloperError('activate must be implemented in the derived class.');
};

module.exports = UserInterfaceControl;