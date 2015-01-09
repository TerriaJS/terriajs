'use strict';

/*global require,URI,$*/

var clone = require('../../third_party/cesium/Source/Core/clone');
var combine = require('../../third_party/cesium/Source/Core/combine');
var defaultValue = require('../../third_party/cesium/Source/Core/defaultValue');
var defined = require('../../third_party/cesium/Source/Core/defined');
var defineProperties = require('../../third_party/cesium/Source/Core/defineProperties');
var freezeObject = require('../../third_party/cesium/Source/Core/freezeObject');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');
var loadXML = require('../../third_party/cesium/Source/Core/loadXML');
var Rectangle = require('../../third_party/cesium/Source/Core/Rectangle');
var WebMercatorTilingScheme = require('../../third_party/cesium/Source/Core/WebMercatorTilingScheme');

var ViewModelError = require('./ViewModelError');
var CatalogGroupViewModel = require('./CatalogGroupViewModel');
var inherit = require('../Core/inherit');
var WebMapServiceItemViewModel = require('./WebMapServiceItemViewModel');

/**
 * A {@link CatalogGroupViewModel} representing a collection of layers from a Web Map Service (WMS) server.
 *
 * @alias WebMapServiceGroupViewModel
 * @constructor
 * @extends CatalogGroupViewModel
 * 
 * @param {ApplicationViewModel} application The application.
 */
var WebMapServiceGroupViewModel = function(application) {
    CatalogGroupViewModel.call(this, application, 'wms-getCapabilities');

    /**
     * Gets or sets the URL of the WMS server.  This property is observable.
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
     * Gets or sets the additional parameters to pass to the WMS server when requesting images.
     * If this property is undefiend, {@link WebMapServiceItemViewModel.defaultParameters} is used.
     * @type {Object}
     */
    this.parameters = undefined;

    knockout.track(this, ['url', 'dataCustodian', 'parameters']);
};

inherit(CatalogGroupViewModel, WebMapServiceGroupViewModel);

defineProperties(WebMapServiceGroupViewModel.prototype, {
    /**
     * Gets the type of data member represented by this instance.
     * @memberOf WebMapServiceGroupViewModel.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return 'wms-getCapabilities';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, such as 'Web Map Service (WMS)'.
     * @memberOf WebMapServiceGroupViewModel.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'Web Map Service (WMS) Group';
        }
    },

    /**
     * Gets the set of functions used to serialize individual properties in {@link CatalogMemberViewModel#serializeToJson}.
     * When a property name on the view-model matches the name of a property in the serializers object lieral,
     * the value will be called as a function and passed a reference to the view-model, a reference to the destination
     * JSON object literal, and the name of the property.
     * @memberOf WebMapServiceGroupViewModel.prototype
     * @type {Object}
     */
    serializers : {
        get : function() {
            return WebMapServiceGroupViewModel.defaultSerializers;
        }
    }
});

/**
 * Gets or sets the set of default serializer functions to use in {@link CatalogMemberViewModel#serializeToJson}.  Types derived from this type
 * should expose this instance - cloned and modified if necesary - through their {@link CatalogMemberViewModel#serializers} property.
 * @type {Object}
 */
WebMapServiceGroupViewModel.defaultSerializers = clone(CatalogGroupViewModel.defaultSerializers);

WebMapServiceGroupViewModel.defaultSerializers.items = function(viewModel, json, propertyName, options) {
    // Only serialize minimal properties in contained items, because other properties are loaded from GetCapabilities.
    var previousSerializeForSharing = options.serializeForSharing;
    options.serializeForSharing = true;

    // Only serlize enabled items as well.  This isn't quite right - ideally we'd serialize any
    // property of any item if the property's value is changed from what was loaded from GetCapabilities -
    // but this gives us reasonable results for sharing and is a lot less work than the ideal
    // solution.
    var previousEnabledItemsOnly = options.enabledItemsOnly;
    options.enabledItemsOnly = true;

    var result = CatalogGroupViewModel.defaultSerializers.items(viewModel, json, propertyName, options);

    options.enabledItemsOnly = previousEnabledItemsOnly;
    options.serializeForSharing = previousSerializeForSharing;

    return result;
};

WebMapServiceGroupViewModel.defaultSerializers.isLoading = function(viewModel, json, propertyName, options) {};

freezeObject(WebMapServiceGroupViewModel.defaultSerializers);

WebMapServiceGroupViewModel.prototype._getValuesThatInfluenceLoad = function() {
    return [this.url];
};

WebMapServiceGroupViewModel.prototype._load = function() {
    var url = cleanAndProxyUrl(this.application, this.url) + '?service=WMS&request=GetCapabilities&version=1.1.1&tiled=true';

    var that = this;
    return loadXML(url).then(function(xml) {
        var json = $.xml2json(xml);

        var supportsJsonGetFeatureInfo = false;

        if (defined(json.Capability.Request) &&
            defined(json.Capability.Request.GetFeatureInfo) &&
            defined(json.Capability.Request.GetFeatureInfo.Format)) {

            var format = json.Capability.Request.GetFeatureInfo.Format;
            if (format === 'application/json') {
                supportsJsonGetFeatureInfo = true;
            } else if (defined(format.indexOf) && format.indexOf('application/json') >= 0) {
                supportsJsonGetFeatureInfo = true;
            }
        }

        if (defined(json.Capability.VendorSpecificCapabilities) &&
            defined(json.Capability.VendorSpecificCapabilities.TileSet)) {

            //TODO: go through TiledSet array and look for     SRS === "EPSG:4326"
            that.parameters = combine(that.parameters, {'tiled': true});
        }

        var dataCustodian = that.dataCustodian;
        if (!defined(dataCustodian) && defined(json.Service.ContactInformation)) {
            var contactInfo = json.Service.ContactInformation;

            var text = '';

            var primary = contactInfo.ContactPersonPrimary;
            if (defined(primary)) {
                if (defined(primary.ContactOrganization) && primary.ContactOrganization.length > 0) {
                    text += primary.ContactOrganization + '<br/>';
                }
            }

            if (defined(contactInfo.ContactElectronicMailAddress) && contactInfo.ContactElectronicMailAddress.length > 0) {
                text += '[' + contactInfo.ContactElectronicMailAddress + '](mailto:' + contactInfo.ContactElectronicMailAddress + ')<br/>'; 
            }

            dataCustodian = text;
        }

        addLayersRecursively(that, json.Capability.Layer, that.items, undefined, supportsJsonGetFeatureInfo, dataCustodian);
    }).otherwise(function(e) {
        throw new ViewModelError({
            sender: that,
            title: 'Group is not available',
            message: '\
An error occurred while invoking GetCapabilities on the WMS server.  \
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
    });
};

function cleanAndProxyUrl(application, url) {
    // Strip off the search portion of the URL
    var uri = new URI(url);
    uri.search('');

    var cleanedUrl = uri.toString();
    if (defined(application.corsProxy) && application.corsProxy.shouldUseProxy(cleanedUrl)) {
        cleanedUrl = application.corsProxy.getURL(cleanedUrl, '1d');
    }

    return cleanedUrl;
}

function addLayersRecursively(viewModel, layers, items, parent, supportsJsonGetFeatureInfo, dataCustodian) {
    if (!(layers instanceof Array)) {
        layers = [layers];
    }

    for (var i = 0; i < layers.length; ++i) {
        var layer = layers[i];

        // Record this layer's parent, so we can walk up the layer hierarchy looking for inherited properties.
        layer.parent = parent;

        if (defined(layer.Layer)) {
            // WMS 1.1.1 spec section 7.1.4.5.2 says any layer with a Name property can be used
            // in the 'layers' parameter of a GetMap request.  This is true in 1.0.0 and 1.3.0 as well.
            if (defined(layer.Name) && layer.Name.length > 0) {
                items.push(createWmsDataSource(viewModel, layer, supportsJsonGetFeatureInfo, dataCustodian));
            }
            addLayersRecursively(viewModel, layer.Layer, items, layer, supportsJsonGetFeatureInfo, dataCustodian);
        }
        else {
            items.push(createWmsDataSource(viewModel, layer, supportsJsonGetFeatureInfo, dataCustodian));
        }
    }
}

function createWmsDataSource(viewModel, layer, supportsJsonGetFeatureInfo, dataCustodian) {
    var result = new WebMapServiceItemViewModel(viewModel.application);

    result.name = layer.Title;
    result.description = defined(layer.Abstract) && layer.Abstract.length > 0 ? layer.Abstract : viewModel.description;
    result.dataCustodian = dataCustodian;
    result.url = viewModel.url;
    result.layers = layer.Name;
    result.parameters = viewModel.parameters;

    result.description = '';

    var viewModelHasDescription = defined(viewModel.description) && viewModel.description.length > 0;
    var layerHasAbstract = defined(layer.Abstract) && layer.Abstract.length > 0;

    if (viewModelHasDescription) {
        result.description += viewModel.description;
    }

    if (viewModelHasDescription && layerHasAbstract) {
        result.description += '<br/>';
    }

    if (layerHasAbstract) {
        result.description += layer.Abstract;
    }


    var queryable = defaultValue(getInheritableProperty(layer, 'queryable'), false);

    result.getFeatureInfoAsGeoJson = queryable && supportsJsonGetFeatureInfo;
    result.getFeatureInfoAsXml = queryable;

    var egbb = getInheritableProperty(layer, 'EX_GeographicBoundingBox'); // required in WMS 1.3.0
    if (defined(egbb)) {
        result.rectangle = Rectangle.fromDegrees(egbb.westBoundLongitude, egbb.southBoundLatitude, egbb.eastBoundLongitude, egbb.northBoundLatitude);
    } else {
        var llbb = getInheritableProperty(layer, 'LatLonBoundingBox'); // required in WMS 1.0.0 through 1.1.1
        if (defined(llbb)) {
            result.rectangle = Rectangle.fromDegrees(llbb.minx, llbb.miny, llbb.maxx, llbb.maxy);
        }
    }

    var crs;
    if (defined(layer.CRS)) {
        crs = layer.CRS;
    } else {
        crs = layer.SRS;
    }

    if (defined(crs)) {
        if (crsIsMatch(crs, 'EPSG:4326')) {
            // Standard Geographic
        } else if (crsIsMatch(crs, 'CRS:84')) {
            // Another name for EPSG:4326
            result.parameters = combine(result.parameters, {srs: 'CRS:84'});
        } else if (crsIsMatch(crs, 'EPSG:4283')) {
            // Australian system that is equivalent to EPSG:4326.
            result.parameters = combine(result.parameters, {srs: 'EPSG:4283'});
        } else if (crsIsMatch(crs, 'EPSG:3857')) {
            // Standard Web Mercator
            result.tilingScheme = new WebMercatorTilingScheme();
        } else if (crsIsMatch(crs, 'EPSG:900913')) {
            // Older code for Web Mercator
            result.tilingScheme = new WebMercatorTilingScheme();
            result.parameters = combine(result.parameters, {srs: 'EPSG:900913'});
        } else {
            // No known supported CRS listed.  Try the default, EPSG:4326, and hope for the best.
        }
    }


    return result;
}

function crsIsMatch(crs, matchValue) {
    if (crs === matchValue) {
        return true;
    }

    if (crs instanceof Array && crs.indexOf(matchValue) >= 0) {
        return true;
    }

     return false;
}

function getInheritableProperty(layer, name) {
    while (defined(layer)) {
        if (defined(layer[name])) {
            return layer[name];
        }
        layer = layer.parent;
    }

    return undefined;
}

module.exports = WebMapServiceGroupViewModel;
