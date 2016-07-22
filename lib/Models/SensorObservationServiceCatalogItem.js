'use strict';

/*global require*/
var URI = require('urijs');

var clone = require('terriajs-cesium/Source/Core/clone');
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
// var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var freezeObject = require('terriajs-cesium/Source/Core/freezeObject');
var formatError = require('terriajs-cesium/Source/Core/formatError');
// var deprecationWarning = require('terriajs-cesium/Source/Core/deprecationWarning');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var loadText = require('terriajs-cesium/Source/Core/loadText');
var when = require('terriajs-cesium/Source/ThirdParty/when');
var CsvCatalogItem = require('./CsvCatalogItem');
var DisplayVariablesConcept = require('../Map/DisplayVariablesConcept');
var inherit = require('../Core/inherit');
var TerriaError = require('../Core/TerriaError');
var overrideProperty = require('../Core/overrideProperty');
var proxyCatalogItemUrl = require('./proxyCatalogItemUrl');
var RegionMapping = require('../Models/RegionMapping');
var TableColumn = require('../Map/TableColumn');
var TableStructure = require('../Map/TableStructure');
var VariableConcept = require('../Map/VariableConcept');
var VarType = require('../Map/VarType');
var URI = require('urijs');
var xml2json = require('../ThirdParty/xml2json');

/*
 *
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

    this.id = undefined;

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

SensorObservationServiceCatalogItem.prototype._load = function() {
    var that = this;


    function sosQuery(options) {
        return new URI(that.url)
            .query({ service: 'SOS', version: '2.0' })
            .addQuery(options);
    }

    function loadXmlJson(uri) {
        return loadText(proxyCatalogItemUrl(that, uri.toString(), '1d')).then(xml2json);
    }


    if (!this.url || !this.id) {
        return undefined;
    }

    // http://www.bom.gov.au/waterdata/services?datasource=0&service=SOS&request=GetObservation&temporalFilter=phenomenonTime,2016-07-01/2016-07-02&offering=http://bom.gov.au/waterdata/services/tstypes/Year.Mean
    var dataUri = sosQuery({
        request: 'GetObservation',
        offering: this.id,
        procedure: this.procedure,
        temporalFilter: this.temporalFilter // undefined is ok, it gets stripped out
        // could filter: &observedProperty=http://bom.gov.au/waterdata/services/parameters/Storage%20Level
    });

    // this doesn't really return anything much useful.
    var describeUri = sosQuery({
        request: 'DescribeSensor',
        procedure: this.procedure,
        procedureDescriptionFormat: 'http://www.opengis.net/sensorML/1.0.1'
    });

    var dataAvailabilityUri = sosQuery({
        request: 'GetDataAvailability',
        offering: this.id,
        procedure: this.procedure
    });

    return loadXmlJson(describeUri)
        .then((j) => readSensorDescription(that, j))
        .then(() => loadXmlJson(dataAvailabilityUri))
        .then((j) => processAvailability(that, j))
        .then(() => loadXmlJson(dataUri))
        .then((j) => processObservations(that, j))
        .otherwise(function(e) {
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


function readSensorDescription(sosItem, sensormljson) {
    //var description = sensormljson.description.SensorDescription.data.SensorML.member; // doesn't really contain anything useful.
    console.log(sensormljson);
}

function processAvailability(sosItem, availability) {
    // strip out any series with no availability at all
    var times = availability.dataAvailabilityMember.filter(x => x.phenomenonTime.TimePeriod);
    sosItem._series = {};
    //sosItem._concept = new DisplayVariablesConcept(...) // dimension name, allowmultiple
    sosItem._concepts = [new DisplayVariablesConcept("Concept name", true /* allowMultiple  */)];
    sosItem._concepts[0].items=[];
    times.forEach(t => {
        var id = t['gml:id'] ;
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

    console.log(availability);
}

function processObservations(sosItem, observations) {
    // this = sosItem
    // Item 26 (Ki.OM_Obs.27) in DMQaQc.Merged.DailyMin.24HR has a non zero value for storage level.
    if (observations.observationData) {
        var data = observations.observationData.map(o => o.OM_Observation);
    // is the value itself in data[0].result.MeasurementTimeseries.point.MeasurementTVP.value?
        console.log(data);
    } // else...what?
}

function changedActiveItems(){
}

module.exports = SensorObservationServiceCatalogItem;