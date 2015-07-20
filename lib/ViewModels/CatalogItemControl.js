'use strict';

/*global require*/

var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');

var UserInterfaceControl = require('./UserInterfaceControl');

var inherit = require('../Core/inherit');

/**
 * The view-model for a control in the data catalog associated with a catalog item
 *
 * @alias CatalogItemControl
 * @constructor
 * @abstract
 *
 * @param {CatalogItem} catalogItem The CatalogItem instance.
 */
var CatalogItemControl = function(catalogItem) {
    UserInterfaceControl.call(this, catalogItem.terria);

    this._item = catalogItem;

    /**
     * Gets or sets the text to be displayed as a button in the now viewing panel.
     * This property is observable.
     * @type {String}
     */
    this.text = "Unnamed Control";

    /**
     * Gets or sets the CSS class of the control. This property is observable.
     * @type {String}
     */
    this.cssClass = 'data-catalog-control-icon';

    /**
     * Gets or sets the name of the required property on the catalog item.
     * @type {String}
     */
    this.requiredPropertyName = undefined;

};

inherit(UserInterfaceControl, CatalogItemControl);

defineProperties(CatalogItemControl.prototype, {

    /**
     * Gets the CatalogItem instance that this control is associated with.
     * @memberOf CatalogItemControl.prototype
     * @type {CatalogItem}
     */
    item : {
        get : function() {
            return this._item;
        }
    }

});

/**
 * Gets the required property from the catalog item.
 * @abstract
 * @protected
 */
CatalogItemControl.prototype.requiredProperty = function() {
    if (!defined(this.requiredPropertyName)) {
        throw new DeveloperError('The required property name is not set.');
    }

    if (defined(this._item[this.requiredPropertyName])) {
        return this._item[this.requiredPropertyName];
    } else if (defined(this._item.customProperties[this.requiredPropertyName])) {
        return this._item.customProperties[this.requiredPropertyName];
    }

    throw new DeveloperError('The required property is not set on the item.');
};

module.exports = CatalogItemControl;