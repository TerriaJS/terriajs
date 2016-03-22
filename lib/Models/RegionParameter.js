'use strict';

/*global require*/
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var FunctionParameter = require('./FunctionParameter');
var inherit = require('../Core/inherit');
var RegionProvider = require('../Map/RegionProvider');
var RegionTypeParameter = require('../Models/RegionTypeParameter');

/**
 * A parameter that specifies a particular region.
 *
 * @alias RegionParameter
 * @constructor
 * @extends FunctionParameter
 *
 * @param {Object} [options] Object with the following properties:
 * @param {Terria} options.terria The Terria instance.
 * @param {String} options.id The unique ID of this parameter.
 * @param {String} [options.name] The name of this parameter.  If not specified, the ID is used as the name.
 * @param {String} [options.description] The description of the parameter.
 * @param {RegionProvider|RegionTypeParameter} options.regionProvider The {@link RegionProvider} from which a region may be selected.  This may also
 *                                                                    be a {@link RegionTypeParameter} that specifies the type of region.
 */
var RegionParameter = function(options) {
    if (!defined(options) || !defined(options.regionProvider)) {
        throw new DeveloperError('options.regionProvider is required.');
    }

    FunctionParameter.call(this, options);

    this.regionProvider = options.regionProvider;
};

inherit(FunctionParameter, RegionParameter);

defineProperties(RegionParameter.prototype, {
    /**
     * Gets the type of this parameter.
     * @memberof RegionParameter.prototype
     * @type {String}
     */
    type: {
        get: function() {
            return 'region';
        }
    }
});

/**
 * Gets the current {@link RegionProvider} definining the possible regions that may be selected with this parameter.
 * @param {Object} [parameterValues] The current values of the parameters to the {@link CatalogFunction}.  This parameter is ignored if
 *                                   {@link RegionParameter#regionProvider} is a {@link RegionProvider}, but it is required when
 *                                   {@link RegionParameter#regionProvider} is a {@link RegionTypeParameter}.
 * @return {RegionProvider} The region provider.
 */
RegionParameter.prototype.getRegionProvider = function(parameterValues) {
    if (this.regionProvider instanceof RegionProvider) {
        return this.regionProvider;
    } else if (this.regionProvider instanceof RegionTypeParameter) {
        return parameterValues[this.regionProvider.id];
    } else {
        return undefined;
    }
};

/**
 * Finds a region with a given region ID.
 *
 * @param {String} regionID The ID of the region to find.
 * @param {Object} [parameterValues] The current values of the parameters to the {@link CatalogFunction}.  This parameter is ignored if
 *                                   {@link RegionParameter#regionProvider} is a {@link RegionProvider}, but it is required when
 *                                   {@link RegionParameter#regionProvider} is a {@link RegionTypeParameter}.
 * @return {Region} The region, or undefined if no region matching the ID was found.
 */
RegionParameter.prototype.findRegionByID = function(regionID, parameterValues) {
    var regions = this.getRegionProvider(parameterValues);
    return regions.regions.filter(function(region) {
        return region.id === regionID;
    })[0];
};

/**
 * Gets the current value of the parameter.
 * @param {Object} parameterValues The value of the parameters to the function.  The value is extracted from a parameter named {@link RegionParameter#id}.
 * @return {Region} The selected region, or undefined if no region is selected for this parameter.
 */
RegionParameter.prototype.getValue = function(parameterValues) {
    var region = parameterValues[this.id];
    if (!defined(region)) {
        return undefined;
    }
    return this.findRegionByID(region.id, parameterValues);
};

module.exports = RegionParameter;
