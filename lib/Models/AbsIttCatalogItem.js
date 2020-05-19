"use strict";

/*global require*/
var URI = require("urijs");

var clone = require("terriajs-cesium/Source/Core/clone").default;
var defaultValue = require("terriajs-cesium/Source/Core/defaultValue").default;
var defined = require("terriajs-cesium/Source/Core/defined").default;

var DeveloperError = require("terriajs-cesium/Source/Core/DeveloperError")
  .default;

var knockout = require("terriajs-cesium/Source/ThirdParty/knockout").default;
var loadJson = require("../Core/loadJson");
var loadText = require("../Core/loadText");
var objectToQuery = require("terriajs-cesium/Source/Core/objectToQuery")
  .default;
var when = require("terriajs-cesium/Source/ThirdParty/when").default;

var AbsConcept = require("../Map/AbsConcept");
var arrayProduct = require("../Core/arrayProduct");
var arraysAreEqual = require("../Core/arraysAreEqual");
var inherit = require("../Core/inherit");
var overrideProperty = require("../Core/overrideProperty");
var proxyCatalogItemUrl = require("./proxyCatalogItemUrl");
var RegionMapping = require("../Models/RegionMapping");
var TableCatalogItem = require("./TableCatalogItem");
var TableColumn = require("../Map/TableColumn");
var TableStructure = require("../Map/TableStructure");
var TerriaError = require("../Core/TerriaError");
var VarSubType = require("../Map/VarSubType");
var VarType = require("../Map/VarType");
var i18next = require("i18next").default;

var allowedRegionCodes = [
  "AUS",
  "STE",
  "SA4",
  "SA3",
  "SA2",
  "SA1",
  "CED",
  "LGA",
  "POA",
  "SED"
]; // These should be made a parameter.

/*
    The ABS ITT format available at http://stat.abs.gov.au/itt/query.jsp provides the following methods:
        method=GetDatasetConcepts & datasetid=...               & format=json
        method=GetCodeListValue   & datasetid=... & concept=... & format=json
        method=GetGenericData     & datasetid=... & and=<CONCEPT_NAME>.<CONCEPT_VALUE>,<CONCEPT2_NAME>.<CONCEPT2_VALUE>,... & or=REGION & format=csv

    GetDatasetConcepts gives us the available concepts to use in GetCodeListValue.
    However, we should ignore STATE, FREQUENCY, and whatever the regionConcept is (defaults to "REGION").

    GetCodeListValue gives us the list of the possible values for a concept, which may be in a tree.

    E.g. Here are the URLs requested for the 'Age' catalog item:

    http://stat.abs.gov.au/itt/query.jsp?method=GetDatasetConcepts&datasetid=ABS_CENSUS2011_B04&format=json
        {
            concepts: ["FREQUENCY", "STATE", "AGE", "REGIONTYPE", "MEASURE", "REGION"],
            copyright: "ABS (c) copyright Commonwealth of Australia 2016. Retrieved on 15/01/2016 at 9:24"
        }

    via loadFunc
    http://stat.abs.gov.au/itt/query.jsp?method=GetCodeListValue&datasetid=ABS_CENSUS2011_B04&concept=AGE&format=json
    http://stat.abs.gov.au/itt/query.jsp?method=GetCodeListValue&datasetid=ABS_CENSUS2011_B04&concept=REGIONTYPE&format=json
    http://stat.abs.gov.au/itt/query.jsp?method=GetCodeListValue&datasetid=ABS_CENSUS2011_B04&concept=MEASURE&format=json

        {
            codes: Array[102],
            copyright: "ABS (c) copyright Commonwealth of Australia 2015. Retrieved on 29/06/2015 at 15:53"
        }

        For AGE, codes is an Array[102] like:
        {
            code: "0" / "1" / "2" / "3" / "4" / etc
            description: "0" / "1" / "2" / "3" / "4"
            parentCode: "A04"
            parentDescription: "0-4 years"
        },
        {
            code: "TT",
            description: "Total all ages",
            parentCode: "",
            parentDescription: ""
        },
        {
            code: "A04" / "A59" / etc
            description: "0-4 years" / "5-9 years"
            parentCode: ""
            parentDescription: ""
        }

        For REGIONTYPE, codes is an Array[5] of:
        {
            code: "AUS" / "STE" / "SA2" / "SA3" / "SA4"
            description: "Australia" / "States and Territories" / etc
            parentCode: ""
            parentDescription: ""
        }

        For MEASURE, codes is an Array[3] of:
        {
            code: "2" / "1" / "3"
            description: "Females" / "Males" / "Persons"
            parentCode: "3"
            parentDescription: "Persons"
        }

    http://stat.abs.gov.au/itt/query.jsp?method=GetGenericData&datasetid=ABS_CENSUS2011_B04&and=REGIONTYPE.SA4%2CAGE.A04%2CMEASURE.3&or=REGION&format=csv
    http://stat.abs.gov.au/itt/query.jsp?method=GetGenericData&datasetid=ABS_CENSUS2011_B04&and=REGIONTYPE.SA4%2CAGE.A59%2CMEASURE.3&or=REGION&format=csv
    http://stat.abs.gov.au/itt/query.jsp?method=GetGenericData&datasetid=ABS_CENSUS2011_B04&and=REGIONTYPE.SA4%2CAGE.A10%2CMEASURE.3&or=REGION&format=csv
    http://stat.abs.gov.au/itt/query.jsp?method=GetGenericData&datasetid=ABS_CENSUS2011_B04&and=REGIONTYPE.SA4%2CAGE.A15%2CMEASURE.3&or=REGION&format=csv

    The first is a csv file with 107 lines, eg.
    Time    Value   REGION  Description
    2011    12005   101 Capital Region
    2011    19003   102 Central Coast
    2011    13009   103 Central West
    ...

    We also provide the file data/abs_names.json for human-readable names:
        {
            AGE: "Age",
            ANCP: "Ancestry",
            BPLP: "Country of Birth", …
            "MEASURE" : {
                "Persons" : "Sex",
                "85 years and over" : "Age",
                "*" : "Measure"
            }
        }

    To convert the csv file above into a table consistent with the csv-geo-au format, we would want, for each region type:
    sa1_code_2011 Description "Region Percentage" "0-4 years Males"  -- adding a column for each selected age.

        with Description and "Region Percentage" not shown in the Now Viewing,
        and the selected ages shown in a different way to normal csvs:
        - potentially in a tree
        - with the ability to select more than one
        - with ages shown that are not in the csv yet, but could be added.

 */

/**
 * A {@link CatalogItem} representing region-mapped data obtained from the Australia Bureau of Statistics
 * (ABS) ITT query interface.  Documentation for the query interface is found here: http://stat.abs.gov.au/itt/r.jsp?api
 *
 * @alias AbsIttCatalogItem
 * @constructor
 * @extends TableCatalogItem
 *
 * @param {Terria} terria The Terria instance.
 * @param {String} [url] The base URL from which to retrieve the data.
 */
var AbsIttCatalogItem = function(terria, url) {
  TableCatalogItem.call(this, terria, url);

  /**
   * Gets or sets the ID of the ABS dataset.  You can obtain a list of all datasets by querying
   * http://stat.abs.gov.au/itt/query.jsp?method=GetDatasetList (or equivalent).  This property
   * is observable.
   * @type {String}
   */
  this.datasetId = undefined;

  /**
   * Gets or sets whether this item can show percentages instead of raw values.  This property is observable.
   * @type {Boolean}
   * @default true
   */
  this.canDisplayPercent = true;

  /**
   * Gets or sets whether to show percentages or raw values.  This property is observable.
   * @type {Boolean}
   * @default true
   */
  this.displayPercent = true;

  /**
   * Gets or sets the ABS region-type concept id used with the region code to set the region type.
   * Usually defaults to 'REGIONTYPE'.
   * This property is observable.
   * @type {String}
   */
  this.regionTypeConcept = undefined;

  /**
   * Gets or sets the ABS region concept id. Defaults to 'REGION'.
   * This property is observable.
   * @type {String}
   */
  this.regionConcept = undefined;

  /**
   * Gets or sets the URL of a JSON file containing human-readable names of Australian Bureau of Statistics concept codes.
   * @type {String}
   */
  this.conceptNamesUrl = undefined;

  /**
   * Gets or sets the start of a URL of a csv file containing the total number of people in each region, eg.
   * SA4,Tot_P_M,Tot_P_F,Tot_P_P
   * 101,100000,23450,123450
   * 102,130000,100000,234560
   * The region code and '.csv' are appended to the end of this URL for the request, eg.
   * 'data/2011Census_TOT_' -> 'data/2011Census_TOT_SA4.csv' (and other region types).
   * @type {String}
   */
  this.regionPopulationsUrlPrefix = undefined;

  /**
   * Gets the list of initial concepts and codes on which to filter the data.  You can obtain a list of all available
   * concepts for a dataset by querying http://stat.abs.gov.au/itt/query.jsp?method=GetDatasetConcepts&datasetid=ABS_CENSUS2011_B25
   * (or equivalent) and a list of the possible values for a concept by querying
   * http://stat.abs.gov.au/itt/query.jsp?method=GetCodeListValue&datasetid=ABS_CENSUS2011_B25&concept=MEASURE&format=json.
   * @type {Array}
   * @editorformat table
   */
  this.filter = [];

  /**
   * Gets or sets the array of concept ids which should not be loaded.
   * Defaults to ['STATE', 'FREQUENCY', and the region concept (which defaults to 'REGION')].
   * @type {String[]}
   */
  this.conceptsNotToLoad = undefined;

  /**
   * Gets or sets the array of ids of concepts which are single-valued, in addition to the region type.
   * @type {String[]}
   */
  this.uniqueValuedConcepts = [];

  this._baseUrl = undefined;
  // These contain raw downloaded data used during the loading process.
  this._conceptIds = undefined;
  this._conceptNamesMap = undefined;
  this._conceptCodes = [];
  // These contain cached promises
  this._loadConceptsPromise = undefined;
  this._loadConceptIdsAndNameMapPromise = undefined;
  this._loadDataFilePromise = {}; // cached promises resolving to loaded data files, keyed by the 'and' parameter.

  // The array of AbsConcepts to display in the NowViewing panel.
  this._concepts = [];

  // Tracking _concepts makes this a circular object.
  // _concepts (via concepts) is both set and read in rebuildData.
  // A solution to this would be to make concepts a Promise, but that would require changing the UI side.
  knockout.track(this, [
    "datasetId",
    "displayPercent",
    "canDisplayPercent",
    "_concepts"
  ]);

  overrideProperty(this, "concepts", {
    get: function() {
      return this._concepts;
    }
  });

  knockout
    .getObservable(this, "displayPercent")
    .subscribe(rebuildData.bind(null, this), this);
};

inherit(TableCatalogItem, AbsIttCatalogItem);

Object.defineProperties(AbsIttCatalogItem.prototype, {
  /**
   * Gets the type of data member represented by this instance.
   * @memberOf AbsIttCatalogItem.prototype
   * @type {String}
   */
  type: {
    get: function() {
      return "abs-itt";
    }
  },

  /**
   * Gets a human-readable name for this type of data source, 'GPX'.
   * @memberOf AbsIttCatalogItem.prototype
   * @type {String}
   */
  typeName: {
    get: function() {
      return i18next.t("models.abs.name");
    }
  },

  /**
   * Gets the set of names of the properties to be serialized for this object for a share link.
   * @memberOf ImageryLayerCatalogItem.prototype
   * @type {String[]}
   */
  propertiesForSharing: {
    get: function() {
      return AbsIttCatalogItem.defaultPropertiesForSharing;
    }
  },

  /**
   * Gets the set of functions used to serialize individual properties in {@link CatalogMember#serializeToJson}.
   * When a property name on the model matches the name of a property in the serializers object literal,
   * the value will be called as a function and passed a reference to the model, a reference to the destination
   * JSON object literal, and the name of the property.
   * @memberOf AbsIttCatalogItem.prototype
   * @type {Object}
   */
  serializers: {
    get: function() {
      return AbsIttCatalogItem.defaultSerializers;
    }
  }
});

/**
 * Gets or sets the default set of properties that are serialized when serializing a {@link CatalogItem}-derived for a
 * share link.
 * @type {String[]}
 */
AbsIttCatalogItem.defaultPropertiesForSharing = clone(
  TableCatalogItem.defaultPropertiesForSharing
);
AbsIttCatalogItem.defaultPropertiesForSharing.push("filter");
AbsIttCatalogItem.defaultPropertiesForSharing.push("regionConcept");
AbsIttCatalogItem.defaultPropertiesForSharing.push("regionTypeConcept");
AbsIttCatalogItem.defaultPropertiesForSharing.push("displayPercent");
Object.freeze(AbsIttCatalogItem.defaultPropertiesForSharing);

AbsIttCatalogItem.defaultSerializers = clone(
  TableCatalogItem.defaultSerializers
);

AbsIttCatalogItem.defaultSerializers.filter = function(item, json) {
  // Create the 'filter' that would start us off with the same active items as are currently shown.
  var nestedFilter = item._concepts.map(function(concept) {
    return concept.toFilter();
  });
  json.filter = nestedFilter.reduce(function(a, b) {
    return a.concat(b);
  }, []);
};

Object.freeze(AbsIttCatalogItem.defaultSerializers);

//Just the items that would influence the load from the abs server or the file
AbsIttCatalogItem.prototype._getValuesThatInfluenceLoad = function() {
  return [this.url, this.datasetId];
};

AbsIttCatalogItem.prototype._load = function() {
  var that = this;
  // Set some defaults.
  this._baseUrl = cleanAndProxyUrl(this, this.url);
  this.conceptNamesUrl = defaultValue(
    this.conceptNamesUrl,
    "data/abs_names.json"
  );
  this.regionPopulationsUrlPrefix = defaultValue(
    this.regionPopulationsUrlPrefix,
    "data/2011Census_TOT_"
  );
  this.regionTypeConcept = defaultValue(this.regionTypeConcept, "REGIONTYPE");
  this.regionConcept = defaultValue(this.regionConcept, "REGION");
  this.conceptsNotToLoad = ["STATE", "FREQUENCY", this.regionConcept]; // Nicer to make this an updateable parameter.

  that._tableStructure = new TableStructure(that.name, {
    displayDuration: that._tableStyle.displayDuration
  });
  that._regionMapping = new RegionMapping(
    that,
    that._tableStructure,
    that._tableStyle
  );
  return rebuildData(that);
};

AbsIttCatalogItem.prototype.startPolling = function() {
  // Polling is not available on ABS ITT items.
};

// TODO: Sometimes these errors do not actually reach the end user, because they are thrown inside a promise.
function throwLoadError(item, methodName) {
  throw new TerriaError({
    sender: item,
    title: i18next.t("models.abs.itemNotAvailableTitle"),
    message: i18next.t("models.abs.itemNotAvailableMessage", {
      methodName: methodName,
      email:
        '<a href="mailto:' +
        item.terria.supportEmail +
        '">' +
        item.terria.supportEmail +
        "</a>"
    })
  });
}

function throwDataColumnsError(item, columnNames) {
  throw new TerriaError({
    sender: item,
    title: i18next.t("models.abs.unexpectedFormatTitle"),
    message: i18next.t("models.abs.unexpectedFormatMessage", {
      email:
        '<a href="mailto:' +
        item.terria.supportEmail +
        '">' +
        item.terria.supportEmail +
        "</a>"
    })
  });
}

function throwDataMergeError(item) {
  throw new TerriaError({
    sender: item,
    title: i18next.t("models.abs.dataMergeErrorTitle"),
    message: i18next.t("models.abs.dataMergeErrorMessage", {
      email:
        '<a href="mailto:' +
        item.terria.supportEmail +
        '">' +
        item.terria.supportEmail +
        "</a>"
    })
  });
}

/**
 * Returns a promise which, when resolved, indicates that item._conceptIds and item._conceptNamesMap are loaded.
 * @private
 * @param  {AbsIttCatalogItem} item This catalog item.
 * @return {Promise} Promise which, when resolved, indicates that item._conceptIds and item._conceptNamesMap are loaded.
 */
function loadConceptIdsAndConceptNameMap(item) {
  if (!defined(item._loadConceptIdsAndNameMapPromise)) {
    var parameters = {
      method: "GetDatasetConcepts",
      datasetid: item.datasetId,
      format: "json"
    };
    var datasetConceptsUrl = item._baseUrl + "?" + objectToQuery(parameters);
    var loadDatasetConceptsPromise = loadJson(datasetConceptsUrl)
      .then(function(json) {
        item._conceptIds = json.concepts;
        if (
          json.concepts.indexOf(item.regionConcept) === -1 ||
          json.concepts.indexOf("REGIONTYPE") === -1
        ) {
          throw new DeveloperError(
            "datasetId " +
              item.datasetId +
              " concepts [" +
              json.concepts.join(", ") +
              '] do not include "' +
              item.regionConcept +
              '" and "REGIONTYPE".'
          );
        }
      })
      .otherwise(throwLoadError.bind(null, item, "GetDatasetConcepts"));
    var loadConceptNamesPromise = loadJson(item.conceptNamesUrl).then(function(
      json
    ) {
      item._conceptNamesMap = json;
    });

    item._loadConceptIdsAndNameMapPromise = when.all([
      loadConceptNamesPromise,
      loadDatasetConceptsPromise
    ]);
    // item.concepts and item.conceptNameMap are now defined with the results.
  }
  return item._loadConceptIdsAndNameMapPromise;
}

// Among other things, rebuildData is triggered when the active items are changed.
// This leads to double-triggering on regions: when the old item is deactivated, and when the new one is activated.
// Since loads are cached, it isn't a problem. It would be nice to find a way around it though.
function rebuildData(item) {
  if (!defined(item._regionMapping)) {
    // This can happen when you open a shared URL with displayRegionPercent defined, since that has a ko subscription above.
    return when();
  }
  item._regionMapping.isLoading = true;
  return loadConceptIdsAndConceptNameMap(item)
    .then(function() {
      return loadConcepts(item);
    })
    .then(function() {
      return loadDataFiles(item);
    })
    .then(function(tableStructuresAndCombinations) {
      item._tableStructure.columns = buildTableColumns(
        item,
        tableStructuresAndCombinations
      );
      if (item._tableStructure.columns.length === 0) {
        // Nothing to show, so the attempt to redraw will fail; need to explicitly hide the existing regions.
        item._regionMapping.hideImageryLayer();
        item.terria.currentViewer.notifyRepaintRequired();
      }
      return item._regionMapping.loadRegionDetails();
    })
    .then(function(regionDetails) {
      // Can get here with undefined region column name, hence no regionDetails.
      if (regionDetails) {
        item._regionMapping.setRegionColumnType();
        // Force a recalc of the imagery.
        // Required because we load the region details _after_ setting the active column.
        item._regionMapping.isLoading = false;
      }
      return when();
    });
}

/**
 * Loads concept codes.
 * As they are loaded, each is processed into a tree of AbsCodes under an AbsConcept.
 * Returns a promise which, when resolved, indicates that item._concepts is complete.
 * The promise is cached, since the promise won't ever change for a given datasetId.
 * @private
 * @param  {AbsIttCatalogItem} item This catalog item.
 * @return {Promise} Promise.
 */
function loadConcepts(item) {
  if (!defined(item._loadConceptsPromise)) {
    var absConcepts = [];
    var promises = item._conceptIds
      .filter(function(conceptId) {
        return item.conceptsNotToLoad.indexOf(conceptId) === -1;
      })
      .map(function(conceptId) {
        var parameters = {
          method: "GetCodeListValue",
          datasetid: item.datasetId,
          concept: conceptId,
          format: "json"
        };
        var conceptCodesUrl = item._baseUrl + "?" + objectToQuery(parameters);

        return loadJson(conceptCodesUrl)
          .then(function(json) {
            // If this is a region type, only include valid region codes (eg. AUS, SA4, but not GCCSA).
            // Valid region codes must have a total population data file, eg. data/2011Census_TOT_SA4.csv
            var codes = json.codes;
            if (conceptId === item.regionTypeConcept) {
              codes = codes.filter(function(absCode) {
                return allowedRegionCodes.indexOf(absCode.code) >= 0;
              });
            }
            // We have loaded the file, process it into an AbsConcept.
            var concept = new AbsConcept({
              id: conceptId,
              codes: codes,
              filter: item.filter,
              allowMultiple: !(
                conceptId === item.regionTypeConcept ||
                item.uniqueValuedConcepts.indexOf(conceptId) >= 0
              ),
              activeItemsChangedCallback: function() {
                // Close any picked features, as the description of any associated with this catalog item may change.
                item.terria.pickedFeatures = undefined;
                rebuildData(item);
              }
            });
            // Give the concept its human-readable name.
            concept.name = getHumanReadableConceptName(
              item._conceptNamesMap,
              concept
            );
            absConcepts.push(concept);
          })
          .otherwise(throwLoadError.bind(null, item, "GetCodeListValue"));
      });

    item._loadConceptsPromise = when.all(promises).then(function() {
      // All the AbsConcept objects have been created, we just need to order them correctly and save them.
      // Put the region type concept first.
      var makeFirst = item.regionTypeConcept;
      absConcepts.sort(function(a, b) {
        return a.id === makeFirst
          ? -1
          : b.id === makeFirst
          ? 1
          : a.name > b.name
          ? 1
          : -1;
      });
      item._concepts = absConcepts;
    });
  }
  return item._loadConceptsPromise;
}

/**
 * Given a concept object with name and possibly items properties, return its human-readable version.
 * @private
 * @param  {Object} conceptNameMap An object whose keys are the concept.names, eg. "ANCP".
 *         Values may be Strings (eg. "Ancestry"), or
 *         a 'code map' (eg. "MEASURE" : {"Persons": "Sex", "85 years and over": "Age", "*": "Measure"}.
 * @param  {AbsConcept} concept An object with a name property and, if a codemap is to be used, an items array of objects with a name property.
 *         In that case, it finds the first of those names to appear as a key in the code map. The value of this property is returned. (Phew!)
 * @return {String} Human-readable concept name.
 */
function getHumanReadableConceptName(conceptNameMap, concept) {
  if (!defined(conceptNameMap[concept.name])) {
    return concept.name; // Default to the name given in the file.
  }
  if (typeof conceptNameMap[concept.name] === "string") {
    return conceptNameMap[concept.name];
  } else {
    var codeMap = conceptNameMap[concept.name];
    for (var j = 0; j < concept.items.length; j++) {
      if (defined(codeMap[concept.items[j].name])) {
        return codeMap[concept.items[j].name];
      }
    }
    // Use the wildcard, if defined, or else fall back to the name in the file.
    return codeMap["*"] || concept.name;
  }
}

// Returns the active regiontype code, eg. SA4, or undefined if none _or more than one_ active.
function getActiveRegionTypeCode(item) {
  // We always put the region first, and at most one is active.
  var activeRegions = item._concepts[0].activeItems;
  if (activeRegions.length === 1) {
    return activeRegions[0].code;
  }
}

function loadTableStructure(item, csvString) {
  var tableStructure = new TableStructure("ABS_ITT");
  tableStructure.loadFromCsv(csvString);
  return tableStructure;
}

/**
 * Loads all the datafiles for this catalog item, given the active concepts.
 * @private
 * @param  {AbsIttCatalogItem} item The AbsIttCatalogItem instance.
 * @return {Promise} A Promise which resolves to an object of TableStructures for each loaded dataset,
 * with the total populations as the final one; and the active combinations.
 */
function loadDataFiles(item) {
  // An array of arrays, indexed by activeItemsPerConcept[conceptIndex][codeIndex].
  var activeCodesPerConcept = item._concepts.map(function(concept) {
    return concept.activeItems;
  });

  // If any one of the concepts has no active selection, there will be no files to load.
  for (var i = activeCodesPerConcept.length - 1; i >= 0; i--) {
    if (activeCodesPerConcept[i].length === 0) {
      return when();
    }
  }

  // If there is no valid region selected (including when there are two!), stop.
  if (!defined(getActiveRegionTypeCode(item))) {
    return when();
  }

  // Find every possible combination, taking a single code from each concept.
  var activeCombinations = arrayProduct(activeCodesPerConcept);

  // Construct the 'and' part of the requests by combining concept.id and the AbsCode.name,
  // eg. and=REGIONTYPE.SA4,AGE.A04,MEASURE.3
  var andParameters = activeCombinations.map(function(codes) {
    return codes
      .map(function(code, index) {
        return code.concept.id + "." + code.code;
      })
      .join(",");
  });

  var loadDataPromises = andParameters.map(function(andParameter) {
    // Build a promise which resolves once this datafile has loaded (unless we have cached this promise already).
    // Note in the original there was different cacheing stuff... but not sure if it was being used?
    if (!defined(item._loadDataFilePromise[andParameter])) {
      var parameters = {
        method: "GetGenericData",
        datasetid: item.datasetId,
        and: andParameter,
        or: item.regionConcept,
        format: "csv"
      };
      var url = item._baseUrl + "?" + objectToQuery(parameters);
      item._loadDataFilePromise[andParameter] = loadText(url).then(
        loadTableStructure.bind(undefined, item)
      );
    }
    return item._loadDataFilePromise[andParameter];
  });

  var totalPopulationsUrl =
    item.regionPopulationsUrlPrefix + getActiveRegionTypeCode(item) + ".csv";
  loadDataPromises.push(
    loadText(totalPopulationsUrl).then(loadTableStructure.bind(undefined, item))
  );

  return when.all(loadDataPromises).then(function(tableStructures) {
    return {
      tableStructures: tableStructures,
      activeCombinations: activeCombinations
    };
  });
}

// Given the loaded data files in their TableStructures, create a suitably named array of columns, from their "Value" columns.
function buildValueColumns(item, tableStructures, activeCombinations) {
  // The tableStructures are from the raw data files, one per activeCombinations.
  return tableStructures.map(function(tableStructure, index) {
    var columnNames = tableStructure.getColumnNames();
    // Check that the data is not blank, and that the column names are ["Time", "Value", "REGION" (or equivalent), "Description"]
    if (columnNames.length === 0) {
      throwLoadError(item, "GetGenericData");
    } else if (
      !arraysAreEqual(columnNames, [
        "Time",
        "Value",
        item.regionConcept,
        "Description"
      ])
    ) {
      throwDataColumnsError(item, columnNames);
    }
    var absCodes = activeCombinations[index];
    // Pull out and clone the 'Value' column, and rename it to match all the codes except the region type, eg. Persons 0-4 years.
    var valueColumn = tableStructure.columns[columnNames.indexOf("Value")];
    var valueName = absCodes
      .filter(function(absCode) {
        return absCode.concept.id !== item.regionTypeConcept;
      })
      .map(function(absCode) {
        return absCode.name.trim();
      })
      .reverse() // It would be nice to specify a preferred order of codes here; reverse because "Persons 0-4 years" sounds better than "0-4 years Persons".
      .join(" ");
    valueColumn = new TableColumn(
      valueName,
      valueColumn.values,
      valueColumn.options
    );
    return valueColumn;
  });
}

/**
 * This builds the columns for the table data source.
 * @private
 * @param  {AbsIttCatalogItem} item This catalog item instance.
 * @param  {Object} tableStructuresAndCombinations The output from loadDataFiles.
 * @return {TableColumn[]} The columns.
 */
function buildTableColumns(item, tableStructuresAndCombinations) {
  if (!defined(tableStructuresAndCombinations)) {
    // Invalid selection, eg. missing a selected code for a concept.
    return []; // Remove current columns.
  }
  var tableStructures = tableStructuresAndCombinations.tableStructures;
  var activeCombinations = tableStructuresAndCombinations.activeCombinations;
  if (tableStructures.length <= 1) {
    throwLoadError(item, "GetGenericData");
  }
  // The last element of the tableStructures is the total population.
  var totalPopulationTableStructure = tableStructures.pop();

  var firstTableStructure = tableStructures[0];
  var timeColumn = firstTableStructure.columns[0];
  var regionColumn = firstTableStructure.columns[2];
  var isTimeVarying =
    defined(timeColumn) && timeColumn.minimumValue !== timeColumn.maximumValue;
  // If there is time variation, for now, let's turn off the displayPercent option.
  // (since we don't have time-varying population data yet)
  if (isTimeVarying) {
    item.canDisplayPercent = false;
    item.displayPercent = false;
  } else {
    item.canDisplayPercent = true; // Assume we can unless proven otherwise.
  }

  var newColumns = buildValueColumns(item, tableStructures, activeCombinations);
  var totalSelectedColumn = new TableColumn(
    "Total selected",
    TableColumn.sumValues(newColumns),
    {
      active: !item.displayPercent
    }
  );
  // If there's more than one combination selected, add the total selected.
  if (newColumns.length > 1) {
    newColumns.push(totalSelectedColumn);
  } else if (!item.displayPercent) {
    // If there's only one value column, activate it.
    newColumns[0].isActive = true;
  }

  // Only add the total population columns if there is no time variation
  // (for now, since we don't have time-varying population data)
  if (!isTimeVarying) {
    var totalPopColumns = totalPopulationTableStructure.columns;
    // Check that the regions correspond in the two tables.  Assume total popn table has regions as first column.
    if (
      !arraysAreEqual(
        totalPopColumns[0].values.slice(0, regionColumn.values.length),
        regionColumn.values
      )
    ) {
      console.error(
        "Region ordering is different between total population data file and ABS data set."
      );
      // Activate the last value column, turn off percentDisplay and don't add the total population columns.
      item.canDisplayPercent = false;
      item.displayPercent = false;
      newColumns[newColumns.length - 1].isActive = true;
    } else {
      var totalPopColumn = new TableColumn(
        "Total population",
        totalPopColumns[totalPopColumns.length - 1].values.slice(
          0,
          regionColumn.values.length
        )
      );
      newColumns.push(totalPopColumn);
      var percentValues = TableColumn.divideValues(
        totalSelectedColumn,
        totalPopColumn,
        0
      ).map(function(fraction) {
        return fraction < 0.01
          ? Math.round(fraction * 1000) / 10
          : Math.round(fraction * 10000) / 100;
      });
      newColumns.push(
        new TableColumn("Total selected percent", percentValues, {
          active: item.displayPercent
        })
      );
    }
  }
  // Rename the region column to conform to csv-geo-au.
  // Since only one regiontype code can be selected, all combinations have the same regiontype.
  // (Don't use getActiveRegionTypeCode() because the UI might no longer reflect which regiontype was loaded.)
  // Just use the first time from the time column; we assume these are all the same (eg. 2011).
  var loadedRegionCode = activeCombinations[0].filter(function(absCode) {
    return absCode.concept.id === item.regionTypeConcept;
  })[0];
  var regionColumnName = regionTypeToCsvGeo(loadedRegionCode.code, timeColumn);

  // Make sure the Time and REGION columns match across columns (apart from the totalPopulationTableStructure).
  // Don't worry about Description - it is a description of the region, which we get from the region mapping anyway.
  if (!isTimeVarying) {
    timeColumn.options.type = VarType.SCALAR; // Otherwise we can get a spurious clock.
  }
  timeColumn = new TableColumn("Year", timeColumn.values, timeColumn.options);
  regionColumn = new TableColumn(
    regionColumnName,
    regionColumn.values,
    regionColumn.options
  );
  tableStructures.slice(1).forEach(function(tableStructure) {
    if (
      !arraysAreEqual(tableStructure.columns[0], timeColumn) ||
      !arraysAreEqual(tableStructure.columns[2], regionColumn)
    ) {
      throwDataMergeError(item);
    }
  });

  // Put these columns to the front of the value columns.
  newColumns.unshift(timeColumn);
  newColumns.unshift(regionColumn);

  return newColumns;
}

function regionTypeToCsvGeo(regionType, timeColumn) {
  // aus is left as aus, but all others (sa1, sa2, sa3, sa4, ste etc)
  // are converted to sa4_code_2011 (if timeColumn is YEAR and all values are the same),
  // or sa4_code if not. (Replacing sa4 with the given regionType.)
  var lowerCaseRegionType = regionType.toLowerCase();
  if (lowerCaseRegionType === "aus") {
    return lowerCaseRegionType;
  } else {
    if (
      timeColumn.subtype === VarSubType.YEAR &&
      timeColumn.minimumValue === timeColumn.maximumValue
    ) {
      return lowerCaseRegionType + "_code_" + timeColumn.minimumValue;
    } else {
      return lowerCaseRegionType + "_code";
    }
  }
}

// cleanAndProxyUrl appears in a few catalog items - we should split it into its own Core file.

function cleanUrl(url) {
  // Strip off the search portion of the URL
  var uri = new URI(url);
  uri.search("");
  return uri.toString();
}

function cleanAndProxyUrl(catalogItem, url) {
  return proxyCatalogItemUrl(catalogItem, cleanUrl(url));
}

module.exports = AbsIttCatalogItem;
