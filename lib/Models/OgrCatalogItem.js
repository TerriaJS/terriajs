'use strict';

/*global require*/

var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var loadWithXhr = require('terriajs-cesium/Source/Core/loadWithXhr');
var Uri = require('terriajs-cesium/Source/ThirdParty/Uri');
var when = require('terriajs-cesium/Source/ThirdParty/when');

var CatalogItem = require('./CatalogItem');
var GeoJsonCatalogItem = require('./GeoJsonCatalogItem');
var inherit = require('../Core/inherit');
var Metadata = require('./Metadata');
var ModelError = require('./ModelError');

/**
 * A {@link CatalogItem} representing ogr2ogr supported data formats.
 *
 * @alias OgrCatalogItem
 * @constructor
 * @extends GeoJsonCatalogItem
 *
 * @param {Terria} terria The Terria instance.
 * @param {String} [url] The URL from which to retrieve the OGR data.
 */
var OgrCatalogItem =  function(terria, url) {
     CatalogItem.call(this, terria);

    this._geoJsonItem = undefined;

    /**
     * Gets or sets the URL from which to retrieve OGR data.  This property is ignored if
     * {@link OgrCatalogItem#data} is defined.  This property is observable.
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
     * Gets or sets the URL from which the {@link OgrCatalogItem#data} was obtained.  This may be used
     * to resolve any resources linked in the Ogr file, if any.
     * @type {String}
     */
    this.dataSourceUrl = undefined;

    knockout.track(this, ['url', 'data', 'dataSourceUrl']);
};

OgrCatalogItem.conversionServiceBaseUrl = 'convert';

inherit(CatalogItem, OgrCatalogItem);

defineProperties(OgrCatalogItem.prototype, {
    /**
     * Gets the type of data member represented by this instance.
     * @memberOf OgrCatalogItem.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return 'ogr';
        }
    },

    /**
     * Gets a human-readable name for this type of data source.
     * @memberOf OgrCatalogItem.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'Unknown / Converted to GeoJSON';
        }
    },

    /**
     * Gets the metadata associated with this data source and the server that provided it, if applicable.
     * @memberOf OgrCatalogItem.prototype
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

OgrCatalogItem.prototype._getValuesThatInfluenceLoad = function() {
    return [this.url, this.data];
};

OgrCatalogItem.prototype._load = function() {
    if (typeof FormData === 'undefined') {
        throw new ModelError({
            sender: this,
            title: 'Legacy browser not supported',
            message: '\
Your web browser does not support the "FormData" type, which is required by the '+this.terria.appName+' conversion service.  \
We recommend you upgrade to the latest version of <a href="http://www.google.com/chrome" target="_blank">Google Chrome</a>, \
<a href="http://www.mozilla.org/firefox" target="_blank">Mozilla Firefox</a>, \
<a href="https://www.apple.com/au/osx/how-to-upgrade/" target="_blank">Apple Safari</a>, or \
<a href="http://www.microsoft.com/ie" target="_blank">Microsoft Internet Explorer</a>.'
        });
    }

    this._geoJsonItem = new GeoJsonCatalogItem( this.terria);

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

OgrCatalogItem.prototype._enable = function() {
    if (defined(this._geoJsonItem)) {
        this._geoJsonItem._enable();
    }
};

OgrCatalogItem.prototype._disable = function() {
    if (defined(this._geoJsonItem)) {
        this._geoJsonItem._disable();
    }
};

OgrCatalogItem.prototype._show = function() {
    if (defined(this._geoJsonItem)) {
        this._geoJsonItem._show();
    }
};

OgrCatalogItem.prototype._hide = function() {
    if (defined(this._geoJsonItem)) {
        this._geoJsonItem._hide();
    }
};

function loadOgrData(ogrItem, file, url) {
    var terria = ogrItem.terria;
    // generate form to submit file for conversion
    var formData = new FormData();
    if (defined(file)) {
        if (file.size > 1000000) {
            errorLoading(ogrItem, 'The file size is greater than the 1Mb limit of the '+terria.appName+' conversion service.');
            return;
        }
        formData.append('input_file', file);
    } else if (defined(url)) {
        url = new Uri(url).resolve(new Uri(document.location.href)).toString();
        formData.append('input_url', url);
    }

    console.log('Attempting to convert file via the NM ogr2ogr web service');

    return loadWithXhr({
        url : OgrCatalogItem.conversionServiceBaseUrl,
        method : 'POST',
        data : formData
    }).then(function(response) {
        ogrItem._geoJsonItem.data = JSON.parse(response);

        return ogrItem._geoJsonItem.load().then(function() {
            ogrItem.rectangle = ogrItem._geoJsonItem.rectangle;
            ogrItem.clock = ogrItem._geoJsonItem.clock;
        });
    }).otherwise(function() {
        errorLoading(ogrItem);
    });
}


function errorLoading(ogrItem, msg) {
    var terria = ogrItem.terria;
    if (!defined(msg)) {
        msg = 'This may indicate that the file is invalid or that it is not supported by the '+terria.appName+' conversion service.';
    }
    throw new ModelError({
        sender: ogrItem,
        title: 'Error converting file to GeoJson',
        message: '\
An error occurred while attempting to convert this file to GeoJson.  ' + msg + '  If you would like assistance or further information, please email us \
at <a href="mailto:'+terria.supportEmail+'">'+terria.supportEmail+'</a>.'
    });
}

module.exports = OgrCatalogItem;
