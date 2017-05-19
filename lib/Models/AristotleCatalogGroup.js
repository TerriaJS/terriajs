'use strict';

/*global require*/
var CatalogGroup = require('./CatalogGroup');
var clone = require('terriajs-cesium/Source/Core/clone');
var CsvCatalogItem = require('./CsvCatalogItem');
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var formatError = require('terriajs-cesium/Source/Core/formatError');
var freezeObject = require('terriajs-cesium/Source/Core/freezeObject');
var inherit = require('../Core/inherit');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var loadJson = require('terriajs-cesium/Source/Core/loadJson');
var proxyCatalogItemUrl = require('./proxyCatalogItemUrl');
var TerriaError = require('../Core/TerriaError');
var URI = require('urijs');
var when = require('terriajs-cesium/Source/ThirdParty/when');

/**
 * A {@link CatalogGroup} representing a collection of layers from an [Aristotle](http://aristotlemetadata.com/) server.
 *
 * @alias AristotleCatalogGroup
 * @constructor
 * @extends CatalogGroup
 *
 * @param {Terria} terria The Terria instance.
 */
var AristotleCatalogGroup = function(terria) {
    CatalogGroup.call(this, terria, 'ckan');

    /**
     * Gets or sets the URL of the Aristotle server.  This property is observable.
     * @type {String}
     */
    this.url = '';

    /**
     * Gets or sets a hash of properties that will be set on each child item.
     * For example, { "treat404AsError": false }
     * @type {Object}
     */
    this.itemProperties = undefined;

    knockout.track(this, [
        'url',
        'itemProperties'
    ]);
};

inherit(CatalogGroup, AristotleCatalogGroup);

defineProperties(AristotleCatalogGroup.prototype, {
    /**
     * Gets the type of data member represented by this instance.
     * @memberOf AristotleCatalogGroup.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return 'aristotle-group';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, such as 'Web Map Service (WMS)'.
     * @memberOf AristotleCatalogGroup.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'Aristotle Server';
        }
    },

    /**
     * Gets the set of functions used to update individual properties in {@link CatalogMember#updateFromJson}.
     * When a property name in the returned object literal matches the name of a property on this instance, the value
     * will be called as a function and passed a reference to this instance, a reference to the source JSON object
     * literal, and the name of the property.
     * @memberOf AristotleCatalogGroup.prototype
     * @type {Object}
     */
    updaters : {
        get : function() {
            return AristotleCatalogGroup.defaultUpdaters;
        }
    },

    /**
     * Gets the set of functions used to serialize individual properties in {@link CatalogMember#serializeToJson}.
     * When a property name on the model matches the name of a property in the serializers object literal,
     * the value will be called as a function and passed a reference to the model, a reference to the destination
     * JSON object literal, and the name of the property.
     * @memberOf AristotleCatalogGroup.prototype
     * @type {Object}
     */
    serializers : {
        get : function() {
            return AristotleCatalogGroup.defaultSerializers;
        }
    }
});

/**
 * Gets or sets the set of default updater functions to use in {@link CatalogMember#updateFromJson}.  Types derived from this type
 * should expose this instance - cloned and modified if necesary - through their {@link CatalogMember#updaters} property.
 * @type {Object}
 */
AristotleCatalogGroup.defaultUpdaters = clone(CatalogGroup.defaultUpdaters);
freezeObject(AristotleCatalogGroup.defaultUpdaters);

/**
 * Gets or sets the set of default serializer functions to use in {@link CatalogMember#serializeToJson}.  Types derived from this type
 * should expose this instance - cloned and modified if necesary - through their {@link CatalogMember#serializers} property.
 * @type {Object}
 */
AristotleCatalogGroup.defaultSerializers = clone(CatalogGroup.defaultSerializers);
AristotleCatalogGroup.defaultSerializers.items = CatalogGroup.enabledShareableItemsSerializer;
freezeObject(AristotleCatalogGroup.defaultSerializers);

AristotleCatalogGroup.prototype._getValuesThatInfluenceLoad = function() {
    return [
        this.url
    ];
};

AristotleCatalogGroup.prototype._load = function() {
    if (!defined(this.url) || this.url.length === 0) {
        return undefined;
    }

    const metadataUri = new URI(this.url).segment('api/v2/metadata/');
    const datasetUri = metadataUri.clone().addQuery({
        type: 'aristotle_dse:dataset'
    });
    const distributionUri = metadataUri.clone().addQuery({
        type: 'aristotle_dse:distribution'
    });
    const dataElementUri = metadataUri.clone().addQuery({
        type: 'aristotle_mdr:dataelement'
    });

    const datasetPromise = loadJson(proxyCatalogItemUrl(this, datasetUri.toString(), '0d'));
    const distributionPromise = loadJson(proxyCatalogItemUrl(this, distributionUri.toString(), '0d'));
    const dataElementPromise = loadJson(proxyCatalogItemUrl(this, dataElementUri.toString(), '0d'));

    const that = this;
    return when.all([datasetPromise, distributionPromise, dataElementPromise]).then(function(results) {
        const datasets = results[0];
        const distributions = results[1];
        const dataElements = results[2];

        const datasetsByUuid = {};
        datasets.results.forEach(dataset => {
            dataset.distributions = [];
            datasetsByUuid[dataset.uuid] = dataset;
        });

        const dataElementsByUuid = {};
        dataElements.results.forEach(dataElement => {
            dataElementsByUuid[dataElement.uuid] = dataElement;
        });

        distributions.results.forEach(distribution => {
            const dataset = datasetsByUuid[distribution.fields.dataset];
            if (dataset) {
                dataset.distributions.push(distribution);
            }
        });

        datasets.results.forEach(dataset => {
            const group = new CatalogGroup(that.terria);
            group.name = dataset.fields.name;

            dataset.distributions.forEach(distribution => {
                const item = new CsvCatalogItem(that.terria);
                item.name = distribution.fields.name;
                item.url = distribution.fields.download_URL;

                if (dataset.fields.definition) {
                    item.info.push({
                        name: 'Dataset Description',
                        content: dataset.fields.definition
                    });
                }
                if (distribution.fields) {
                    item.info.push({
                        name: 'Resource Description',
                        content: distribution.fields.definition
                    });
                }

                item.info.push({
                    name: 'Aristotle Dataset Page',
                    content: new URI(that.url).segment('item/uuid').segment(dataset.uuid).toString()
                });

                item.info.push({
                    name: 'Aristotle Distribution Page',
                    content: new URI(that.url).segment('item/uuid').segment(distribution.uuid).toString()
                });

                const columns = {};
                distribution.fields.data_elements.forEach(dataElement => {
                    const details = dataElementsByUuid[dataElement.data_element];
                    if (!details || dataElement.logical_path === 'lat' || dataElement.logical_path === 'lon') {
                        return;
                    }
                    columns[dataElement.logical_path] = {
                        name: details.fields.name,
                        description: details.fields.definition
                    };
                });

                item.updateFromJson({
                    tableStyle: {
                        columns: columns
                    }
                });

                group.items.push(item);
            });

            that.items.push(group);
        });
    }).otherwise(function(e) {
        throw new TerriaError({
            sender: that,
            title: that.name,
            message: '\
Couldn\'t retrieve datasets and distributions from this Aristotle server.<br/><br/>\
If you entered the URL manually, please double-check it.<br/><br/>\
If it\'s your server, make sure <a href="http://enable-cors.org/" target="_blank">CORS</a> is enabled.<br/><br/>\
Otherwise, if reloading doesn\'t fix it, please report the problem by sending an email to <a href="mailto:'+that.terria.supportEmail+'">'+that.terria.supportEmail+'</a> with the technical details below.  Thank you!<br/><br/>\
<pre>' + formatError(e) + '</pre>'
        });
    });
};

module.exports = AristotleCatalogGroup;
