'use strict';

/*global require,Document,$,toGeoJSON*/

var defaultValue = require('../../third_party/cesium/Source/Core/defaultValue');
var defined = require('../../third_party/cesium/Source/Core/defined');
var defineProperties = require('../../third_party/cesium/Source/Core/defineProperties');
var DeveloperError = require('../../third_party/cesium/Source/Core/DeveloperError');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');
var loadXML = require('../../third_party/cesium/Source/Core/loadXML');
var Rectangle = require('../../third_party/cesium/Source/Core/Rectangle');
var when = require('../../third_party/cesium/Source/ThirdParty/when');

var corsProxy = require('../Core/corsProxy');
var MetadataViewModel = require('./MetadataViewModel');
var MetadataItemViewModel = require('./MetadataItemViewModel');
var ViewModelError = require('./ViewModelError');
var CatalogItemViewModel = require('./CatalogItemViewModel');
var inherit = require('../Core/inherit');
var readXml = require('../Core/readXml');
var runLater = require('../Core/runLater');
var loadWithXhr = require('../../third_party/cesium/Source/Core/loadWithXhr');

var GeoJsonItemViewModel = require('./GeoJsonItemViewModel');
var readText = require('../Core/readText');
var loadText = require('../../third_party/cesium/Source/Core/loadText');


/**
 * A {@link CatalogItemViewModel} representing GPX data.
 *
 * @alias OgrItemViewModel
 * @constructor
 * @extends GeoJsonItemViewModel
 * 
 * @param {ApplicationViewModel} application The application.
 * @param {String} [url] The URL from which to retrieve the GPX data.
 */
var OgrItemViewModel = function(application, url) {
    CatalogItemViewModel.call(this, application);

    this._geoJsonViewModel = undefined;
    this._loadedUrl = undefined;
    this._loadedData = undefined;

    /**
     * Gets or sets the URL from which to retrieve GPX data.  This property is ignored if
     * {@link OgrItemViewModel#data} is defined.  This property is observable.
     * @type {String}
     */
    this.url = url;

    /**
     * Gets or sets the Ogr data, represented as a binary Blob, DOM Document, or a Promise for one of those things.
     * This property is observable.
     * @type {Blob|Document|Promise}
     */
    this.data = undefined;

    /**
     * Gets or sets the URL from which the {@link OgrItemViewModel#data} was obtained.  This may be used
     * to resolve any resources linked in the Ogr file, if any.
     * @type {String}
     */
    this.dataSourceUrl = undefined;

    knockout.track(this, ['url', 'data', 'dataSourceUrl']);
};

inherit(CatalogItemViewModel, OgrItemViewModel);

defineProperties(OgrItemViewModel.prototype, {
    /**
     * Gets the type of data member represented by this instance.
     * @memberOf OgrItemViewModel.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return 'ogr';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, 'GPX'.
     * @memberOf OgrItemViewModel.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'OGR';
        }
    },

    /**
     * Gets the metadata associated with this data source and the server that provided it, if applicable.
     * @memberOf OgrItemViewModel.prototype
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
 * Processes the Ogr data supplied via the {@link OgrItemViewModel#data} property.  If
 * {@link OgrItemViewModel#data} is undefined, this method downloads GPX data from 
 * {@link OgrItemViewModel#url} and processes that.  It is safe to call this method multiple times.
 * It is called automatically when the data source is enabled.
 */
OgrItemViewModel.prototype.load = function() {
    if ((this.url === this._loadedUrl && this.data === this._loadedData) || this.isLoading === true) {
        return;
    }

    this.isLoading = true;
    this._geoJsonViewModel = new GeoJsonItemViewModel(this.application);

    var that = this;
    runLater(function() {
        that._loadedUrl = that.url;
        that._loadedData = that.data;

        if (defined(that.data)) {
            when(that.data, function(data) {
                if (!(data instanceof Blob)) {
                    //create a file blob
                    data = new Blob([data], {
                        type : 'text/html', 
                        name: that.dataSourceUrl, 
                        lastModifiedDate: new Date()
                    });
                }
                loadOgrData(that, data);
            });
        } else {
            loadOgrData(that, undefined, that.url);
        }
    });
};

OgrItemViewModel.prototype._enable = function() {
    if (defined(this._geoJsonViewModel)) {
        this._geoJsonViewModel._enable();
    }
};

OgrItemViewModel.prototype._disable = function() {
    if (defined(this._geoJsonViewModel)) {
        this._geoJsonViewModel._disable();
    }
};

OgrItemViewModel.prototype._show = function() {
    if (defined(this._geoJsonViewModel)) {
        this._geoJsonViewModel._show();
    }
};

OgrItemViewModel.prototype._hide = function() {
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

function loadOgrData(viewModel, file, url) {

    // generate form to submit file for conversion
    var formData = new FormData();
    if (defined(file)) {
        if (file.size > 1000000) {
            errorLoading(viewModel);
            return;
        }
        formData.append('input_file', file);
    } else if (defined(url)) {
        formData.append('input_url', url);
    }

    loadWithXhr({
        url : 'http://localhost/convert',
        method : 'POST',
        data : formData
    }).then(function(response) {
        loadGeoJsonText(viewModel, JSON.parse(response));
    }).otherwise(function() {
        errorLoading(viewModel);
    });

    console.log('Attempting to convert file via our ogrservice');
}


function loadGeoJsonText(viewModel, geojson) {

    viewModel._geoJsonViewModel.data = geojson;

    var subscription = knockout.getObservable(viewModel._geoJsonViewModel, 'isLoading').subscribe(function(newValue) {
        if (newValue === false) {
            subscription.dispose();
            viewModel.rectangle = viewModel._geoJsonViewModel.rectangle;
            viewModel.isLoading = false;
        }
    });

    viewModel._geoJsonViewModel.load();
}

function errorLoading(viewModel) {
    viewModel.application.error.raiseEvent(new ViewModelError({
        sender: viewModel,
        title: 'Error converting file',
        message: '\
An error occurred while attempting to convert file.  This may indicate that the file is invalid or that it \
is not supported by National Map.  If you would like assistance or further information, please email us \
at <a href="mailto:nationalmap@lists.nicta.com.au">nationalmap@lists.nicta.com.au</a>.'
    }));

    viewModel._loadedUrl = undefined;
    viewModel._loadedData = undefined;
    viewModel.isEnabled = false;
    viewModel.isLoading = false;
    viewModel._geoJsonViewModel = undefined;
}

module.exports = OgrItemViewModel;
