'use strict';

/*global require*/
var URI = require('URIjs');

var clone = require('terriajs-cesium/Source/Core/clone');
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var formatError = require('terriajs-cesium/Source/Core/formatError');
var freezeObject = require('terriajs-cesium/Source/Core/freezeObject');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var loadJson = require('terriajs-cesium/Source/Core/loadJson');
var loadText = require('terriajs-cesium/Source/Core/loadText');
var loadXml = require('terriajs-cesium/Source/Core/loadXml');
var Rectangle = require('terriajs-cesium/Source/Core/Rectangle');
var when = require('terriajs-cesium/Source/ThirdParty/when');

var xml2json = require('../ThirdParty/xml2json');

var inherit = require('../Core/inherit');
var KmlCatalogItem = require('./KmlCatalogItem');
var WebMapServiceCatalogGroup = require('./WebMapServiceCatalogGroup');
var WebMapServiceCatalogItem = require('./WebMapServiceCatalogItem');
var corsProxy = require('../Core/corsProxy');
var CsvCatalogItem = require('./CsvCatalogItem');
var CatalogGroup = require('./CatalogGroup');
var GeoJsonCatalogItem = require('./GeoJsonCatalogItem');
var ArcGisMapServerCatalogItem = require('./ArcGisMapServerCatalogItem');
var ModelError = require('./ModelError');

/**
 * A {@link CatalogGroup} representing a collection of files scraped from any web page. This is primarily intended as a quick
 * way to visualise a directory of files exposed through a web server that allows listing  directories. However it can also be
 * used to harvest data from any web page, with a few fairly major limitations:
 *
 * * The server must support CORS (or be added to the proxy whitelist)
 * * Only .csv, .kml, .kmz, .geojson files are supported. (Most major spatial sources are ESRI shapefile or MapInfo)
 * * Large files will fail with very poor user feedback.
 * * Sometimes GeoJSON files have the extension .json, which makes detecting them unreliable.
 *
 * @alias HtmlCatalogGroup
 * @constructor
 * @extends CatalogGroup
 *
 * @param {Terria} terria The Terria instance.
 */
var HtmlCatalogGroup = function(terria) {
    CatalogGroup.call(this, terria, 'html');

    /**
     * Gets or sets the URL of a web page containing links to supported file types. This property is observable.
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
     * Gets or sets an array of regular expressions against which each link target will be tested. For example, to
     * only include links to .geojson files, set this to ['\\.geojson$']
     * This property is observable.
     * @type {String[]}
     */
    this.filterQuery = ['\\.(geojson|csv|kml|kmz)$'];

    /**
     * Gets or sets a hash of names of blacklisted groups and data sources.  A group or data source that appears in this hash
     * will not be shown to the user.  In this hash, the keys should be the names of the groups and data sources to blacklist,
     * and the values should be "true".  This property is observable.
     * @type {Object}
     */
    this.blacklist = undefined;

    /* Could be complicated - maybe group by type, or by containing HTML element? 
    this.groupBy = 'group'; */

    /**
     * True to allow KML resources to be added to the catalog; otherwise, false.
     * @type {Boolean}
     * @default false
     */
    this.includeKml = true;

    /**
     * Gets or sets a regular expression that, when it matches a link target, indicates that link points to a KML file.
     * @type {RegExp}
     */
    this.kmlLinkPattern = /(\.kml|\.kmz)\b/i;

    /**
     * True to allow CSV resources to be added to the catalog; otherwise, false.
     * @type {Boolean}
     */
    this.includeCsv = true;

    /**
     * Gets or sets a regular expression that, when it matches a link target, indicates that link points to a CSV file.
     * @type {RegExp}
     */
    this.csvLinkPattern = /\.csv\b/i;

    /**
     * True to allow ESRI Map resources to be added to the catalog; otherwise, false.
     * @type {Boolean}
     * @default false
     */
    this.includeEsriMapServer = true;

    /**
     * Gets or sets a regular expression that, when it matches a link target, indicates that link points to an ESRI server.
     * @type {RegExp}
     */
    this.esriMapServerLinkPattern = /\/rest\//i; //### who knows

    /**
     * True to allow GeoJSON resources to be added to the catalog; otherwise, false.
     * @type {Boolean}
     * @default false
     */
    this.includeGeoJson = true;

    /**
     * Gets or sets a regular expression that, when it matches a link target, indicates that link points to a GeoJSON file.
     * @type {RegExp}
     */
    this.geoJsonLinkPattern = /(\.geojson|\.json)\b/i;

    // ## why don't we include the other properties?
    knockout.track(this, ['url', 'dataCustodian', 'filterQuery', 'blacklist', 'includeKml', 'includeCsv', 'includeEsriMapServer', 'includeGeoJson']);
};

inherit(CatalogGroup, HtmlCatalogGroup);

defineProperties(HtmlCatalogGroup.prototype, {
    /**
     * Gets the type of data member represented by this instance.
     * @memberOf HtmlCatalogGroup.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return 'html';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, such as 'Web Map Service (WMS)'.
     * @memberOf HtmlCatalogGroup.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'HTML listing';
        }
    },

    /**
     * Gets the set of functions used to update individual properties in {@link CatalogMember#updateFromJson}.
     * When a property name in the returned object literal matches the name of a property on this instance, the value
     * will be called as a function and passed a reference to this instance, a reference to the source JSON object
     * literal, and the name of the property.
     * @memberOf HtmlCatalogGroup.prototype
     * @type {Object}
     */
    updaters : {
        get : function() {
            return HtmlCatalogGroup.defaultUpdaters;
        }
    },

    /**
     * Gets the set of functions used to serialize individual properties in {@link CatalogMember#serializeToJson}.
     * When a property name on the model matches the name of a property in the serializers object lieral,
     * the value will be called as a function and passed a reference to the model, a reference to the destination
     * JSON object literal, and the name of the property.
     * @memberOf HtmlCatalogGroup.prototype
     * @type {Object}
     */
    serializers : {
        get : function() {
            return HtmlCatalogGroup.defaultSerializers;
        }
    }
});

/**
 * Gets or sets the set of default updater functions to use in {@link CatalogMember#updateFromJson}.  Types derived from this type
 * should expose this instance - cloned and modified if necesary - through their {@link CatalogMember#updaters} property.
 * @type {Object}
 */
HtmlCatalogGroup.defaultUpdaters = clone(CatalogGroup.defaultUpdaters);

/* Deserializes a regex like ".foo" into a case-insensitive regex /.foo/i  */
function regexDeserializer(fieldName) {
    return function(catalogGroup, json, propertyName, options) {
        if (defined(json[fieldName])) {
            catalogGroup[fieldName] = new RegExp(json[fieldName], 'i');
        }
    };
}

HtmlCatalogGroup.defaultUpdaters.kmlLinkPattern = regexDeserializer('kmlLinkPattern');
HtmlCatalogGroup.defaultUpdaters.csvLinkPattern = regexDeserializer('csvLinkPattern');
HtmlCatalogGroup.defaultUpdaters.esriMapServerLinkPattern = regexDeserializer('esriMapServerLinkPattern');
HtmlCatalogGroup.defaultUpdaters.geoJsonLinkPattern = regexDeserializer('geoJsonLinkPattern');


freezeObject(HtmlCatalogGroup.defaultUpdaters);

/**
 * Gets or sets the set of default serializer functions to use in {@link CatalogMember#serializeToJson}.  Types derived from this type
 * should expose this instance - cloned and modified if necesary - through their {@link CatalogMember#serializers} property.
 * @type {Object}
 */
HtmlCatalogGroup.defaultSerializers = clone(CatalogGroup.defaultSerializers);


HtmlCatalogGroup.defaultSerializers.isLoading = function(htmlGroup, json, propertyName, options) {};


/* Serializes a regex like /.foo/i into ".foo"  */
function regexSerializer (fieldName) {
    return function(htmlGroup, json, propertyName, options) {
        if(defined(htmlGroup[fieldName])) {
            json[fieldName] = htmlGroup[fieldName].source;
        }
    };
}

HtmlCatalogGroup.defaultSerializers.kmlLinkPattern = regexSerializer('kmlLinkPattern');
HtmlCatalogGroup.defaultSerializers.csvLinkPattern = regexSerializer('csvLinkPattern');
HtmlCatalogGroup.defaultSerializers.esriMapServerLinkPattern = regexSerializer('esriMapServerLinkPattern');
HtmlCatalogGroup.defaultSerializers.geoJsonLinkPattern = regexSerializer('geoJsonLinkPattern');


freezeObject(HtmlCatalogGroup.defaultSerializers);

HtmlCatalogGroup.prototype._getValuesThatInfluenceLoad = function() {
    return [this.url, this.filterQuery, this.blacklist, this.includeKml, this.includeWms, this.includeCsv, this.includeEsriMapServer];
};

function itemFromLink(link, h) {
    var linkPatterns = 
        [[ h.esriMapServerLinkPattern, h.includeEsriMapServer, ArcGisMapServerCatalogItem ],
        [ h.kmlLinkPattern,            h.includeKml,           KmlCatalogItem],
        [ h.geoJsonLinkPattern,        h.includeGeoJson,       GeoJsonCatalogItem],
        [ h.csvLinkPattern,            h.includeCsv,           CsvCatalogItem]];

    var newItem;
    linkPatterns.forEach(function(f) {
        if (link.href.match(f[0]) && f[1]) {
            newItem = new f[2](h.terria);
        }
    });

    // TODO handle directories

    if (!newItem) {
        return undefined;
    }
    
    if (link.origin === document.origin) {
        // a relative link that has been reinterpreted relative to *this* page
        // There's probably a properer way of doing this by setting the origin of the document with <base> or something.
        link.href = link.href.replace(link.origin, h.url.replace(/\/$/, ''));
    }
    newItem.url = link.href;
    newItem.name = link.innerText;
    return newItem;

}

HtmlCatalogGroup.prototype._load = function() {
    if (!defined(this.url) || this.url.length === 0) {
        return undefined;
    }

    var that = this;

    return loadText(proxy(this.terria, this.url))
        .then(function(xml) {
            var el = document.createElement( 'html' );
            el.innerHTML = xml;

            var links = el.getElementsByTagName( 'a' );
            var i;
            // this array isn't an Array?
            for (i=0; i < links.length; i++) { 
                var newItem = itemFromLink(links[i], that);
                if (newItem) {
                    that.add(newItem);
                }
            };
        }).otherwise(function(e) {
                throw new ModelError({
                    sender: that,
                    title: that.name,
                    message: '\
        Couldn\'t load spatial files from this web page.<br/><br/>\
        If you entered the URL manually, please double-check it.<br/><br/>\
        If it\'s your server, make sure <a href="http://enable-cors.org/" target="_blank">CORS</a> is enabled.<br/><br/>\
        Otherwise, if reloading doesn\'t fix it, please report the problem by sending an email to <a href="mailto:'+that.terria.supportEmail+'">'+that.terria.supportEmail+'</a> with the technical details below.  Thank you!<br/><br/>\
        <pre>' + formatError(e) + '</pre>'
                });
            });
    }


function proxy(terria, url) {
    if (defined(terria.corsProxy) && terria.corsProxy.shouldUseProxy(url)) {
        return terria.corsProxy.getURL(url, '1d');
    }
    return url;
}

module.exports = HtmlCatalogGroup;
