'use strict';

/*global require,URI*/

var Cartesian3 = require('../../third_party/cesium/Source/Core/Cartesian3');
var clone = require('../../third_party/cesium/Source/Core/clone');
var defined = require('../../third_party/cesium/Source/Core/defined');
var defineProperties = require('../../third_party/cesium/Source/Core/defineProperties');
var freezeObject = require('../../third_party/cesium/Source/Core/freezeObject');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');
var loadJson = require('../../third_party/cesium/Source/Core/loadJson');
var Rectangle = require('../../third_party/cesium/Source/Core/Rectangle');
var when = require('../../third_party/cesium/Source/ThirdParty/when');
var WebMercatorProjection = require('../../third_party/cesium/Source/Core/WebMercatorProjection');

var ModelError = require('./ModelError');
var CatalogGroup = require('./CatalogGroup');
var inherit = require('../Core/inherit');
var ArcGisMapServerCatalogItem = require('./ArcGisMapServerCatalogItem');

/**
 * A {@link CatalogGroup} representing a collection of layers from an ArcGIS Map Service.
 *
 * @alias WebMapServiceCatalogGroup
 * @constructor
 * @extends CatalogGroup
 * 
 * @param {Application} application The application.
 */
var ArcGisMapServerCatalogGroup = function(application) {
    CatalogGroup.call(this, application, 'esri-mapServer-group');

    /**
     * Gets or sets the URL of the Map Service.  This property is observable.
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
     * Gets or sets a hash of names of blacklisted data layers.  A layer that appears in this hash
     * will not be shown to the user.  In this hash, the keys should be the Title of the layers to blacklist,
     * and the values should be "true".  This property is observable.
     * @type {Object}
     */
    this.blacklist = undefined;

    knockout.track(this, ['url', 'dataCustodian', 'blacklist']);
};

inherit(CatalogGroup, ArcGisMapServerCatalogGroup);

defineProperties(ArcGisMapServerCatalogGroup.prototype, {
    /**
     * Gets the type of data member represented by this instance.
     * @memberOf WebMapServiceCatalogGroup.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return 'esri-mapServer-group';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, such as 'Web Map Service (WMS)'.
     * @memberOf WebMapServiceCatalogGroup.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'ArcGIS Map Service Group';
        }
    },

    /**
     * Gets the set of functions used to serialize individual properties in {@link CatalogMember#serializeToJson}.
     * When a property name on the model matches the name of a property in the serializers object lieral,
     * the value will be called as a function and passed a reference to the model, a reference to the destination
     * JSON object literal, and the name of the property.
     * @memberOf WebMapServiceCatalogGroup.prototype
     * @type {Object}
     */
    serializers : {
        get : function() {
            return ArcGisMapServerCatalogGroup.defaultSerializers;
        }
    }
});

/**
 * Gets or sets the set of default serializer functions to use in {@link CatalogMember#serializeToJson}.  Types derived from this type
 * should expose this instance - cloned and modified if necesary - through their {@link CatalogMember#serializers} property.
 * @type {Object}
 */
ArcGisMapServerCatalogGroup.defaultSerializers = clone(CatalogGroup.defaultSerializers);

ArcGisMapServerCatalogGroup.defaultSerializers.items = function(wmsGroup, json, propertyName, options) {
    // Only serialize minimal properties in contained items, because other properties are loaded from GetCapabilities.
    var previousSerializeForSharing = options.serializeForSharing;
    options.serializeForSharing = true;

    // Only serlize enabled items as well.  This isn't quite right - ideally we'd serialize any
    // property of any item if the property's value is changed from what was loaded from GetCapabilities -
    // but this gives us reasonable results for sharing and is a lot less work than the ideal
    // solution.
    var previousEnabledItemsOnly = options.enabledItemsOnly;
    options.enabledItemsOnly = true;

    var result = CatalogGroup.defaultSerializers.items(wmsGroup, json, propertyName, options);

    options.enabledItemsOnly = previousEnabledItemsOnly;
    options.serializeForSharing = previousSerializeForSharing;

    return result;
};

ArcGisMapServerCatalogGroup.defaultSerializers.isLoading = function(wmsGroup, json, propertyName, options) {};

freezeObject(ArcGisMapServerCatalogGroup.defaultSerializers);

ArcGisMapServerCatalogGroup.prototype._getValuesThatInfluenceLoad = function() {
    return [this.url, this.blacklist];
};

ArcGisMapServerCatalogGroup.prototype._load = function() {
    var serviceUrl = cleanAndProxyUrl(this.application, this.url) + '?f=json';
    var layersUrl = cleanAndProxyUrl(this.application, this.url) + '/layers?f=json';

    var that = this;
    return when.all([loadJson(serviceUrl), loadJson(layersUrl)]).then(function(result) {
        var serviceJson = result[0];
        var layersJson = result[1];

        // Is this really a MapServer REST response?
        if (!serviceJson || !serviceJson.layers || !layersJson || !layersJson.layers) {
            throw new ModelError({
                title: 'Invalid ArcGIS Map Service',
                message: '\
An error occurred while invoking the ArcGIS Map Service.  The server\'s response does not appear to be a valid Map Service document.  \
<p>If you entered the link manually, please verify that the link is correct.</p>\
<p>If you did not enter this link manually, this error may indicate that the group you opened is temporarily unavailable or there is a \
problem with your internet connection.  Try opening the group again, and if the problem persists, please report it by \
sending an email to <a href="mailto:nationalmap@lists.nicta.com.au">nationalmap@lists.nicta.com.au</a>.</p>'
            });
        }

        var dataCustodian = that.dataCustodian;
        if (!defined(dataCustodian) && defined(serviceJson.documentInfo) && defined(serviceJson.documentInfo.Author)) {
            dataCustodian = serviceJson.documentInfo.Author;
        }

        addLayersRecursively(that, -1, layersJson.layers, that.items, dataCustodian);
    }).otherwise(function(e) {
        throw new ModelError({
            sender: that,
            title: 'Group is not available',
            message: '\
An error occurred while invoking the ArcGIS Map Service. \
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

function addLayersRecursively(mapServiceGroup, parentID, layers, items, dataCustodian) {
    if (!(layers instanceof Array)) {
        layers = [layers];
    }

    for (var i = 0; i < layers.length; ++i) {
        var layer = layers[i];

        if (parentID === -1 && layer.parentLayer !== null && defined(layer.parentLayer)) {
            continue;
        } else if (parentID !== -1 && (!layer.parentLayer || layer.parentLayer.id !== parentID)) {
            continue;
        }

        if (mapServiceGroup.blacklist && mapServiceGroup.blacklist[layer.name]) {
            console.log('Provider Feedback: Filtering out ' + layer.name + ' (' + layer.id + ') because it is blacklisted.');
            continue;
        }

        if (layer.type === 'Group Layer') {
            var subGroup = new CatalogGroup(mapServiceGroup.application);
            subGroup.name = layer.name;
            items.push(subGroup);
            addLayersRecursively(mapServiceGroup, layer.id, layers, subGroup.items, dataCustodian);
        } else if (layer.type === 'Feature Layer') {
            items.push(createDataSource(mapServiceGroup, layer, dataCustodian));
        }
    }
}

function createDataSource(mapServiceGroup, layer, dataCustodian) {
    var result = new ArcGisMapServerCatalogItem(mapServiceGroup.application);

    result.name = layer.name;
    result.description = defined(layer.description) && layer.description.length > 0 ? layer.description : mapServiceGroup.description;
    result.dataCustodian = dataCustodian;
    result.url = mapServiceGroup.url;
    result.dataUrl = mapServiceGroup.url;
    result.dataUrlType = 'direct';
    result.layers = layer.id.toString();
    result.maximumScale = layer.maxScale;

    result.description = '';

    var groupHasDescription = defined(mapServiceGroup.description) && mapServiceGroup.description.length > 0;
    var layerHasDescription = defined(layer.description) && layer.description.length > 0;

    if (groupHasDescription) {
        result.description += mapServiceGroup.description;
    }

    if (groupHasDescription && layerHasDescription) {
        result.description += '<br/>';
    }

    if (layerHasDescription) {
        result.description += layer.description;
    }

    var extent = layer.extent;
    if (defined(extent) && extent.spatialReference && extent.spatialReference.wkid) {
        var wkid = extent.spatialReference.wkid;
        if (wkid === 4326 || wkid === 4283) {
            result.rectangle = Rectangle.fromDegrees(extent.xmin, extent.ymin, extent.xmax, extent.ymax);
        } else if (wkid === 3857 || wkid === 900913 || wkid === 102100) {
            var projection = new WebMercatorProjection();
            var sw = projection.unproject(new Cartesian3(extent.xmin, extent.ymin, 0.0));
            var ne = projection.unproject(new Cartesian3(extent.xmax, extent.ymax, 0.0));
            result.rectangle = new Rectangle(sw.longitude, sw.latitude, ne.longitude, ne.latitude);
        }
    }

    return result;
}

module.exports = ArcGisMapServerCatalogGroup;
