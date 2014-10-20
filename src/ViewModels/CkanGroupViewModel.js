'use strict';

/*global require,URI,$*/

var CesiumMath = require('../../third_party/cesium/Source/Core/Math');
var clone = require('../../third_party/cesium/Source/Core/clone');
var combine = require('../../third_party/cesium/Source/Core/combine');
var defaultValue = require('../../third_party/cesium/Source/Core/defaultValue');
var defined = require('../../third_party/cesium/Source/Core/defined');
var defineProperties = require('../../third_party/cesium/Source/Core/defineProperties');
var DeveloperError = require('../../third_party/cesium/Source/Core/DeveloperError');
var ImageryLayer = require('../../third_party/cesium/Source/Scene/ImageryLayer');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');
var loadJson = require('../../third_party/cesium/Source/Core/loadJson');
var Rectangle = require('../../third_party/cesium/Source/Core/Rectangle');
var WebMapServiceImageryProvider = require('../../third_party/cesium/Source/Scene/WebMapServiceImageryProvider');
var when = require('../../third_party/cesium/Source/ThirdParty/when');

var corsProxy = require('../corsProxy');
var GeoDataGroupViewModel = require('./GeoDataGroupViewModel');
var inherit = require('../inherit');
var PopupMessage = require('../viewer/PopupMessage');
var rectangleToLatLngBounds = require('../rectangleToLatLngBounds');
var runLater = require('../runLater');
var WebMapServiceDataSourceViewModel = require('./WebMapServiceDataSourceViewModel');

/**
 * A {@link GeoDataGroupViewModel} representing a collection of layers from a [CKAN](http://ckan.org) server.
 *
 * @alias CkanGroupViewModel
 * @constructor
 * @extends GeoDataGroupViewModel
 * 
 * @param {GeoDataCatalogContext} context The context for the group.
 */
var CkanGroupViewModel = function(context) {
    GeoDataGroupViewModel.call(this, context, 'ckan');

    this._loadedUrl = undefined;
    this._loadedFilterQuery = undefined;

    /**
     * Gets or sets the URL of the CKAN server.  This property is observable.
     * @type {String}
     */
    this.url = '';

    /**
     * Gets or sets a description of the custodian of the data sources in this group.
     * This property is an HTML string that must be sanitized before display to the user.
     * This property is observable.
     * @type {String}
     */
    this.dataCustodian = undefined;

    /**
     * Gets or sets the filter query to pass to CKAN when querying the available data sources and their groups.  If this is string,
     * it is passed to CKAN in the "fq" query parameter.  If it is an array of strings, each string in the array is passed to CKAN
     * as an independent "fq" query parameter.  See the [Solr documentation](http://wiki.apache.org/solr/CommonQueryParameters#fq) for
     * information about filter queries.  This property is observable.
     * @type {String|String[]}
     */
    this.filterQuery = undefined;

    knockout.track(this, ['url', 'dataCustodian', 'filterQuery']);
};

CkanGroupViewModel.prototype = inherit(GeoDataGroupViewModel.prototype);

defineProperties(CkanGroupViewModel.prototype, {
    /**
     * Gets the type of data member represented by this instance.
     * @memberOf CkanGroupViewModel.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return 'ckan';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, such as 'Web Map Service (WMS)'.
     * @memberOf CkanGroupViewModel.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'CKAN Group';
        }
    }
});

/**
 * Loads the items in this group by invoking the GetCapabilities service on the WMS server.
 * Each layer in the response becomes an item in the group.  The {@link GeoDataGroupViewModel#isLoading} flag will
 * be set while the load is in progress.
 */
CkanGroupViewModel.prototype.load = function() {
    if ((this.url === this._loadedUrl && this.filterQuery ===  this._loadedFilterQuery) || this.isLoading) {
        return;
    }

    this.isLoading = true;

    var that = this;
    runLater(function() {
        that._loadedUrl = that.url;
        that._loadedFilterQuery = that.filterQuery;
        packageSearch(that).always(function() {
            that.isLoading = false;
        });
    });
};

// The "format" field of CKAN resources must match this regular expression to be considered a WMS resource.
var wmsFormatRegex = /^wms$/i;

function packageSearch(viewModel) {
    var url = cleanAndProxyUrl(viewModel.context, viewModel.url) + '/api/3/action/package_search?rows=100000&fq=' + encodeURIComponent(viewModel.filterQuery);

    return when(loadJson(url), function(json) {
        var items = json.result.results;
        for (var itemIndex = 0; itemIndex < items.length; ++itemIndex) {
            var item = items[itemIndex];

            var textDescription = item.notes.replace(/\n/g, '<br/>');
            if (defined(item.license_url)) {
                textDescription += '<br/>[Licence](' + item.license_url + ')';
            }

            var rectangle;
            var bboxString = item.geo_coverage;
            if (defined(bboxString)) {
                var parts = bboxString.split(',');
                if (parts.length === 4) {
                    rectangle = Rectangle.fromDegrees(parts[0], parts[1], parts[2], parts[3])
                }
            }

            // Currently, we only support WMS layers.
            var resources = item.resources;
            for (var resourceIndex = 0; resourceIndex < resources.length; ++resourceIndex) {
                var resource = resources[resourceIndex];
                if (!resource.format.match(wmsFormatRegex)) {
                    continue;
                }

                var wmsUrl = resource.wms_url;
                if (!defined(wmsUrl)) {
                    wmsUrl = resource.url;
                    if (!defined(wmsUrl)) {
                        continue;
                    }
                }

                // Extract the layer name from the WMS URL.
                var uri = new URI(wmsUrl);
                var params = uri.search(true);
                var layerName = params.LAYERS;

                // Remove the query portion of the WMS URL.
                uri.search('');

                var newItem = new WebMapServiceDataSourceViewModel(viewModel.context);
                newItem.name = item.title;
                newItem.description = textDescription;
                newItem.url = uri.toString();
                newItem.layers = layerName;
                newItem.rectangle = rectangle;

                if (defined(viewModel.dataCustodian)) {
                    newItem.dataCustodian = viewModel.dataCustodian;
                } else if (item.organization && item.organization.title) {
                    newItem.dataCustodian = item.organization.title;
                }

                var groups = item.groups;
                for (var groupIndex = 0; groupIndex < groups.length; ++groupIndex) {
                    var group = groups[groupIndex];

                    var existingGroup = viewModel.findFirstItemByName(group.display_name);
                    if (!defined(existingGroup)) {
                        existingGroup = new GeoDataGroupViewModel(viewModel.context);
                        existingGroup.name = group.display_name;
                        viewModel.add(existingGroup);
                    }

                    existingGroup.add(newItem);
                }
            }
        }
    }, function(e) {
        // TODO: view models should not create UI elements directly like this.
        var message =new PopupMessage({
            container: document.body,
            title: 'Group is not available',
            message: '\
An error occurred while invoking package_search on the CKAN server.  \
<p>If you entered the link manually, please verify that the link is correct.</p>\
<p>This error may also indicate that the server does not support <a href="http://enable-cors.org/" target="_blank">CORS</a>.  If this is your \
server, verify that CORS is enabled and enable it if it is not.  If you do not control the server, \
please contact the administrator of the server and ask them to enable CORS.  Or, contact the National \
Map team by emailing <a href="mailto:nationalmap@lists.nicta.com.au">nationalmap@lists.nicta.com.au</a> \
and ask us to add this server to the list of non-CORS-supporting servers that may be proxied by \
National Map itself.</p>\
<p>If you did not enter this link manually, this error may indicate that the group you opened is temporarily unavailable or there is a \
problem with your internet connection.  Try opening the group again, and if the problem persists, please report it by \
sending an email to <a href="mailto:nationalmap@lists.nicta.com.au">nationalmap@lists.nicta.com.au</a>.</p>'
        });
        viewModel.isOpen = false;
        viewModel._loadedUrl = undefined;
        viewModel._loadedFilterQuery = undefined;
    });
}

function cleanAndProxyUrl(context, url) {
    // Strip off the search portion of the URL
    var uri = new URI(url);
    uri.search('');

    var cleanedUrl = uri.toString();
    if (defined(context.corsProxy) && context.corsProxy.shouldUseProxy(cleanedUrl)) {
        cleanedUrl = context.corsProxy.getURL(cleanedUrl);
    }

    return cleanedUrl;
}

module.exports = CkanGroupViewModel;
