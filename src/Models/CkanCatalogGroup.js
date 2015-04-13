'use strict';

/*global require,URI,$*/

var clone = require('../../third_party/cesium/Source/Core/clone');
var defined = require('../../third_party/cesium/Source/Core/defined');
var defineProperties = require('../../third_party/cesium/Source/Core/defineProperties');
var formatError = require('../../third_party/cesium/Source/Core/formatError');
var freezeObject = require('../../third_party/cesium/Source/Core/freezeObject');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');
var loadJson = require('../../third_party/cesium/Source/Core/loadJson');
var loadText = require('../../third_party/cesium/Source/Core/loadText');
var Rectangle = require('../../third_party/cesium/Source/Core/Rectangle');
var when = require('../../third_party/cesium/Source/ThirdParty/when');

var ArcGisMapServerCatalogItem = require('./ArcGisMapServerCatalogItem');
var corsProxy = require('../Core/corsProxy');
var ModelError = require('./ModelError');
var CatalogGroup = require('./CatalogGroup');
var inherit = require('../Core/inherit');
var KmlCatalogItem = require('./KmlCatalogItem');
var WebMapServiceCatalogItem = require('./WebMapServiceCatalogItem');

/**
 * A {@link CatalogGroup} representing a collection of layers from a [CKAN](http://ckan.org) server.
 *
 * @alias CkanCatalogGroup
 * @constructor
 * @extends CatalogGroup
 * 
 * @param {Application} application The application.
 */
var CkanCatalogGroup = function(application) {
    CatalogGroup.call(this, application, 'ckan');

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

    this.includeWms = true;
    this.includeKml = false;
    this.includeEsriMapServer = false;

    knockout.track(this, ['url', 'dataCustodian', 'filterQuery', 'blacklist', 'wmsParameters']);
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
 * Gets or sets the set of default serializer functions to use in {@link CatalogMember#serializeToJson}.  Types derived from this type
 * should expose this instance - cloned and modified if necesary - through their {@link CatalogMember#serializers} property.
 * @type {Object}
 */
CkanCatalogGroup.defaultSerializers = clone(CatalogGroup.defaultSerializers);

CkanCatalogGroup.defaultSerializers.items = function(ckanGroup, json, propertyName, options) {
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

CkanCatalogGroup.defaultSerializers.isLoading = function(ckanGroup, json, propertyName, options) {};

freezeObject(CkanCatalogGroup.defaultSerializers);

CkanCatalogGroup.prototype._getValuesThatInfluenceLoad = function() {
    return [this.url, this.filterQuery, this.blacklist, this.filterByWmsGetCapabilities, this.minimumMaxScaleDenominator];
};

CkanCatalogGroup.prototype._load = function() {
    if (!defined(this.url) || this.url.length === 0) {
        return undefined;
    }

    var that = this;

    var promises = [];
    for (var i = 0; i < this.filterQuery.length; i++) {
        var url = cleanAndProxyUrl(this.application, this.url) + '/api/3/action/package_search?rows=100000&' + this.filterQuery[i];

        var promise = loadJson(url);

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
        throw new ModelError({
            sender: that,
            title: that.name,
            message: '\
Couldn\'t retrieve packages from this CKAN server.<br/><br/>\
If you entered the URL manually, please double-check it.<br/><br/>\
If it\'s your server, make sure <a href="http://enable-cors.org/" target="_blank">CORS</a> is enabled.<br/><br/>\
Otherwise, if reloading doesn\'t fix it, please report the problem by sending an email to <a href="mailto:nationalmap@lists.nicta.com.au">nationalmap@lists.nicta.com.au</a> with the technical details below.  Thank you!<br/><br/>\
<pre>' + formatError(e) + '</pre>'
        });
    });
};

// The "format" field of CKAN resources must match this regular expression to be considered a WMS resource.
var wmsFormatRegex = /^wms$/i;
var esriRestFormatRegex = /^esri rest$/i;
var jsonFormatRegex = /^JSON$/i;
var kmlFormatRegex = /^KML$/i;

function filterResultsByGetCapabilities(ckanGroup, json) {
    var wmsServers = {};

    var items = json.result.results;
    for (var itemIndex = 0; itemIndex < items.length; ++itemIndex) {
        var item = items[itemIndex];

        var resources = item.resources;
        for (var resourceIndex = 0; resourceIndex < resources.length; ++resourceIndex) {
            var resource = resources[resourceIndex];
            if (!resource.format.match(wmsFormatRegex)) {
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
        var getCapabilitiesJson = $.xml2json(getCapabilitiesXml);
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

function populateGroupFromResults(ckanGroup, json) {
    var items = json.result.results;
    for (var itemIndex = 0; itemIndex < items.length; ++itemIndex) {
        var item = items[itemIndex];

        if (ckanGroup.blacklist && ckanGroup.blacklist[item.title]) {
            console.log('Provider Feedback: Filtering out ' + item.title + ' (' + item.name + ') because it is blacklisted.');
            continue;
        }

        var textDescription = '';

        if (item.notes) {
            textDescription = item.notes.replace(/\n/g, '<br/>');
        }

        if (item.license_url && (item.notes === null || item.notes.indexOf('[Licence]') === -1)) {
            textDescription += '<br/>[Licence](' + item.license_url + ')';
        }

        var extras = {};
        if (defined(item.extras)) {
            for (var idx = 0; idx < item.extras.length; idx++) {
                extras[item.extras[idx].key] = item.extras[idx].value;
            }
        }

        var dataUrl = extras.data_url;
        var dataUrlType = extras.data_url_type;

        var rectangle;
        var bboxString = item.geo_coverage || extras.geo_coverage;
        if (defined(bboxString)) {
            var parts = bboxString.split(',');
            if (parts.length === 4) {
                rectangle = Rectangle.fromDegrees(parts[0], parts[1], parts[2], parts[3]);
            }
        }

        var dataGovCkan = (ckanGroup.url === 'http://www.data.gov.au');  //data.gov.au hack

        // Currently, we support WMS and Esri REST layers.
        var resources = item.resources;
        for (var resourceIndex = 0; resourceIndex < resources.length; ++resourceIndex) {
            var resource = resources[resourceIndex];
                //TODO: make the resource types a parameter in the init file
            if (resource.__filtered) {
                continue;
            }

            var isWms;
            if (dataGovCkan) {
                if (resource.format.match(jsonFormatRegex)) {
                    isWms = true;
                } else if (resource.format.match(kmlFormatRegex)) {
                    isWms = false;
                } else {
                    continue;
                }
            }
            else {
                if (resource.format.match(wmsFormatRegex)) {
                    isWms = true;
                } else if (resource.format.match(esriRestFormatRegex) || resource.format.match(kmlFormatRegex)) {
                    isWms = false;
                } else {
                    continue;
                }
            }

            var baseUrl = resource.wms_url;
            if (!defined(baseUrl)) {
                baseUrl = resource.url;
                if (!defined(baseUrl)) {
                    continue;
                }
            }

            // Extract the layer name from the URL.
            var uri = new URI(baseUrl);
            var params = uri.search(true);
            var layerName = params.LAYERS || params.layers || params.typeName;

            if (isWms && !defined(layerName)) {
                continue;
            }

            // Remove the query portion of the WMS URL.
            var url = baseUrl;
            if (isWms) {
                uri.search('');
                url = uri.toString();

                if (dataGovCkan) {
                    url = url.replace('wfs', 'wms');  //data.gov.au hack
                }
            }

            var newItem;
            if (isWms) {
                if (!ckanGroup.includeWms) {
                    continue;
                }
                newItem = new WebMapServiceCatalogItem(ckanGroup.application);
            } else if (resource.format.match(esriRestFormatRegex)) {
                if (!ckanGroup.includeEsriMapServer) {
                    continue;
                }
                newItem = new ArcGisMapServerCatalogItem(ckanGroup.application);
            } else if (resource.format.match(kmlFormatRegex)) {
                if (!ckanGroup.includeKml) {
                    continue;
                }
                newItem = new KmlCatalogItem(ckanGroup.application);
            } else {
                continue;
            }

            newItem.name = item.title;
            newItem.description = textDescription;
            newItem.url = url;
            newItem.rectangle = rectangle;
            newItem.dataUrl = dataUrl;
            newItem.dataUrlType = dataUrlType;

            if (isWms) {
                newItem.layers = layerName;
                //This should be deprecated and done on a server by server basis when feasible
                newItem.parameters = ckanGroup.wmsParameters;
            }

            if (defined(ckanGroup.dataCustodian)) {
                newItem.dataCustodian = ckanGroup.dataCustodian;
            } else if (item.organization && item.organization.title) {
                newItem.dataCustodian = item.organization.description || item.organization.title;
            }

            //if no groups then use organization
            var groups = item.groups;
            if (!defined(groups) || groups.length === 0 || dataGovCkan) {
                groups = [item.organization];
            }
            for (var groupIndex = 0; groupIndex < groups.length; ++groupIndex) {
                var group = groups[groupIndex];
                var groupName = group.display_name || group.title;
                if (groupName.indexOf(',') !== -1) {
                    groupName = groupName.substring(0, groupName.indexOf(','));
                }

                if (ckanGroup.blacklist && ckanGroup.blacklist[groupName]) {
                    continue;
                }

                var existingGroup = ckanGroup.findFirstItemByName(groupName);
                if (!defined(existingGroup)) {
                    existingGroup = new CatalogGroup(ckanGroup.application);
                    existingGroup.name = groupName;
                    ckanGroup.add(existingGroup);
                }

                existingGroup.add(newItem);
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
        ckanGroup.items[i].items.sort(compareNames);
    }
}

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

module.exports = CkanCatalogGroup;
