'use strict';

/*global require,L,URI,Document*/

var CesiumMath = require('../../third_party/cesium/Source/Core/Math');
var clone = require('../../third_party/cesium/Source/Core/clone');
var Color = require('../../third_party/cesium/Source/Core/Color');
var ColorMaterialProperty = require('../../third_party/cesium/Source/DataSources/ColorMaterialProperty');
var combine = require('../../third_party/cesium/Source/Core/combine');
var ConstantProperty = require('../../third_party/cesium/Source/DataSources/ConstantProperty');
var defaultValue = require('../../third_party/cesium/Source/Core/defaultValue');
var defined = require('../../third_party/cesium/Source/Core/defined');
var defineProperties = require('../../third_party/cesium/Source/Core/defineProperties');
var DeveloperError = require('../../third_party/cesium/Source/Core/DeveloperError');
var freezeObject = require('../../third_party/cesium/Source/Core/freezeObject');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');
var loadJson = require('../../third_party/cesium/Source/Core/loadJson');
var loadXML = require('../../third_party/cesium/Source/Core/loadXML');
var Rectangle = require('../../third_party/cesium/Source/Core/Rectangle');
var when = require('../../third_party/cesium/Source/ThirdParty/when');

var TableDataSource = require('../TableDataSource');

var corsProxy = require('../corsProxy');
var DataSourceMetadataViewModel = require('./DataSourceMetadataViewModel');
var DataSourceMetadataItemViewModel = require('./DataSourceMetadataItemViewModel');
var GeoDataCatalogError = require('./GeoDataCatalogError');
var GeoDataSourceViewModel = require('./GeoDataSourceViewModel');
var ImageryLayerDataSourceViewModel = require('./ImageryLayerDataSourceViewModel');
var inherit = require('../inherit');
var rectangleToLatLngBounds = require('../rectangleToLatLngBounds');
var readText = require('../readText');
var runLater = require('../runLater');

/**
 * A {@link GeoDataSourceViewModel} representing CSV data.
 *
 * @alias CsvDataSourceViewModel
 * @constructor
 * @extends GeoDataSourceViewModel
 * 
 * @param {GeoDataCatalogContext} context The context for the group.
 * @param {String} [url] The URL from which to retrieve the CSV data.
 */
var CsvDataSourceViewModel = function(context, url) {
    GeoDataSourceViewModel.call(this, context);

    this._cesiumDataSource = undefined;
    this._clock = undefined;

    /**
     * Gets or sets the URL from which to retrieve GeoJSON data.  This property is ignored if
     * {@link GeoJsonDataSourceViewModel#data} is defined.  This property is observable.
     * @type {String}
     */
    this.url = url;

    /**
     * Gets or sets the CSV data, represented as a binary Blob, a string, or a Promise for one of those things.
     * This property is observable.
     * @type {Blob|String|Promise}
     */
    this.data = undefined;

    /**
     * Gets or sets the URL from which the {@link CsvDataSourceViewModel#data} was obtained.
     * @type {String}
     */
    this.dataSourceUrl = undefined;

    knockout.track(this, ['_clock', 'url', 'data', 'dataSourceUrl']);

    delete this.__knockoutObservables.clock;
    knockout.defineProperty(this, 'clock', {
        get : function() {
            if (defined(this._clock)) {
                return this._clock;
            } else if (defined(this._cesiumDataSource)) {
                return this._cesiumDataSource.clock;
            } else {
                return undefined;
            }
        },
        set : function(value) {
            this._clock = value;
        }
    });
};

CsvDataSourceViewModel.prototype = inherit(GeoDataSourceViewModel.prototype);

defineProperties(CsvDataSourceViewModel.prototype, {
    /**
     * Gets the type of data member represented by this instance.
     * @memberOf CsvDataSourceViewModel.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return 'csv';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, 'CSV'.
     * @memberOf CsvDataSourceViewModel.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'CSV';
        }
    },

    /**
     * Gets the metadata associated with this data source and the server that provided it, if applicable.
     * @memberOf CsvDataSourceViewModel.prototype
     * @type {DataSourceMetadataViewModel}
     */
    metadata : {
        get : function() {
            var result = new DataSourceMetadataViewModel();
            result.isLoading = false;
            result.dataSourceErrorMessage = 'This data source does not have any details available.';
            result.serviceErrorMessage = 'This service does not have any details available.';
            return result;
        }
    },

    /**
     * Gets the set of functions used to update individual properties in {@link GeoDataItemViewModel#updateFromJson}.
     * When a property name in the returned object literal matches the name of a property on this instance, the value
     * will be called as a function and passed a reference to this instance, a reference to the source JSON object
     * literal, and the name of the property.
     * @memberOf CsvDataSourceViewModel.prototype
     * @type {Object}
     */
    updaters : {
        get : function() {
            return CsvDataSourceViewModel.defaultUpdaters;
        }
    },

    /**
     * Gets the set of functions used to serialize individual properties in {@link GeoDataItemViewModel#serializeToJson}.
     * When a property name on the view-model matches the name of a property in the serializers object lieral,
     * the value will be called as a function and passed a reference to the view-model, a reference to the destination
     * JSON object literal, and the name of the property.
     * @memberOf CsvDataSourceViewModel.prototype
     * @type {Object}
     */
    serializers : {
        get : function() {
            return CsvDataSourceViewModel.defaultSerializers;
        }
    }
});

CsvDataSourceViewModel.defaultUpdaters = clone(GeoDataSourceViewModel.defaultUpdaters);
freezeObject(CsvDataSourceViewModel.defaultUpdaters);

CsvDataSourceViewModel.defaultSerializers = clone(GeoDataSourceViewModel.defaultSerializers);

// Serialize the underlying properties instead of the public views of them.
CsvDataSourceViewModel.defaultSerializers.clock = function(viewModel, json, propertyName) {
    json.clock = viewModel._clock;
};

freezeObject(CsvDataSourceViewModel.defaultSerializers);

/**
 * Processes the CSV data supplied via the {@link CsvDataSourceViewModel#data} property.  If
 * {@link CsvDataSourceViewModel#data} is undefined, this method downloads CSV data from 
 * {@link CsvDataSourceViewModel#url} and processes that.  It is safe to call this method multiple times.
 * It is called automatically when the data source is enabled.
 */
CsvDataSourceViewModel.prototype.load = function() {
};

CsvDataSourceViewModel.prototype._enableInCesium = function() {
    if (defined(this._cesiumDataSource)) {
        throw new DeveloperError('This data source is already enabled.');
    }

    var dataSource = this._cesiumDataSource = new TableDataSource();

    if (defined(this.data)) {
        var that = this;
        when(this.data, function(data) {
            if (data instanceof Blob) {
                readText(data).then(function(text) {
                    dataSource.loadText(text);
                    that.rectangle = dataSource.dataset.getExtent();
                });
            } else if (data instanceof String) {
                dataSource.loadText(data);
                that.rectangle = dataSource.dataset.getExtent();
            } else {
                that.context.error.raiseEvent(new GeoDataCatalogError({
                    sender: that,
                    title: 'Unexpected type of CSV data',
                    message: '\
CsvDataSourceViewModel.data is expected to be a Blob, File, or String, but it was not any of these. \
This may indicate a bug in National Map or incorrect use of the National Map API. \
If you believe it is a bug in National Map, please report it by emailing \
<a href="mailto:nationalmap@lists.nicta.com.au">nationalmap@lists.nicta.com.au</a>.'
                }));
            }
        });
    } else {
        dataSource.loadUrl(proxyUrl(this, this.url));
        this.rectangle = dataSource.dataset.getExtent();
    }
};

CsvDataSourceViewModel.prototype._disableInCesium = function() {
    if (!defined(this._cesiumDataSource)) {
        throw new DeveloperError('This data source is not enabled.');
    }

    this._cesiumDataSource = undefined;
};

CsvDataSourceViewModel.prototype._showInCesium = function() {
    if (!defined(this._cesiumDataSource)) {
        throw new DeveloperError('This data source is not enabled.');
    }

    var dataSources = this.context.cesiumViewer.dataSources;
    if (dataSources.contains(this._cesiumDataSource)) {
        throw new DeveloperError('This data source is already shown.');
    }

    dataSources.add(this._cesiumDataSource);
};

CsvDataSourceViewModel.prototype._hideInCesium = function() {
    if (!defined(this._cesiumDataSource)) {
        throw new DeveloperError('This data source is not enabled.');
    }

    var dataSources = this.context.cesiumViewer.dataSources;
    if (!dataSources.contains(this._cesiumDataSource)) {
        throw new DeveloperError('This data source is not shown.');
    }

    dataSources.remove(this._cesiumDataSource, false);
};

CsvDataSourceViewModel.prototype._enableInLeaflet = function() {
    this._enableInCesium();
};

CsvDataSourceViewModel.prototype._disableInLeaflet = function() {
    this._disableInCesium();
};

CsvDataSourceViewModel.prototype._showInLeaflet = function() {
    if (!defined(this._cesiumDataSource)) {
        throw new DeveloperError('This data source is not enabled.');
    }

    var dataSources = this.context.leafletMap.dataSources;
    if (dataSources.contains(this._cesiumDataSource)) {
        throw new DeveloperError('This data source is already shown.');
    }

    dataSources.add(this._cesiumDataSource);
};

CsvDataSourceViewModel.prototype._hideInLeaflet = function() {
    if (!defined(this._cesiumDataSource)) {
        throw new DeveloperError('This data source is not enabled.');
    }

    var dataSources = this.context.leafletMap.dataSources;
    if (!dataSources.contains(this._cesiumDataSource)) {
        throw new DeveloperError('This data source is not shown.');
    }

    dataSources.remove(this._cesiumDataSource, false);
};

function proxyUrl(context, url) {
    if (defined(context.corsProxy) && context.corsProxy.shouldUseProxy(url)) {
        return context.corsProxy.getURL(url);
    }

    return url;
}

module.exports = CsvDataSourceViewModel;
