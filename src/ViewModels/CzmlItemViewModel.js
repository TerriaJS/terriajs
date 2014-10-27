'use strict';

/*global require*/

var CesiumMath = require('../../third_party/cesium/Source/Core/Math');
var clone = require('../../third_party/cesium/Source/Core/clone');
var Color = require('../../third_party/cesium/Source/Core/Color');
var ColorMaterialProperty = require('../../third_party/cesium/Source/DataSources/ColorMaterialProperty');
var combine = require('../../third_party/cesium/Source/Core/combine');
var ConstantProperty = require('../../third_party/cesium/Source/DataSources/ConstantProperty');
var CzmlDataSource = require('../../third_party/cesium/Source/DataSources/CzmlDataSource');
var defaultValue = require('../../third_party/cesium/Source/Core/defaultValue');
var defined = require('../../third_party/cesium/Source/Core/defined');
var defineProperties = require('../../third_party/cesium/Source/Core/defineProperties');
var DeveloperError = require('../../third_party/cesium/Source/Core/DeveloperError');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');
var loadJson = require('../../third_party/cesium/Source/Core/loadJson');
var loadXML = require('../../third_party/cesium/Source/Core/loadXML');
var Rectangle = require('../../third_party/cesium/Source/Core/Rectangle');
var when = require('../../third_party/cesium/Source/ThirdParty/when');

var corsProxy = require('../corsProxy');
var MetadataViewModel = require('./MetadataViewModel');
var MetadataItemViewModel = require('./MetadataItemViewModel');
var ViewModelError = require('./ViewModelError');
var CatalogItemViewModel = require('./CatalogItemViewModel');
var ImageryLayerItemViewModel = require('./ImageryLayerItemViewModel');
var inherit = require('../inherit');
var rectangleToLatLngBounds = require('../rectangleToLatLngBounds');
var readJson = require('../readJson');
var runLater = require('../runLater');

/**
 * A {@link CatalogItemViewModel} representing Cesium Language (CZML) data.
 *
 * @alias CzmlItemViewModel
 * @constructor
 * @extends CatalogItemViewModel
 * 
 * @param {ApplicationViewModel} context The context for the group.
 * @param {String} [url] The URL from which to retrieve the CZML data.
 */
var CzmlItemViewModel = function(context, url) {
    CatalogItemViewModel.call(this, context);

    this._czmlDataSource = undefined;
    this._loadedUrl = undefined;
    this._loadedData = undefined;

    /**
     * Gets or sets the URL from which to retrieve CZML data.  This property is ignored if
     * {@link CzmlItemViewModel#data} is defined.  This property is observable.
     * @type {String}
     */
    this.url = url;

    /**
     * Gets or sets the CZML data, represented as a binary Blob, JSON object literal, or a Promise for one of those things.
     * This property is observable.
     * @type {Blob|Object|Promise}
     */
    this.data = undefined;

    /**
     * Gets or sets the URL from which the {@link CzmlItemViewModel#data} was obtained.  This will be used
     * to resolve any resources linked in the CZML file, if any.
     * @type {String}
     */
    this.dataSourceUrl = undefined;

    knockout.track(this, ['url', 'data', 'dataSourceUrl']);
};

CzmlItemViewModel.prototype = inherit(CatalogItemViewModel.prototype);

defineProperties(CzmlItemViewModel.prototype, {
    /**
     * Gets the type of data member represented by this instance.
     * @memberOf CzmlItemViewModel.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return 'czml';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, 'Cesium Language (CZML)'.
     * @memberOf CzmlItemViewModel.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'Cesium Language (CZML)';
        }
    },

    /**
     * Gets the metadata associated with this data source and the server that provided it, if applicable.
     * @memberOf CzmlItemViewModel.prototype
     * @type {MetadataViewModel}
     */
    metadata : {
        get : function() {
            var result = new MetadataViewModel();
            result.isLoading = false;
            result.dataSourceErrorMessage = 'This data source does not have any details available.';
            result.serviceErrorMessage = 'This service does not have any details available.';
            return result;
        }
    }
});

/**
 * Processes the CZML data supplied via the {@link CzmlItemViewModel#data} property.  If
 * {@link CzmlItemViewModel#data} is undefined, this method downloads CZML data from 
 * {@link CzmlItemViewModel#url} and processes that.  It is safe to call this method multiple times.
 * It is called automatically when the data source is enabled.
 */
CzmlItemViewModel.prototype.load = function() {
    if ((this.url === this._loadedUrl && this.data === this._loadedData) || this.isLoading === true) {
        return;
    }

    this.isLoading = true;

    if (defined(this._czmlDataSource)) {
        this._czmlDataSource.destroy();
    }

    var dataSource = new CzmlDataSource();
    this._czmlDataSource = dataSource;

    var that = this;
    runLater(function() {
        that._loadedUrl = that.url;
        that._loadedData = that.data;

        if (defined(that.data)) {
            when(that.data, function(data) {
                if (data instanceof Blob) {
                    readJson(data).then(function(data) {
                        dataSource.load(data, proxyUrl(that, that.dataSourceUrl));
                        doneLoading(that);
                    }).otherwise(function() {
                        errorLoading(that);
                    });
                } else {
                    dataSource.load(data, proxyUrl(that, that.dataSourceUrl));
                    doneLoading(that);
                }
            }).otherwise(function() {
                errorLoading(that);
            });
        } else {
            dataSource.loadUrl(proxyUrl(that, that.url)).then(function() {
                doneLoading(that);
            }).otherwise(function() {
                errorLoading(that);
            });
        }
    });
};

CzmlItemViewModel.prototype._enable = function() {
};

CzmlItemViewModel.prototype._disable = function() {
};

CzmlItemViewModel.prototype._show = function() {
    if (!defined(this._czmlDataSource)) {
        throw new DeveloperError('This data source is not enabled.');
    }

    var dataSources = this.context.dataSources;
    if (dataSources.contains(this._czmlDataSource)) {
        throw new DeveloperError('This data source is already shown.');
    }

    dataSources.add(this._czmlDataSource);
};

CzmlItemViewModel.prototype._hide = function() {
    if (!defined(this._czmlDataSource)) {
        throw new DeveloperError('This data source is not enabled.');
    }

    var dataSources = this.context.dataSources;
    if (!dataSources.contains(this._czmlDataSource)) {
        throw new DeveloperError('This data source is not shown.');
    }

    dataSources.remove(this._czmlDataSource, false);
};

function proxyUrl(context, url) {
    if (defined(context.corsProxy) && context.corsProxy.shouldUseProxy(url)) {
        return context.corsProxy.getURL(url);
    }

    return url;
}

function doneLoading(viewModel) {
    viewModel.clock = viewModel._czmlDataSource.clock;
    viewModel.isLoading = false;
}

function errorLoading(viewModel) {
    viewModel.context.error.raiseEvent(new ViewModelError({
        sender: viewModel,
        title: 'Error loading CZML',
        message: '\
An error occurred while loading a CZML file.  This may indicate that the file is invalid or that it \
is not supported by National Map.  If you would like assistance or further information, please email us \
at <a href="mailto:nationalmap@lists.nicta.com.au">nationalmap@lists.nicta.com.au</a>.'
    }));

    viewModel._loadedUrl = undefined;
    viewModel._loadedData = undefined;
    viewModel.isEnabled = false;
    viewModel.isLoading = false;
}

module.exports = CzmlItemViewModel;
