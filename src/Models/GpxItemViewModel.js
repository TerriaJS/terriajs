'use strict';

/*global require,toGeoJSON*/

var defined = require('../../third_party/cesium/Source/Core/defined');
var defineProperties = require('../../third_party/cesium/Source/Core/defineProperties');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');
var when = require('../../third_party/cesium/Source/ThirdParty/when');

var MetadataViewModel = require('./MetadataViewModel');
var ViewModelError = require('./ViewModelError');
var CatalogItem = require('./CatalogItem');
var inherit = require('../Core/inherit');

var GeoJsonItemViewModel = require('./GeoJsonItemViewModel');
var readText = require('../Core/readText');
var loadText = require('../../third_party/cesium/Source/Core/loadText');


/**
 * A {@link CatalogItem} representing GPX data.
 *
 * @alias GpxItemViewModel
 * @constructor
 * @extends GeoJsonItemViewModel
 * 
 * @param {ApplicationViewModel} application The application.
 * @param {String} [url] The URL from which to retrieve the GPX data.
 */
var GpxItemViewModel = function(application, url) {
    CatalogItem.call(this, application);

    this._geoJsonViewModel = undefined;

    /**
     * Gets or sets the URL from which to retrieve GPX data.  This property is ignored if
     * {@link GpxItemViewModel#data} is defined.  This property is observable.
     * @type {String}
     */
    this.url = url;

    /**
     * Gets or sets the Gpx data, represented as a binary Blob, DOM Document, or a Promise for one of those things.
     * This property is observable.
     * @type {Blob|Document|Promise}
     */
    this.data = undefined;

    /**
     * Gets or sets the URL from which the {@link GpxItemViewModel#data} was obtained.  This may be used
     * to resolve any resources linked in the Gpx file, if any.
     * @type {String}
     */
    this.dataSourceUrl = undefined;

    knockout.track(this, ['url', 'data', 'dataSourceUrl']);
};

inherit(CatalogItem, GpxItemViewModel);

defineProperties(GpxItemViewModel.prototype, {
    /**
     * Gets the type of data member represented by this instance.
     * @memberOf GpxItemViewModel.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return 'gpx';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, 'GPX'.
     * @memberOf GpxItemViewModel.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'GPX';
        }
    },

    /**
     * Gets the metadata associated with this data source and the server that provided it, if applicable.
     * @memberOf GpxItemViewModel.prototype
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

GpxItemViewModel.prototype._getValuesThatInfluenceLoad = function() {
    return [this.url, this.data];
};

GpxItemViewModel.prototype._load = function() {
    this._geoJsonViewModel = new GeoJsonItemViewModel(this.application);

    var that = this;

    if (defined(that.data)) {
        return when(that.data, function(data) {
            var promise;
            if (data instanceof Blob) {
                promise = readText(data);
            } else {
                promise = data;
            }

            return when(promise, function(text) {
                return loadGpxText(that, text);
            });
        });
    } else {
        return loadText(proxyUrl(that, that.url)).then(function(text) {
            return loadGpxText(that, text);
        }).otherwise(function() {
            errorLoading(that);
        });
    }
};

GpxItemViewModel.prototype._enable = function() {
    if (defined(this._geoJsonViewModel)) {
        this._geoJsonViewModel._enable();
    }
};

GpxItemViewModel.prototype._disable = function() {
    if (defined(this._geoJsonViewModel)) {
        this._geoJsonViewModel._disable();
    }
};

GpxItemViewModel.prototype._show = function() {
    if (defined(this._geoJsonViewModel)) {
        this._geoJsonViewModel._show();
    }
};

GpxItemViewModel.prototype._hide = function() {
    if (defined(this._geoJsonViewModel)) {
        this._geoJsonViewModel._hide();
    }
};


function proxyUrl(application, url) {
    if (defined(application.corsProxy) && application.corsProxy.shouldUseProxy(url)) {
        return application.corsProxy.getURL(url);
    }

    return url;
}

function loadGpxText(viewModel, text) {

    var dom = (new DOMParser()).parseFromString(text, 'text/xml');    
    var geojson = toGeoJSON.gpx(dom);

    viewModel._geoJsonViewModel.data = geojson;

    return viewModel._geoJsonViewModel.load().then(function() {
        viewModel.rectangle = viewModel._geoJsonViewModel.rectangle;
        viewModel.clock = viewModel._geoJsonViewModel.clock;
    });
}

function errorLoading(viewModel) {
    throw new ViewModelError({
        sender: viewModel,
        title: 'Error loading GPX',
        message: '\
An error occurred while loading a GPX file.  This may indicate that the file is invalid or that it \
is not supported by National Map.  If you would like assistance or further information, please email us \
at <a href="mailto:nationalmap@lists.nicta.com.au">nationalmap@lists.nicta.com.au</a>.'
    });
}

module.exports = GpxItemViewModel;
