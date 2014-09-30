'use strict';

/*global require*/

var GeoDataItemViewModel = require('./GeoDataItemViewModel');
var inherit = require('../inherit');

var loadWithXhr = require('../../third_party/cesium/Source/Core/loadWithXhr');

/**
 * A {@link GeoDataItemViewModel} representing an unknown URL.  This class can asynchronously deduce the type
 * of the URL and create an appropriate view-model for it.
 *
 * @alias UnknownUrlViewModel
 * @constructor
 * @extends GeoDataItemViewModel
 * 
 * @param {GeoDataCatalogContext} context The context for the item.
 */
var UnknownUrlViewModel = function(context) {
    GeoDataItemViewModel.call(this, context);

    this.url = undefined;

    knockout.track(this, ['url']);
};

UnknownUrlViewModel.prototype = inherit(GeoDataItemViewModel.prototype);

/**
 * Asychronously deduces the type of data referred to by the URL and creates an appropriate
 * {@link GeoDataItemViewModel} for it.
 * 
 * @return {Promise|GeoDataItemViewModel} A promise for the created view model.
 */
UnknownUrlViewModel.prototype.createViewModel = function() {
    return loadWithXhr({
        url: this.url
    }).then(function(content) {

    }).otherwise(function(e) {

    });
};

module.exports = UnknownUrlViewModel;
