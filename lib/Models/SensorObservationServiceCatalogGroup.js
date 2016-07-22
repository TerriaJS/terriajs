'use strict';

/*global require*/

var clone = require('terriajs-cesium/Source/Core/clone');
var defined = require('terriajs-cesium/Source/Core/defined');
var when = require('terriajs-cesium/Source/ThirdParty/when');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var formatError = require('terriajs-cesium/Source/Core/formatError');
var freezeObject = require('terriajs-cesium/Source/Core/freezeObject');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var loadText = require('terriajs-cesium/Source/Core/loadText');
var proxyCatalogItemUrl = require('./proxyCatalogItemUrl');
var URI = require('urijs');
var xml2json = require('../ThirdParty/xml2json');
var SensorObservationServiceCatalogItem = require('./SensorObservationServiceCatalogItem');

var inherit = require('../Core/inherit');

var CatalogGroup = require('./CatalogGroup');
var TerriaError = require('../Core/TerriaError');

/**
 * A {@link CatalogGroup} representing a collection of layers from an OGC-compliant Sensor Observation Service (SOS) server. 
 *
 * @alias SensorObservationServiceCatalogGroup
 * @constructor
 * @extends CatalogGroup
 *
 * @param {Terria} terria The Terria instance.
 */
var SensorObservationServiceCatalogGroup = function(terria) {
    CatalogGroup.call(this, terria, 'sos-group');

    /**
     * Gets or sets the URL of the SOS endpoint.  This property is observable.
     * @type {String}
     */
    this.url = '';

    // needs to generate a string like `om:phenomenonTime,2009-01-10T10:00:00Z/2009-01-10T11:00:00Z`
    this.temporalFilter = undefined;

    // ? this.groupBy = 'category';

    knockout.track(this, ['url', 'temporalFilter']);

};

inherit(CatalogGroup, SensorObservationServiceCatalogGroup);

defineProperties(SensorObservationServiceCatalogGroup.prototype, {

    /**
     * Gets the type of data member represented by this instance.
     * @memberOf SensorObservationServiceCatalogGroup.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return 'sos-group';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, such as 'Web Map Service (WMS)'.
     * @memberOf SensorObservationServiceCatalogGroup.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'SOS server';
        }
    },

    /**
     * Gets the set of functions used to update individual properties in {@link CatalogMember#updateFromJson}.
     * When a property name in the returned object literal matches the name of a property on this instance, the value
     * will be called as a function and passed a reference to this instance, a reference to the source JSON object
     * literal, and the name of the property.
     * @memberOf SensorObservationServiceCatalogGroup.prototype
     * @type {Object}
     */
    updaters : {
        get : function() {
            return SensorObservationServiceCatalogGroup.defaultUpdaters;
        }
    },

    /**
     * Gets the set of functions used to serialize individual properties in {@link CatalogMember#serializeToJson}.
     * When a property name on the model matches the name of a property in the serializers object lieral,
     * the value will be called as a function and passed a reference to the model, a reference to the destination
     * JSON object literal, and the name of the property.
     * @memberOf SensorObservationServiceCatalogGroup.prototype
     * @type {Object}
     */
    serializers : {
        get : function() {
            return SensorObservationServiceCatalogGroup.defaultSerializers;
        }
    }
});

/**
 * Gets or sets the set of default updater functions to use in {@link CatalogMember#updateFromJson}.  Types derived from this type
 * should expose this instance - cloned and modified if necesary - through their {@link CatalogMember#updaters} property.
 * @type {Object}
 */
SensorObservationServiceCatalogGroup.defaultUpdaters = clone(CatalogGroup.defaultUpdaters);

freezeObject(SensorObservationServiceCatalogGroup.defaultUpdaters);

/**
 * Gets or sets the set of default serializer functions to use in {@link CatalogMember#serializeToJson}.  Types derived from this type
 * should expose this instance - cloned and modified if necesary - through their {@link CatalogMember#serializers} property.
 * @type {Object}
 */
SensorObservationServiceCatalogGroup.defaultSerializers = clone(CatalogGroup.defaultSerializers);

SensorObservationServiceCatalogGroup.defaultSerializers.items = CatalogGroup.enabledShareableItemsSerializer;

SensorObservationServiceCatalogGroup.defaultSerializers.isLoading = function(sosGroup, json, propertyName, options) {};


SensorObservationServiceCatalogGroup.prototype._getValuesThatInfluenceLoad = function() {
    return [this.url, this.filterQuery, this.groupBy, this.dataCustodian];
};

SensorObservationServiceCatalogGroup.prototype._load = function() {
    if (!this.url) {
        return undefined;
    }

    var that = this;

    // Duplicated from SosItem
    function loadSos(options, processFunc) {
        var url = new URI(that.url)
            .query({ service: 'SOS', version: '2.0' })
            .addQuery(options) // It's ok to pass `foo: undefined`, it gets stripped out.
            .toString();

        return loadText(proxyCatalogItemUrl(that, url, '1d'))
            .then(xml2json)
            .then(j => processFunc(that, j));
    }

    
    return when.all([
        loadSos({ request: 'GetCapabilities', temporalFilter: this.temporalFilter },  processCapabilities),
        loadSos({ request: 'GetFeatureOfInterest' }, processFeaturesOfInterest ) 
    ]).otherwise(function(e) {
        throw new TerriaError({
            sender: that,
            title: that.name,
            message: 
                'Couldn\'t retrieve list of services from this SOS server.<br/><br/>'+
                'If you entered the URL manually, please double-check it.<br/><br/>'+
                'Otherwise, if reloading doesn\'t fix it, please report the problem by sending an email to <a href="mailto:'+that.terria.supportEmail+'">'+that.terria.supportEmail+'</a> with the technical details below.  Thank you!<br/><br/>'+
                '<pre>' + formatError(e) + '</pre>'
        });
    });
};
/*
 Do something with the locations of all the sensors
 http://www.bom.gov.au/waterdata/services?service=SOS&version=2.0&request=GetFeatureOfInterest
 */
function processFeaturesOfInterest(sosItem, fois) {
    var locations = fois.featureMember.map(x=>x.MonitoringPoint.shape.Point.pos.text);
    // There are 8029 points in BOM's service, of which 7065 that have locations, and 6395 unique locations.
    console.log('Features of interest:', fois);
}

// http://www.bom.gov.au/waterdata/services?service=SOS&version=2.0&request=GetCapabilities
function populateCapabilities(sosGroup, results) {
    // Possible enhancement: we could look for features like GetRequest which is a CSV output:
    // http://sensiasoft.net:8181/sensorhub/sos?service=SOS&version=2.0&request=GetResult&offering=urn:mysos:offering03&observedProperty=http://sensorml.com/ont/swe/property/Weather&temporalFilter=phenomenonTime,2015-10-15T16:34:00Z/2015-10-15T17:34:00Z
    // 
    // "Offerings" are various pre-defined aggregations of data along different dimensions and with different filters.
    // We don't necessarily want to expose them all to the end user. Also, they don't have nice IDs.
    var offerings = results.contents.Contents.offering.map(o => o.ObservationOffering);
    offerings.forEach(function(o) {
        var item = new SensorObservationServiceCatalogItem(sosGroup.terria);
        // These aren't unique. Eg, a bunch of DMQaQc.Merged.AsStored.1 with differing identifiers like http://bom.gov.au/waterdata/services/tstypes/Pat3_C_B_1
        item.name = o.name; 
        item.url = sosGroup.url;
        item.id = o.identifier;
        item.procedure = o.procedure;
        item.info = [
            { name: 'Description',
              content: o.description
          }];
        // Bounding box in o.observedArea.Envelope:
            // lowerCorner: "-43.3341 113.5289"
            // srsName: "http://www.opengis.net/def/crs/EPSG/0/4326"
            // upperCorner :"-11.148899999999998 153.5084"
        // They're the same on every layer though - whole of Australia

        // can we use o.identifier as the actual identifier?
        sosGroup.add(item);
    });

}

module.exports = SensorObservationServiceCatalogGroup;
