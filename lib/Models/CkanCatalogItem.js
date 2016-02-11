'use strict';

/*global require*/
var ArcGisMapServerCatalogItem = require('./ArcGisMapServerCatalogItem');
var CatalogItem = require('./CatalogItem');
var CsvCatalogItem = require('./CsvCatalogItem');
var CzmlCatalogItem = require('./CzmlCatalogItem');
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var GeoJsonCatalogItem = require('./GeoJsonCatalogItem');
var inherit = require('../Core/inherit');
var KmlCatalogItem = require('./KmlCatalogItem');
var loadJson = require('terriajs-cesium/Source/Core/loadJson');
var Metadata = require('./Metadata');
var TerriaError = require('../Core/TerriaError');
var proxyCatalogItemUrl = require('./proxyCatalogItemUrl');
var Rectangle = require('terriajs-cesium/Source/Core/Rectangle');
var URI = require('urijs');
var WebMapServiceCatalogGroup = require('./WebMapServiceCatalogGroup');
var WebMapServiceCatalogItem = require('./WebMapServiceCatalogItem');

function CkanCatalogItem(terria) {
    CatalogItem.call(this, terria);
}

inherit(CatalogItem, CkanCatalogItem);

defineProperties(CkanCatalogItem.prototype, {
    /**
     * Gets the type of data member represented by this instance.
     * @memberOf CkanCatalogItem.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return 'ckan-resource';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, 'CKAN Resource'.
     * @memberOf CkanCatalogItem.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'CKAN Resource';
        }
    },

    /**
     * Gets the metadata associated with this data source and the server that provided it, if applicable.
     * @memberOf CkanCatalogItem.prototype
     * @type {Metadata}
     */
    metadata : {
        get : function() {
            // TODO: maybe return the FeatureCollection's properties?
            var result = new Metadata();
            result.isLoading = false;
            result.dataSourceErrorMessage = 'This data source does not have any details available.';
            result.serviceErrorMessage = 'This service does not have any details available.';
            return result;
        }
    }
});

/**
 * Creates a catalog item from a CKAN resource.
 *
 * @param {Terria} options.terria The Terria instance.
 * @param {Object} options.resource The CKAN resource JSON.
 * @param {Object} options.itemData The CKAN dataset JSON.
 * @param {String} options.ckanBaseUrl The base URL of the CKAN server.
 * @param {Object} [options.extras] The parsed version of `options.itemData`, if available.  If not provided, it will be parsed as needed.
 * @param {String} [options.parent] The parent of this catalog item.
 * @param {RegExp} [options.wmsResourceFormat] A regular expression that, when it matches a resource's format, indicates that the resource
 *                                             is a WMS resource.  If undefined, WMS resources will not be returned.
 * @param {RegExp} [options.esriMapServerResourceFormat] A regular expression that, when it matches a resource's format, indicates that the resource
 *                                                       is an Esri MapServer resource.  If undefined, Esri MapServer resources will not be returned.
 * @param {RegExp} [options.kmlResourceFormat] A regular expression that, when it matches a resource's format, indicates that the resource
 *                                             is a KML resource.  If undefined, KML resources will not be returned.
 * @param {RegExp} [options.geoJsonResourceFormat] A regular expression that, when it matches a resource's format, indicates that the resource
 *                                                 is a GeoJSON resource.  If undefined, GeoJSON resources will not be returned.
 * @param {RegExp} [options.csvResourceFormat] A regular expression that, when it matches a resource's format, indicates that the resource
 *                                             is a CSV resource.  If undefined, CSV resources will not be returned.
 * @param {RegExp} [options.czmlResourceFormat] A regular expression that, when it matches a resource's format, indicates that the resource
 *                                              is a CZML resource.  If undefined, CZML resources will not be returned.
 * @param {Boolean} [options.allowGroups=false] True to allow this function to return groups in addition to items.  For example if the resource
 *                                              refers to a WMS server but no layer is available, a {@see WebMapServiceCatalogGroup} for the
 *                                              server will be returned.
 * @param {Boolean} [options.useResourceName=false] True to use the name of the resource for the name of the catalog item; false to use the
 *                                                  name of the dataset.
 * @param {String} [options.dataCustodian] The data custodian to use, overriding any that might be inferred from the CKAN dataset.
 * @param {Object} [options.itemProperties] Additional properties to apply to the item once created.
 * @return {CatalogMember} The created catalog member, or undefined if no catalog member could be created from the resource.
 */
CkanCatalogItem.createItemFromResource = function(options) {
    var resource = options.resource;
    var itemData = options.itemData;
    var extras = options.extras;
    var parent = options.parent;

    if (resource.__filtered) {
        return;
    }

    if (!defined(extras)) {
        extras = {};
        if (defined(itemData.extras)) {
            for (var idx = 0; idx < itemData.extras.length; idx++) {
                extras[itemData.extras[idx].key] = itemData.extras[idx].value;
            }
        }
    }

    var formats = [
        [options.wmsResourceFormat, WebMapServiceCatalogItem],
        [options.esriMapServerResourceFormat, ArcGisMapServerCatalogItem],
        [options.kmlResourceFormat, KmlCatalogItem],
        [options.geoJsonResourceFormat, GeoJsonCatalogItem],
        [options.czmlResourceFormat, CzmlCatalogItem],
        [options.csvResourceFormat, CsvCatalogItem]
    ].filter(function(format) {
        return defined(format[0]);
    });

    var matchingFormats = formats.filter(function(format) { return resource.format.match(format[0]); });
    if (matchingFormats.length === 0) {
        return undefined;
    }

    var isWms = matchingFormats[0][1] === WebMapServiceCatalogItem;

    var baseUrl = resource.wms_url;
    if (!defined(baseUrl)) {
        baseUrl = resource.url;
        if (!defined(baseUrl)) {
            return undefined;
        }
    }

    // Extract the layer name from the URL.
    var uri = new URI(baseUrl);
    var params = uri.search(true);

    // Remove the query portion of the WMS URL.
    var url = baseUrl;

    var newItem;
    if (isWms) {
        var layerName = resource.wms_layer || params.LAYERS || params.layers || params.typeName;
        if (defined(layerName)) {
            newItem = new WebMapServiceCatalogItem(options.terria);
            newItem.layers = layerName;
        } else {
            if (!options.allowGroups) {
                return undefined;
            }
            newItem = new WebMapServiceCatalogGroup(options.terria);
        }
        uri.search('');
        url = uri.toString();
    } else {
        newItem = new matchingFormats[0][1](options.terria);
    }
    if (!newItem) {
        return;
    }

    if (options.useResourceName) {
        newItem.name = resource.name;
    } else {
        newItem.name = itemData.title;
    }


    var textDescription = '';

    if (itemData.notes) {
        textDescription = itemData.notes;
    }

    if (itemData.license_url && (itemData.notes === null || itemData.notes.indexOf('[Licence]') === -1)) {
        textDescription += '\n\n[Licence](' + itemData.license_url + ')';
    }

    newItem.info.push({
        name: 'Dataset Description',
        content: textDescription
    });

    if (defined(resource.description)) {
        newItem.info.push({
            name: 'Resource Description',
            content: resource.description
        });
    }

    newItem.url = url;

    var bboxString = itemData.geo_coverage || extras.geo_coverage;
    if (defined(bboxString)) {
        var parts = bboxString.split(',');
        if (parts.length === 4) {
            newItem.rectangle = Rectangle.fromDegrees(parts[0], parts[1], parts[2], parts[3]);
        }
    }
    newItem.dataUrl = options.ckanBaseUrl + '/dataset/' + itemData.name;
    newItem.dataUrlType = 'direct';

    if (defined(options.dataCustodian)) {
        newItem.dataCustodian = options.dataCustodian;
    } else if (itemData.organization && itemData.organization.title) {
        newItem.dataCustodian = itemData.organization.description || itemData.organization.title;
    }

    if (typeof(options.itemProperties) === 'object') {
        newItem.updateFromJson(options.itemProperties);
    }

    if (defined(parent)) {
        newItem.id = parent.uniqueId + '/' + resource.id;
    }

    return newItem;
};

CkanCatalogItem.prototype._load = function() {
    var url = proxyCatalogItemUrl(this, this.url, '1d');

    var that = this;
    return loadJson(url).then(function(json) {
        if (!json.success) {
            throw new TerriaError({
                sender: that,
                title: 'Error retrieving CKAN URL',
                message: 'Could not retrieve URL as JSON: ' + that.url + '.',
            });
        }

        var resources = json.result.resources;

        for (var i = 0; i < resources.length; ++i) {
            var catalogItem = CkanCatalogItem.createItemFromResource({
                terria: that.terria,
                resource: resources[i],
                itemData: json.result,
                ckanBaseUrl: 'http://data.gov.au', // TODO
                wmsResourceFormat: /^wms$/i,
                kmlResourceFormat: /^kml$/i,
                csvResourceFormat: /^csv-geo-/i,
                esriMapServerResourceFormat: /^esri rest$/i,
                geoJsonResourceFormat: /^geojson$/i,
                czmlResourceFormat: /^czml$/i,
                useResourceName: false, // TODO
                dataCustodian: that.dataCustodian,
                itemProperties: that.itemProperties
            });
            if (defined(catalogItem)) {
                catalogItem.name = that.name;
                return catalogItem;
            }
        }

        return undefined;
    });
};

module.exports = CkanCatalogItem;
