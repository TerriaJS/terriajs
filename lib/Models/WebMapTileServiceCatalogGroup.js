'use strict';

/*global require*/
var URI = require('URIjs');

var clone = require('terriajs-cesium/Source/Core/clone');
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var freezeObject = require('terriajs-cesium/Source/Core/freezeObject');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var loadXML = require('terriajs-cesium/Source/Core/loadXML');

var CatalogGroup = require('./CatalogGroup');
var inherit = require('../Core/inherit');
var ModelError = require('./ModelError');
var WebMapTileServiceCatalogItem = require('./WebMapTileServiceCatalogItem');

/**
 * A {@link CatalogGroup} representing a collection of layers from a Web Map Tile Service (WMTS) server.
 *
 * @alias WebMapTileServiceCatalogGroup
 * @constructor
 * @extends CatalogGroup
 *
 * @param {Terria} terria The Terria instance.
 */
var WebMapTileServiceCatalogGroup = function(terria) {
     CatalogGroup.call(this, terria, 'wmts-getCapabilities');

    /**
     * Gets or sets the URL of the WMTS server.  This property is observable.
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
     * Gets or sets the additional parameters to pass to the WMTS server when requesting images.
     * If this property is undefiend, {@link WebMapTileServiceCatalogItem.defaultParameters} is used.
     * @type {Object}
     */
    this.parameters = undefined;

    /**
     * Gets or sets a hash of names of blacklisted data layers.  A layer that appears in this hash
     * will not be shown to the user.  In this hash, the keys should be the Title of the layers to blacklist,
     * and the values should be "true".  This property is observable.
     * @type {Object}
     */
    this.blacklist = undefined;

    /**
     * Gets or sets the field name to use as the primary title in the catalog view: each WMTS layer's
     * "title" (default), "identifier", or "abstract".
     * @type {String}
     */
    this.titleField = 'title';

    /**
     * Gets or sets a hash of properties that will be set on each child item.
     * For example, { 'treat404AsError': false }
     */
    this.itemProperties = undefined;

    knockout.track(this, ['url', 'dataCustodian', 'parameters', 'blacklist', 'titleField', 'itemProperties']);
};

inherit(CatalogGroup, WebMapTileServiceCatalogGroup);

defineProperties(WebMapTileServiceCatalogGroup.prototype, {
    /**
     * Gets the type of data member represented by this instance.
     * @memberOf WebMapTileServiceCatalogGroup.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return 'wmts-getCapabilities';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, such as 'Web Map Tile Service (WMTS)'.
     * @memberOf WebMapTileServiceCatalogGroup.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'Web Map Tile Service (WMTS) Server';
        }
    },

    /**
     * Gets the set of functions used to serialize individual properties in {@link CatalogMember#serializeToJson}.
     * When a property name on the model matches the name of a property in the serializers object lieral,
     * the value will be called as a function and passed a reference to the model, a reference to the destination
     * JSON object literal, and the name of the property.
     * @memberOf WebMapTileServiceCatalogGroup.prototype
     * @type {Object}
     */
    serializers : {
        get : function() {
            return WebMapTileServiceCatalogGroup.defaultSerializers;
        }
    }
});

/**
 * Gets or sets the set of default serializer functions to use in {@link CatalogMember#serializeToJson}.  Types derived from this type
 * should expose this instance - cloned and modified if necesary - through their {@link CatalogMember#serializers} property.
 * @type {Object}
 */
WebMapTileServiceCatalogGroup.defaultSerializers = clone(CatalogGroup.defaultSerializers);

WebMapTileServiceCatalogGroup.defaultSerializers.items = function(wmtsGroup, json, propertyName, options) {
    // Only serialize minimal properties in contained items, because other properties are loaded from GetCapabilities.
    var previousSerializeForSharing = options.serializeForSharing;
    options.serializeForSharing = true;

    // Only serlize enabled items as well.  This isn't quite right - ideally we'd serialize any
    // property of any item if the property's value is changed from what was loaded from GetCapabilities -
    // but this gives us reasonable results for sharing and is a lot less work than the ideal
    // solution.
    var previousEnabledItemsOnly = options.enabledItemsOnly;
    options.enabledItemsOnly = true;

    var result = CatalogGroup.defaultSerializers.items(wmtsGroup, json, propertyName, options);

    options.enabledItemsOnly = previousEnabledItemsOnly;
    options.serializeForSharing = previousSerializeForSharing;

    return result;
};

WebMapTileServiceCatalogGroup.defaultSerializers.isLoading = function(wmtsGroup, json, propertyName, options) {};

freezeObject(WebMapTileServiceCatalogGroup.defaultSerializers);

WebMapTileServiceCatalogGroup.prototype._getValuesThatInfluenceLoad = function() {
    return [this.url, this.blacklist, this.titleField];
};

WebMapTileServiceCatalogGroup.prototype._load = function() {
    var url = cleanAndProxyUrl( this.terria, this.url) + '?service=WMTS&request=GetCapabilities&version=1.0.0';

    var that = this;
    return loadXML(url).then(function(xml) {
        // Is this really a GetCapabilities response?
        if (!xml || !xml.documentElement || (xml.documentElement.localName !== 'Capabilities')) {
            throw new ModelError({
                title: 'Invalid WMTS server',
                message: '\
An error occurred while invoking GetCapabilities on the WMTS server.  The server\'s response does not appear to be a valid GetCapabilities document.  \
<p>If you entered the link manually, please verify that the link is correct.</p>\
<p>If you did not enter this link manually, this error may indicate that the group you opened is temporarily unavailable or there is a \
problem with your internet connection.  Try opening the group again, and if the problem persists, please report it by \
sending an email to <a href="mailto:'+that.terria.supportEmail+'">'+that.terria.supportEmail+'</a>.</p>'
            });
        }

        var json = WebMapTileServiceCatalogItem.capabilitiesXmlToJson(xml);

        // WMTS does not have layer hierarchy like WMS.  Instead, it has a separate/optional Themes section that
        // groups layers by reference.  We currently don't support the Themes section.
        var layers;
        if (!defined(json.Contents) || !defined(json.Contents.Layer)) {
            layers = [];
        } else if (Array.isArray(json.Contents.Layer)) {
            layers = json.Contents.Layer;
        } else {
            layers = [json.Contents.Layer];
        }

        for (var i = 0; i < layers.length; ++i) {
            createWmtsDataSource(that, json, layers[i]);
        }
    }).otherwise(function(e) {
        throw new ModelError({
            sender: that,
            title: 'Group is not available',
            message: '\
An error occurred while invoking GetCapabilities on the WMTS server.  \
<p>If you entered the link manually, please verify that the link is correct.</p>\
<p>This error may also indicate that the server does not support <a href="http://enable-cors.org/" target="_blank">CORS</a>.  If this is your \
server, verify that CORS is enabled and enable it if it is not.  If you do not control the server, \
please contact the administrator of the server and ask them to enable CORS.  Or, contact the National \
Map team by emailing <a href="mailto:'+that.terria.supportEmail+'">'+that.terria.supportEmail+'</a> \
and ask us to add this server to the list of non-CORS-supporting servers that may be proxied by \
National Map itself.</p>\
<p>If you did not enter this link manually, this error may indicate that the group you opened is temporarily unavailable or there is a \
problem with your internet connection.  Try opening the group again, and if the problem persists, please report it by \
sending an email to <a href="mailto:'+that.terria.supportEmail+'">'+that.terria.supportEmail+'</a>.</p>'
        });
    });
};

function cleanAndProxyUrl(terria, url) {
    // Strip off the search portion of the URL
    var uri = new URI(url);
    uri.search('');

    var cleanedUrl = uri.toString();
    if (defined(terria.corsProxy) && terria.corsProxy.shouldUseProxy(cleanedUrl)) {
        cleanedUrl = terria.corsProxy.getURL(cleanedUrl, '1d');
    }

    return cleanedUrl;
}

function getNameFromLayer(wmtsGroup, layer) {
    if (wmtsGroup.titleField === 'name') {
        return layer.Identifier;
    } else if (wmtsGroup.titleField === 'abstract') {
        return layer.Abstract;
    } else {
        return layer.Title;
    }
}

function createWmtsDataSource(wmtsGroup, capabilities, layer) {
    var result = new WebMapTileServiceCatalogItem(wmtsGroup.terria);

    result.name = getNameFromLayer(wmtsGroup, layer);
    result.url = wmtsGroup.url;
    result.layer = layer.Identifier;

    result.updateFromCapabilities(capabilities, true, layer);

    if (typeof(wmtsGroup.itemProperties) === 'object') {
        result.updateFromJson(wmtsGroup.itemProperties);
    }

    wmtsGroup.items.push(result);

    return result;
}

module.exports = WebMapTileServiceCatalogGroup;
