'use strict';

/*global require*/
var URI = require('URIjs');

var CatalogGroup = require('./CatalogGroup');
var inherit = require('../Core/inherit');
var ModelError = require('./ModelError');
var WebMapServiceCatalogItem = require('./WebMapServiceCatalogItem');
var xml2json = require('../ThirdParty/xml2json');

var clone = require('terriajs-cesium/Source/Core/clone');
var combine = require('terriajs-cesium/Source/Core/combine');
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var formatError = require('terriajs-cesium/Source/Core/formatError');
var freezeObject = require('terriajs-cesium/Source/Core/freezeObject');
var objectToQuery = require('terriajs-cesium/Source/Core/objectToQuery');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var loadXML = require('terriajs-cesium/Source/Core/loadXML');

var CswCatalogGroup = function(terria) {
    CatalogGroup.call(this, terria, 'csw');

    /**
     * Gets or sets the URL of the CSW server.  This property is observable.
     * @type {String}
     */
    this.url = '';

    /**
     * Gets or sets the parameters to pass to in the GetRecords request to the CSW server.  Any parameters
     * in this object literal override the parameters in {@link CswCatalogGroup.defaultGetRecordsParameters}.
     * This property is observable.
     * @type {Object}
     */
    this.getRecordsParameters = undefined;

    knockout.track(this, ['url', 'getRecordsParameters']);
};

CswCatalogGroup.defaultGetRecordsParameters = {
    service: 'CSW',
    version: '2.0.2',
    request: 'GetRecords',
    constraintlanguage: 'CQL_TEXT',
    constraint_language_version: '1.1.0',
    maxrecords: '100',
    resultType: 'results',
    elementSetName: 'full',
    constraint: 'Format=\'OGC:WMS\''
};

inherit(CatalogGroup, CswCatalogGroup);

defineProperties(CswCatalogGroup.prototype, {
    /**
     * Gets the type of data member represented by this instance.
     * @memberOf CswCatalogGroup.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return 'csw';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, such as 'Web Map Service (WMS)'.
     * @memberOf CswCatalogGroup.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'Catalogue Services (CSW)';
        }
    },

    /**
     * Gets the set of functions used to update individual properties in {@link CatalogMember#updateFromJson}.
     * When a property name in the returned object literal matches the name of a property on this instance, the value
     * will be called as a function and passed a reference to this instance, a reference to the source JSON object
     * literal, and the name of the property.
     * @memberOf CswCatalogGroup.prototype
     * @type {Object}
     */
    updaters : {
        get : function() {
            return CswCatalogGroup.defaultUpdaters;
        }
    },

    /**
     * Gets the set of functions used to serialize individual properties in {@link CatalogMember#serializeToJson}.
     * When a property name on the model matches the name of a property in the serializers object lieral,
     * the value will be called as a function and passed a reference to the model, a reference to the destination
     * JSON object literal, and the name of the property.
     * @memberOf CswCatalogGroup.prototype
     * @type {Object}
     */
    serializers : {
        get : function() {
            return CswCatalogGroup.defaultSerializers;
        }
    }
});

/**
 * Gets or sets the set of default serializer functions to use in {@link CatalogMember#serializeToJson}.  Types derived from this type
 * should expose this instance - cloned and modified if necesary - through their {@link CatalogMember#serializers} property.
 * @type {Object}
 */
CswCatalogGroup.defaultSerializers = clone(CatalogGroup.defaultSerializers);

CswCatalogGroup.defaultSerializers.items = function(ckanGroup, json, propertyName, options) {
    // Only serialize minimal properties in contained items, because other properties are loaded from CKAN.
    var previousSerializeForSharing = options.serializeForSharing;
    options.serializeForSharing = true;

    // Only serlize enabled items as well.  This isn't quite right - ideally we'd serialize any
    // property of any item if the property's value is changed from what was loaded from CKAN -
    // but this gives us reasonable results for sharing and is a lot less work than the ideal
    // solution.
    var previousEnabledItemsOnly = options.enabledItemsOnly;
    options.enabledItemsOnly = true;

    var result = CatalogGroup.defaultSerializers.items(ckanGroup, json, propertyName, options);

    options.enabledItemsOnly = previousEnabledItemsOnly;
    options.serializeForSharing = previousSerializeForSharing;

    return result;
};

freezeObject(CswCatalogGroup.defaultSerializers);

CswCatalogGroup.prototype._getValuesThatInfluenceLoad = function() {
    return [this.url, this.filterQuery, this.blacklist, this.filterByWmsGetCapabilities, this.minimumMaxScaleDenominator, this.allowEntireWmsServers, this.includeKml, this.includeWms, this.includeCsv, this.includeEsriMapServer];
};

CswCatalogGroup.prototype._load = function() {
    // Working query for WMS records:
    // http://www.marlin.csiro.au/geonetwork/srv/eng/csw?CONSTRAINT=Format%20=%20%27OGC:WMS%27&request=GetRecords&service=CSW&version=2.0.2&CONSTRAINTLANGUAGE=CQL_TEXT&CONSTRAINT_LANGUAGE_VERSION=1.1.0&maxRecords=1&resultType=results&elementSetname=full
    if (!defined(this.url) || this.url.length === 0) {
        return undefined;
    }

    var parameters = CswCatalogGroup.defaultGetRecordsParameters;
    if (defined(this.getRecordsParameters)) {
        parameters = combine(this.getRecordsParameters, CswCatalogGroup.defaultGetRecordsParameters);
    }

    var that = this;
    var startPosition = 1;
    function loadNextPage() {
        parameters.startPosition = startPosition;
        var url = cleanAndProxyUrl(that.terria, that.url) + '?' + objectToQuery(parameters);

        return loadXML(url).then(function(xml) {
            if (!defined(xml)) {
                return;
            }

            var json = xml2json(xml);
            var searchResults = json.SearchResults;
            if (!defined(searchResults) || !defined(searchResults.Record)) {
                return;
            }

            var records = searchResults.Record;

            for (var i = 0; i < records.length; ++i) {
                var record = records[i];
                var uris = record.URI;
                if (!defined(uris)) {
                    continue;
                }

                for (var j = 0; j < uris.length; ++j) {
                    var uri = uris[j];
                    if (uri.protocol === 'OGC:WMS') {
                        var catalogItem = new WebMapServiceCatalogItem(that.terria);
                        catalogItem.name = record.title;
                        catalogItem.description = record.description;
                        catalogItem.layers = uri.name;
                        catalogItem.url = uri.toString();
                        that.items.push(catalogItem);
                    }
                }
            }

            var nextRecord = parseInt(searchResults.nextRecord, 10);
            if (nextRecord < parseInt(searchResults.numberOfRecordsMatched, 10)) {
                startPosition = nextRecord;
                return loadNextPage();
            }
        });
    }

    return loadNextPage().otherwise(function(e) {
        throw new ModelError({
            sender: that,
            title: that.name,
            message: '\
Couldn\'t retrieve packages from this CKAN server.<br/><br/>\
If you entered the URL manually, please double-check it.<br/><br/>\
If it\'s your server, make sure <a href="http://enable-cors.org/" target="_blank">CORS</a> is enabled.<br/><br/>\
Otherwise, if reloading doesn\'t fix it, please report the problem by sending an email to <a href="mailto:'+that.terria.supportEmail+'">'+that.terria.supportEmail+'</a> with the technical details below.  Thank you!<br/><br/>\
<pre>' + formatError(e) + '</pre>'
        });
    });
};

function cleanAndProxyUrl(terria, url) {
    return proxyUrl(terria, cleanUrl(url));
}

function cleanUrl(url) {
    // Strip off the search portion of the URL
    var uri = new URI(url);
    uri.search('');
    return uri.toString();
}

function proxyUrl(terria, url) {
    if (defined(terria.corsProxy) && terria.corsProxy.shouldUseProxy(url)) {
        return terria.corsProxy.getURL(url);
    }

    return url;
}

module.exports = CswCatalogGroup;
