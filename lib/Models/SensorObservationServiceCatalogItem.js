'use strict';

/*global require*/
var URI = require('urijs');
var Mustache = require('mustache');

var clone = require('terriajs-cesium/Source/Core/clone');
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var freezeObject = require('terriajs-cesium/Source/Core/freezeObject');
var formatError = require('terriajs-cesium/Source/Core/formatError');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var loadText = require('terriajs-cesium/Source/Core/loadText');
var loadWithXhr = require('terriajs-cesium/Source/Core/loadWithXhr');
var when = require('terriajs-cesium/Source/ThirdParty/when');

// var DisplayVariablesConcept = require('../Map/DisplayVariablesConcept');
var inherit = require('../Core/inherit');
var featureDataToGeoJson = require('../Map/featureDataToGeoJson');
var GeoJsonCatalogItem = require('./GeoJsonCatalogItem');
var overrideProperty = require('../Core/overrideProperty');
var proxyCatalogItemUrl = require('./proxyCatalogItemUrl');
var TableCatalogItem = require('./CsvCatalogItem');
var TableColumn = require('../Map/TableColumn');
var TableStructure = require('../Map/TableStructure');
var TerriaError = require('../Core/TerriaError');
// var VariableConcept = require('../Map/VariableConcept');
var xml2json = require('../ThirdParty/xml2json');

/**
 * @alias SensorObservationServiceCatalogItem
 * @constructor
 * @extends TableCatalogItem
 *
 * @param {Terria} terria The Terria instance.
 * @param {String} [url] The base URL from which to retrieve the data.
 */
var SensorObservationServiceCatalogItem = function(terria, url) {

    TableCatalogItem.call(this, terria, url);

    this._concepts = [];

    /**
     * Gets or sets the maximum number of timeseries that the server can return in
     * a single GetObservation request.
     * @type {Number}
     */
    this.responseSizeLimit = 250;

    // TODO: doc this
    this.procedures = [
        {
            name: 'http://bom.gov.au/waterdata/services/tstypes/Pat7_C_B_1_YearlyMean',
            title: 'Yearly Mean' // Haven't seen this one in the mxl response.
        }
    ]; // undefined;

    // TODO: doc this
    this.observableProperties = [
        {
            name: 'http://bom.gov.au/waterdata/services/parameters/Storage Level',
            title: 'Storage Level' // may not need... available in the GetObservations xml response.
        }
    ]; // undefined;

    this.startTime = undefined;

    this.endTime = undefined;

    /**
     * A flag to choose between representing the underlying data as a TableStructure or as GeoJson.
     * Geojson representation is not fully implemented - eg. currently only points are supported.
     * Set to true for geojson. This can allow for non-point data (once the code is written).
     * Set to false (the default) for table structure. This allows all the TableStyle options, and a better legend.
     */
    this.representAsGeoJson = false;

    this._geoJsonItem = undefined;

    /**
     * Gets or sets the template XML string to POST to the SOS server to query for GetObservation.
     * If this property is undefined,
     * {@link SensorObservationServiceCatalogItem.defaultRequestTemplate} is used.
     * This is used as a Mustache template. See SensorObservationServiceRequestTemplate.xml for the default.
     * Be careful with newlines inside tags: Mustache can add an extra space in the front of them,
     * which causes the request to fail on the SOS server. Eg.
     * <wsa:Action>
     * http://www.opengis.net/...
     * </wsa:Action>
     * will render as <wsa:Action> http://www.opengis.net/...</wsa:Action>
     * The space before the "http" will cause the request to fail.
     * This property is observable.
     * @type {String}
     */
    this.requestTemplate = undefined;

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

SensorObservationServiceCatalogItem.defaultRequestTemplate = require('./SensorObservationServiceRequestTemplate.xml');

inherit(TableCatalogItem, SensorObservationServiceCatalogItem);

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
    },

    /**
     * Gets the data source associated with this catalog item. Might be a TableDataSource or a GeoJsonDataSource.
     * @memberOf SensorObservationServiceCatalogItem.prototype
     * @type {DataSource}
     */
    dataSource : {
        get : function() {
            if (defined(this._geoJsonItem)) {
                return this._geoJsonItem.dataSource;
            } else if (defined(this._dataSource)) {
                return this._dataSource;
            }
        }
    }
});

/**
 * Gets or sets the default set of properties that are serialized when serializing a {@link CatalogItem}-derived for a
 * share link.
 * @type {String[]}
 */
SensorObservationServiceCatalogItem.defaultPropertiesForSharing = clone(TableCatalogItem.defaultPropertiesForSharing);
freezeObject(SensorObservationServiceCatalogItem.defaultPropertiesForSharing);

SensorObservationServiceCatalogItem.defaultSerializers = clone(TableCatalogItem.defaultSerializers);
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

    if (!this.url) {
        return undefined;
    }

    return when.all([
        loadFeaturesOfInterest(this),
        loadCapabilities(this)
    ]).otherwise(function(e) {
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

function loadSoapBody(sosItem, templateContext) {
    var postDataTemplate = defaultValue(sosItem.requestTemplate, SensorObservationServiceCatalogItem.defaultRequestTemplate);
    const xml = Mustache.render(postDataTemplate, templateContext);
    // console.log(xml);
    return loadWithXhr({
        url : proxyCatalogItemUrl(sosItem, sosItem.url, '1d'),  // TODO: 1d won't work for more frequent data.
        responseType: 'document',
        method: 'POST',
        overrideMimeType: 'text/xml',
        data: xml,
        headers: {'Content-Type': 'application/soap+xml'}
    }).then(function(xml) {
        if (!defined(xml)) {
            return;
        }
        var json = xml2json(xml);
        if (json.Exception) {
            var errorMessage = 'The SOS server reported an unknown error.';
            if (json.Exception.ExceptionText) {
                errorMessage = 'The SOS server reported an error:\n\n' + json.Exception.ExceptionText;
            }
            throw new TerriaError({
                sender: sosItem,
                title: sosItem.name,
                message: errorMessage
            });
        }
        if (!defined(json.Body)) {
            throw new TerriaError({
                sender: sosItem,
                title: sosItem.name,
                message: 'The SOS server responded with missing body.'
            });
        }
        return json.Body;
    });
}

/**
 * Loads sensor observation data from a featureOfInterest identifier into a table structure using GetObservation.
 * This is required by Chart.jsx for any non-csv format.
 * @param  {String|String[]} url The featureOfInterest identifier, or array thereof.
 * @return {Promise} A promise which resolves to a table structure.
 */
SensorObservationServiceCatalogItem.prototype.loadIntoTableStructure = function(url) {
    var featureOfInterestIdentifiers = url;
    if (!Array.isArray(featureOfInterestIdentifiers)) {
        featureOfInterestIdentifiers = [featureOfInterestIdentifiers];
    }
    // TODO: this test only works for a single procedure and observedProperty,
    // which is all we should be requesting here anyway.
    if (featureOfInterestIdentifiers.length > this.responseSizeLimit) {
        featureOfInterestIdentifiers = featureOfInterestIdentifiers.slice(0, this.responseSizeLimit);
    }
    // console.log(featureOfInterestIdentifier, 'vs', 'http://bom.gov.au/waterdata/services/stations/425022');
    var sosItem = this;
    // TODO: in the chart, doesn't make sense to load multiple procedures & properties.
    var paramArray = convertObjectToNameValueArray({
        'procedure': sosItem.procedures.map(procedure => procedure.name), // eg. 'http://bom.gov.au/waterdata/services/tstypes/Pat7_C_B_1_YearlyMean',
        'observedProperty':  sosItem.observableProperties.map(observable => observable.name),  // eg. 'http://bom.gov.au/waterdata/services/parameters/Storage Level'
        'featureOfInterest': featureOfInterestIdentifiers // eg. 'http://bom.gov.au/waterdata/services/stations/425022'
        // offering: sosItem.id,
        // procedure: sosItem.procedure,
        // temporalFilter: sosItem.temporalFilter
        // could filter: &observedProperty=http://bom.gov.au/waterdata/services/parameters/Storage%20Level
    });
    const templateContext = {
        'action': 'GetObservation',
        'actionClass': 'core',
        'parameters': paramArray
    };
    return loadSoapBody(sosItem, templateContext).then(function(body) {
        // Item 26 (Ki.OM_Obs.27) in DMQaQc.Merged.DailyMin.24HR has a non zero value for storage level.
        var observationData = body.GetObservationResponse && body.GetObservationResponse.observationData;
        if (defined(observationData)) {
            if (!Array.isArray(observationData)) {
                observationData = [observationData];
            }
            var observations = observationData.map(o => o.OM_Observation);
            console.log('Observations: ', observations);
            // Each element of data is a set of observations (or just one?) at a given location
            // Location given by data.featureOfInterest. There's a bom.gov.au/waterdata/services/station/123 URL in ['xlink:href'] but it doesn't resolve. You can
            // manually take that number and type it in at bom.gov.au/waterdata to view the station.
            // (Arthur notes - at that link, and others like it, I only see http://bom.gov.au/waterdata/services/stations/system)
            // Create a temporary structure
            var dateValues = [];
            var valueValues = [];
            var featureValues = [];
            var procedureValues = [];
            observations.forEach(observation => {
                var points = observation.result.MeasurementTimeseries.point;
                if (!defined(points)) {
                    return;
                }
                if (!Array.isArray(points)) {
                    points = [points];
                }
                var measurements = points.map(point => point.MeasurementTVP); // TVP = Time value pairs, I think.
                var procedureName = defined(observation.procedure) ? observation.procedure['xlink:title'] : 'value';
                // var featureName = observation.featureOfInterest['xlink:title'];
                var featureIdentifier = observation.featureOfInterest['xlink:href'];
                dateValues = dateValues.concat(measurements.map(measurement =>
                    (typeof measurement.time === 'object' ? null : measurement.time)
                ));
                valueValues = valueValues.concat(measurements.map(measurement =>
                    (typeof measurement.value === 'object' ? null : Number.parseFloat(measurement.value))
                ));
                featureValues = featureValues.concat(measurements.map(measurement =>
                    featureIdentifier
                ));
                procedureValues = procedureValues.concat(measurements.map(measurement =>
                    procedureName
                ));
            });
            var observationTableStructure = new TableStructure('observations');
            var columnOptions = {tableStructure: observationTableStructure};
            var timeColumn = new TableColumn('date', dateValues, columnOptions);
            var valueColumn = new TableColumn('value', valueValues, columnOptions);
            var featureColumn = new TableColumn('identifier', featureValues, columnOptions);
            var procedureColumn = new TableColumn('procedure', procedureValues, columnOptions);
            observationTableStructure.columns = [timeColumn, valueColumn, featureColumn, procedureColumn];
            console.log('Observation table', observationTableStructure);
            return observationTableStructure;
        }
    }).otherwise(function(e) {
        console.log(e);  // TODO: improve
        // Eg. <ExceptionReport><Exception exceptionCode="ResponseExceedsSizeLimit"><ExceptionText>The search terms matched more than 250 timeseries in the datasource...
    });
};


// It's OK to override TableCatalogItem's enable, disable, because for lat/lon tables, they don't do anything.
SensorObservationServiceCatalogItem.prototype._enable = function() {
    if (defined(this._geoJsonItem)) {
        this._geoJsonItem._enable();
    }
};

SensorObservationServiceCatalogItem.prototype._disable = function() {
    if (defined(this._geoJsonItem)) {
        this._geoJsonItem._disable();
    }
};

// However show and hide need to become a combination of both the geojson and the lat/lon table catalog item versions.
SensorObservationServiceCatalogItem.prototype._show = function() {
    if (defined(this._geoJsonItem)) {
        this._geoJsonItem._show();
    } else if (defined(this._dataSource)) {
        var dataSources = this.terria.dataSources;
        if (dataSources.contains(this._dataSource)) {
            throw new DeveloperError('This data source is already shown.');
        }
        dataSources.add(this._dataSource);
    }
};

SensorObservationServiceCatalogItem.prototype._hide = function() {
    if (defined(this._geoJsonItem)) {
        this._geoJsonItem._hide();
    } else if (defined(this._dataSource)) {
        var dataSources = this.terria.dataSources;
        if (!dataSources.contains(this._dataSource)) {
            throw new DeveloperError('This data source is not shown.');
        }
        dataSources.remove(this._dataSource, false);
    }
};

SensorObservationServiceCatalogItem.prototype.showOnSeparateMap = function(globeOrMap) {
    if (defined(this._geoJsonItem)) {
        return this._geoJsonItem.showOnSeparateMap(globeOrMap);
    }
};

function loadFeaturesOfInterest(item) {
    // return querySos(item, { 
    //     request: 'GetFeatureOfInterest'
    // }).then(function(featuresResponse) {
    var paramArray = convertObjectToNameValueArray({
        'procedure': item.procedures.map(procedure => procedure.name), // eg. 'http://bom.gov.au/waterdata/services/tstypes/Pat7_C_B_1_YearlyMean',
        'observedProperty':  item.observableProperties.map(observable => observable.name)  // eg. 'http://bom.gov.au/waterdata/services/parameters/Storage Level'
        // 'featureOfInterest': 'http://bom.gov.au/waterdata/services/stations/425022'
        // offering: sosItem.id,
        // procedure: sosItem.procedure,
        // temporalFilter: sosItem.temporalFilter
        // could filter: &observedProperty=http://bom.gov.au/waterdata/services/parameters/Storage%20Level
    });
    const templateContext = {
        'action': 'GetFeatureOfInterest',
        'actionClass': 'foiRetrieval',
        'parameters': paramArray
    };
    return loadSoapBody(item, templateContext).then(function(body) {
        console.log('loadSoapBody: body', body);
        var featuresResponse = body.GetFeatureOfInterestResponse;
        // var locations = featuresResponse.featureMember.map(x=>x.MonitoringPoint.shape.Point.pos.text);
        // There are 8029 points in BOM's service, of which 7065 that have locations, and 6395 unique locations.
        console.log('Features of interest:', featuresResponse);
        if (!defined(featuresResponse.featureMember)) {
            throw new TerriaError({
                sender: item,
                title: item.name,
                message: 'The SOS server responded with an unknown feature format.'
            });
        }
        var featureMembers = featuresResponse.featureMember;
        if (!Array.isArray(featureMembers)) {
            featureMembers = [featureMembers];
        }
        if (item.representAsGeoJson) {
            item._geoJsonItem = createGeoJsonItemFromFeatureMembers(item, featureMembers);
            return item._geoJsonItem.load().then(function() {
                item.rectangle = item._geoJsonItem.rectangle;
            });
        } else {
            var featureMapping = createMappingFromFeatureMembers(featureMembers);
            console.log('feature mapping', featureMapping);
            // console.log('table columns', columns);
            // tableStructure.columns = columns;
            // item.initializeFromTableStructure(tableStructure);
            return featureMapping;
        }
    }).then(function(featureMapping) {
        // Testing this idea out. Load some observation data into this table.
        var featuresOfInterest = Object.keys(featureMapping);
        return item.loadIntoTableStructure(featuresOfInterest).then(function(observationTableStructure) {
            console.log('how did it look?');
            // Add the extra columns from the mapping into the table.
            var newColumns = createColumnsFromMapping(featureMapping, observationTableStructure);
            console.log('new columns', newColumns);
            observationTableStructure.columns = observationTableStructure.columns.concat(newColumns);
            observationTableStructure.name = item.name;
            item.initializeFromTableStructure(observationTableStructure);
            return when();
        });
    });
}

function getChartTagFromFeatureIdentifier(identifier) {
    return '<chart src="' + identifier + '"></chart>';
}

/**
 * Converts the featureMembers into a mapping from identifier to its lat/lon and other info.
 * @param  {Object[]} featureMembers An array of feature members as returned by GetFeatureOfInterest in body.GetFeatureOfInterestResponse.featuresResponse.featureMember.
 * @return {Object} Keys = identifier, values = {lat, lon, name, id, identifier, type, chart}.
 */
function createMappingFromFeatureMembers(featureMembers) {
    var mapping = {};
    featureMembers.forEach(member => {
        var shape = member.MonitoringPoint.shape;
        if (defined(shape.Point)) {
            var posString = shape.Point.pos;
            if (defined(posString.split)) {
                // Sometimes shape.Point.pos is actually an object, eg. {srsName: "http://www.opengis.net/def/crs/EPSG/0/4326"}
                var coords = posString.split(' ');
                if (coords.length === 2) {
                    var identifier = member.MonitoringPoint.identifier.toString();
                    mapping[identifier] = {
                        lat: coords[0],
                        lon: coords[1],
                        name: member.MonitoringPoint.name,
                        id: member.MonitoringPoint['gml:id'],
                        identifier: identifier,
                        type: member.MonitoringPoint.type && member.MonitoringPoint.type['xlink:href'],
                        chart: getChartTagFromFeatureIdentifier(identifier)
                    };
                    return mapping[identifier];
                }
            }
        } else {
            console.log('Non-point feature not shown. You may want `"representAsGeoJson": true`.', shape);
        }
    });
    return mapping;
}

/**
 * Converts the featureMapping output by createMappingFromFeatureMembers into columns for a TableStructure.
 * @param  {Object} featureMapping Keys = identifier, values = {lat, lon, name, id, identifier, type, chart}.
 * @param  {TableStructure} [tableStructure] Used to set the columns' tableStructure (parent). If it contains an 'identifier' column, output columns line up with it.
 * @return {TableColumn[]} An array of columns to add to observationTableStructure. Only include 'identifier' and 'chart' columns if no identifierColumn was provided.
 */
function createColumnsFromMapping(featureMapping, observationTableStructure) {
    var identifierColumn, identifiers;
    if (defined(observationTableStructure)) {
        identifierColumn = observationTableStructure.getColumnWithName('identifier');
    }
    if (defined(identifierColumn)) {
        identifiers = identifierColumn.values;
    } else {
        identifiers = Object.keys(featureMapping);
    }
    var rows = identifiers.map(identifier => featureMapping[identifier]);
    var columnOptions = {tableStructure: observationTableStructure};
    var result = [
        new TableColumn('type', rows.map(row => row.type), columnOptions),
        new TableColumn('name', rows.map(row => row.name), columnOptions),
        new TableColumn('id', rows.map(row => row.id), columnOptions),
        new TableColumn('lat', rows.map(row => row.lat), columnOptions),
        new TableColumn('lon', rows.map(row => row.lon), columnOptions)
    ];
    if (!defined(identifierColumn)) {
        result.push(
            new TableColumn('identifier', rows.map(row => row.identifier), columnOptions),
            new TableColumn('chart', rows.map(row => row.chart), columnOptions)
        );
    }
    return result;
}

function createGeoJsonItemFromFeatureMembers(item, featureMembers) {
    var geojson = {
        type: 'FeatureCollection',
        features: featureMembers.map(member => {
            var shape = member.MonitoringPoint.shape;
            var geometry;
            if (defined(shape.Point)) {
                var posString = shape.Point.pos;
                if (defined(posString.split)) {
                    // Sometimes shape.Point.pos is actually an object, eg. {srsName: "http://www.opengis.net/def/crs/EPSG/0/4326"}
                    var coords = posString.split(' ');
                    if (coords.length === 2) {
                        geometry = {
                            type: 'Point',
                            coordinates: [coords[1], coords[0]]
                        };
                    }
                }
            } else {
                console.log('Feature shape type not implemented.', shape);
            }
            return {
                type: 'Feature',
                geometry: geometry,
                properties: {
                    name: member.MonitoringPoint.name,
                    id: member.MonitoringPoint['gml:id'],
                    identifier: member.MonitoringPoint.identifier.toString(),
                    type: member.MonitoringPoint.type && member.MonitoringPoint.type['xlink:href']
                }
            };
        }).filter(geojson => defined(geojson.geometry))
    };
    var geoJsonItem = new GeoJsonCatalogItem(item.terria);
    geoJsonItem.data = featureDataToGeoJson(geojson);
    geoJsonItem.style = item.style; // For the future...
    return geoJsonItem;
}

/*
  Load the description of a sensor. In practice, it doesn't really contain anything useful.
  http://www.bom.gov.au/waterdata/services?service=SOS&version=2.0&request=DescribeSensor&procedureDescriptionFormat=http%3A%2F%2Fwww.opengis.net%2FsensorML%2F1.0.1&procedure=http%3A%2F%2Fbom.gov.au%2Fwaterdata%2Fservices%2Ftstypes%2FPat1_C_B_1
 */
// function loadDescription(sosItem) {
//     return querySos(sosItem, {
//         request: 'DescribeSensor',
//         procedure: sosItem.procedure,
//         procedureDescriptionFormat: 'http://www.opengis.net/sensorML/1.0.1'
//     }).then(function(sensorml) {
//         //var description = sensormljson.description.SensorDescription.data.SensorML.member; 
//         console.log('Sensor description: ', sensorml);
//     });
// }

/*
    Want to get more information about a location? 

    new urijs('http://www.bom.gov.au/waterdata/services').setQuery({service:'SOS',version:'2.0',request:'GetFeatureOfInterest',featureOfInterest:'http://bom.gov.au/waterdata/services/stations/401229'});
    http://www.bom.gov.au/waterdata/services?service=SOS&version=2.0&request=GetFeatureOfInterest&featureOfInterest=http%3A%2F%2Fbom.gov.au%2Fwaterdata%2Fservices%2Fstations%2F401229

    Point location buried in featureMember -> MonitoringPoint -> shape -> Point
    Warning: some IDs don't have locations (ie http://bom.gov.au/waterdata/services/stations/system)
*/

/**
 * Retrieve list of all "offerings" of this service.
 * Eg. http://www.bom.gov.au/waterdata/services?service=SOS&version=2.0&request=GetCapabilities
 * @private
 */
function loadCapabilities(item) {
    // Possible enhancement: we could look for features like GetRequest which is a CSV output:
    // http://sensiasoft.net:8181/sensorhub/sos?service=SOS&version=2.0&request=GetResult&offering=urn:mysos:offering03&observedProperty=http://sensorml.com/ont/swe/property/Weather&temporalFilter=phenomenonTime,2015-10-15T16:34:00Z/2015-10-15T17:34:00Z
    //
    // "Offerings" are various pre-defined aggregations of data along different dimensions and with different filters.
    // We don't necessarily want to expose them all to the end user. Also, they don't have nice IDs.
    return querySos(item, {
        request: 'GetCapabilities',
        temporalFilter: item.temporalFilter
    }).then(function(capabilities) {
        console.log('GetCapabilities:', capabilities);
        var offerings = capabilities.contents.Contents.offering.map(o => o.ObservationOffering);
        if (!Array.isArray(offerings)) {
            offerings = [offerings];
        }
        var observableProperties = capabilities.contents.Contents.observableProperty;
        if (!Array.isArray(observableProperties)) {
            observableProperties = [observableProperties];
        }
        console.log('offerings', offerings);
        console.log('observableProperties', observableProperties);
        return {
            offerings: offerings,
            observableProperties: observableProperties
        };
    });
}

function changedActiveItems() {
    console.log('[SensorObservationServiceCatalogItem]: changedActiveItems');
}

/**
 * Converts parameters {x: 'y'} into an array of {name: 'x', value: 'y'} objects.
 * Converts {x: [1, 2, ...]} into multiple objects:
 *   {name: 'x', value: 1}, {name: 'x', value: 2}, ...
 * @param  {Object} parameters eg. {a: 3, b: [6, 8]}
 * @return {Object[]} eg. [{name: 'a', value: 3}, {name: 'b', value: 6}, {name: 'b', value: 8}]
 */
function convertObjectToNameValueArray(parameters) {
    return Object.keys(parameters).reduce((result, key) => {
        var values = parameters[key];
        if (!Array.isArray(values)) {
            values = [values];
        }
        return result.concat(values.map(value => {
            return {
                name: key,
                value: value
            };
        }));
    }, []);
}

module.exports = SensorObservationServiceCatalogItem;