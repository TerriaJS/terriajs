'use strict';

/*global require*/

var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');

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

module.exports = CatalogItemControl;