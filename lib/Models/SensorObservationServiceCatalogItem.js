'use strict';

/*global require*/
var URI = require('urijs');

var clone = require('terriajs-cesium/Source/Core/clone');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var freezeObject = require('terriajs-cesium/Source/Core/freezeObject');
var formatError = require('terriajs-cesium/Source/Core/formatError');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var loadText = require('terriajs-cesium/Source/Core/loadText');
var when = require('terriajs-cesium/Source/ThirdParty/when');
var CsvCatalogItem = require('./CsvCatalogItem');
var DisplayVariablesConcept = require('../Map/DisplayVariablesConcept');
var inherit = require('../Core/inherit');
var TerriaError = require('../Core/TerriaError');
var overrideProperty = require('../Core/overrideProperty');
var proxyCatalogItemUrl = require('./proxyCatalogItemUrl');
var TableStructure = require('../Map/TableStructure');
var VariableConcept = require('../Map/VariableConcept');
var xml2json = require('../ThirdParty/xml2json');

/*
 * @alias SensorObservationServiceCatalogItem
 * @constructor
 * @extends CsvCatalogItem
 *
 * @param {Terria} terria The Terria instance.
 * @param {String} [url] The base URL from which to retrieve the data.
 */
var SensorObservationServiceCatalogItem = function(terria, url) {

    CsvCatalogItem.call(this, terria, url);

    this._concepts = [];

    this.procedure = undefined; // swes:procedure

    this.startTime = undefined;

    this.endTime = undefined;

    knockout.track(this, ['_concepts']);

    overrideProperty(this, 'concepts', {
        get: function() {
            return this._concepts;
        }
    });

    knockout.defineProperty(this, 'activeConcepts', {
        get: function() {
            return this._concepts.map(function(parent) {
                return parent.items.filter(function(concept) { return concept.isActive; });
            });
        }
    });

    knockout.getObservable(this, 'activeConcepts').subscribe(function() {
        if (!this.isLoading) {
            changedActiveItems(this);
        }
    }, this);

};

inherit(CsvCatalogItem, SensorObservationServiceCatalogItem);

defineProperties(SensorObservationServiceCatalogItem.prototype, {
    /**
     * Gets the type of data member represented by this instance.
     * @memberOf SensorObservationServiceCatalogItem.prototype
     * @type {String}
     */
    type: {
        get: function() {
            return 'sos';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, 'GPX'.
     * @memberOf SensorObservationServiceCatalogItem.prototype
     * @type {String}
     */
    typeName: {
        get: function() {
            return 'SOS';
        }
    },

    /**
     * Gets the set of names of the properties to be serialized for this object for a share link.
     * @memberOf ImageryLayerCatalogItem.prototype
     * @type {String[]}
     */
    propertiesForSharing: {
        get: function() {
            return SensorObservationServiceCatalogItem.defaultPropertiesForSharing;
        }
    },

    /**
     * Gets the set of functions used to serialize individual properties in {@link CatalogMember#serializeToJson}.
     * When a property name on the model matches the name of a property in the serializers object lieral,
     * the value will be called as a function and passed a reference to the model, a reference to the destination
     * JSON object literal, and the name of the property.
     * @memberOf SensorObservationServiceCatalogItem.prototype
     * @type {Object}
     */
    serializers: {
        get: function() {
            return SensorObservationServiceCatalogItem.defaultSerializers;
        }
    }
});

/**
 * Gets or sets the default set of properties that are serialized when serializing a {@link CatalogItem}-derived for a
 * share link.
 * @type {String[]}
 */
SensorObservationServiceCatalogItem.defaultPropertiesForSharing = clone(CsvCatalogItem.defaultPropertiesForSharing);
freezeObject(SensorObservationServiceCatalogItem.defaultPropertiesForSharing);

SensorObservationServiceCatalogItem.defaultSerializers = clone(CsvCatalogItem.defaultSerializers);
freezeObject(SensorObservationServiceCatalogItem.defaultSerializers);

// Just the items that would influence the load from the abs server or the file
SensorObservationServiceCatalogItem.prototype._getValuesThatInfluenceLoad = function() {
    return [this.url];
};

function querySos(sosItem, options) {
    var url = new URI(sosItem.url)
        .query({ service: 'SOS', version: '2.0' })
        .addQuery(options)
        .toString();

    return loadText(proxyCatalogItemUrl(sosItem, url, '1d'))
        .then(xml2json);
}


SensorObservationServiceCatalogItem.prototype._load = function() {
    var that = this;

    if (!this.url || !this.id) {
        return undefined;
    }

    return when.all([ loadObservations(this), loadAvailability(this), loadDescription(this) ]).otherwise(function(e) {
        throw new TerriaError({
            sender: that,
            title: that.name,
            message:
                'Couldn\'t retrieve data from this SOS server.<br/><br/>'+
                'If you entered the URL manually, please double-check it.<br/><br/>'+
                'Otherwise, if reloading doesn\'t fix it, please report the problem by sending an email to <a href="mailto:'+that.terria.supportEmail+'">'+that.terria.supportEmail+'</a> with the technical details below.  Thank you!<br/><br/>'+
                '<pre>' + formatError(e) + '</pre>'
        });
    });
};

/*
  Load the description of a sensor. In practice, it doesn't really contain anything useful.

  http://www.bom.gov.au/waterdata/services?service=SOS&version=2.0&request=DescribeSensor&procedureDescriptionFormat=http%3A%2F%2Fwww.opengis.net%2FsensorML%2F1.0.1&procedure=http%3A%2F%2Fbom.gov.au%2Fwaterdata%2Fservices%2Ftstypes%2FPat1_C_B_1
 */
function loadDescription(sosItem) {
    return querySos(sosItem, {
        request: 'DescribeSensor',
        procedure: sosItem.procedure,
        procedureDescriptionFormat: 'http://www.opengis.net/sensorML/1.0.1'
    }).then(function(sensorml) {
        //var description = sensormljson.description.SensorDescription.data.SensorML.member; 
        console.log('Sensor description: ', sensorml);
    });
}

/*
    Want to get more information about a location? 

    new urijs('http://www.bom.gov.au/waterdata/services').setQuery({service:'SOS',version:'2.0',request:'GetFeatureOfInterest',featureOfInterest:'http://bom.gov.au/waterdata/services/stations/401229'});
    http://www.bom.gov.au/waterdata/services?service=SOS&version=2.0&request=GetFeatureOfInterest&featureOfInterest=http%3A%2F%2Fbom.gov.au%2Fwaterdata%2Fservices%2Fstations%2F401229

    Point location buried in featureMember -> MonitoringPoint -> shape -> Point
    Warning: some IDs don't have locations (ie http://bom.gov.au/waterdata/services/stations/system)
*/


/*
    Retrieve range of times over which data is available for the given offering.

    Problem here is that this often returns ResponseExceedsSizeLimit: Please narrow your search, maximum number of timeseries in a single request is: 250
    Eg: http://www.bom.gov.au/waterdata/services?service=SOS&version=2.0&request=GetDataAvailability&offering=http%3A%2F%2Fbom.gov.au%2Fwaterdata%2Fservices%2Ftstypes%2FPat1_PC_1&procedure=http%3A%2F%2Fbom.gov.au%2Fwaterdata%2Fservices%2Ftstypes%2FPat1_PC_1

    Unfortunately GetDataAvailability is not a standard SOS 2.0 function, so we're guessing a bit about which filters might apply
     - https://live.osgeo.org/en/standards/fe_overview.html

    Restricting to a single featureOfInterest works:
    - http://www.bom.gov.au/waterdata/services?service=SOS&version=2.0&request=GetDataAvailability&featureOfInterest=http%3A%2F%2Fbom.gov.au%2Fwaterdata%2Fservices%2Fstations%2F401229
*/

function loadAvailability(sosItem) {
    return querySos(sosItem, {
        request: 'GetDataAvailability',
        offering: sosItem.id,
        procedure: sosItem.procedure
    }).then(function(availability) {
        // strip out any series with no availability at all
        var times = availability.dataAvailabilityMember.filter(x => x.phenomenonTime.TimePeriod);
        sosItem._series = {};
        //sosItem._concept = new DisplayVariablesConcept(...) // dimension name, allowmultiple
        sosItem._concepts = [new DisplayVariablesConcept("Concept name", true /* allowMultiple  */)];
        sosItem._concepts[0].items = [];
        times.forEach(t => {
            var id = t['gml:id'];
            sosItem._series[id] = {
                id: id, // Ki.DAM.5
                observedProperty: t.observedProperty['xlink:title'], // Generic
                procedure: t.procedure['xlink:title'], // 0 Cmd
                start: t.phenomenonTime.TimePeriod.beginPosition, //2016-07-18T00:00:04.000+10:00
                end: t.phenomenonTime.TimePeriod.endPosition      //2016-07-18T00:00:04.000+10:00
            };
            sosItem._concepts[0].items.push(new VariableConcept(id + ' (' + t.observedProperty['xlink:title'] + ')', {  // need a better name
                parent: sosItem._concepts[0],
                id: id,
                active: false
            }));
        });

        var ts = sosItem._tableStyle;
        sosItem._tableStructure = new TableStructure(sosItem.name, {
            displayDuration: ts.displayDuration,
            displayVariableTypes: TableStructure.defaultDisplayVariableTypes,
            replaceWithNullValues: ts.replaceWithNullValues,
            replaceWithZeroValues: ts.replaceWithZeroValues
        });

        console.log('Data availability: ', availability);
    });
}

/*
    Retrieve list of observations - actual data points, buried in a huge pile of XML. Unfortunately BOM's server doesn't support the much cleaner GetRequest.
    We should turn this into a chart or two.
    http://www.bom.gov.au/waterdata/services?datasource=0&service=SOS&request=GetObservation&temporalFilter=phenomenonTime,2016-07-01/2016-07-02&offering=http://bom.gov.au/waterdata/services/tstypes/Year.Mean
 */
function loadObservations(sosItem) {
    // http://www.bom.gov.au/waterdata/services?datasource=0&service=SOS&request=GetObservation&temporalFilter=phenomenonTime,2016-07-01/2016-07-02&offering=http://bom.gov.au/waterdata/services/tstypes/Year.Mean
    querySos(sosItem, {
        request: 'GetObservation',
        offering: sosItem.id,
        procedure: sosItem.procedure,
        temporalFilter: sosItem.temporalFilter // undefined is ok, it gets stripped out
        // could filter: &observedProperty=http://bom.gov.au/waterdata/services/parameters/Storage%20Level
    }).then(function(observations) {
        // this = sosItem
        // Item 26 (Ki.OM_Obs.27) in DMQaQc.Merged.DailyMin.24HR has a non zero value for storage level.
        if (observations.observationData) {
            var data = observations.observationData.map(o => o.OM_Observation);
            // is the value itself in data[0].result.MeasurementTimeseries.point.MeasurementTVP.value?
            console.log('Observations: ', data);
            // Each element of data is a set of observations (or just one?) at a given location
            // Location given by data.featureOfInterest. There's a bom.gov.au/waterdata/services/station/123 URL in ['xlink:href'] but it doesn't resolve. You can
            // manually take that number and type it in at bom.gov.au/waterdata to view the station.
            // (Arthur notes - at that link, and others like it, I only see http://bom.gov.au/waterdata/services/stations/system)
            // Create a temporary structure
            var values = data.map(x => {
                var tvp = x.result.MeasurementTimeseries.point.MeasurementTVP;
                return {
                    name: x.featureOfInterest['xlink:title'],
                    id: x.featureOfInterest['xlink:href'],
                    time: tvp.time,
                    // Convert objects with 'xsi:nil' = true' to nulls */
                    value: typeof tvp.value === 'object' ? null : Number.parseFloat(tvp.value) 
                };
            });
            console.log('Condensed observation values', values);
            //values: data[].result.MeasurementTimeSeries
        } // else...what?
    });
}

function changedActiveItems(){
}

module.exports = SensorObservationServiceCatalogItem;