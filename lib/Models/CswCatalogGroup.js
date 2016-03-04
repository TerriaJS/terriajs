'use strict';

/*global require*/
var URI = require('urijs');

var ArcGisMapServerCatalogItem = require('./ArcGisMapServerCatalogItem');
var CatalogGroup = require('./CatalogGroup');
var CsvCatalogItem = require('./CsvCatalogItem');
var GeoJsonCatalogItem = require('./GeoJsonCatalogItem');
var inherit = require('../Core/inherit');
var KmlCatalogItem = require('./KmlCatalogItem');
var TerriaError = require('../Core/TerriaError');
var WebMapServiceCatalogGroup = require('./WebMapServiceCatalogGroup');
var WebMapServiceCatalogItem = require('./WebMapServiceCatalogItem');
var xml2json = require('../ThirdParty/xml2json');

var clone = require('terriajs-cesium/Source/Core/clone');
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var formatError = require('terriajs-cesium/Source/Core/formatError');
var freezeObject = require('terriajs-cesium/Source/Core/freezeObject');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var loadWithXhr = require('terriajs-cesium/Source/Core/loadWithXhr');
var proxyCatalogItemUrl = require('./proxyCatalogItemUrl');

/**
 * A {@link CatalogGroup} representing a collection of datasets queried from an OGC Catalog Service (CSW) server.
 *
 * @alias CswCatalogGroup
 * @constructor
 * @extends CatalogGroup
 *
 * @param {Terria} terria The Terria instance.
 */
var CswCatalogGroup = function(terria) {
    CatalogGroup.call(this, terria, 'csw');

    /**
     * Gets or sets the URL of the CSW server.  This property is observable.
     * @type {String}
     */
    this.url = '';

    /**
     * Gets or sets the template XML string to POST to the CSW server to query for catalog items.  If this property is undefined,
     * {@link CswCatalogGroup.defaultGetRecordsTemplate} is used.  The XML string should have a `{startPosition}` placeholder to be
     * replaced with the next start position in order to allow incremental paging of results.
     * This property is observable.
     * @type {String}
     */
    this.getRecordsTemplate = undefined;

    /**
     * True to allow WMS resources to be added to the catalog; otherwise, false.
     * @type {Boolean}
     * @default true
     */
    this.includeWms = true;

    /**
     * Gets or sets a regular expression that, when it matches the protocol attribute of a URI element of a record, indicates that the URI is a WMS resource.
     * @type {RegExp}
     */
    this.wmsResourceFormat = /\bwms\b/i;

    /**
     * True to allow KML resources to be added to the catalog; otherwise, false.
     * @type {Boolean}
     * @default false
     */
    this.includeKml = false;

    /**
     * Gets or sets a regular expression that, when it matches the protocol attribute of a URI element of a record, indicates that the resource is a KML resource.
     * @type {RegExp}
     */
    this.kmlResourceFormat = /\bkml\b/i;

    /**
     * True to allow CSV resources to be added to the catalog; otherwise, false.
     * @type {Boolean}
     */
    this.includeCsv = false;

    /**
     * Gets or sets a regular expression that, when it matches the protocol attribute of a URI element of a record, indicates that the resource is a CSV resource.
     * @type {RegExp}
     */
    this.csvResourceFormat = /\bcsv-geo-/i;

    /**
     * True to allow ESRI Map resources to be added to the catalog; otherwise, false.
     * @type {Boolean}
     * @default false
     */
    this.includeEsriMapServer = false;

    /**
     * Gets or sets a regular expression that, when it matches the protocol attribute of a URI element of a record, indicates that the resource is an Esri MapServer resource.
     * @type {RegExp}
     */
    this.esriMapServerResourceFormat = /\besri rest\b/i;

    /**
     * True to allow GeoJSON resources to be added to the catalog; otherwise, false.
     * @type {Boolean}
     * @default false
     */
    this.includeGeoJson = false;

    /**
     * Gets or sets a regular expression that, when it matches the protocol attribute of a URI element of a record, indicates that the resource is a GeoJSON resource.
     * @type {RegExp}
     */
    this.geoJsonResourceFormat = /\bgeojson\b/i;

    knockout.track(this, ['url', 'getRecordsParameters', 'includeWms', 'includeKml', 'includeCsv', 'includeEsriMapServer', 'includeGeoJson']);
};

CswCatalogGroup.defaultGetRecordsTemplate = require('./CswGetRecordsTemplate.xml');

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
     * Gets a human-readable name for this type of data source, such as 'Catalogue Service (CSW)'.
     * @memberOf CswCatalogGroup.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'Catalogue Service (CSW)';
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
 * Gets or sets the set of default updater functions to use in {@link CatalogMember#updateFromJson}.  Types derived from this type
 * should expose this instance - cloned and modified if necesary - through their {@link CatalogMember#updaters} property.
 * @type {Object}
 */
CswCatalogGroup.defaultUpdaters = clone(CatalogGroup.defaultUpdaters);

/* Deserializes a regex like ".foo" into a case-insensitive regex /.foo/i  */
function regexDeserializer(fieldName) {
    return function(catalogGroup, json, propertyName, options) {
        if (defined(json[fieldName])) {
            catalogGroup[fieldName] = new RegExp(json[fieldName], 'i');
        }
    };
}

CswCatalogGroup.defaultUpdaters.wmsResourceFormat = regexDeserializer('wmsResourceFormat');
CswCatalogGroup.defaultUpdaters.kmlResourceFormat = regexDeserializer('kmlResourceFormat');
CswCatalogGroup.defaultUpdaters.csvResourceFormat = regexDeserializer('csvResourceFormat');
CswCatalogGroup.defaultUpdaters.esriMapServerResourceFormat = regexDeserializer('esriMapServerResourceFormat');
CswCatalogGroup.defaultUpdaters.geoJsonResourceFormat = regexDeserializer('geoJsonResourceFormat');

freezeObject(CswCatalogGroup.defaultUpdaters);

/**
 * Gets or sets the set of default serializer functions to use in {@link CatalogMember#serializeToJson}.  Types derived from this type
 * should expose this instance - cloned and modified if necesary - through their {@link CatalogMember#serializers} property.
 * @type {Object}
 */
CswCatalogGroup.defaultSerializers = clone(CatalogGroup.defaultSerializers);

CswCatalogGroup.defaultSerializers.items = CatalogGroup.enabledShareableItemsSerializer;

/* Serializes a regex like /.foo/i into ".foo"  */
function regexSerializer (fieldName) {
    return function(cswGroup, json, propertyName, options) {
        if(defined(cswGroup[fieldName])) {
            json[fieldName] = cswGroup[fieldName].source;
        }
    };
}

CswCatalogGroup.defaultSerializers.wmsResourceFormat = regexSerializer('wmsResourceFormat');
CswCatalogGroup.defaultSerializers.kmlResourceFormat = regexSerializer('kmlResourceFormat');
CswCatalogGroup.defaultSerializers.csvResourceFormat = regexSerializer('csvResourceFormat');
CswCatalogGroup.defaultSerializers.esriMapServerResourceFormat = regexSerializer('esriMapServerResourceFormat');
CswCatalogGroup.defaultSerializers.geoJsonResourceFormat = regexSerializer('geoJsonResourceFormat');

freezeObject(CswCatalogGroup.defaultSerializers);

CswCatalogGroup.prototype._getValuesThatInfluenceLoad = function() {
    return [this.url, this.filterQuery, this.blacklist, this.filterByWmsGetCapabilities, this.minimumMaxScaleDenominator, this.allowEntireWmsServers, this.includeKml, this.includeWms, this.includeCsv, this.includeEsriMapServer];
};

var resourceFormats = [
    ['wmsResourceFormat',           'includeWms',           WebMapServiceCatalogItem],
    ['esriMapServerResourceFormat', 'includeEsriMapServer', ArcGisMapServerCatalogItem],
    ['kmlResourceFormat',           'includeKml',           KmlCatalogItem],
    ['geoJsonResourceFormat',       'includeGeoJson',       GeoJsonCatalogItem],
    ['csvResourceFormat',           'includeCsv',           CsvCatalogItem]
];

CswCatalogGroup.prototype._load = function() {
    var postDataTemplate = defaultValue(this.getRecordsTemplate, CswCatalogGroup.defaultGetRecordsTemplate);

    var that = this;
    var startPosition = 1;
    var lastPostData;

    function loadNextPage() {
        var postData = postDataTemplate.replace('{startPosition}', startPosition);

        // Don't page endlessly if there's no {startPosition} placeholder.
        if (postData === lastPostData) {
            return;
        }

        return loadWithXhr({
            url: cleanAndProxyUrl(that, that.url),
            responseType: 'document',
            method: 'POST',
            overrideMimeType: 'text/xml',
            data: postData,
            headers: {
                'Content-Type': 'application/xml'
            }
        }).then(function(xml) {
            if (!defined(xml)) {
                return;
            }

            var json = xml2json(xml);

            if (json.Exception) {
                var errorMessage = 'The CSW server reported an unknown error.';
                if (json.Exception.ExceptionText) {
                    errorMessage = 'The CSW server reported an error:\n\n' + json.Exception.ExceptionText;
                }
                throw new TerriaError({
                    sender: that,
                    title: that.name,
                    message: errorMessage
                });
            }

            var searchResults = json.SearchResults;
            if (!defined(searchResults) || !defined(searchResults.Record)) {
                return;
            }

            var records = searchResults.Record;
            if (!Array.isArray(records)) {
                records = [records];
            }

            for (var i = 0; i < records.length; ++i) {
                var record = records[i];
                var uris = record.URI || record.references;
                if (!defined(uris)) {
                    continue;
                }

                if (uris instanceof String || typeof uris === 'string') {
                    uris = [uris];
                }

                for (var j = 0; j < uris.length; ++j) {
                    var uri = uris[j];

                    var catalogItem = createItemForUri(that, record, uri);
                    if (defined(catalogItem)) {
                        that.add(catalogItem);
                    }

                }
            }

            var nextRecord = parseInt(searchResults.nextRecord, 10);
            if (nextRecord !== 0 && nextRecord < parseInt(searchResults.numberOfRecordsMatched, 10)) {
                startPosition = nextRecord;
                lastPostData = postData;
                return loadNextPage();
            }
        });
    }

    return loadNextPage().otherwise(function(e) {
        if (e instanceof TerriaError) {
            throw e;
        }
        throw new TerriaError({
            sender: that,
            title: that.name,
            message: '\
Couldn\'t execute GetRecords on this CSW server.<br/><br/>\
If you entered the URL manually, please double-check it.<br/><br/>\
If it\'s your server, make sure <a href="http://enable-cors.org/" target="_blank">CORS</a> is enabled.<br/><br/>\
Otherwise, if reloading doesn\'t fix it, please report the problem by sending an email to <a href="mailto:'+that.terria.supportEmail+'">'+that.terria.supportEmail+'</a> with the technical details below.  Thank you!<br/><br/>\
<pre>' + formatError(e) + '</pre>'
        });
    });
};

function createItemForUri(catalogGroup, record, uri) {
    var layerName;
    if (defined(uri.name)) {
        layerName = uri.name;
    }

    var catalogItem;
    resourceFormats.forEach(function(f) {
        if (!defined(catalogItem) && (uri.protocol || uri.scheme).match(catalogGroup[f[0]]) && catalogGroup[f[1]]) {
            if (f[2] === WebMapServiceCatalogItem && !defined(layerName)) {
                catalogItem = new WebMapServiceCatalogGroup(catalogGroup.terria);
            } else {
                catalogItem = new f[2](catalogGroup.terria);
            }
        }
    });

    if (defined(catalogItem)) {
        catalogItem.name = record.title;
        catalogItem.description = record.description;
        catalogItem.url = uri.toString();

        if (catalogItem.hasOwnProperty('layers') && defined(layerName)) {
            catalogItem.layers = layerName;
        }
    }

    return catalogItem;
}

function cleanAndProxyUrl(catalogGroup, url) {
    return proxyCatalogItemUrl(catalogGroup, cleanUrl(url), '1d');
}

function cleanUrl(url) {
    // Strip off the search portion of the URL
    var uri = new URI(url);
    uri.search('');
    return uri.toString();
}

module.exports = CswCatalogGroup;
