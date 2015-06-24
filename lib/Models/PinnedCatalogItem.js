'use strict';

/*global require*/

var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var CatalogItem = require('./CatalogItem');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');

var inherit = require('../Core/inherit');

/**
 * A {@link CatalogItem} that represented on the map with a pin.
 *
 * @alias PinnedCatalogItem
 * @constructor
 * @extends CatalogItem
 * @abstract
 *
 * @param {Terria} terria The terria instance.
 * @param {MapIcon} pin The icon to be used as the pin.
 */
var PinnedCatalogItem = function(terria, pin) {
    CatalogItem.call(this, terria);

    this._pin = pin;

    knockout.getObservable(this.terria, 'pickedFeatures').subscribe(function(features) {
        console.log(features);
        for (var i = 0; i < features.length; i++) {
            var feature = features[i];
            var id = defaultValue(feature.id, feature.primitive.id);
            if (id instanceof PinnedCatalogItem) {
                id.pinClicked();
            }
        }
    }, this);
};

inherit(CatalogItem, PinnedCatalogItem);

defineProperties(PinnedCatalogItem.prototype, {

    /**
     * Gets the type of data item represented by this instance.
     * @memberOf PinnedCatalogItem.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return 'pinned';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, 'Pinned Item'.
     * @memberOf PinnedCatalogItem.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'Pinned Item';
        }
    },

    /**
     * Gets the pin used to display this data item.
     * @memberOf PinnedCatalogItem.prototype
     * @type {MapIcon}
     */
    pin : {
        get : function() {
            return this._pin;
        }
    },

});


/**
 * When implemented in a derived class, enables this data item on the Cesium globe.  You should not call this
 * directly, but instead set the {@link CatalogItem#isEnabled} property to true.  See
 * {@link CatalogItem#_enable} for more information.
 * @abstract
 * @protected
 */
CatalogItem.prototype._enableInCesium = function() {
    if (!defined(this.pin)) {
        throw new DeveloperError('This data source is not properly configured.');
    }
    this.pin.icon.id = this;
};

/**
 * When implemented in a derived class, disables this data item on the Cesium globe.  You should not call this
 * directly, but instead set the {@link CatalogItem#isEnabled} property to false.  See
 * {@link CatalogItem#_disable} for more information.
 * @abstract
 * @protected
 */
CatalogItem.prototype._disableInCesium = function() {
    // Nothing to be done.
};

/**
 * When implemented in a derived class, shows this data item on the Cesium globe.  You should not call this
 * directly, but instead set the {@link CatalogItem#isShown} property to true.  See
 * {@link CatalogItem#_show} for more information.
 * @abstract
 * @protected
 */
CatalogItem.prototype._showInCesium = function() {
    if (!defined(this.rectangle)) {
        throw new DeveloperError('This data source is not enabled.');
    }
    this.pin.show();
};

/**
 * When implemented in a derived class, hides this data item on the Cesium globe.  You should not call this
 * directly, but instead set the {@link CatalogItem#isShown} property to false.  See
 * {@link CatalogItem#_hide} for more information.
 * @abstract
 * @protected
 */
CatalogItem.prototype._hideInCesium = function() {
    this.pin.hide();
};

/**
 * When implemented in a derived class, enables this data item on the Leaflet map.  You should not call this
 * directly, but instead set the {@link CatalogItem#isEnabled} property to true.  See
 * {@link CatalogItem#_enable} for more information.
 * @abstract
 * @protected
 */
CatalogItem.prototype._enableInLeaflet = function() {
    if (!defined(this.pin)) {
        throw new DeveloperError('This data source is not properly configured.');
    }
};

/**
 * When implemented in a derived class, disables this data item on the Leaflet map.  You should not call this
 * directly, but instead set the {@link CatalogItem#isEnabled} property to false.  See
 * {@link CatalogItem#_disable} for more information.
 * @abstract
 * @protected
 */
CatalogItem.prototype._disableInLeaflet = function() {
    // Nothing to be done.
};

/**
 * When implemented in a derived class, shows this data item on the Leaflet map.  You should not call this
 * directly, but instead set the {@link CatalogItem#isShown} property to true.  See
 * {@link CatalogItem#_show} for more information.
 * @abstract
 * @protected
 */
CatalogItem.prototype._showInLeaflet = function() {
    if (!defined(this.rectangle)) {
        throw new DeveloperError('This data source is not enabled.');
    }
    this.pin.show(this.rectangle.center);
};

/**
 * When implemented in a derived class, hides this data item on the Leaflet map.  You should not call this
 * directly, but instead set the {@link CatalogItem#isShown} property to false.  See
 * {@link CatalogItem#_hide} for more information.
 * @abstract
 * @protected
 */
CatalogItem.prototype._hideInLeaflet = function() {
    this.position.hide();
};

/**
 * When implemented in a derived class, is the function called when a pin is clicked
 * @abstract
 * @protected
 */
CatalogItem.prototype.pinClicked = function(data) {
    throw new DeveloperError('pinClicked must be implemented in the derived class.');
};

module.exports = PinnedCatalogItem;
