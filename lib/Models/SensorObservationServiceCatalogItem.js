"use strict";

/*global require*/
var i18next = require("i18next").default;
var Mustache = require("mustache");

var clone = require("terriajs-cesium/Source/Core/clone").default;
var defaultValue = require("terriajs-cesium/Source/Core/defaultValue").default;
var defined = require("terriajs-cesium/Source/Core/defined").default;

var DeveloperError = require("terriajs-cesium/Source/Core/DeveloperError")
  .default;

var JulianDate = require("terriajs-cesium/Source/Core/JulianDate").default;
var knockout = require("terriajs-cesium/Source/ThirdParty/knockout").default;
var loadWithXhr = require("../Core/loadWithXhr");
var when = require("terriajs-cesium/Source/ThirdParty/when").default;

var DisplayVariablesConcept = require("../Map/DisplayVariablesConcept");
var inherit = require("../Core/inherit");
var featureDataToGeoJson = require("../Map/featureDataToGeoJson");
var GeoJsonCatalogItem = require("./GeoJsonCatalogItem");
var overrideProperty = require("../Core/overrideProperty");
var proxyCatalogItemUrl = require("./proxyCatalogItemUrl");
var raiseErrorToUser = require("./raiseErrorToUser");
var TableCatalogItem = require("./TableCatalogItem");
var TableColumn = require("../Map/TableColumn");
var TableStructure = require("../Map/TableStructure");
var TerriaError = require("../Core/TerriaError");
var VariableConcept = require("../Map/VariableConcept");
var xml2json = require("../ThirdParty/xml2json");

/**
 * A {@link CatalogItem} representing data obtained from a Sensor Observation Service (SOS) 2.0 server.
 * The SOS specifications are available at http://www.opengeospatial.org/standards/sos .
 * This requires a json configuration file which specifies the procedures and observableProperties to show.
 * If more than one procedure or observableProperty is provided, the user can choose between the options.
 * Note because of this need for configuration, there is no SOS catalog "group" (yet).
 *
 * The offerings parameter is not used, and no spatial filters are provided.
 * The default soap XML request body can be overridden to handle custom requirements.
 *
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

  this._featureMapping = undefined;

  // A bunch of variables used to manage changing the active concepts (procedure and/or observable property),
  // so they can handle errors in the result, and so you cannot change active concepts while in the middle of loading observations.
  this._previousProcedureIdentifier = undefined;
  this._previousObservablePropertyIdentifier = undefined;
  this._loadingProcedureIdentifier = undefined;
  this._loadingObservablePropertyIdentifier = undefined;
  this._revertingConcepts = false;
  this._loadingFeatures = false;

  // Set during changedActiveItems, so tests can access the promise.
  this._observationDataPromise = undefined;

  /**
   * Gets or sets a flag. If true, the catalog item will load all features, then, if
   * number of features < requestSizeLimit * requestNumberLimit, it will load all the observation data
   * for those features, and show that.
   * If false, or there are too many features, the observation data is only loaded when the feature is clicked on
   * (via a chart in the feature info panel).
   * Defaults to true.
   * @type {Boolean}
   */
  this.tryToLoadObservationData = true;

  /**
   * Gets or sets the maximum number of timeseries to request of the server in a single GetObservation request.
   * Servers may have a Response Size Limit, eg. 250.
   * Note the number of responses may be different to the number requested,
   * eg. the BoM server can return > 1 timeseries/feature identifier, (such as ...stations/41001702),
   * so it can be sensible to set this below the response size limit.
   * @type {Integer}
   */
  this.requestSizeLimit = 200;

  /**
   * Gets or sets the maximum number of GetObservation requests that we can fire off at a time.
   * If the response size limit is 250, and this is 4, then observations for at most 1000 features will load.
   * If there are more than 1000 features, they will be shown without observation data, until they are clicked.
   * @type {Integer}
   */
  this.requestNumberLimit = 3;

  /**
   * Gets or sets the name seen by the user for the list of procedures.
   * Defaults to "Procedure", but eg. for BoM, "Frequency" would be better.
   * @type {String}
   */
  this.proceduresName = i18next.t("models.sensorObservationService.procedure");

  /**
   * Gets or sets the name seen by the user for the list of observable properties.
   * Defaults to "Property", but eg. for BoM, "Observation type" would be better.
   * @type {String}
   */
  this.observablePropertiesName = i18next.t(
    "models.sensorObservationService.property"
  );

  /**
   * Gets or sets the sensor observation service procedures that the user can choose from for this catalog item.
   * An array of objects with keys 'identifier', 'title' and (optionally) 'defaultDuration' and 'units', eg.
   *     [{
   *        identifier: 'http://bom.gov.au/waterdata/services/tstypes/Pat7_C_B_1_YearlyMean',
   *        title: 'Annual Mean',
   *        defaultDuration: '20y'  // Final character must be s, h, d or y for seconds, hours, days or years.
   *     }]
   * The identifier is used for communication with the server, and the title is used for display to the user.
   * If there is only one object, the user is not presented with a choice.
   * @type {Object[]}
   */
  this.procedures = undefined;

  /**
   * Gets or sets the sensor observation service observableProperties that the user can choose from for this catalog item.
   * An array of objects with keys 'identifier', 'title' and (optionally) 'defaultDuration' and 'units', eg.
   *     [{
   *        identifier: 'http://bom.gov.au/waterdata/services/parameters/Storage Level',
   *        title: 'Storage Level',
   *        units: 'metres'
   *     }]
   * The identifier is used for communication with the server, and the title is used for display to the user.
   * If there is only one object, the user is not presented with a choice.
   * @type {Object[]}
   */
  this.observableProperties = undefined;

  /**
   * Gets or sets the index of the initially selected procedure. Defaults to 0.
   * @type {Number}
   */
  this.initialProcedureIndex = 0;

  /**
   * Gets or sets the index of the initially selected observable property. Defaults to 0.
   * @type {Number}
   */
  this.initialObservablePropertyIndex = 0;

  /**
   * A start date in ISO8601 format. All requests filter to this start date. Set to undefined for no temporal filter.
   * @type {String}
   */
  this.startDate = undefined;

  /**
   * An end date in ISO8601 format. All requests filter to this end date. Set to undefined to use the current date.
   * @type {String}
   */
  this.endDate = undefined;

  /**
   * Gets or sets a flag for whether to display all features at all times, when tryToLoadObservationData is True.
   * This can help the UX if the server returns some features starting in 1990 and some starting in 1995,
   * so that the latter still appear (as grey points with no data) in 1990.
   * It works by adding artificial rows to the table for each feature at the start and end of the total date range,
   * if not already present.
   * Set to false (the default) to only show points when they have data (including invalid data).
   * Set to true to display points even at times that the server does not return them.
   */
  this.showFeaturesAtAllTimes = false;

  /**
   * A flag to choose between representing the underlying data as a TableStructure or as GeoJson.
   * Geojson representation is not fully implemented - eg. currently only points are supported.
   * Set to true for geojson. This can allow for non-point data (once the code is written).
   * Set to false (the default) for table structure. This allows all the TableStyle options, and a better legend.
   */
  this.representAsGeoJson = false;

  /**
   * Whether to include the list of procedures in GetFeatureOfInterest calls, so that only locations that support
   * those procedures are returned. For some servers (such as BoM's Water Data Online), this causes the request to time out.
   * @default true
   */
  this.filterByProcedures = true;

  /**
   * If set, an array of IDs. Only station IDs that match these will be included.
   */
  this.stationIdWhitelist = undefined;

  /**
   * If set, an array of IDs. Only station IDs that don't match these will be included.
   */
  this.stationIdBlacklist = undefined;

  // Which columns of the tableStructure define a unique feature.
  // Use both because sometimes identifier is not unique (!).
  this._idColumnNames = ["identifier", "id"];

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

  knockout.track(this, ["_concepts"]);

  overrideProperty(this, "concepts", {
    get: function() {
      return this._concepts;
    }
  });

  // See explanation in the comments for TableCatalogItem.
  overrideProperty(this, "dataViewId", {
    get: function() {
      // We need an id that depends on the selected concepts.
      if (defined(this.procedures) && defined(this.observableProperties)) {
        var procedure = getObjectCorrespondingToSelectedConcept(
          this,
          "procedures"
        );
        var observableProperty = getObjectCorrespondingToSelectedConcept(
          this,
          "observableProperties"
        );
        return [
          (procedure && procedure.identifier) || "",
          (observableProperty && observableProperty.identifier) || ""
        ].join("-");
      }
    }
  });

  knockout.defineProperty(this, "activeConcepts", {
    get: function() {
      return this._concepts.map(function(parent) {
        return parent.items.filter(function(concept) {
          return concept.isActive;
        });
      });
    }
  });

  knockout.getObservable(this, "activeConcepts").subscribe(function() {
    // If we are in the middle of reverting concepts back to previous values, just ignore.
    if (this._revertingConcepts) {
      return;
    }
    // If we are in the middle of loading the features themselves, a change is fine and will happen with no further intervention.
    if (this._loadingFeatures) {
      return;
    }
    // If either of these names is not available, the user is probably in the middle of a change
    // (when for a brief moment either 0 or 2 items are selected). So ignore.
    var procedure = getObjectCorrespondingToSelectedConcept(this, "procedures");
    var observableProperty = getObjectCorrespondingToSelectedConcept(
      this,
      "observableProperties"
    );
    if (!defined(procedure) || !defined(observableProperty)) {
      return;
    }
    // If we are loading data (other than the feature data), do not allow a change.
    if (this.isLoading) {
      revertConceptsToPrevious(
        this,
        this._loadingProcedureIdentifier,
        this._loadingObservablePropertyIdentifier
      );
      var error = new TerriaError({
        sender: this,
        title: i18next.t("models.sensorObservationService.alreadyLoadingTitle"),
        message: i18next.t(
          "models.sensorObservationService.alreadyLoadingMessage"
        )
      });
      raiseErrorToUser(this.terria, error);
    } else {
      changedActiveItems(this);
    }
  }, this);
};

SensorObservationServiceCatalogItem.defaultRequestTemplate = require("./SensorObservationServiceRequestTemplate.xml");

inherit(TableCatalogItem, SensorObservationServiceCatalogItem);

Object.defineProperties(SensorObservationServiceCatalogItem.prototype, {
  /**
   * Gets the type of data member represented by this instance.
   * @memberOf SensorObservationServiceCatalogItem.prototype
   * @type {String}
   */
  type: {
    get: function() {
      return "sos";
    }
  },

  /**
   * Gets a human-readable name for this type of data source, 'GPX'.
   * @memberOf SensorObservationServiceCatalogItem.prototype
   * @type {String}
   */
  typeName: {
    get: function() {
      return i18next.t("models.sensorObservationService.sos");
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
  dataSource: {
    get: function() {
      if (defined(this._geoJsonItem)) {
        return this._geoJsonItem.dataSource;
      } else if (defined(this._dataSource)) {
        return this._dataSource;
      }
      return undefined;
    }
  }
});

/**
 * Gets or sets the default set of properties that are serialized when serializing a {@link CatalogItem}-derived for a
 * share link.
 * @type {String[]}
 */
SensorObservationServiceCatalogItem.defaultPropertiesForSharing = clone(
  TableCatalogItem.defaultPropertiesForSharing
);
SensorObservationServiceCatalogItem.defaultPropertiesForSharing.push(
  "initialProcedureIndex"
);
SensorObservationServiceCatalogItem.defaultPropertiesForSharing.push(
  "initialObservablePropertyIndex"
);
Object.freeze(SensorObservationServiceCatalogItem.defaultPropertiesForSharing);

SensorObservationServiceCatalogItem.defaultSerializers = clone(
  TableCatalogItem.defaultSerializers
);
SensorObservationServiceCatalogItem.defaultSerializers.activeConcepts = function() {
  // Don't serialize.
};
Object.freeze(SensorObservationServiceCatalogItem.defaultSerializers);

// Just the items that would influence the load from the abs server or the file
SensorObservationServiceCatalogItem.prototype._getValuesThatInfluenceLoad = function() {
  return [this.url];
};

SensorObservationServiceCatalogItem.prototype._load = function() {
  var that = this;
  if (!that.url) {
    return undefined;
  }
  that._loadingFeatures = true;
  that._concepts = buildConcepts(that);
  return loadFeaturesOfInterest(that)
    .then(function() {
      that._loadingFeatures = false;
      return loadObservationData(that);
    })
    .otherwise(function(e) {
      throw e;
    });
};

function loadSoapBody(item, templateContext) {
  var postDataTemplate = defaultValue(
    item.requestTemplate,
    SensorObservationServiceCatalogItem.defaultRequestTemplate
  );
  const xml = Mustache.render(postDataTemplate, templateContext);
  return loadWithXhr({
    url: proxyCatalogItemUrl(item, item.url, "0d"),
    responseType: "document",
    method: "POST",
    overrideMimeType: "text/xml",
    data: xml,
    headers: { "Content-Type": "application/soap+xml" }
  }).then(function(xml) {
    if (!defined(xml)) {
      return;
    }
    var json = xml2json(xml);
    if (json.Exception) {
      var errorMessage = i18next.t(
        "models.sensorObservationService.unknownError"
      );
      if (json.Exception.ExceptionText) {
        errorMessage = i18next.t(
          "models.sensorObservationService.exceptionMessage",
          { exceptionText: json.Exception.ExceptionText }
        );
      }
      throw new TerriaError({
        sender: item,
        title: item.name,
        message: errorMessage
      });
    }
    if (!defined(json.Body)) {
      throw new TerriaError({
        sender: item,
        title: item.name,
        message: i18next.t("models.sensorObservationService.missingBody")
      });
    }
    return json.Body;
  });
}

/**
 * Return the Mustache template context "temporalFilters" for this item.
 * If a "defaultDuration" parameter (eg. 60d or 12h) exists on either
 * procedure or observableProperty, restrict to that duration from item.endDate.
 * @param  {SensorObservationServiceCatalogItem} item This catalog item.
 * @param  {Object} [procedure] An element from the item.procedures array.
 * @param  {Object} [observableProperty] An element from the item.observableProperties array.
 * @return {Object[]} An array of {index, startDate, endDate}, or undefined.
 */
function getTemporalFiltersContext(item, procedure, observableProperty) {
  var defaultDuration =
    (procedure && procedure.defaultDuration) ||
    (observableProperty && observableProperty.defaultDuration);
  // If the item has no endDate, use the current datetime (to nearest second).
  var endDateIso8601 =
    item.endDate || JulianDate.toIso8601(JulianDate.now(), 0);
  if (defined(defaultDuration)) {
    var startDateIso8601 = addDurationToIso8601(
      endDateIso8601,
      "-" + defaultDuration
    );
    // This is just a string-based comparison, so timezones could make it up to 1 day wrong.
    // That much error is fine here.
    if (startDateIso8601 < item.startDate) {
      startDateIso8601 = item.startDate;
    }
    return [{ index: 1, startDate: startDateIso8601, endDate: endDateIso8601 }];
  } else {
    // If there is no procedure- or property-specific duration, use the item's start and end dates, if any.
    if (item.startDate) {
      return [{ index: 1, startDate: item.startDate, endDate: endDateIso8601 }];
    }
  }
}

SensorObservationServiceCatalogItem.getObjectCorrespondingToSelectedConcept = function(
  item,
  conceptIdAndItemKey
) {
  if (item[conceptIdAndItemKey].length === 1) {
    return item[conceptIdAndItemKey][0];
  } else {
    var parentConcept = item._concepts.filter(
      concept => concept.id === conceptIdAndItemKey
    )[0];
    var activeConceptIndices = parentConcept.items.filter(
      concept => concept.isActive
    );
    if (activeConceptIndices.length === 1) {
      var identifier = activeConceptIndices[0].id;
      var matches = item[conceptIdAndItemKey].filter(
        element => element.identifier === identifier
      );
      return matches[0];
    }
  }
};

function getObjectCorrespondingToSelectedConcept(item, conceptIdAndItemKey) {
  return SensorObservationServiceCatalogItem.getObjectCorrespondingToSelectedConcept(
    item,
    conceptIdAndItemKey
  );
}

function getConceptIndexOfIdentifier(item, conceptIdAndItemKey, identifier) {
  if (item[conceptIdAndItemKey].length === 1) {
    return 0;
  } else {
    var parentConcept = item._concepts.filter(
      concept => concept.id === conceptIdAndItemKey
    )[0];
    return parentConcept.items.map(concept => concept.id).indexOf(identifier);
  }
}

function observationResponsesToTableStructure(
  item,
  procedure,
  observableProperty,
  responses
) {
  // Iterate over all the points in all the time series in all the observations in all the bodies to get individual result rows.
  function extractValues(response) {
    var observationData =
      response.GetObservationResponse &&
      response.GetObservationResponse.observationData;
    if (defined(observationData)) {
      if (!Array.isArray(observationData)) {
        observationData = [observationData];
      }
      var observations = observationData.map(o => o.OM_Observation);
      observations.forEach(observation => {
        if (!defined(observation)) {
          return;
        }
        var points = observation.result.MeasurementTimeseries.point;
        if (!defined(points)) {
          return;
        }
        if (!Array.isArray(points)) {
          points = [points];
        }
        var measurements = points.map(point => point.MeasurementTVP); // TVP = Time value pairs, I think.
        // var procedureTitle = defined(observation.procedure) ? observation.procedure['xlink:title'] : 'value';
        // var featureName = observation.featureOfInterest['xlink:title'];
        var featureIdentifier = observation.featureOfInterest["xlink:href"];
        dateValues.push(
          ...measurements.map(measurement =>
            typeof measurement.time === "object" ? null : measurement.time
          )
        );
        valueValues.push(
          ...measurements.map(measurement =>
            typeof measurement.value === "object"
              ? null
              : parseFloat(measurement.value)
          )
        );
        // These 5 arrays constitute columns in the table, some of which (like this one) have the same
        // value in each row.
        featureValues.push(...measurements.map(_ => featureIdentifier));
        procedureValues.push(...measurements.map(_ => procedure.identifier));
        observedPropertyValues.push(
          ...measurements.map(_ => observableProperty.identifier)
        );
      });
    }
  }
  var dateValues = [],
    valueValues = [],
    featureValues = [],
    procedureValues = [],
    observedPropertyValues = [];

  // extract columns from response
  responses.forEach(extractValues);
  // Now turn all the columns of dates, values etc into a single table structure
  var observationTableStructure = new TableStructure("observations");
  var columnOptions = { tableStructure: observationTableStructure };
  var timeColumn = new TableColumn("date", dateValues, columnOptions);

  var units = observableProperty.units || procedure.units;
  var valueTitle =
    observableProperty.title +
    " " +
    procedure.title +
    (defined(units) ? " (" + units + ")" : "");
  var valueColumn = new TableColumn(valueTitle, valueValues, columnOptions);
  valueColumn.id = "value";
  valueColumn.units = units;

  var featureColumn = new TableColumn(
    "identifier",
    featureValues,
    columnOptions
  ); // featureColumn.id must be 'identifier', used as an idColumn.

  var procedureColumn = new TableColumn(
    item.proceduresName,
    procedureValues,
    columnOptions
  );

  var observedPropertyColumn = new TableColumn(
    item.observablePropertiesName,
    observedPropertyValues,
    columnOptions
  );

  observationTableStructure.columns = [
    timeColumn,
    valueColumn,
    featureColumn,
    procedureColumn,
    observedPropertyColumn
  ];
  return observationTableStructure;
}

/**
 * Returns a promise to a table structure of sensor observation data, given one/multiple featureOfInterest identifiers.
 * Uses the currently active concepts to determine the procedure and observedProperty filter.
 * Then batches GetObservation requests to actually fetch the values for that procedure and property at that site(s).
 * This is required by Chart.jsx for any non-csv format (which passes the chart's source url as the sole argument.)
 * @param  {String|String[]} featureOfInterestIdentifiers The featureOfInterest identifier, or array thereof.
 * @param {Object} options Object with the following properties:
 * @param {Object} [options.procedure] An object overriding the selected procedure, for instance from chart generated items being regenerated.
 * @return {Promise} A promise which resolves to a TableStructure.
 */
SensorObservationServiceCatalogItem.prototype.loadIntoTableStructure = function(
  featureOfInterestIdentifiers,
  options = {}
) {
  var item = this;
  if (!Array.isArray(featureOfInterestIdentifiers)) {
    featureOfInterestIdentifiers = [featureOfInterestIdentifiers];
  }
  var requestNumber = 0;
  var requests = [];
  var procedure = getObjectCorrespondingToSelectedConcept(item, "procedures");
  if (defined(options.procedure)) {
    procedure = options.procedure;
  }

  var observableProperty = getObjectCorrespondingToSelectedConcept(
    item,
    "observableProperties"
  );
  // If either of these names is not available, the user is probably in the middle of a change
  // (when for a brief moment either 0 or 2 items are selected). So ignore.
  if (
    !defined(procedure.identifier) ||
    !defined(observableProperty.identifier)
  ) {
    return when();
  }
  for (
    var startFeatureNumber = 0;
    startFeatureNumber < featureOfInterestIdentifiers.length;
    startFeatureNumber += this.requestSizeLimit
  ) {
    var theseFeatureIdentifiers = featureOfInterestIdentifiers.slice(
      startFeatureNumber,
      startFeatureNumber + this.requestSizeLimit
    );
    var paramArray = convertObjectToNameValueArray({
      procedure: procedure.identifier,
      observedProperty: observableProperty.identifier,
      featureOfInterest: theseFeatureIdentifiers // eg. 'http://bom.gov.au/waterdata/services/stations/425022'
    });
    const templateContext = {
      action: "GetObservation",
      actionClass: "core",
      parameters: paramArray,
      temporalFilters: getTemporalFiltersContext(
        item,
        procedure,
        observableProperty
      )
    };
    requests.push(loadSoapBody(item, templateContext));

    requestNumber++;
    if (requestNumber >= this.requestNumberLimit) {
      break;
    }
  }
  // Could improve UX by showing features as they are returned. For now, wait until we have them all.
  return when
    .all(requests)
    .then(responses =>
      observationResponsesToTableStructure(
        item,
        procedure,
        observableProperty,
        responses
      )
    )
    .otherwise(function(e) {
      // Improve the error reporting in the case that the error response is XML like this:
      // <ExceptionReport>
      //   <Exception exceptionCode="ResponseExceedsSizeLimit">
      //     <ExceptionText>The search terms matched more than 250 timeseries in the datasource...
      if (!defined(e.message) && defined(e.response)) {
        var json = xml2json(e.response);
        throw new TerriaError({
          sender: item,
          title: json.Exception && json.Exception.exceptionCode,
          message: json.Exception && json.Exception.ExceptionText
        });
      }
      throw e;
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
      if (console && console.log) {
        console.log(new Error("This data source is already shown."));
      }
      return;
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
      throw new DeveloperError("This data source is not shown.");
    }
    dataSources.remove(this._dataSource, false);
  }
};

SensorObservationServiceCatalogItem.prototype.showOnSeparateMap = function(
  globeOrMap
) {
  if (defined(this._geoJsonItem)) {
    return this._geoJsonItem.showOnSeparateMap(globeOrMap);
  } else {
    return TableCatalogItem.prototype.showOnSeparateMap.bind(this)(globeOrMap);
  }
};

/*
 * Performs the GetFeatureOfInterest request to obtain the locations of sources of data that match the required
 * observed properties and procedures.
 * @param {SensorObservationServiceCatalogItem} item
 * @return Promise for the request.
 */
function loadFeaturesOfInterest(item) {
  const filter = {
    observedProperty: item.observableProperties.map(
      observable => observable.identifier
    ) // eg. 'http://bom.gov.au/waterdata/services/parameters/Storage Level'
  };
  if (item.filterByProcedures) {
    filter.procedure = item.procedures.map(procedure => procedure.identifier); // eg. 'http://bom.gov.au/waterdata/services/tstypes/Pat7_C_B_1_YearlyMean',
  }
  const templateContext = {
    action: "GetFeatureOfInterest",
    actionClass: "foiRetrieval",
    parameters: convertObjectToNameValueArray(filter)
  };
  return loadSoapBody(item, templateContext)
    .then(function(body) {
      var featuresResponse = body.GetFeatureOfInterestResponse;
      // var locations = featuresResponse.featureMember.map(x=>x.MonitoringPoint.shape.Point.pos.text);
      if (!featuresResponse) {
        throw new TerriaError({
          sender: item,
          title: item.name,
          message: i18next.t("models.sensorObservationService.noFeatures")
        });
      }
      if (!defined(featuresResponse.featureMember)) {
        throw new TerriaError({
          sender: item,
          title: item.name,
          message: i18next.t("models.sensorObservationService.unknownFormat")
        });
      }
      var featureMembers = featuresResponse.featureMember;
      if (!Array.isArray(featureMembers)) {
        featureMembers = [featureMembers];
      }
      if (item.stationIdWhitelist) {
        featureMembers = featureMembers.filter(
          m =>
            m.MonitoringPoint &&
            item.stationIdWhitelist.indexOf(
              String(m.MonitoringPoint.identifier)
            ) >= 0
        );
      }
      if (item.stationIdBlacklist) {
        featureMembers = featureMembers.filter(
          m =>
            m.MonitoringPoint &&
            !item.stationIdBlacklist.indexOf(
              String(m.MonitoringPoint.identifier)
            ) >= 0
        );
      }
      if (item.representAsGeoJson) {
        item._geoJsonItem = createGeoJsonItemFromFeatureMembers(
          item,
          featureMembers
        );
        return item._geoJsonItem.load().then(function() {
          item.rectangle = item._geoJsonItem.rectangle;
          return;
        });
      } else {
        item._featureMapping = createMappingFromFeatureMembers(featureMembers);
      }
    })
    .otherwise(function(e) {
      throw e;
    });
}

/**
 * Given the features already loaded into item._featureMap, this loads the observations according to the user-selected concepts,
 * and puts them into item._tableStructure.
 * If there are too many features, fall back to a tableStructure without the observation data.
 * @param  {SensorObservationServiceCatalogItem} item This catalog item.
 * @return {Promise} A promise which, when it resolves, sets item._tableStructure.
 * @private
 */
function loadObservationData(item) {
  if (!item._featureMapping) {
    return;
  }
  var featuresOfInterest = Object.keys(item._featureMapping);
  // Are there too many features to load observations (or we've been asked not to try)?
  if (
    !item.tryToLoadObservationData ||
    featuresOfInterest.length > item.requestSizeLimit * item.requestNumberLimit
  ) {
    // MODE 1. Do not load observation data for the features.
    // Just show where the features are, and when the feature info panel is opened, then load the feature's observation data
    // (via the 'chart' column in _tableStructure, which generates a call to item.loadIntoTableStructure).
    var tableStructure = item._tableStructure;
    if (!defined(tableStructure)) {
      tableStructure = new TableStructure(item.name);
    }
    var columns = createColumnsFromMapping(item, tableStructure);
    tableStructure.columns = columns;
    if (!defined(item._tableStructure)) {
      item._tableStyle.dataVariable = null; // Turn off the legend and give all the points a single colour.
      item.initializeFromTableStructure(tableStructure);
    } else {
      item._tableStructure.columns = tableStructure.columns;
    }
    return when();
  }
  // MODE 2. Create a big time-varying tableStructure with all the observations for all the features.
  // In this mode, the feature info panel shows a chart through as a standard time-series, like it would for any time-varying csv.
  return item
    .loadIntoTableStructure(featuresOfInterest)
    .then(function(observationTableStructure) {
      if (
        !defined(observationTableStructure) ||
        observationTableStructure.columns[0].values.length === 0
      ) {
        throw new TerriaError({
          sender: item,
          title: item.name,
          message: i18next.t(
            "models.sensorObservationService.noMatchingFeatures"
          )
        });
      }
      // Add the extra columns from the mapping into the table.
      var identifiers = observationTableStructure.getColumnWithName(
        "identifier"
      ).values;
      var newColumns = createColumnsFromMapping(
        item,
        observationTableStructure,
        identifiers
      );
      observationTableStructure.activeTimeColumnNameIdOrIndex = undefined;
      observationTableStructure.columns = observationTableStructure.columns.concat(
        newColumns
      );
      observationTableStructure.idColumnNames = item._idColumnNames;
      if (item.showFeaturesAtAllTimes) {
        // Set finalEndJulianDate so that adding new null-valued feature rows doesn't mess with the final date calculations.
        // To do this, we need to set the active time column, so that finishJulianDates is calculated.
        observationTableStructure.setActiveTimeColumn(
          item.tableStyle.timeColumn
        );
        var finishDates = observationTableStructure.finishJulianDates.map(d =>
          Number(JulianDate.toDate(d))
        );
        // I thought we'd need to unset the time column, because we're about to change the columns again, and there can be interactions
        // - but it works without unsetting it.
        // observationTableStructure.setActiveTimeColumn(undefined);
        observationTableStructure.finalEndJulianDate = JulianDate.fromDate(
          new Date(Math.max.apply(null, finishDates))
        );
        observationTableStructure.columns = observationTableStructure.getColumnsWithFeatureRowsAtStartAndEndDates(
          "date",
          "value"
        );
      }
      if (!defined(item._tableStructure)) {
        observationTableStructure.name = item.name;
        item.initializeFromTableStructure(observationTableStructure);
      } else {
        observationTableStructure.setActiveTimeColumn(
          item.tableStyle.timeColumn
        );
        // Moving this isActive statement earlier stops all points appearing on the map/globe.
        observationTableStructure.columns.filter(
          column => column.id === "value"
        )[0].isActive = true;
        item._tableStructure.columns = observationTableStructure.columns; // TODO: doesn't do anything.
        // Force the timeline (terria.clock) to update by toggling "isShown" (see CatalogItem's isShownChanged).
        if (item.isShown) {
          item.isShown = false;
          item.isShown = true;
        }
        // Changing the columns triggers a knockout change of the TableDataSource that uses this table.
      }
    });
}

/**
 * Returns an array of procedure and/or observableProperty concepts,
 * and sets item._previousProcedureIdentifier and _previousObservablePropertyIdentifier.
 * @private
 */
function buildConcepts(item) {
  var concepts = [];
  if (!defined(item.procedures) || !defined(item.observableProperties)) {
    throw new DeveloperError(
      "Both `procedures` and `observableProperties` arrays must be defined on the catalog item."
    );
  }
  if (item.procedures.length > 1) {
    var concept = new DisplayVariablesConcept(item.proceduresName);
    concept.id = "procedures"; // must match the key of item['procedures']
    concept.requireSomeActive = true;
    concept.items = item.procedures.map((value, index) => {
      return new VariableConcept(value.title || value.identifier, {
        parent: concept,
        id: value.identifier, // used in the SOS request to identify the procedure.
        active: index === item.initialProcedureIndex
      });
    });
    concepts.push(concept);
    item._previousProcedureIdentifier =
      concept.items[item.initialProcedureIndex].id;
    item._loadingProcedureIdentifier =
      concept.items[item.initialProcedureIndex].id;
  }
  if (item.observableProperties.length > 1) {
    concept = new DisplayVariablesConcept(item.observablePropertiesName);
    concept.id = "observableProperties";
    concept.requireSomeActive = true;
    concept.items = item.observableProperties.map((value, index) => {
      return new VariableConcept(value.title || value.identifier, {
        parent: concept,
        id: value.identifier, // used in the SOS request to identify the procedure.
        active: index === item.initialObservablePropertyIndex
      });
    });
    concepts.push(concept);
    item._previousObservablePropertyIdentifier =
      concept.items[item.initialObservablePropertyIndex].id;
    item._loadingObservablePropertyIdentifier =
      concept.items[item.initialObservablePropertyIndex].id;
  }
  return concepts;
}

function getChartTagFromFeatureIdentifier(identifier, chartId) {
  // Including a chart id which depends on the frequency serves an important purpose: it means that something about the chart has changed,
  // which tells the FeatureInfoSection React component to re-render.
  // The feature's definitionChanged event triggers when the feature's properties change, but if this chart tag doesn't change,
  // React does not know to re-render the chart.
  if (defined(chartId)) {
    chartId = ' id="' + encodeURIComponent(chartId) + '"';
  } else {
    chartId = "";
  }
  return (
    '<chart src="' +
    identifier +
    '" can-download="false"' +
    chartId +
    "></chart>"
  );
}

/**
 * Converts the featureMembers into a mapping from identifier to its lat/lon and other info.
 * @param  {Object[]} featureMembers An array of feature members as returned by GetFeatureOfInterest in body.GetFeatureOfInterestResponse.featuresResponse.featureMember.
 * @return {Object} Keys = identifier, values = {lat, lon, name, id, identifier, type, chart}.
 * @private
 */
function createMappingFromFeatureMembers(featureMembers) {
  var mapping = {};
  featureMembers.forEach(member => {
    var shape = member.MonitoringPoint.shape;
    if (defined(shape.Point)) {
      var posString = shape.Point.pos;
      if (defined(posString.split)) {
        // Sometimes shape.Point.pos is actually an object, eg. {srsName: "http://www.opengis.net/def/crs/EPSG/0/4326"}
        var coords = posString.split(" ");
        if (coords.length === 2) {
          var identifier = member.MonitoringPoint.identifier.toString();
          mapping[identifier] = {
            lat: coords[0],
            lon: coords[1],
            name: member.MonitoringPoint.name,
            id: member.MonitoringPoint["gml:id"],
            identifier: identifier,
            type:
              member.MonitoringPoint.type &&
              member.MonitoringPoint.type["xlink:href"]
          };
          return mapping[identifier];
        }
      }
    } else {
      throw new DeveloperError(
        "Non-point feature not shown. You may want to implement `representAsGeoJson`. " +
          JSON.stringify(shape)
      );
    }
  });
  return mapping;
}

/**
 * Converts the featureMapping output by createMappingFromFeatureMembers into columns for a TableStructure.
 * @param  {SensorObservationServiceCatalogItem} item This catalog item.
 * @param  {TableStructure} [tableStructure] Used to set the columns' tableStructure (parent). If identifiers given, output columns line up with them.
 * @param  {String[]} identifiers An array of identifier values from tableStructure. Defaults to all available identifiers.
 * @return {TableColumn[]} An array of columns to add to observationTableStructure. Only include 'identifier' and 'chart' columns if no identifiers provided.
 * @private
 */
function createColumnsFromMapping(item, tableStructure, identifiers) {
  var featureMapping = item._featureMapping;
  var addChartColumn = !defined(identifiers);
  if (!defined(identifiers)) {
    identifiers = Object.keys(featureMapping);
  }
  var rows = identifiers.map(identifier => featureMapping[identifier]);
  var columnOptions = { tableStructure: tableStructure };
  var chartColumnOptions = { tableStructure: tableStructure, id: "chart" }; // So the chart column can be referred to in the FeatureInfoTemplate as 'chart'.
  var result = [
    new TableColumn("type", rows.map(row => row.type), columnOptions),
    new TableColumn("name", rows.map(row => row.name), columnOptions),
    new TableColumn("id", rows.map(row => row.id), columnOptions),
    new TableColumn("lat", rows.map(row => row.lat), columnOptions),
    new TableColumn("lon", rows.map(row => row.lon), columnOptions)
  ];
  if (addChartColumn) {
    var procedure = getObjectCorrespondingToSelectedConcept(item, "procedures");
    var observableProperty = getObjectCorrespondingToSelectedConcept(
      item,
      "observableProperties"
    );
    var chartName = procedure.title || observableProperty.title || "chart";
    var chartId = procedure.title + "_" + observableProperty.title;
    var charts = rows.map(row =>
      getChartTagFromFeatureIdentifier(row.identifier, chartId)
    );
    result.push(
      new TableColumn(
        "identifier",
        rows.map(row => row.identifier),
        columnOptions
      ),
      new TableColumn(chartName, charts, chartColumnOptions)
    );
  }
  return result;
}

function createGeoJsonItemFromFeatureMembers(item, featureMembers) {
  var geojson = {
    type: "FeatureCollection",
    features: featureMembers
      .map(member => {
        var shape = member.MonitoringPoint.shape;
        var geometry;
        if (defined(shape.Point)) {
          var posString = shape.Point.pos;
          if (defined(posString.split)) {
            // Sometimes shape.Point.pos is actually an object, eg. {srsName: "http://www.opengis.net/def/crs/EPSG/0/4326"}
            var coords = posString.split(" ");
            if (coords.length === 2) {
              geometry = {
                type: "Point",
                coordinates: [coords[1], coords[0]]
              };
            }
          }
        } else {
          throw new DeveloperError(
            "Feature shape type not implemented. " + JSON.stringify(shape)
          );
        }
        return {
          type: "Feature",
          geometry: geometry,
          properties: {
            name: member.MonitoringPoint.name,
            id: member.MonitoringPoint["gml:id"],
            identifier: member.MonitoringPoint.identifier.toString(),
            type:
              member.MonitoringPoint.type &&
              member.MonitoringPoint.type["xlink:href"]
          }
        };
      })
      .filter(geojson => defined(geojson.geometry))
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
// function loadDescription(item) {
//     return querySos(item, {
//         request: 'DescribeSensor',
//         procedure: item.procedure,
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

function revertConceptsToPrevious(
  item,
  previousProcedureIdentifier,
  previousObservablePropertyIdentifier
) {
  var parentConcept;
  item._revertingConcepts = true;
  // Use the flag above to signify that we do not want to trigger a reload.
  if (defined(previousProcedureIdentifier)) {
    parentConcept = item._concepts.filter(
      concept => concept.id === "procedures"
    )[0];
    // Toggle the old value on again (unless it is already on). This auto-toggles-off the new value.
    var old =
      parentConcept &&
      parentConcept.items.filter(
        concept =>
          !concept.isActive && concept.id === previousProcedureIdentifier
      )[0];
    if (defined(old)) {
      old.toggleActive();
    }
  }
  if (defined(previousObservablePropertyIdentifier)) {
    parentConcept = item._concepts.filter(
      concept => concept.id === "observableProperties"
    )[0];
    old =
      parentConcept &&
      parentConcept.items.filter(
        concept =>
          !concept.isActive &&
          concept.id === previousObservablePropertyIdentifier
      )[0];
    if (defined(old)) {
      old.toggleActive();
    }
  }
  item._revertingConcepts = false;
}

function changedActiveItems(item) {
  // If either of these names is not available, the user is probably in the middle of a change
  // (when for a brief moment either 0 or 2 items are selected). So ignore.
  var procedure = getObjectCorrespondingToSelectedConcept(item, "procedures");
  var observableProperty = getObjectCorrespondingToSelectedConcept(
    item,
    "observableProperties"
  );
  if (!defined(procedure) || !defined(observableProperty)) {
    return;
  }
  item.isLoading = true;
  item._loadingProcedureIdentifier = procedure.identifier;
  item._loadingObservablePropertyIdentifier = observableProperty.identifier;
  item._observationDataPromise = loadObservationData(item)
    .then(function() {
      item.isLoading = false;
      // Save the current values of these concepts so we can fall back to them if there's an error moving to a new set.
      item._previousProcedureIdentifier = procedure.identifier;
      item._previousObservablePropertyIdentifier =
        observableProperty.identifier;
      // And save them for sharing.
      item.initialProcedureIndex = getConceptIndexOfIdentifier(
        item,
        "procedures",
        procedure.identifier
      );
      item.initialObservablePropertyIndex = getConceptIndexOfIdentifier(
        item,
        "observableProperties",
        observableProperty.identifier
      );
    })
    .otherwise(function(e) {
      revertConceptsToPrevious(
        item,
        item._previousProcedureIdentifier,
        item._previousObservablePropertyIdentifier
      );
      item.isLoading = false;
      raiseErrorToUser(item.terria, e);
    });
}

/**
 * Converts parameters {x: 'y'} into an array of {name: 'x', value: 'y'} objects.
 * Converts {x: [1, 2, ...]} into multiple objects:
 *   {name: 'x', value: 1}, {name: 'x', value: 2}, ...
 * @param  {Object} parameters eg. {a: 3, b: [6, 8]}
 * @return {Object[]} eg. [{name: 'a', value: 3}, {name: 'b', value: 6}, {name: 'b', value: 8}]
 * @private
 */
function convertObjectToNameValueArray(parameters) {
  return Object.keys(parameters).reduce((result, key) => {
    var values = parameters[key];
    if (!Array.isArray(values)) {
      values = [values];
    }
    return result.concat(
      values.map(value => {
        return {
          name: key,
          value: value
        };
      })
    );
  }, []);
}

var scratchJulianDate = new JulianDate();
/**
 * Adds a period to an iso8601-formatted date.
 * Periods must be (positive or negative) numbers followed by a letter:
 * s (seconds), h (hours), d (days), y (years).
 * To avoid confusion between minutes and months, do not use m.
 * @param  {String} dateIso8601 The date in ISO8601 format.
 * @param  {String} durationString The duration string, in the format described.
 * @return {String} A date string in ISO8601 format.
 * @private
 */
function addDurationToIso8601(dateIso8601, durationString) {
  if (!defined(dateIso8601) || dateIso8601.length < 3) {
    throw new DeveloperError("Bad date " + dateIso8601);
  }
  var duration = parseFloat(durationString);
  if (isNaN(duration) || duration === 0) {
    throw new DeveloperError("Bad duration " + durationString);
  }
  var julianDate = JulianDate.fromIso8601(dateIso8601, scratchJulianDate);
  var units = durationString.slice(durationString.length - 1);
  if (units === "s") {
    julianDate = JulianDate.addSeconds(julianDate, duration, scratchJulianDate);
  } else if (units === "h") {
    julianDate = JulianDate.addHours(julianDate, duration, scratchJulianDate);
  } else if (units === "d") {
    // Use addHours on 24 * numdays - on my casual reading of addDays, it needs an integer.
    julianDate = JulianDate.addHours(
      julianDate,
      duration * 24,
      scratchJulianDate
    );
  } else if (units === "y") {
    var days = Math.round(duration * 365);
    julianDate = JulianDate.addDays(julianDate, days, scratchJulianDate);
  } else {
    throw new DeveloperError(
      'Unknown duration type "' + durationString + '" (use s, h, d or y)'
    );
  }
  return JulianDate.toIso8601(julianDate);
}

// THE COMMENTED FUNCTIONS BELOW SHOW HOW TO LOAD ALL THE AVAILABLE PROCEDURES AND OBSERVABLEPROPERTIES FOR A SERVICE.
//
// var URI = require('urijs');
// var loadText = require('terriajs-cesium/Source/Core/loadText');

// function querySos(sosGroup, options) {
//     var url = new URI(sosGroup.url)
//         .query({ service: 'SOS', version: '2.0' })
//         .addQuery(options)
//         .toString();

//     return loadText(proxyCatalogItemUrl(sosGroup, url, '0d'))
//         .then(xml2json);
// }
// /**
//  * Retrieve list of all "offerings" of this service.
//  * Eg. http://www.bom.gov.au/waterdata/services?service=SOS&version=2.0&request=GetCapabilities
//  * @private
//  */
// function loadCapabilities(item) {
//     // Possible enhancement: we could look for features like GetRequest which is a CSV output:
//     // http://sensiasoft.net:8181/sensorhub/sos?service=SOS&version=2.0&request=GetResult&offering=urn:mysos:offering03&observedProperty=http://sensorml.com/ont/swe/property/Weather&temporalFilter=phenomenonTime,2015-10-15T16:34:00Z/2015-10-15T17:34:00Z
//     //
//     // "Offerings" are various pre-defined aggregations of data along different dimensions and with different filters.
//     // We don't necessarily want to expose them all to the end user. Also, they don't have nice IDs.
//     return querySos(item, {
//         request: 'GetCapabilities'
//     }).then(function(capabilities) {
//         console.log('GetCapabilities:', capabilities);
//         var offerings = capabilities.contents.Contents.offering.map(o => o.ObservationOffering);
//         if (!Array.isArray(offerings)) {
//             offerings = [offerings];
//         }
//         var observableProperties = capabilities.contents.Contents.observableProperty;
//         if (!Array.isArray(observableProperties)) {
//             observableProperties = [observableProperties];
//         }
//         console.log('offerings', offerings);
//         console.log('observableProperties', observableProperties);
//         return {
//             offerings: offerings,
//             observableProperties: observableProperties
//         };
//     });
// }

module.exports = SensorObservationServiceCatalogItem;
