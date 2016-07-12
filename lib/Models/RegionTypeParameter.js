'use strict';

/*global require*/
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
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

    this._regionProviderList = undefined;

    this.validRegionTypes = options.validRegionTypes;
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
    }
});

/**
 * Gets all list of region types that may be selected for this parameter.
 * @return {Promise.<RegionProvider[]>} [description]
 */
RegionTypeParameter.prototype.getAllRegionTypes = function() {
    var that = this;
    return RegionProviderList.fromUrl(this.terria.configParameters.regionMappingDefinitionsUrl, this.terria.corsProxy).then(function(regionProviderList) {
        var result;

        if (!defined(that.validRegionTypes)) {
            result = regionProviderList.regionProviders;
        } else {
            result = regionProviderList.regionProviders.filter(function(regionProvider) {
                return that.validRegionTypes.indexOf(regionProvider.regionType) >= 0;
            });
        }

        return result;
    });
};

module.exports = RegionTypeParameter;
