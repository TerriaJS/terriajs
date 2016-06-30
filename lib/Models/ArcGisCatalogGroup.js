'use strict';

/*global require*/
var URI = require('urijs');

var clone = require('terriajs-cesium/Source/Core/clone');
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var freezeObject = require('terriajs-cesium/Source/Core/freezeObject');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var loadJson = require('terriajs-cesium/Source/Core/loadJson');
var when = require('terriajs-cesium/Source/ThirdParty/when');

var TerriaError = require('../Core/TerriaError');
var CatalogGroup = require('./CatalogGroup');
var inherit = require('../Core/inherit');
var proxyCatalogItemUrl = require('./proxyCatalogItemUrl');
var replaceUnderscores = require('../Core/replaceUnderscores');
var ArcGisMapServerCatalogItem = require('./ArcGisMapServerCatalogItem');

/**
 * A {@link CatalogGroup} representing a collection of layers from an ArcGIS Map Service.
 *
 * @alias ArcGisCatalogGroup
 * @constructor
 * @extends CatalogGroup
 *
 * @param {Terria} terria The Terria instance.
 */
var ArcGisCatalogGroup = function(terria) {
    CatalogGroup.call(this, terria, 'esri-mapServer-group');

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

    /**
     * Gets or sets a hash of properties that will be set on each child item.
     * For example, { 'treat404AsError': false }
     */
    this.itemProperties = undefined;

    knockout.track(this, ['url', 'dataCustodian', 'blacklist', 'itemProperties']);
};

inherit(CatalogGroup, ArcGisCatalogGroup);

defineProperties(ArcGisCatalogGroup.prototype, {
    /**
     * Gets the type of data member represented by this instance.
     * @memberOf ArcGisCatalogGroup.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return 'esri-mapServer-group';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, such as 'Web Map Service (WMS)'.
     * @memberOf ArcGisCatalogGroup.prototype
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
     * @memberOf ArcGisCatalogGroup.prototype
     * @type {Object}
     */
    serializers : {
        get : function() {
            return ArcGisCatalogGroup.defaultSerializers;
        }
    }
});

/**
 * Gets or sets the set of default serializer functions to use in {@link CatalogMember#serializeToJson}.  Types derived from this type
 * should expose this instance - cloned and modified if necesary - through their {@link CatalogMember#serializers} property.
 * @type {Object}
 */
ArcGisCatalogGroup.defaultSerializers = clone(CatalogGroup.defaultSerializers);

ArcGisCatalogGroup.defaultSerializers.items = CatalogGroup.enabledShareableItemsSerializer;

ArcGisCatalogGroup.defaultSerializers.isLoading = function(wmsGroup, json, propertyName, options) {};

freezeObject(ArcGisCatalogGroup.defaultSerializers);

ArcGisCatalogGroup.prototype._getValuesThatInfluenceLoad = function() {
    return [this.url, this.blacklist];
};

ArcGisCatalogGroup.prototype._load = function() {
    if (/\/MapServer\/?$/i.test(this.url)) {
        return loadMapServer(this);
    } else {
        return loadRest(this);
    }
};

function loadMapServer(catalogGroup) {
    function getJson(segment) {
        var uri = new URI(catalogGroup.url)
            .segment(segment)
            .addQuery('f', 'json');
        return loadJson(proxyCatalogItemUrl(catalogGroup, uri.toString(), '1d'));
    }
    var terria = catalogGroup.terria;
    return when.all([getJson(''), getJson('layers'), getJson('legend')]).then(function(result) {
        var serviceJson = result[0];
        var layersJson = result[1];
        var legendJson = result[2];

        // Is this really a MapServer REST response?
        if (!serviceJson || !serviceJson.layers || !layersJson || !layersJson.layers) {
            throw new TerriaError({
                title: 'Invalid ArcGIS Map Service',
                message: '\
An error occurred while invoking the ArcGIS Map Service.  The server\'s response does not appear to be a valid Map Service document.  \
<p>If you entered the link manually, please verify that the link is correct.</p>\
<p>If you did not enter this link manually, this error may indicate that the group you opened is temporarily unavailable or there is a \
problem with your internet connection.  Try opening the group again, and if the problem persists, please report it by \
sending an email to <a href="mailto:'+terria.supportEmail+'">'+terria.supportEmail+'</a>.</p>'
            });
        }

        var dataCustodian = catalogGroup.dataCustodian;
        if (!defined(dataCustodian) && defined(serviceJson.documentInfo) && defined(serviceJson.documentInfo.Author)) {
            dataCustodian = serviceJson.documentInfo.Author;
        }
        if (catalogGroup.name === 'Unnamed Item' && defined(serviceJson.mapName) && serviceJson.mapName.length > 0) {
            catalogGroup.name = serviceJson.mapName;
        }

        addLayersRecursively(catalogGroup, serviceJson, layersJson, legendJson, -1, layersJson.layers, catalogGroup, dataCustodian);
    }).otherwise(function(e) {
        throw new TerriaError({
            sender: catalogGroup,
            title: 'Group is not available',
            message: '\
An error occurred while invoking the ArcGIS Map Service. \
<p>If you entered the link manually, please verify that the link is correct.</p>\
<p>This error may also indicate that the server does not support <a href="http://enable-cors.org/" target="_blank">CORS</a>.  If this is your \
server, verify that CORS is enabled and enable it if it is not.  If you do not control the server, \
please contact the administrator of the server and ask them to enable CORS.  Or, contact the '+terria.appName+' \
team by emailing <a href="mailto:'+terria.supportEmail+'">'+terria.supportEmail+'</a> \
and ask us to add this server to the list of non-CORS-supporting servers that may be proxied by '+terria.appName+' \
itself.</p>\
<p>If you did not enter this link manually, this error may indicate that the group you opened is temporarily unavailable or there is a \
problem with your internet connection.  Try opening the group again, and if the problem persists, please report it by \
sending an email to <a href="mailto:'+terria.supportEmail+'">'+terria.supportEmail+'</a>.</p>'
        });
    });
}

function loadRest(catalogGroup) {
    // This does not look like a MapServer, try to use it as a generic REST endpoint.
    var serviceUrl = cleanAndProxyUrl(catalogGroup, catalogGroup.url) + '?f=json';

    var terria = catalogGroup.terria;

    return loadJson(serviceUrl).then(function(serviceJson) {
        // Is this really a MapServer REST response?
        if (!serviceJson || (!serviceJson.folders && !serviceJson.services)) {
            throw new TerriaError({
                title: 'Invalid ArcGIS Server',
                message: '\
An error occurred while invoking the ArcGIS REST service.  The server\'s response does not appear to be a valid ArcGIS REST document.  \
<p>If you entered the link manually, please verify that the link is correct.</p>\
<p>If you did not enter this link manually, this error may indicate that the group you opened is temporarily unavailable or there is a \
problem with your internet connection.  Try opening the group again, and if the problem persists, please report it by \
sending an email to <a href="mailto:'+terria.supportEmail+'">'+terria.supportEmail+'</a>.</p>'
            });
        }

        var basePath = getBasePath(catalogGroup);

        var i;

        var folders = serviceJson.folders;
        if (defined(folders)) {
            for (i = 0; i < folders.length; ++i) {
                createGroup(catalogGroup, basePath, folders[i]);
            }
        }

        var services = serviceJson.services;
        if (defined(services)) {
            for (i = 0; i < services.length; ++i) {
                createMapServer(catalogGroup, basePath, services[i]);
            }
        }
    }).otherwise(function(e) {
        throw new TerriaError({
            sender: catalogGroup,
            title: 'Group is not available',
            message: '\
An error occurred while invoking the ArcGIS REST service. \
<p>If you entered the link manually, please verify that the link is correct.</p>\
<p>This error may also indicate that the server does not support <a href="http://enable-cors.org/" target="_blank">CORS</a>.  If this is your \
server, verify that CORS is enabled and enable it if it is not.  If you do not control the server, \
please contact the administrator of the server and ask them to enable CORS.  Or, contact the '+terria.appName+' \
team by emailing <a href="mailto:'+terria.supportEmail+'">'+terria.supportEmail+'</a> \
and ask us to add this server to the list of non-CORS-supporting servers that may be proxied by '+terria.appName+' \
itself.</p>\
<p>If you did not enter this link manually, this error may indicate that the group you opened is temporarily unavailable or there is a \
problem with your internet connection.  Try opening the group again, and if the problem persists, please report it by \
sending an email to <a href="mailto:'+terria.supportEmail+'">'+terria.supportEmail+'</a>.</p>'
        });
    });
}

function cleanAndProxyUrl(catalogGroup, url) {
    // Strip off the search portion of the URL
    var uri = new URI(url);
    uri.search('');

    var cleanedUrl = uri.toString();
    return proxyCatalogItemUrl(catalogGroup, cleanedUrl, '1d');
}

function addLayersRecursively(mapServiceGroup, topLevelJson, topLevelLayersJson, topLevelLegendJson, parentID, layers, thisGroup, dataCustodian) {
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
            var subGroup = new CatalogGroup(mapServiceGroup.terria);
            subGroup.name = replaceUnderscores(layer.name);
            thisGroup.add(subGroup);
            addLayersRecursively(mapServiceGroup, topLevelJson, topLevelLayersJson, topLevelLegendJson, layer.id, layers, subGroup, dataCustodian);
        } else if (layer.type === 'Feature Layer' || layer.type === 'Raster Layer' || layer.type === 'Mosaic Layer') {
            thisGroup.add(createDataSource(mapServiceGroup, topLevelJson, topLevelLayersJson, topLevelLegendJson, layer, dataCustodian));
        }
    }
}

function createDataSource(mapServiceGroup, topLevelJson, topLevelLayersJson, topLevelLegendJson, layer, dataCustodian) {
    var result = new ArcGisMapServerCatalogItem(mapServiceGroup.terria);

    result.name = replaceUnderscores(layer.name);
    result.dataCustodian = dataCustodian;
    result.url = mapServiceGroup.url;
    result.layers = layer.id.toString();
    result.maximumScale = layer.maxScale;

    result.updateFromMetadata(topLevelJson, topLevelLayersJson, topLevelLegendJson, true, layer);

    if (typeof(mapServiceGroup.itemProperties) === 'object') {
        result.updateFromJson(mapServiceGroup.itemProperties);
    }

    return result;
}

function createGroup(catalogGroup, basePath, folderJson) {
    var localName = removePathFromName(basePath, folderJson);

    var newGroup = new ArcGisCatalogGroup(catalogGroup.terria);
    newGroup.name = replaceUnderscores(localName);
    newGroup.url = new URI(catalogGroup.url).segment(localName).toString();
    newGroup.dataCustodian = catalogGroup.dataCustodian;
    newGroup.blacklist = catalogGroup.blacklist;

    if (defined(catalogGroup.itemProperties)) {
        newGroup.updateFromJson(catalogGroup.itemProperties);
    }

    catalogGroup.add(newGroup);

    return newGroup;
}

function createMapServer(catalogGroup, basePath, serviceJson) {
    if (serviceJson.type !== 'MapServer') {
        return;
    }

    var localName = removePathFromName(basePath, serviceJson.name);

    var mapServer = new ArcGisCatalogGroup(catalogGroup.terria);
    mapServer.name = replaceUnderscores(localName);
    mapServer.url = new URI(catalogGroup.url).segment(localName).segment('MapServer').toString();
    mapServer.dataCustodian = catalogGroup.dataCustodian;
    mapServer.blacklist = catalogGroup.blacklist;

    if (defined(catalogGroup.itemProperties)) {
        for (var propertyName in catalogGroup.itemProperties) {
            if (catalogGroup.itemProperties.hasOwnProperty(propertyName)) {
                mapServer[propertyName] = catalogGroup.itemProperties[propertyName];
            }
        }
    }

    catalogGroup.add(mapServer);

    return mapServer;
}

function getBasePath(catalogGroup) {
    var match = /rest\/services\/(.*)/i.exec(catalogGroup.url);
    if (match && match.length > 1) {
        return match[1];
    } else {
        return '';
    }
}

function removePathFromName(basePath, name) {
    if (!basePath && basePath.length === 0) {
        return name;
    }

    var index = name.indexOf(basePath);
    if (index === 0) {
        return name.substring(basePath.length + 1);
    } else {
        return name;
    }
}

module.exports = ArcGisCatalogGroup;
