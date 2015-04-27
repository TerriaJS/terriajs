'use strict';

/*global require*/
var URI = require('URIjs');

var clone = require('terriajs-cesium/Source/Core/clone');
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var freezeObject = require('terriajs-cesium/Source/Core/freezeObject');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var loadJson = require('terriajs-cesium/Source/Core/loadJson');
var objectToQuery = require('terriajs-cesium/Source/Core/objectToQuery');

var AbsIttCatalogItem = require('./AbsIttCatalogItem');
var CatalogGroup = require('./CatalogGroup');
var inherit = require('../Core/inherit');
var ModelError = require('./ModelError');

/**
 * A {@link CatalogGroup} representing a collection of items from an Australian Bureau of Statistics
 * (ABS) ITT server, formed by querying for all the codes in a given dataset and concept.
 *
 * @alias AbsIttCatalogGroup
 * @constructor
 * @extends CatalogGroup
 * 
 * @param {Application} application The application.
 */
var AbsIttCatalogGroup = function(application) {
    CatalogGroup.call(this, application, 'abs-itt-by-concept');

    /**
     * Gets or sets the URL of the ABS ITT API, typically http://stat.abs.gov.au/itt/query.jsp.
     * This property is observable.
     * @type {String}
     */
    this.url = undefined;

    /**
     * Gets or sets the ID of the ABS dataset.  You can obtain a list of all datasets by querying
     * http://stat.abs.gov.au/itt/query.jsp?method=GetDatasetList (or equivalent).  This property
     * is observable.
     * @type {String}
     */
    this.dataSetID = undefined;

    /**
     * Gets or sets the ABS region type to query.  You can obtain a list of all available region types for
     * a dataset by querying
     * http://stat.abs.gov.au/itt/query.jsp?method=GetCodeListValue&datasetid=ABS_CENSUS2011_B25&concept=REGIONTYPE&format=json
     * (or equivalent).  This property is observable.
     * @type {String}
     */
    this.regionType = undefined;

    /**
     * Gets or sets a description of the custodian of the data sources in this group.
     * This property is an HTML string that must be sanitized before display to the user.
     * This property is observable.
     * @type {String}
     */
    this.dataCustodian = undefined;

    /**
     * Gets or sets a hash of names of blacklisted datasets.  A dataset that appears in this hash
     * will not be shown to the user.  In this hash, the keys should be the name of the dataset to blacklist,
     * and the values should be "true".  This property is observable.
     * @type {Object}
     */
    this.blacklist = undefined;

    knockout.track(this, ['url', 'dataSetID', 'regionType', 'dataCustodian', 'blacklist']);
};

inherit(CatalogGroup, AbsIttCatalogGroup);

defineProperties(AbsIttCatalogGroup.prototype, {
    /**
     * Gets the type of data member represented by this instance.
     * @memberOf AbsIttCatalogGroup.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return 'abs-itt-dataset-list';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, such as 'Web Map Service (WMS)'.
     * @memberOf AbsIttCatalogGroup.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'ABS.Stat Dataset List';
        }
    },

    /**
     * Gets a value indicating whether the items in this group (and their sub-items, if any) should be sorted when
     * {@link CatalogGroup#load} is complete.
     * @memberOf CatalogGroup.prototype
     * @type {Boolean}
     */
    sortItemsOnLoad : {
        get : function() {
            return false;
        }
    },
    
    /**
     * Gets the set of functions used to serialize individual properties in {@link CatalogMember#serializeToJson}.
     * When a property name on the model matches the name of a property in the serializers object lieral,
     * the value will be called as a function and passed a reference to the model, a reference to the destination
     * JSON object literal, and the name of the property.
     * @memberOf AbsIttCatalogGroup.prototype
     * @type {Object}
     */
    serializers : {
        get : function() {
            return AbsIttCatalogGroup.defaultSerializers;
        }
    }
});

/**
 * Gets or sets the set of default serializer functions to use in {@link CatalogMember#serializeToJson}.  Types derived from this type
 * should expose this instance - cloned and modified if necesary - through their {@link CatalogMember#serializers} property.
 * @type {Object}
 */
AbsIttCatalogGroup.defaultSerializers = clone(CatalogGroup.defaultSerializers);

AbsIttCatalogGroup.defaultSerializers.items = function(absGroup, json, propertyName, options) {
    // Only serialize minimal properties in contained items, because other properties are loaded by querying ABS.Stat.
    var previousSerializeForSharing = options.serializeForSharing;
    options.serializeForSharing = true;

    // Only serlize enabled items as well.  This isn't quite right - ideally we'd serialize any
    // property of any item if the property's value is changed from what was loaded from GetCapabilities -
    // but this gives us reasonable results for sharing and is a lot less work than the ideal
    // solution.
    var previousEnabledItemsOnly = options.enabledItemsOnly;
    options.enabledItemsOnly = true;

    var result = CatalogGroup.defaultSerializers.items(absGroup, json, propertyName, options);

    options.enabledItemsOnly = previousEnabledItemsOnly;
    options.serializeForSharing = previousSerializeForSharing;

    return result;
};

freezeObject(AbsIttCatalogGroup.defaultSerializers);

AbsIttCatalogGroup.prototype._getValuesThatInfluenceLoad = function() {
    return [this.url, this.blacklist];
};

AbsIttCatalogGroup.prototype._load = function() {
    var baseUrl = cleanAndProxyUrl(this.application, this.url);
    var parameters = {
        method: 'GetDatasetList',
        format: 'json'
    };

    var that = this;

    var url = baseUrl + '?' + objectToQuery(parameters);

    return loadJson(url).then(function(json) {
        var datasets = json.datasets;

        var promises = [];

        var myFunc = function(url, dataset) {
            return loadJson(url).then(function(json) {
                var concepts = json.concepts;

                if (concepts.indexOf('REGION') !== -1) {
                    that.items.push(createItemForDataset(that, dataset));
                }
            });
        };

        var wildcardTerms = [];
        for (var p in that.blacklist) {
            if (that.blacklist.hasOwnProperty(p)) {
                if (p[0] === '?') {
                    wildcardTerms.push(p.substring(1));
                }
            }
        }

        for (var i = 0; i < datasets.length - 1; ++i) {
            var dataset = datasets[i];

            var blacklist = (that.blacklist && that.blacklist[dataset.description]);
            for (var w = 0; w < wildcardTerms.length && !blacklist; w++) {
                if (dataset.description.indexOf(wildcardTerms[w]) !== -1) {
                    blacklist = true;
                }
            }
            if (blacklist) {
                console.log('Provider Feedback: Filtering out ' + dataset.description + ' (' + dataset.id + ') because it is blacklisted.');
                continue;
            }

            var parameters = {
                method: 'GetDatasetConcepts',
                datasetid: dataset.id,
                format: 'json'
            };

            var url = baseUrl + '?' + objectToQuery(parameters);

            promises.push(myFunc(url, dataset));
        }
    }).otherwise(function(e) {
        console.log(e.message);
        throw new ModelError({
            sender: that,
            title: 'Group is not available',
            message: '\
An error occurred while invoking GetCodeListValue on the ABS ITT server.  \
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

function createItemForDataset(absGroup, dataset) {
    var result = new AbsIttCatalogItem(absGroup.application);

    result.name = dataset.description;
    result.description = dataset.description;
    result.dataCustodian = absGroup.dataCustodian;
    result.url = absGroup.url;
    result.dataSetID = dataset.id;
    result.regionType = absGroup.regionType;

    return result;
}

module.exports = AbsIttCatalogGroup;