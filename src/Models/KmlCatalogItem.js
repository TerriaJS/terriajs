'use strict';

/*global require,Document*/

var defined = require('../../third_party/cesium/Source/Core/defined');
var defineProperties = require('../../third_party/cesium/Source/Core/defineProperties');
var DeveloperError = require('../../third_party/cesium/Source/Core/DeveloperError');
var KmlDataSource = require('../../third_party/cesium/Source/DataSources/KmlDataSource');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');
var when = require('../../third_party/cesium/Source/ThirdParty/when');

var Metadata = require('./Metadata');
var ModelError = require('./ModelError');
var CatalogItem = require('./CatalogItem');
var inherit = require('../Core/inherit');
var readXml = require('../Core/readXml');

/**
 * A {@link CatalogItem} representing KML or KMZ feature data.
 *
 * @alias KmlCatalogItem
 * @constructor
 * @extends CatalogItem
 * 
 * @param {Application} application The application.
 * @param {String} [url] The URL from which to retrieve the KML or KMZ data.
 */
var KmlCatalogItem = function(application, url) {
    CatalogItem.call(this, application);

    this._kmlDataSource = undefined;

    /**
     * Gets or sets the URL from which to retrieve KML or KMZ data.  This property is ignored if
     * {@link KmlCatalogItem#data} is defined.  This property is observable.
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
     * Gets or sets the URL from which the {@link KmlCatalogItem#data} was obtained.  This will be used
     * to resolve any resources linked in the KML file, if any.
     * @type {String}
     */
    this.dataSourceUrl = undefined;

    knockout.track(this, ['url', 'data', 'dataSourceUrl']);
};

inherit(CatalogItem, KmlCatalogItem);

defineProperties(KmlCatalogItem.prototype, {
    /**
     * Gets the type of data member represented by this instance.
     * @memberOf KmlCatalogItem.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return 'kml';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, 'KML'.
     * @memberOf KmlCatalogItem.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'KML or KMZ';
        }
    },

    /**
     * Gets the metadata associated with this data source and the server that provided it, if applicable.
     * @memberOf KmlCatalogItem.prototype
     * @type {Metadata}
     */
    metadata : {
        get : function() {
            var result = new Metadata();
            result.isLoading = false;
            result.dataSourceErrorMessage = 'This data source does not have any details available.';
            result.serviceErrorMessage = 'This service does not have any details available.';
            return result;
        }
    }
});

KmlCatalogItem.prototype._getValuesThatInfluenceLoad = function() {
    return [this.url, this.data];
};

var kmzRegex = /\.kmz$/i;

KmlCatalogItem.prototype._load = function() {
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
                    return dataSource.load(data, proxyUrl(that, that.dataSourceUrl)).then(function() {
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
                throw new ModelError({
                    sender: that,
                    title: 'Unexpected type of KML data',
                    message: '\
KmlCatalogItem.data is expected to be an XML Document, Blob, or File, but it was none of these. \
This may indicate a bug in National Map or incorrect use of the National Map API. \
If you believe it is a bug in National Map, please report it by emailing \
<a href="mailto:nationalmap@lists.nicta.com.au">nationalmap@lists.nicta.com.au</a>.'
                });
            }
        });
    } else {
        return dataSource.load(proxyUrl(that, that.url)).then(function() {
            doneLoading(that);
        }).otherwise(function() {
            errorLoading(that);
        });
    }
};

KmlCatalogItem.prototype._enable = function() {
};

KmlCatalogItem.prototype._disable = function() {
};

KmlCatalogItem.prototype._show = function() {
    if (!defined(this._kmlDataSource)) {
        throw new DeveloperError('This data source is not enabled.');
    }

    var dataSources = this.application.dataSources;
    if (dataSources.contains(this._kmlDataSource)) {
        throw new DeveloperError('This data source is already shown.');
    }

    dataSources.add(this._kmlDataSource);
};

KmlCatalogItem.prototype._hide = function() {
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

function doneLoading(kmlItem) {
    kmlItem.clock = kmlItem._kmlDataSource.clock;
}

function errorLoading(kmlItem) {
    throw new ModelError({
        sender: kmlItem,
        title: 'Error loading KML or KMZ',
        message: '\
An error occurred while loading a KML or KMZ file.  This may indicate that the file is invalid or that it \
is not supported by National Map.  If you would like assistance or further information, please email us \
at <a href="mailto:nationalmap@lists.nicta.com.au">nationalmap@lists.nicta.com.au</a>.'
    });
}

module.exports = KmlCatalogItem;
