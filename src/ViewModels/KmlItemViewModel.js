'use strict';

/*global require,Document*/

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
var KmlDataSource = require('../../third_party/cesium/Source/DataSources/KmlDataSource');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');
var loadJson = require('../../third_party/cesium/Source/Core/loadJson');
var loadXML = require('../../third_party/cesium/Source/Core/loadXML');
var Rectangle = require('../../third_party/cesium/Source/Core/Rectangle');
var when = require('../../third_party/cesium/Source/ThirdParty/when');

var corsProxy = require('../Core/corsProxy');
var MetadataViewModel = require('./MetadataViewModel');
var MetadataItemViewModel = require('./MetadataItemViewModel');
var ViewModelError = require('./ViewModelError');
var CatalogItemViewModel = require('./CatalogItemViewModel');
var ImageryLayerItemViewModel = require('./ImageryLayerItemViewModel');
var inherit = require('../Core/inherit');
var rectangleToLatLngBounds = require('../Map/rectangleToLatLngBounds');
var readXml = require('../Core/readXml');
var runLater = require('../Core/runLater');

/**
 * A {@link CatalogItemViewModel} representing KML or KMZ feature data.
 *
 * @alias KmlItemViewModel
 * @constructor
 * @extends CatalogItemViewModel
 * 
 * @param {ApplicationViewModel} application The application.
 * @param {String} [url] The URL from which to retrieve the KML or KMZ data.
 */
var KmlItemViewModel = function(application, url) {
    CatalogItemViewModel.call(this, application);

    this._kmlDataSource = undefined;

    /**
     * Gets or sets the URL from which to retrieve KML or KMZ data.  This property is ignored if
     * {@link KmlItemViewModel#data} is defined.  This property is observable.
     * @type {String}
     */
    this.url = url;

    /**
     * Gets or sets the KML or KMZ data, represented as a binary Blob, DOM Document, or a Promise for one of those things.
     * This property is observable.
     * @type {Blob|Document|Promise}
     */
    this.data = undefined;

    /**
     * Gets or sets the URL from which the {@link KmlItemViewModel#data} was obtained.  This will be used
     * to resolve any resources linked in the KML file, if any.
     * @type {String}
     */
    this.dataSourceUrl = undefined;

    knockout.track(this, ['url', 'data', 'dataSourceUrl']);
};

inherit(CatalogItemViewModel, KmlItemViewModel);

defineProperties(KmlItemViewModel.prototype, {
    /**
     * Gets the type of data member represented by this instance.
     * @memberOf KmlItemViewModel.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return 'kml';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, 'KML'.
     * @memberOf KmlItemViewModel.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'KML';
        }
    },

    /**
     * Gets the metadata associated with this data source and the server that provided it, if applicable.
     * @memberOf KmlItemViewModel.prototype
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

KmlItemViewModel.prototype._getValuesThatInfluenceLoad = function() {
    return [this.url, this.data];
};

var kmzRegex = /\.kmz$/i;

KmlItemViewModel.prototype._load = function() {
    var dataSource = new KmlDataSource();
    this._kmlDataSource = dataSource;

    var that = this;

    if (defined(that.data)) {
        return when(that.data, function(data) {
            if (data instanceof Document) {
                return dataSource.load(data, proxyUrl(that, that.dataSourceUrl)).then(function() {
                    doneLoading(that);
                }).otherwise(function() {
                    errorLoading(that);
                });
            } else if (data instanceof Blob) {
                if (that.dataSourceUrl && that.dataSourceUrl.match(kmzRegex)) {
                    return dataSource.loadKmz(data, proxyUrl(that, that.dataSourceUrl)).then(function() {
                        doneLoading(that);
                    }).otherwise(function() {
                        errorLoading(that);
                    });
                } else {
                    return readXml(data).then(function(xml) {
                        return dataSource.load(xml, proxyUrl(that, that.dataSourceUrl)).then(function() {
                            doneLoading(that);
                        }).otherwise(function() {
                            errorLoading(that);
                        });
                    });
                }
            } else {
                throw new ViewModelError({
                    sender: that,
                    title: 'Unexpected type of KML data',
                    message: '\
KmlItemViewModel.data is expected to be an XML Document, Blob, or File, but it was none of these. \
This may indicate a bug in National Map or incorrect use of the National Map API. \
If you believe it is a bug in National Map, please report it by emailing \
<a href="mailto:nationalmap@lists.nicta.com.au">nationalmap@lists.nicta.com.au</a>.'
                });
            }
        });
    } else {
        return dataSource.loadUrl(proxyUrl(that, that.url)).then(function() {
            doneLoading(that);
        }).otherwise(function() {
            errorLoading(that);
        });
    }
};

KmlItemViewModel.prototype._enable = function() {
};

KmlItemViewModel.prototype._disable = function() {
};

KmlItemViewModel.prototype._show = function() {
    if (!defined(this._kmlDataSource)) {
        throw new DeveloperError('This data source is not enabled.');
    }

    var dataSources = this.application.dataSources;
    if (dataSources.contains(this._kmlDataSource)) {
        throw new DeveloperError('This data source is already shown.');
    }

    dataSources.add(this._kmlDataSource);
};

KmlItemViewModel.prototype._hide = function() {
    if (!defined(this._kmlDataSource)) {
        throw new DeveloperError('This data source is not enabled.');
    }

    var dataSources = this.application.dataSources;
    if (!dataSources.contains(this._kmlDataSource)) {
        throw new DeveloperError('This data source is not shown.');
    }

    dataSources.remove(this._kmlDataSource, false);
};

function proxyUrl(application, url) {
    if (defined(application.corsProxy) && application.corsProxy.shouldUseProxy(url)) {
        return application.corsProxy.getURL(url);
    }

    return url;
}

function doneLoading(viewModel) {
    viewModel.clock = viewModel._kmlDataSource.clock;
}

function errorLoading(viewModel) {
    throw new ViewModelError({
        sender: viewModel,
        title: 'Error loading KML or KMZ',
        message: '\
An error occurred while loading a KML or KMZ file.  This may indicate that the file is invalid or that it \
is not supported by National Map.  If you would like assistance or further information, please email us \
at <a href="mailto:nationalmap@lists.nicta.com.au">nationalmap@lists.nicta.com.au</a>.'
    });
}

module.exports = KmlItemViewModel;
