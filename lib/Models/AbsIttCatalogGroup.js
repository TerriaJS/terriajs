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
 * @param {Terria} terria The Terria instance.
 */
var AbsIttCatalogGroup = function(terria) {
    CatalogGroup.call(this, terria, 'abs-itt-by-concept');

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

    /**
     * Gets or sets a hash of names of whitelisted datasets.  A dataset that doesn't appears in this hash
     * will not be shown to the user.  In this hash, the keys should be the name of the dataset to blacklist,
     * and the values should be "true".  This property is observable.
     * @type {Object}
     */
    this.whitelist = undefined;

    /**
     * Gets or sets a hash of properties that will be set on each child item.
     * For example, { 'treat404AsError': false }
     */
    this.itemProperties = undefined;

    knockout.track(this, ['url', 'dataSetID', 'regionType', 'dataCustodian', 'blacklist', 'whitelist', 'itemProperties']);
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
    return [this.url, this.blacklist, this.whitelist];
};

AbsIttCatalogGroup.prototype._load = function() {
    var baseUrl = cleanAndProxyUrl(this.terria, this.url);
    var parameters = {
        method: 'GetDatasetList',
        format: 'json'
    };

    var that = this;

    var url = baseUrl + '?' + objectToQuery(parameters);

    return loadJson(url).then(function(json) {
        var datasets = json.datasets;

        var p;

        var blacklistWildcardTerms = [];
        for (p in that.blacklist) {
            if (that.blacklist.hasOwnProperty(p)) {
                if (p[0] === '?') {
                    blacklistWildcardTerms.push(p.substring(1));
                }
            }
        }

        var whitelistWildcardTerms = [];
        for (p in that.whitelist) {
            if (that.whitelist.hasOwnProperty(p)) {
                if (p[0] === '?') {
                    whitelistWildcardTerms.push(p.substring(1));
                }
            }
        }

        for (var i = 0; i < datasets.length - 1; ++i) {
            var dataset = datasets[i];

            var w;

                //apply blacklist
            var blacklist = (defined(that.blacklist) && defined(that.blacklist[dataset.description]));
            for (w = 0; w < blacklistWildcardTerms.length && !blacklist; w++) {
                if (dataset.id.indexOf(blacklistWildcardTerms[w]) !== -1) {
                    blacklist = true;
                }
            }
                //now apply whitelist
            for (w = 0; w < whitelistWildcardTerms.length && !blacklist; w++) {
                if (dataset.id.indexOf(whitelistWildcardTerms[w]) === -1) {
                    blacklist = true;
                }
            }
            if (defined(that.whitelist) && defined(that.whitelist[dataset.description])) {
                blacklist = true;
            }
            if (blacklist) {
                console.log('Provider Feedback: Filtering out ' + dataset.description + ' (' + dataset.id + ') because it is blacklisted.');
                continue;
            }

            that.items.push(createItemForDataset(that, dataset));
        }

    }).otherwise(function(e) {
        console.log(e.message);
        throw new ModelError({
            sender: that,
            title: 'Group is not available',
            message: '\
An error occurred while invoking GetCodeListValue on the ABS ITT server.  \
<p>This error may indicate that the group you opened is temporarily unavailable or there is a \
problem with your internet connection.  Try opening the group again, and if the problem persists, please report it by \
sending an email to <a href="mailto:'+that.terria.supportEmail+'">'+that.terria.supportEmail+'</a>.</p>'
        });
    });
};

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

function createItemForDataset(absGroup, dataset) {
    var result = new AbsIttCatalogItem(absGroup.terria);

    result.name = dataset.description;
    result.description = dataset.description;
    result.dataCustodian = absGroup.dataCustodian;
    result.url = absGroup.url;
    result.dataSetID = dataset.id;
    result.regionType = absGroup.regionType;

    if (typeof(absGroup.itemProperties) === 'object') {
        result.updateFromJson(absGroup.itemProperties);
    }

    return result;
}

module.exports = AbsIttCatalogGroup;