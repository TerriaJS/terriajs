'use strict';

/*global require*/
var URI = require('urijs');

var clone = require('terriajs-cesium/Source/Core/clone');
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var formatError = require('terriajs-cesium/Source/Core/formatError');
var freezeObject = require('terriajs-cesium/Source/Core/freezeObject');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var loadJson = require('terriajs-cesium/Source/Core/loadJson');
var loadText = require('terriajs-cesium/Source/Core/loadText');
var Rectangle = require('terriajs-cesium/Source/Core/Rectangle');
var when = require('terriajs-cesium/Source/ThirdParty/when');

var ArcGisMapServerCatalogItem = require('./ArcGisMapServerCatalogItem');
var corsProxy = require('../Core/corsProxy');
var CsvCatalogItem = require('./CsvCatalogItem');
var TerriaError = require('../Core/TerriaError');
var CatalogGroup = require('./CatalogGroup');
var GeoJsonCatalogItem = require('./GeoJsonCatalogItem');
var inherit = require('../Core/inherit');
var KmlCatalogItem = require('./KmlCatalogItem');
var CzmlCatalogItem = require('./CzmlCatalogItem');
var proxyCatalogItemUrl = require('./proxyCatalogItemUrl');
var WebMapServiceCatalogGroup = require('./WebMapServiceCatalogGroup');
var WebMapServiceCatalogItem = require('./WebMapServiceCatalogItem');
var xml2json = require('../ThirdParty/xml2json');

/**
 * A {@link CatalogGroup} representing a collection of layers from a [CKAN](http://ckan.org) server.
 *
 * @alias CkanCatalogGroup
 * @constructor
 * @extends CatalogGroup
 *
 * @param {Terria} terria The Terria instance.
 */
var CkanCatalogGroup = function(terria) {
    CatalogGroup.call(this, terria, 'ckan');

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
     * Gets or sets the filter query to pass to CKAN when querying the available data sources and their groups.  Each string in the
     * array is passed to CKAN as an independent search string and the results are concatenated to create the complete list.  The
     * search string is equivlent to what would be in the parameters segment of the url calling the CKAN search api.
     * See the [Solr documentation](http://wiki.apache.org/solr/CommonQueryParameters#fq) for information about filter queries.
     *   To get all the datasets with wms resources the query array would be ['fq=res_format%3awms']
     *   To get all the datasets in the Surface Water group it would be ['q=groups%3dSurface%20Water&fq=res_format%3aWMS']
     *   And to get both wms and esri-mapService datasets it would be ['q=res_format:WMS', 'q=res_format:%22Esri%20REST%22' ]
     * This property is observable.
     * @type {String[]}
     * @editoritemstitle Filter
     */
    this.filterQuery = undefined;

    /**
     * Gets or sets a hash of names of blacklisted groups and data sources.  A group or data source that appears in this hash
     * will not be shown to the user.  In this hash, the keys should be the names of the groups and data sources to blacklist,
     * and the values should be "true".  This property is observable.
     * @type {Object}
     */
    this.blacklist = undefined;

    /**
     * Gets or sets a value indicating whether the CKAN datasets should be filtered by querying GetCapabilities from each
     * referenced WMS server and excluding datasets not found therein.  This property is observable.
     * @type {Boolean}
     */
    this.filterByWmsGetCapabilities = false;

    /**
     * Gets or sets the minimum MaxScaleDenominator that is allowed for a WMS dataset to be included in this CKAN group.
     * If this property is undefined or if {@link CkanCatalogGroup#filterByWmsGetCapabilities} is false, no
     * filtering based on MaxScaleDenominator is performed.  This property is observable.
     * @type {Number}
     */
    this.minimumMaxScaleDenominator = undefined;

    /**
     * Gets or sets any extra wms parameters that should be added to the wms query urls in this CKAN group.
     * If this property is undefined then no extra parameters are added.
     * This property is observable.
     * @type {Object}
     */
    this.wmsParameters = undefined;

    /**
     * Gets or sets a value indicating how datasets should be grouped.  Valid values are:
     * * `none` - Datasets are put in a flat list; they are not grouped at all.
     * * `group` - Datasets are grouped according to their CKAN group.  Datasets that are not in any groups are put at the top level.
     * * `organization` - Datasets are grouped by their CKAN organization.  Datasets that are not associated with an organization are put at the top level.
     * @type {String}
     */
    this.groupBy = 'group';

    /**
     * Gets or sets a value indicating whether each catalog item's name should be populated from
     * individual resources instead of from the CKAN dataset.
     * @type {Boolean}
     */
    this.useResourceName = false;

    /**
     * True to allow entire WMS servers (that is, WMS resources without a clearly-defined layer) to be
     * added to the catalog; otherwise, false.
     * @type {Boolean}
     * @default false
     */
    this.allowEntireWmsServers = false;

    /**
     * True to allow WMS resources to be added to the catalog; otherwise, false.
     * @type {Boolean}
     * @default true
     */
    this.includeWms = true;

    /**
     * Gets or sets a regular expression that, when it matches a resource's format, indicates that the resource is a WMS resource.
     * @type {RegExp}
     */
    this.wmsResourceFormat = /^wms$/i;

    /**
     * True to allow KML resources to be added to the catalog; otherwise, false.
     * @type {Boolean}
     * @default false
     */
    this.includeKml = false;

    /**
     * Gets or sets a regular expression that, when it matches a resource's format, indicates that the resource is a KML resource.
     * @type {RegExp}
     */
    this.kmlResourceFormat = /^kml$/i;

    /**
     * True to allow CSV resources to be added to the catalog; otherwise, false.
     * @type {Boolean}
     */
    this.includeCsv = false;

    /**
     * Gets or sets a regular expression that, when it matches a resource's format, indicates that the resource is a CSV resource.
     * @type {RegExp}
     */
    this.csvResourceFormat = /^csv-geo-/i;

    /**
     * True to allow ESRI Map resources to be added to the catalog; otherwise, false.
     * @type {Boolean}
     * @default false
     */
    this.includeEsriMapServer = false;

    /**
     * Gets or sets a regular expression that, when it matches a resource's format, indicates that the resource is an Esri MapServer resource.
     * @type {RegExp}
     */
    this.esriMapServerResourceFormat = /^esri rest$/i;

    /**
     * True to allow GeoJSON resources to be added to the catalog; otherwise, false.
     * @type {Boolean}
     * @default false
     */
    this.includeGeoJson = false;

    /**
     * Gets or sets a regular expression that, when it matches a resource's format, indicates that the resource is a GeoJSON resource.
     * @type {RegExp}
     */
    this.geoJsonResourceFormat = /^geojson$/i;

    /**
     * True to allow CZML resources to be added to the catalog; otherwise, false.
     * @type {Boolean}
     * @default false
     */
    this.includeCzml = false;

    /**
     * Gets or sets a regular expression that, when it matches a resource's format, indicates that the resource is a CZML resource.
     * @type {RegExp}
     */
    this.czmlResourceFormat = /^czml$/i;

    /**
     * Gets or sets a hash of properties that will be set on each child item.
     * For example, { 'treat404AsError': false }
     */
    this.itemProperties = undefined;

    knockout.track(this, ['url', 'dataCustodian', 'filterQuery', 'blacklist', 'wmsParameters', 'groupBy', 'useResourceName', 'allowEntireWmsServers', 'includeWms', 'includeKml', 'includeCsv', 'includeEsriMapServer', 'includeGeoJson', 'includeCzml', 'itemProperties']);
};

inherit(CatalogGroup, CkanCatalogGroup);

defineProperties(CkanCatalogGroup.prototype, {
    /**
     * Gets the type of data member represented by this instance.
     * @memberOf CkanCatalogGroup.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return 'ckan';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, such as 'Web Map Service (WMS)'.
     * @memberOf CkanCatalogGroup.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'CKAN Server';
        }
    },

    /**
     * Gets the set of functions used to update individual properties in {@link CatalogMember#updateFromJson}.
     * When a property name in the returned object literal matches the name of a property on this instance, the value
     * will be called as a function and passed a reference to this instance, a reference to the source JSON object
     * literal, and the name of the property.
     * @memberOf CkanCatalogGroup.prototype
     * @type {Object}
     */
    updaters : {
        get : function() {
            return CkanCatalogGroup.defaultUpdaters;
        }
    },

    /**
     * Gets the set of functions used to serialize individual properties in {@link CatalogMember#serializeToJson}.
     * When a property name on the model matches the name of a property in the serializers object lieral,
     * the value will be called as a function and passed a reference to the model, a reference to the destination
     * JSON object literal, and the name of the property.
     * @memberOf CkanCatalogGroup.prototype
     * @type {Object}
     */
    serializers : {
        get : function() {
            return CkanCatalogGroup.defaultSerializers;
        }
    }
});

/**
 * Gets or sets the set of default updater functions to use in {@link CatalogMember#updateFromJson}.  Types derived from this type
 * should expose this instance - cloned and modified if necesary - through their {@link CatalogMember#updaters} property.
 * @type {Object}
 */
CkanCatalogGroup.defaultUpdaters = clone(CatalogGroup.defaultUpdaters);

/* Deserializes a regex like ".foo" into a case-insensitive regex /.foo/i  */
function regexDeserializer(fieldName) {
    return function(catalogGroup, json, propertyName, options) {
        if (defined(json[fieldName])) {
            catalogGroup[fieldName] = new RegExp(json[fieldName], 'i');
        }
    };
}

CkanCatalogGroup.defaultUpdaters.wmsResourceFormat = regexDeserializer('wmsResourceFormat');
CkanCatalogGroup.defaultUpdaters.kmlResourceFormat = regexDeserializer('kmlResourceFormat');
CkanCatalogGroup.defaultUpdaters.csvResourceFormat = regexDeserializer('csvResourceFormat');
CkanCatalogGroup.defaultUpdaters.esriMapServerResourceFormat = regexDeserializer('esriMapServerResourceFormat');
CkanCatalogGroup.defaultUpdaters.geoJsonResourceFormat = regexDeserializer('geoJsonResourceFormat');
CkanCatalogGroup.defaultUpdaters.czmlResourceFormat = regexDeserializer('czmlResourceFormat');

freezeObject(CkanCatalogGroup.defaultUpdaters);

/**
 * Gets or sets the set of default serializer functions to use in {@link CatalogMember#serializeToJson}.  Types derived from this type
 * should expose this instance - cloned and modified if necesary - through their {@link CatalogMember#serializers} property.
 * @type {Object}
 */
CkanCatalogGroup.defaultSerializers = clone(CatalogGroup.defaultSerializers);

CkanCatalogGroup.defaultSerializers.items = CatalogGroup.enabledShareableItemsSerializer;

/* Serializes a regex like /.foo/i into ".foo"  */
function regexSerializer (fieldName) {
    return function(ckanGroup, json, propertyName, options) {
        if(defined(ckanGroup[fieldName])) {
            json[fieldName] = ckanGroup[fieldName].source;
        }
    };
}

CkanCatalogGroup.defaultSerializers.wmsResourceFormat = regexSerializer('wmsResourceFormat');
CkanCatalogGroup.defaultSerializers.kmlResourceFormat = regexSerializer('kmlResourceFormat');
CkanCatalogGroup.defaultSerializers.csvResourceFormat = regexSerializer('csvResourceFormat');
CkanCatalogGroup.defaultSerializers.esriMapServerResourceFormat = regexSerializer('esriMapServerResourceFormat');
CkanCatalogGroup.defaultSerializers.geoJsonResourceFormat = regexSerializer('geoJsonResourceFormat');
CkanCatalogGroup.defaultSerializers.czmlResourceFormat = regexSerializer('czmlResourceFormat');

freezeObject(CkanCatalogGroup.defaultSerializers);

CkanCatalogGroup.prototype._getValuesThatInfluenceLoad = function() {
    return [this.url, this.filterQuery, this.blacklist, this.filterByWmsGetCapabilities, this.minimumMaxScaleDenominator, this.allowEntireWmsServers, this.includeKml, this.includeWms, this.includeCsv, this.includeEsriMapServer, this.includeGeoJson, this.includeCzml];
};

CkanCatalogGroup.prototype._load = function() {
    if (!defined(this.url) || this.url.length === 0) {
        return undefined;
    }

    var that = this;

    var promises = [];
    for (var i = 0; i < this.filterQuery.length; i++) {
        var url = new URI(this.url)
            .segment('api/3/action/package_search')
            .addQuery({ rows: 100000 })
            .toString();
        url += '&' + this.filterQuery[i]; // filterQuery[i] is expected to be aleady URL-encoded and begin with a query like 'fq='
        var promise = loadJson(proxyCatalogItemUrl(this, url, '1d'));

        promises.push(promise);
    }

    return when.all(promises).then( function(queryResults) {
        if (!defined(queryResults)) {
            return;
        }
        var allResults = queryResults[0];
        for (var p = 1; p < queryResults.length; p++) {
            allResults.result.results = allResults.result.results.concat(queryResults[p].result.results);
        }

        if (that.filterByWmsGetCapabilities) {
            return when(filterResultsByGetCapabilities(that, allResults), function() {
                populateGroupFromResults(that, allResults);
            });
        } else {
            populateGroupFromResults(that, allResults);
        }
    }).otherwise(function(e) {
        throw new TerriaError({
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

function filterResultsByGetCapabilities(ckanGroup, json) {
    var wmsServers = {};

    var items = json.result.results;
    for (var itemIndex = 0; itemIndex < items.length; ++itemIndex) {
        var item = items[itemIndex];

        var resources = item.resources;
        for (var resourceIndex = 0; resourceIndex < resources.length; ++resourceIndex) {
            var resource = resources[resourceIndex];
            if (!resource.format.match(ckanGroup.wmsResourceFormat)) {
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
            var url = uri.toString();

            if (!defined(wmsServers[url])) {
                wmsServers[url] = {};
            }

            wmsServers[url][layerName] = resource;
        }
    }

    var promises = [];

    for (var wmsServer in wmsServers) {
        if (wmsServers.hasOwnProperty(wmsServer)) {
            var getCapabilitiesUrl = wmsServer + '?service=WMS&request=GetCapabilities';
            if (corsProxy.shouldUseProxy(getCapabilitiesUrl)) {
                getCapabilitiesUrl = corsProxy.getURL(getCapabilitiesUrl, '1d');
            }

            promises.push(filterBasedOnGetCapabilities(ckanGroup, getCapabilitiesUrl, wmsServers[wmsServer]));
        }
    }

    return when.all(promises);
}

function filterBasedOnGetCapabilities(ckanGroup, getCapabilitiesUrl, resources) {
    // Initially assume all resources will be filtered.
    for (var name in resources) {
        if (resources.hasOwnProperty(name)) {
            resources[name].__filtered = true;
        }
    }

    return loadText(getCapabilitiesUrl).then(function(getCapabilitiesXml) {
        var getCapabilitiesJson = xml2json(getCapabilitiesXml);
        filterBasedOnGetCapabilitiesResponse(ckanGroup, getCapabilitiesJson.Capability.Layer, resources);
    }).otherwise(function() {
        // Do nothing - all resources will be filtered.
    });
}

function filterBasedOnGetCapabilitiesResponse(ckanGroup, wmsLayersSource, resources) {
    if (defined(wmsLayersSource) && !(wmsLayersSource instanceof Array)) {
        wmsLayersSource = [wmsLayersSource];
    }

    for (var i = 0; i < wmsLayersSource.length; ++i) {
        var layerSource = wmsLayersSource[i];

        if (layerSource.Name) {
            var resource = resources[layerSource.Name];
            if (resource) {
                if (!defined(ckanGroup.minimumMaxScaleDenominator) || !defined(layerSource.MaxScaleDenominator) || layerSource.MaxScaleDenominator >= ckanGroup.minimumMaxScaleDenominator) {
                    resource.__filtered = false;
                }
                else {
                    console.log('Provider Feedback: Filtering out ' + layerSource.Title + ' (' + layerSource.Name + ') because its MaxScaleDenominator is ' + layerSource.MaxScaleDenominator);
                }
            }
        }

        if (layerSource.Layer) {
            filterBasedOnGetCapabilitiesResponse(ckanGroup, layerSource.Layer, resources);
        }
    }
}

function createItemFromResource(resource, ckanGroup, itemData, extras, parent) {
    return CkanCatalogItem.createCatalogItemFromResource({
        itemData: itemData,
        resource: resource,
        extras: extras,
        parent: parent,
        wmsResourceFormat: ckanGroup.includeWms ? ckanGroup.wmsResourceFormat : undefined,
        esriMapServerResourceFormat: ckanGroup.includeEsriMapServer ? ckanGroup.esriMapServerResourceFormat : undefined,
        kmlResourceFormat: ckanGroup.includeKml ? ckanGroup.kmlResourceFormat : undefined,
        geoJsonResourceFormat: ckanGroup.includeGeoJson ? ckanGroup.geoJsonResourceFormat : undefined,
        csvResourceFormat: ckanGroup.includeCsv ? ckanGroup.csvResourceFormat : undefined,
        czmlResourceFormat: ckanGroup.includeCzml ? ckanGroup.czmlResourceFormat : undefined
    });

    if (resource.__filtered) {
        return;
    }

    var isWms;
    var c = ckanGroup;
    if (resource.format.match(ckanGroup.wmsResourceFormat)) {
        isWms = true;
    } else if ([c.esriMapServerResourceFormat, c.kmlResourceFormat, c.geoJsonResourceFormat, c.csvResourceFormat, c.czmlResourceFormat].some(''.match, resource.format)) {
        isWms = false;
    } else {
        return;
    }

    var baseUrl = resource.wms_url;
    if (!defined(baseUrl)) {
        baseUrl = resource.url;
        if (!defined(baseUrl)) {
            return;
        }
    }

    // Extract the layer name from the URL.
    var uri = new URI(baseUrl);
    var params = uri.search(true);

    // Remove the query portion of the WMS URL.
    var url = baseUrl;

    var newItem;
    if (isWms) {
        if (!ckanGroup.includeWms) {
            return;
        }
        var layerName = resource.wms_layer || params.LAYERS || params.layers || params.typeName;
        if (defined(layerName)) {
            newItem = new WebMapServiceCatalogItem(ckanGroup.terria);
            newItem.layers = layerName;
        } else {
            if (!ckanGroup.allowEntireWmsServer) {
                return;
            }
            newItem = new WebMapServiceCatalogGroup(ckanGroup.terria);
        }
        uri.search('');
        url = uri.toString();
    } else {
        [['esriMapServerResourceFormat', 'includeEsriMapServer', ArcGisMapServerCatalogItem],
            ['kmlResourceFormat', 'includeKml', KmlCatalogItem],
            ['geoJsonResourceFormat', 'includeGeoJson', GeoJsonCatalogItem],
            ['czmlJsonResourceFormat', 'includeCzml', CzmlCatalogItem],
            ['csvResourceFormat', 'includeCsv', CsvCatalogItem]].forEach(function (f) {
            if (resource.format.match(ckanGroup[f[0]]) && ckanGroup[f[1]]) {
                newItem = new f[2](ckanGroup.terria);
            }
        });
    }
    if (!newItem) {
        return;
    }

    if (ckanGroup.useResourceName) {
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
    newItem.dataUrl = ckanGroup.url + '/dataset/' + itemData.name;
    newItem.dataUrlType = 'direct';

    if (isWms) {
        //This should be deprecated and done on a server by server basis when feasible
        newItem.parameters = ckanGroup.wmsParameters;
    }

    if (defined(ckanGroup.dataCustodian)) {
        newItem.dataCustodian = ckanGroup.dataCustodian;
    } else if (itemData.organization && itemData.organization.title) {
        newItem.dataCustodian = itemData.organization.description || itemData.organization.title;
    }

    if (typeof(ckanGroup.itemProperties) === 'object') {
        newItem.updateFromJson(ckanGroup.itemProperties);
    }

    newItem.id = parent.uniqueId + '/' + resource.id;

    return newItem;
}
function populateGroupFromResults(ckanGroup, json) {
    var items = json.result.results;
    for (var itemIndex = 0; itemIndex < items.length; ++itemIndex) {
        var item = items[itemIndex];

        if (ckanGroup.blacklist && ckanGroup.blacklist[item.title]) {
            console.log('Provider Feedback: Filtering out ' + item.title + ' (' + item.name + ') because it is blacklisted.');
            continue;
        }


        var extras = {};
        if (defined(item.extras)) {
            for (var idx = 0; idx < item.extras.length; idx++) {
                extras[item.extras[idx].key] = item.extras[idx].value;
            }
        }

        var resources = item.resources;
        for (var resourceIndex = 0; resourceIndex < resources.length; ++resourceIndex) {
            var resource = resources[resourceIndex];

            var groups;
            if (ckanGroup.groupBy === 'group') {
                groups = item.groups;
            } else if (ckanGroup.groupBy === 'organization' && item.organization) { // item.organization is sometimes null
                groups = [item.organization];
            }

            if (defined(groups) && groups.length > 0) {
                for (var groupIndex = 0; groupIndex < groups.length; ++groupIndex) {
                    var group = groups[groupIndex];
                    var groupName = group.display_name || group.title;
                    var groupId = ckanGroup.uniqueId + '/' + group.id;

                    if (ckanGroup.blacklist && ckanGroup.blacklist[groupName]) {
                        continue;
                    }

                    var groupToAdd = ckanGroup.terria.catalog.shareKeyIndex[groupId];
                    var updating = defined(groupToAdd);

                    if (!defined(groupToAdd)) {
                        groupToAdd = new CatalogGroup(ckanGroup.terria);
                        groupToAdd.name = groupName;
                        groupToAdd.id = groupId;
                    }

                    addItem(resource, ckanGroup, item, extras, groupToAdd);

                    if (!updating && groupToAdd.items.length) {
                        ckanGroup.add(groupToAdd);
                    }
                }
            } else {
                addItem(resource, ckanGroup, item, extras, ckanGroup);
            }
        }
    }

    function compareNames(a, b) {
        var aName = a.name.toLowerCase();
        var bName = b.name.toLowerCase();
        if (aName < bName) {
            return -1;
        } else if (aName > bName) {
            return 1;
        } else {
            return 0;
        }
    }

    ckanGroup.items.sort(compareNames);

    for (var i = 0; i < ckanGroup.items.length; ++i) {
        if (defined(ckanGroup.items[i].items)) {
            ckanGroup.items[i].items.sort(compareNames);
        }
    }
}

/**
 * Creates a catalog item from the supplied resource and adds it to the supplied parent if necessary..
 *
 * @param resource The Ckan resource
 * @param rootCkanGroup The root group of all items in this Ckan hierarchy
 * @param itemData The data of the item to build the catalog item from
 * @param extras
 * @param parent The parent group to add the item to once it's constructed - set this to rootCkanGroup for flat hierarchies.
 */
function addItem(resource, rootCkanGroup, itemData, extras, parent) {
    var item = rootCkanGroup.terria.catalog.shareKeyIndex[parent.uniqueId + '/' + resource.id];
    var alreadyExists = defined(item);

    if (!alreadyExists) {
        item = createItemFromResource(resource, rootCkanGroup, itemData, extras, parent);

        if (item) {
            parent.add(item);
        }
    }
}

module.exports = CkanCatalogGroup;
