'use strict';

/*global require*/

var defined = require('../../third_party/cesium/Source/Core/defined');
var defineProperties = require('../../third_party/cesium/Source/Core/defineProperties');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');
var loadWithXhr = require('../../third_party/cesium/Source/Core/loadWithXhr');
var when = require('../../third_party/cesium/Source/ThirdParty/when');

var CatalogItemViewModel = require('./CatalogItemViewModel');
var GeoJsonItemViewModel = require('./GeoJsonItemViewModel');
var inherit = require('../Core/inherit');
var MetadataViewModel = require('./MetadataViewModel');
var ViewModelError = require('./ViewModelError');

/**
 * A {@link CatalogItemViewModel} representing ogr2ogr supported data formats.
 *
 * @alias OgrItemViewModel
 * @constructor
 * @extends GeoJsonItemViewModel
 * 
 * @param {ApplicationViewModel} application The application.
 * @param {String} [url] The URL from which to retrieve the OGR data.
 */
var OgrItemViewModel = function(application, url) {
    CatalogItemViewModel.call(this, application);

    this._geoJsonViewModel = undefined;

    /**
     * Gets or sets the URL from which to retrieve OGR data.  This property is ignored if
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
     * Gets a human-readable name for this type of data source.
     * @memberOf OgrItemViewModel.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'Unknown / Converted to GeoJSON';
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

OgrItemViewModel.prototype._getValuesThatInfluenceLoad = function() {
    return [this.url, this.data];
};

OgrItemViewModel.prototype._load = function() {
    if (typeof FormData === 'undefined') {
        throw new ViewModelError({
            sender: this,
            title: 'Legacy browser not supported',
            message: '\
Your web browser does not support the "FormData" type, which is required by the National Map conversion service.  \
We recommend you upgrade to the latest version of <a href="http://www.google.com/chrome" target="_blank">Google Chrome</a>, \
<a href="http://www.mozilla.org/firefox" target="_blank">Mozilla Firefox</a>, \
<a href="https://www.apple.com/au/osx/how-to-upgrade/" target="_blank">Apple Safari</a>, or \
<a href="http://www.microsoft.com/ie" target="_blank">Microsoft Internet Explorer</a>.'
        });
    }

    this._geoJsonViewModel = new GeoJsonItemViewModel(this.application);

    var that = this;

    if (defined(that.data)) {
        return when(that.data, function(data) {
            if (!(data instanceof Blob)) {
                //create a file blob
                data = new Blob([data], {
                    type : 'application/octet-stream', 
                    name: that.dataSourceUrl, 
                    lastModifiedDate: new Date()
                });
            }
            return loadOgrData(that, data);
        });
    } else {
        return loadOgrData(that, undefined, that.url);
    }
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

function loadOgrData(viewModel, file, url) {

    // generate form to submit file for conversion
    var formData = new FormData();
    if (defined(file)) {
        if (file.size > 1000000) {
            errorLoading(viewModel, 'The file size is greater than the 1Mb limit of the National Map conversion service.');
            return;
        }
        formData.append('input_file', file);
    } else if (defined(url)) {
        // fix up url to server if relative
        if (url.indexOf('http') !== 0) {
            url = 'http://'+document.location.host+'/'+url;
        }
        formData.append('input_url', url);
    }

    console.log('Attempting to convert file via the NM ogr2ogr web service');

    return loadWithXhr({
        url : '/convert',
        method : 'POST',
        data : formData
    }).then(function(response) {
        viewModel._geoJsonViewModel.data = JSON.parse(response);

        return viewModel._geoJsonViewModel.load().then(function() {
            viewModel.rectangle = viewModel._geoJsonViewModel.rectangle;
            viewModel.clock = viewModel._geoJsonViewModel.clock;
        });
    }).otherwise(function() {
        errorLoading(viewModel);
    });
}


function errorLoading(viewModel, msg) {
    if (!defined(msg)) {
        msg = 'This may indicate that the file is invalid or that it is not supported by the National Map conversion service.';
    }
    throw new ViewModelError({
        sender: viewModel,
        title: 'Error converting file to GeoJson',
        message: '\
An error occurred while attempting to convert this file to GeoJson.  ' + msg + '  If you would like assistance or further information, please email us \
at <a href="mailto:nationalmap@lists.nicta.com.au">nationalmap@lists.nicta.com.au</a>.'
    });
}

module.exports = OgrItemViewModel;
