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
var KmlDataSource = require('../../third_party/cesium/Source/DataSources/KmlDataSource');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');
var loadJson = require('../../third_party/cesium/Source/Core/loadJson');
var loadXML = require('../../third_party/cesium/Source/Core/loadXML');
var Rectangle = require('../../third_party/cesium/Source/Core/Rectangle');
var when = require('../../third_party/cesium/Source/ThirdParty/when');

var corsProxy = require('../corsProxy');
var DataSourceMetadataViewModel = require('./DataSourceMetadataViewModel');
var DataSourceMetadataItemViewModel = require('./DataSourceMetadataItemViewModel');
var GeoDataCatalogError = require('./GeoDataCatalogError');
var GeoDataSourceViewModel = require('./GeoDataSourceViewModel');
var ImageryLayerDataSourceViewModel = require('./ImageryLayerDataSourceViewModel');
var inherit = require('../inherit');
var rectangleToLatLngBounds = require('../rectangleToLatLngBounds');
var readXml = require('../readXml');
var runLater = require('../runLater');

var lineAndFillPalette = {
    minimumRed : 0.4,
    minimumGreen : 0.4,
    minimumBlue : 0.4,
    maximumRed : 0.9,
    maximumGreen : 0.9,
    maximumBlue : 0.9,
    alpha : 1.0
};

var pointPalette = {
    minimumRed : 0.6,
    minimumGreen : 0.6,
    minimumBlue : 0.6,
    maximumRed : 1.0,
    maximumGreen : 1.0,
    maximumBlue : 1.0,
    alpha : 1.0
};

/**
 * A {@link GeoDataSourceViewModel} representing KML or KMZ feature data.
 *
 * @alias KmlDataSourceViewModel
 * @constructor
 * @extends GeoDataSourceViewModel
 * 
 * @param {GeoDataCatalogContext} context The context for the group.
 * @param {String} [url] The URL from which to retrieve the KML or KMZ data.
 */
var KmlDataSourceViewModel = function(context, url) {
    GeoDataSourceViewModel.call(this, context);

    this._cesiumDataSource = undefined;

    /**
     * Gets or sets the URL from which to retrieve GeoJSON data.  This property is ignored if
     * {@link GeoJsonDataSourceViewModel#data} is defined.  This property is observable.
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
     * Gets or sets the URL from which the {@link KmlDataSourceViewModel#data} was obtained.  This will be used
     * to resolve any resources linked in the KML file, if any.
     * @type {String}
     */
    this.dataSourceUrl = undefined;

    knockout.track(this, ['url', 'data', 'dataSourceUrl']);
};

KmlDataSourceViewModel.prototype = inherit(GeoDataSourceViewModel.prototype);

defineProperties(KmlDataSourceViewModel.prototype, {
    /**
     * Gets the type of data member represented by this instance.
     * @memberOf KmlDataSourceViewModel.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return 'kml';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, 'KML'.
     * @memberOf KmlDataSourceViewModel.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'KML';
        }
    },

    /**
     * Gets the metadata associated with this data source and the server that provided it, if applicable.
     * @memberOf KmlDataSourceViewModel.prototype
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
    }
});

/**
 * Processes the KML or KMZ data supplied via the {@link KmlDataSourceViewModel#data} property.  If
 * {@link KmlDataSourceViewModel#data} is undefined, this method downloads KML or KMZ data from 
 * {@link KmlDataSourceViewModel#url} and processes that.  It is safe to call this method multiple times.
 * It is called automatically when the data source is enabled.
 */
KmlDataSourceViewModel.prototype.load = function() {
};

var kmzRegex = /\.kmz$/i;

KmlDataSourceViewModel.prototype._enableInCesium = function() {
    if (defined(this._cesiumDataSource)) {
        throw new DeveloperError('This data source is already enabled.');
    }

    var dataSource = this._cesiumDataSource = new KmlDataSource();

    if (defined(this.data)) {
        var that = this;
        when(this.data, function(data) {
            if (data instanceof Document) {
                dataSource.load(data, proxyUrl(that, that.dataSourceUrl));
            } else if (data instanceof Blob) {
                if (that.dataSourceUrl && that.dataSourceUrl.match(kmzRegex)) {
                    dataSource.loadKmz(data, proxyUrl(that, that.dataSourceUrl));
                } else {
                    readXml(data).then(function(xml) {
                        dataSource.load(xml, proxyUrl(that, that.dataSourceUrl));
                    });
                }
            } else {
                that.context.error.raiseEvent(new GeoDataCatalogError({
                    sender: that,
                    title: 'Unexpected type of KML data',
                    message: '\
KmlDataSourceViewModel.data is expected to be an XML Document, Blob, or File, but it was none of these. \
This may indicate a bug in National Map or incorrect use of the National Map API. \
If you believe it is a bug in National Map, please report it by emailing \
<a href="mailto:nationalmap@lists.nicta.com.au">nationalmap@lists.nicta.com.au</a>.'
                }));
            }
        });
    } else {
        dataSource.loadUrl(proxyUrl(this, this.url));
    }
};

KmlDataSourceViewModel.prototype._disableInCesium = function() {
    if (!defined(this._cesiumDataSource)) {
        throw new DeveloperError('This data source is not enabled.');
    }

    this._cesiumDataSource = undefined;
};

KmlDataSourceViewModel.prototype._showInCesium = function() {
    if (!defined(this._cesiumDataSource)) {
        throw new DeveloperError('This data source is not enabled.');
    }

    var dataSources = this.context.cesiumViewer.dataSources;
    if (dataSources.contains(this._cesiumDataSource)) {
        throw new DeveloperError('This data source is already shown.');
    }

    dataSources.add(this._cesiumDataSource);
};

KmlDataSourceViewModel.prototype._hideInCesium = function() {
    if (!defined(this._cesiumDataSource)) {
        throw new DeveloperError('This data source is not enabled.');
    }

    var dataSources = this.context.cesiumViewer.dataSources;
    if (!dataSources.contains(this._cesiumDataSource)) {
        throw new DeveloperError('This data source is not shown.');
    }

    dataSources.remove(this._cesiumDataSource, false);
};

KmlDataSourceViewModel.prototype._enableInLeaflet = function() {
    this._enableInCesium();
};

KmlDataSourceViewModel.prototype._disableInLeaflet = function() {
    this._disableInCesium();
};

KmlDataSourceViewModel.prototype._showInLeaflet = function() {
    if (!defined(this._cesiumDataSource)) {
        throw new DeveloperError('This data source is not enabled.');
    }

    var dataSources = this.context.leafletMap.dataSources;
    if (dataSources.contains(this._cesiumDataSource)) {
        throw new DeveloperError('This data source is already shown.');
    }

    dataSources.add(this._cesiumDataSource);
};

KmlDataSourceViewModel.prototype._hideInLeaflet = function() {
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

module.exports = KmlDataSourceViewModel;
