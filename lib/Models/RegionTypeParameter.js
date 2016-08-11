'use strict';

/*global require*/
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');

var FunctionParameter = require('./FunctionParameter');
var inherit = require('../Core/inherit');
var RegionProviderList = require('../Map/RegionProviderList');

/**
 * A parameter that specifies a type of region.
 *
 * @alias RegionTypeParameter
 * @constructor
 * @extends FunctionParameter
 *
 * @param {Object} [options] Object with the following properties:
 * @param {Terria} options.terria The Terria instance.
 * @param {String} options.id The unique ID of this parameter.
 * @param {String} [options.name] The name of this parameter.  If not specified, the ID is used as the name.
 * @param {String} [options.description] The description of the parameter.
 * @param {String[]} [options.validRegionTypes] The region types from which this RegionTypeParameter selects.  If this parameter is not specified, all region types
 *                                              known to {@link Terria} may be selected.
 */
var RegionTypeParameter = function(options) {
    FunctionParameter.call(this, options);

    this._regionProviderPromise = undefined;
    this._regionProviderList = undefined;

    this.validRegionTypes = options.validRegionTypes;

    // Track this so that defaultValue can update once regionProviderList is known.
    knockout.track(this, ['_regionProviderList']);
};

inherit(FunctionParameter, RegionTypeParameter);

defineProperties(RegionTypeParameter.prototype, {
    /**
     * Gets the type of this parameter.
     * @memberof RegionTypeParameter.prototype
     * @type {String}
     */
    type: {
        get: function() {
            return 'regionType';
        }
    },

    defaultValue: {
        get: function() {
            const nowViewingItems = this.terria.nowViewing.items;
            if (nowViewingItems.length > 0) {
                for (let i = 0; i < nowViewingItems.length; ++i) {
                    const item = nowViewingItems[i];
                    if (defined(item.regionMapping) && defined(item.regionMapping.regionDetails) && item.regionMapping.regionDetails.length > 0) {
                        return item.regionMapping.regionDetails[0].regionProvider;
                    }
                }
            }
            if (defined(this._regionProviderList) && this._regionProviderList.length > 0) {
                return this._regionProviderList[0];
            }
            // No defaults available; have we requested the region providers yet?
            this.getAllRegionTypes();
        }
    }
});

/**
 * Gets all list of region types that may be selected for this parameter.
 * Also caches the promise in this._regionProviderPromise, and the promise result in
 * this._regionProviderList.
 * @return {Promise.<RegionProvider[]>} [description]
 */
RegionTypeParameter.prototype.getAllRegionTypes = function() {
    var that = this;
    if (defined(this._regionProviderPromise)) {
        return this._regionProviderPromise;
    }
    this._regionProviderPromise = RegionProviderList.fromUrl(this.terria.configParameters.regionMappingDefinitionsUrl, this.terria.corsProxy).then(function(regionProviderList) {
        var result;
        if (!defined(that.validRegionTypes)) {
            result = regionProviderList.regionProviders;
        } else {
            result = regionProviderList.regionProviders.filter(function(regionProvider) {
                return that.validRegionTypes.indexOf(regionProvider.regionType) >= 0;
            });
        }
        that._regionProviderList = result;
        return result;
    });
    return this._regionProviderPromise;
};

module.exports = RegionTypeParameter;
