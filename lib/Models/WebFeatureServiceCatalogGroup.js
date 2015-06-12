'use strict';

/*global require*/
var URI = require('URIjs');

var clone = require('terriajs-cesium/Source/Core/clone');
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var freezeObject = require('terriajs-cesium/Source/Core/freezeObject');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var loadXML = require('terriajs-cesium/Source/Core/loadXML');
var Rectangle = require('terriajs-cesium/Source/Core/Rectangle');

var ModelError = require('./ModelError');
var CatalogGroup = require('./CatalogGroup');
var inherit = require('../Core/inherit');
var unionRectangles = require('../Map/unionRectangles');
var WebFeatureServiceCatalogItem = require('./WebFeatureServiceCatalogItem');
var xml2json = require('../ThirdParty/xml2json');

/**
 * A {@link CatalogGroup} representing a collection of feature types from a Web Feature Service (WFS) server.
 *
 * @alias WebFeatureServiceCatalogGroup
 * @constructor
 * @extends CatalogGroup
 *
 * @param {Terria} terria The Terria instance.
 */
var WebFeatureServiceCatalogGroup = function(terria) {
    CatalogGroup.call(this, terria, 'wfs-getCapabilities');

    /**
     * Gets or sets the URL of the WFS server.  This property is observable.
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

inherit(CatalogGroup, WebFeatureServiceCatalogGroup);

defineProperties(WebFeatureServiceCatalogGroup.prototype, {
    /**
     * Gets the type of data member represented by this instance.
     * @memberOf WebFeatureServiceCatalogGroup.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return 'wfs-getCapabilities';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, such as 'Web Feature Service (WFS)'.
     * @memberOf WebFeatureServiceCatalogGroup.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'Web Feature Service (WFS) Server';
        }
    },

    /**
     * Gets the set of functions used to serialize individual properties in {@link CatalogMember#serializeToJson}.
     * When a property name on the model matches the name of a property in the serializers object lieral,
     * the value will be called as a function and passed a reference to the model, a reference to the destination
     * JSON object literal, and the name of the property.
     * @memberOf WebFeatureServiceCatalogGroup.prototype
     * @type {Object}
     */
    serializers : {
        get : function() {
            return WebFeatureServiceCatalogGroup.defaultSerializers;
        }
    }
});

/**
 * Gets or sets the set of default serializer functions to use in {@link CatalogMember#serializeToJson}.  Types derived from this type
 * should expose this instance - cloned and modified if necesary - through their {@link CatalogMember#serializers} property.
 * @type {Object}
 */
WebFeatureServiceCatalogGroup.defaultSerializers = clone(CatalogGroup.defaultSerializers);

WebFeatureServiceCatalogGroup.defaultSerializers.items = function(wfsGroup, json, propertyName, options) {
    // Only serialize minimal properties in contained items, because other properties are loaded from GetCapabilities.
    var previousSerializeForSharing = options.serializeForSharing;
    options.serializeForSharing = true;

    // Only serlize enabled items as well.  This isn't quite right - ideally we'd serialize any
    // property of any item if the property's value is changed from what was loaded from GetCapabilities -
    // but this gives us reasonable results for sharing and is a lot less work than the ideal
    // solution.
    var previousEnabledItemsOnly = options.enabledItemsOnly;
    options.enabledItemsOnly = true;

    CatalogGroup.defaultSerializers.items(wfsGroup, json, propertyName, options);

    options.enabledItemsOnly = previousEnabledItemsOnly;
    options.serializeForSharing = previousSerializeForSharing;
};

WebFeatureServiceCatalogGroup.defaultSerializers.isLoading = function(wfsGroup, json, propertyName, options) {};

freezeObject(WebFeatureServiceCatalogGroup.defaultSerializers);

WebFeatureServiceCatalogGroup.prototype._getValuesThatInfluenceLoad = function() {
    return [this.url, this.blacklist];
};

WebFeatureServiceCatalogGroup.prototype._load = function() {
    var url = cleanAndProxyUrl( this.terria, this.url) + '?service=WFS&version=1.1.0&request=GetCapabilities';

    var that = this;
    return loadXML(url).then(function(xml) {
        // Is this really a GetCapabilities response?
        if (!xml || !xml.documentElement || xml.documentElement.localName !== 'WFS_Capabilities') {
            throw new ModelError({
                title: 'Invalid WFS server',
                message: '\
An error occurred while invoking GetCapabilities on the WFS server.  The server\'s response does not appear to be a valid GetCapabilities document.  \
<p>If you entered the link manually, please verify that the link is correct.</p>\
<p>If you did not enter this link manually, this error may indicate that the group you opened is temporarily unavailable or there is a \
problem with your internet connection.  Try opening the group again, and if the problem persists, please report it by \
sending an email to <a href="mailto:'+that.terria.supportEmail+'">'+that.terria.supportEmail+'</a>.</p>'
            });
        }

        var json = xml2json(xml);

        var supportsJsonGetFeature = false;

        if (defined(json.OperationsMetadata)) {
            var getFeatureOperation = findElementByName(json.OperationsMetadata.Operation, 'GetFeature');
            if (defined(getFeatureOperation)) {
                var outputFormatParameter = findElementByName(getFeatureOperation.Parameter, 'outputFormat');
                if (defined(outputFormatParameter) && defined(outputFormatParameter.Value)) {
                    supportsJsonGetFeature = outputFormatParameter.Value.indexOf('json') >= 0 ||
                                             outputFormatParameter.Value.indexOf('JSON') >= 0 ||
                                             outputFormatParameter.Value.indexOf('application/json') >= 0;
                }
            }
        }

        var dataCustodian = that.dataCustodian;
        if (!defined(dataCustodian) && defined(json.ServiceProvider) && defined(json.ServiceProvider.ProviderName)) {
            dataCustodian = json.ServiceProvider.ProviderName;

            if (defined(json.ServiceProvider.ProviderSite) && defined(json.ServiceProvider.ProviderSite.href)) {
                dataCustodian = '[' + dataCustodian + '](' + json.ServiceProvider.ProviderSite.href + ')';
            }

            if (defined(json.ServiceProvider.ServiceContact) && defined(json.ServiceProvider.ServiceContact.Address) && defined(json.ServiceProvider.ServiceContact.Address.ElectronicMailAddress)) {
                dataCustodian += '<br/>';
                dataCustodian += '[' + json.ServiceProvider.ServiceContact.Address.ElectronicMailAddress + '](mailto:' + json.ServiceProvider.ServiceContact.Address.ElectronicMailAddress + ')<br/>';
            }
        }

        if (defined(json.FeatureTypeList)) {
            addFeatureTypes(that, json.FeatureTypeList.FeatureType, that.items, undefined, supportsJsonGetFeature, dataCustodian);
        }
    }).otherwise(function(e) {
        throw new ModelError({
            title: 'Group is not available',
            message: '\
An error occurred while invoking GetCapabilities on the WFS server.  \
<p>If you entered the link manually, please verify that the link is correct.</p>\
<p>This error may also indicate that the server does not support <a href="http://enable-cors.org/" target="_blank">CORS</a>.  If this is your \
server, verify that CORS is enabled and enable it if it is not.  If you do not control the server, \
please contact the administrator of the server and ask them to enable CORS.  Or, contact the '+that.terria.appName+' \
Map team by emailing <a href="mailto:'+that.terria.supportEmail+'">'+that.terria.supportEmail+'</a> \
and ask us to add this server to the list of non-CORS-supporting servers that may be proxied by '+that.terria.appName+' \
itself.</p>\
<p>If you did not enter this link manually, this error may indicate that the group you opened is temporarily unavailable or there is a \
problem with your internet connection.  Try opening the group again, and if the problem persists, please report it by \
sending an email to <a href="mailto:'+that.terria.supportEmail+'">'+that.terria.supportEmail+'</a>.</p>'
        });
    });
};

function findElementByName(list, name) {
    if (!defined(list)) {
        return undefined;
    }

    for (var i = 0; i < list.length; ++i) {
        if (list[i].name === name) {
            return list[i];
        }
    }

    return undefined;
}

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

function addFeatureTypes(wfsGroup, featureTypes, items, parent, supportsJsonGetFeature, dataCustodian) {
    if (!(featureTypes instanceof Array)) {
        featureTypes = [featureTypes];
    }

    for (var i = 0; i < featureTypes.length; ++i) {
        var featureType = featureTypes[i];

        if (wfsGroup.blacklist && wfsGroup.blacklist[featureType.Title]) {
            console.log('Provider Feedback: Filtering out ' + featureType.Title + ' (' + featureType.Name + ') because it is blacklisted.');
            continue;
        }

        items.push(createWfsDataSource(wfsGroup, featureType, supportsJsonGetFeature, dataCustodian));
    }
}

function createWfsDataSource(wfsGroup, featureType, supportsJsonGetFeature, dataCustodian) {
    var result = new WebFeatureServiceCatalogItem(wfsGroup.terria);

    result.name = featureType.Title;
    result.description = defined(featureType.Abstract) && featureType.Abstract.length > 0 ? featureType.Abstract : wfsGroup.description;
    result.dataCustodian = dataCustodian;
    result.url = wfsGroup.url;
    result.typeNames = featureType.Name;

    result.description = '';

    var wfsGroupHasDescription = defined(wfsGroup.description) && wfsGroup.description.length > 0;
    var layerHasAbstract = defined(featureType.Abstract) && featureType.Abstract.length > 0;

    if (wfsGroupHasDescription) {
        result.description += wfsGroup.description;
    }

    if (wfsGroupHasDescription && layerHasAbstract) {
        result.description += '<br/>';
    }

    if (layerHasAbstract) {
        result.description += featureType.Abstract;
    }

    result.requestGeoJson = supportsJsonGetFeature;
    result.requestGml = true;

    var boundingBoxes = featureType.WGS84BoundingBox;

    var rectangle;
    if (boundingBoxes instanceof Array) {
        rectangle = wgs84BoundingBoxToRectangle(boundingBoxes[0]);
        for (var i = 1; i < boundingBoxes.length; ++i) {
            rectangle = unionRectangles(rectangle, wgs84BoundingBoxToRectangle(boundingBoxes[i]));
        }
    } else if (defined(boundingBoxes)) {
        rectangle = wgs84BoundingBoxToRectangle(boundingBoxes);
    } else {
        rectangle = Rectangle.MAX_VALUE;
    }

    result.rectangle = rectangle;

    return result;
}

function wgs84BoundingBoxToRectangle(boundingBox) {
    if (!defined(boundingBox)) {
        return Rectangle.MAX_VALUE;
    }

    var lowerCorner = boundingBox.LowerCorner;
    var upperCorner = boundingBox.UpperCorner;
    if (!defined(lowerCorner) || !defined(upperCorner)) {
        return Rectangle.MAX_VALUE;
    }

    var lowerCoordinates = lowerCorner.split(' ');
    var upperCoordinates = upperCorner.split(' ');
    if (lowerCoordinates.length !== 2 || upperCoordinates.length !== 2) {
        return Rectangle.MAX_VALUE;
    }

    return Rectangle.fromDegrees(lowerCoordinates[0], lowerCoordinates[1], upperCoordinates[0], upperCoordinates[1]);
}


module.exports = WebFeatureServiceCatalogGroup;
