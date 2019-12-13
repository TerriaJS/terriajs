"use strict";

import i18next from "i18next";
/*global require*/
var defined = require("terriajs-cesium/Source/Core/defined").default;
var defaultValue = require("terriajs-cesium/Source/Core/defaultValue").default;
var DeveloperError = require("terriajs-cesium/Source/Core/DeveloperError")
  .default;
var JulianDate = require("terriajs-cesium/Source/Core/JulianDate").default;
var loadText = require("../Core/loadText");
var loadJson = require("../Core/loadJson");
var TimeInterval = require("terriajs-cesium/Source/Core/TimeInterval").default;
var when = require("terriajs-cesium/Source/ThirdParty/when").default;

var TerriaError = require("../Core/TerriaError");
var xml2json = require("../ThirdParty/xml2json");
var URI = require("urijs");

/*
Encapsulates one entry in regionMapping.json
Responsibilities:
- communicate with WFS or MVT server
- provide region IDs for a given region type
- determine whether a given column name matches
- identify region and disambiguation columns
- provide a lookup function for a given column of data
*/

/**
 * Instantiate a region provider by giving it an entry from the region mapping JSON file.
 *
 * @alias RegionProvider
 * @constructor
 * @param {String} regionType Unique text identifier.
 * @param {Object} [properties] Properties as given in configuration file.
 * @param {CorsProxy} corsProxy an instance of CorsProxy for making ajax calls.
 */
var RegionProvider = function(regionType, properties, corsProxy) {
  properties = defaultValue(properties, defaultValue.EMPTY_OBJECT);

  /**
   * String uniquely identifying this type of region (eg, 'sa4')
   * @type {String}
   */
  this.regionType = regionType;

  /**
   * WMS attribute whose value will correspond to each region's code.
   * @type {String}
   */
  this.regionProp = properties.regionProp;
  /**
   * WMS attribute whose value can be used as a user-facing name for the region.  If this property is undefined, the regions
   * do not have names.
   * @type {String}
   */
  this.nameProp = properties.nameProp;
  /**
   * A text description of this region type, which may feature in the user interface.
   * @type {String}
   */
  this.description = properties.description;

  /**
   * Name of the WMS or MVT layer where these regions are found.
   * @type {String}
   */
  this.layerName = properties.layerName;

  /**
   * URL of the WMS or MVT server
   * @type {String}
   */
  this.server = properties.server;

  /**
   * Server type (either 'WMS' or 'MVT')
   * @type {String}
   */
  this.serverType = defaultValue(properties.serverType, "WMS");

  /**
   * URL of WMS server. Needed if the layer is a MVT layer, but the layer is also used for analytics region picker (analytics section uses WMS/WFS)
   * @type {String}
   */
  this.analyticsWmsServer = defaultValue(
    properties.analyticsWmsServer,
    this.serverType === "WMS" ? this.server : undefined
  );

  /**
   * Name of the layer on the WMS server. Needed if the layer is a MVT layer, but the layer is also used for analytics region picker (analytics section uses WMS/WFS)
   * @type {String}
   */
  this.analyticsWmsLayerName = defaultValue(
    properties.analyticsWmsLayerName,
    this.serverType === "WMS" ? this.layerName : undefined
  );

  /**
   * List of subdomains for requests to be sent to (only defined for MVT providers)
   * @type {String[]|undefined}
   */
  this.serverSubdomains = properties.serverSubdomains;

  /**
   * Minimum zoom which the server serves tiles at
   * @type {Number}
   */
  this.serverMinZoom = defaultValue(properties.serverMinZoom, 0);

  /**
   * Maximum zoom which the maximum native zoom tiles can be rendered at
   * @type {Number}
   */
  this.serverMaxZoom = defaultValue(properties.serverMaxZoom, Infinity);

  /**
   * Maximum zoom which the server serves tiles at
   * @type {Number}
   */
  this.serverMaxNativeZoom = defaultValue(
    properties.serverMaxNativeZoom,
    this.serverMaxZoom
  );

  /**
   * Bounding box of vector geometry [w,s,e,n] (only defined for MVT providers)
   * @type {Number[]|undefined}
   */
  this.bbox = properties.bbox;

  /**
   * List of aliases which will be matched against if found as column headings.
   * @type {String[]}
   */
  this.aliases = defaultValue(properties.aliases, [this.regiontype]);

  /**
   * Array of [regex, replacement] arrays which will be applied to each ID element on the server side before matching
   * is attempted. For example, [ [ ' \(.\)$' ], '' ] will convert 'Baw Baw (S)' to 'Baw Baw'
   * @type {Array[]}
   */
  this.serverReplacements =
    properties.serverReplacements instanceof Array
      ? properties.serverReplacements.map(function(r) {
          return [
            r[0],
            r[1].toLowerCase(),
            new RegExp(r[0].toLowerCase(), "gi")
          ];
        })
      : [];

  /**
   * Array of [regex, replacement] arrays which will be applied to each user-provided ID element before matching
   * is attempted. For example, [ [ ' \(.\)$' ], '' ] will convert 'Baw Baw (S)' to 'Baw Baw'
   * @type {Array[]}
   */

  this.dataReplacements =
    properties.dataReplacements instanceof Array
      ? properties.dataReplacements.map(function(r) {
          return [
            r[0],
            r[1].toLowerCase(),
            new RegExp(r[0].toLowerCase(), "gi")
          ];
        })
      : [];

  this._appliedReplacements = {
    serverReplacements: {},
    dataReplacements: {},
    disambigDataReplacements: {}
  };

  /** The property within the same WFS region that can be used for disambiguation. */
  this.disambigProp = properties.disambigProp;

  /**
   * Returns the name of a field which uniquely identifies each region. This field is not necessarily used for matching, or
   * of interest to the user, but is needed for reverse lookups. This field must count from zero, and features must be
   * returned in sorted order.
   * @type {string}
   */
  this.uniqueIdProp = defaultValue(properties.uniqueIdProp, "FID");

  /**
   * Returns the name of a field which is used to name the region in feature info.
   * @type {string}
   */
  this.nameProp = properties.nameProp;

  /**
   * Whether this region type uses text codes, rather than numeric. It matters because numeric codes are treated differently by the
   * CSV handling models.
   * @type {Boolean}
   */
  this.textCode = defaultValue(properties.textCodes, false); // yes, it's singular...

  /**
   * Array of attributes of each region, once retrieved from the server.
   * @type {Object[]}
   */
  this.regions = [];

  /**
   * Array of names of each region, once retrieved from the server.  Each item in {@link RegionProvider#regions} has a corresponding
   * item in this array at the same index.  To populate this array, call {@link RegionProvider#loadRegionNames}.
   * @type {String[]}
   */
  this.regionNames = [];

  /**
   * Look-up table of attributes, for speed.
   * @type {Object}
   */
  this._idIndex = {};

  /**
   * The URL of a pre-generated JSON file containing just a long list of IDs for a given
   * layer attribute, in the order of ascending feature IDs (fids). If defined, it will
   * be used in preference to requesting those attributes from the WFS server.
   * @type {String}
   */
  this.regionIdsFile = properties.regionIdsFile;

  /**
   * JSON file for disambiguation attribute, as per regionIdsFile.
   * @type {String}
   */
  this.regionDisambigIdsFile = properties.regionDisambigIdsFile;

  // Cache the loadRegionID promises so they are not regenerated each time until this.regions is defined.
  this._loadRegionIDsPromises = undefined;

  this._loadRegionNamesPromise = undefined;

  // Used for proxying around cors
  this.corsProxy = corsProxy;
};

/*
The flow:

1. CsvCatalogItem wants to check for region mapping, DataTable.checkForRegionVariable
2. which calls RegionProviderList on regionmapping.json
3. RPL loads all RPs, then provides cross references to dab providers
4. CSVCI calls RPL.getRegionDetails, which asks each RP to identify a region variable
5. Based on response, it assigns RP to the right variable, sets this.selected.region.
*/

RegionProvider.prototype.setDisambigProperties = function(dp) {
  this.disambigDataReplacements = dp.dataReplacements;
  this.disambigServerReplacements = dp.serverReplacements;
  this.disambigAliases = dp.aliases;
};

/**
 * Given an entry from the region mapping config, load the IDs that correspond to it, and possibly to disambiguation properties.
 *
 * @return {Promise} Promise with no return value.
 */
RegionProvider.prototype.loadRegionIDs = function() {
  var that = this;

  function fetchAndProcess(idListFile, idProp, propertyName, replacementsVar) {
    if (!defined(idListFile) && !defined(idProp)) {
      return when();
    }
    var p;
    if (defined(idListFile)) {
      p = loadJson(idListFile);
    } else {
      p = loadRegionsFromWfs(that, idProp);
    }
    p.then(function(json) {
      processRegionIds(that, json.values, propertyName, replacementsVar);
    }).otherwise(function(err) {
      console.log(err);
      throw err;
    });
    return p;
  }

  if (this.regions.length > 0) {
    return when(); // already loaded, so return insta-promise.
  }
  if (this.server === undefined) {
    // technically this may not be a problem yet, but it will be when we want to actually fetch tiles.
    throw new DeveloperError(
      "No server for region mapping defined: " + this.regionType
    );
  }
  // Check for a pre-calculated promise (which may not have resolved yet), and returned that if it exists.
  if (!defined(this._loadRegionIDsPromises)) {
    this._loadRegionIDsPromises = [
      fetchAndProcess(
        this.regionIdsFile,
        this.regionProp,
        undefined,
        "serverReplacements"
      ),
      fetchAndProcess(
        this.regionDisambigIdsFile,
        this.disambigProp,
        this.disambigProp,
        "disambigServerReplacements"
      )
    ];
  }
  return when.all(this._loadRegionIDsPromises);
};

/**
 * Load names of regions. Used for analytics region picker.
 *
 * @return {Promise} Promise resolving to region names
 */
RegionProvider.prototype.loadRegionNames = function() {
  if (defined(this._loadRegionNamesPromise)) {
    return this._loadRegionNamesPromise;
  }

  var nameProp = this.nameProp || this.regionProp;

  var baseuri = URI(this.analyticsWmsServer).addQuery({
    service: "wfs",
    version: "2.0",
    request: "getPropertyValue",
    typenames: this.analyticsWmsLayerName
  });

  // get the list of IDs that we will attempt to match against for this column
  var url = baseuri.setQuery("valueReference", nameProp).toString();

  if (this.corsProxy.shouldUseProxy(url)) {
    url = this.corsProxy.getURL(url);
  }

  var that = this;
  this._loadRegionNamesPromise = loadText(url).then(function(xml) {
    var obj = xml2json(xml);

    if (!defined(obj.member)) {
      console.log(xml);
      var exception = defined(obj.Exception)
        ? "<br/><br/>" + obj.Exception.ExceptionText
        : "";
      throw new TerriaError({
        title: "CSV region mapping",
        message:
          "Couldn't load region names for region type " +
          that.regionType +
          exception
      });
    }

    if (!(obj.member instanceof Array)) {
      obj.member = [obj.member];
    }
    if (obj.member.length === 1 && !defined(obj.member[0])) {
      throw new TerriaError({
        title: i18next.t("map.regionProvider.csvRegionMappingTitle"),
        message: i18next.t(
          "map.regionProvider.csvRegionMappingMessageZeroFound",
          { regionType: that.regionType }
        )
      });
    }

    that.regionNames = obj.member.map(function(m) {
      return m[nameProp];
    });
    return that.regionNames;
  });

  return this._loadRegionNamesPromise;
};

/**
 * Maps this.regions to indices into the provided regionArray.
 * Eg. If regionArray = ['Vic', 'Qld', 'NSW'], and this.regions = ['NSW', 'Vic', 'Qld', 'WA'], then returns [2, 0, 1, undefined].
 *
 * @param {Array} regionArray An array of the regions (eg. the column of State values from a csv file). Could be Strings or Numbers.
 * @param {Array} [disambigValues] An array of disambiguating names/numbers for when regions alone are insufficient. Could be Strings or Numbers.
 * @param {Array} [failedMatches] An optional empty array. If provided, indices of failed matches are appended to the array.
 * @param {Array} [ambiguousMatches] An optional empty array. If provided, indices of matches which duplicate prior matches are appended to the array.
 *                (Eg. these are not relevant if at different times.)
 * @param {TimeInterval[]} [timeIntervals] The time intervals during which each value in `regionArray` applies.  If undefined, the data is not
 *                         time-varying.
 * @param {JulianDate} [time] The time at which to do the mapping.  If undefined, the data is not time-varying.
 * @return {Array} Indices into this.region.
 */
RegionProvider.prototype.mapRegionsToIndicesInto = function(
  regionArray,
  disambigValues,
  failedMatches,
  ambiguousMatches,
  timeIntervals,
  time
) {
  if (this.regions.length < 1) {
    throw new DeveloperError("Region provider is not ready to match regions.");
  }
  if (!defined(disambigValues)) {
    disambigValues = []; // so that disambigValues[i] is undefined, not an error.
  }

  var isTimeVarying = defined(timeIntervals) && defined(time);

  var result = new Array(this.regions.length);
  for (var i = 0; i < regionArray.length; i++) {
    if (!defined(regionArray[i])) {
      // Skip over undefined or null values
      continue;
    }

    // Is this row applicable at this time?
    if (isTimeVarying) {
      var interval = timeIntervals[i];
      if (!defined(interval)) {
        // Row is not applicable at any time.
        continue;
      }
      if (!TimeInterval.contains(interval, time)) {
        // Row is not applicable at this time.
        continue;
      }
    }

    var index = findRegionIndex(this, regionArray[i], disambigValues[i]);
    if (index < 0) {
      if (defined(failedMatches)) {
        failedMatches.push(i);
      }
      continue;
    }
    if (defined(result[index])) {
      // This region already has a value. In a time-varying dataset, intervals may
      // overlap at their endpoints (i.e. the end of one interval is the start of the next).
      // In that case, we want the later interval to apply.
      if (isTimeVarying) {
        var existingInterval = timeIntervals[result[index]];
        var newInterval = timeIntervals[i];
        if (JulianDate.greaterThan(newInterval.start, existingInterval.start)) {
          // Use the current row as the value.
          result[index] = i;
          continue;
        } else if (
          JulianDate.lessThan(newInterval.start, existingInterval.start)
        ) {
          // Use the existing row as the value.
          continue;
        } else {
          // The two rows have the same start date, so treat this as an ambiguous match.
        }
      }

      if (defined(ambiguousMatches)) {
        ambiguousMatches.push(i);
      }
      continue;
    }

    result[index] = i;
  }
  return result;
};

/**
 * Pre-generates a function which quickly turns a value into a colour.
 *
 * @param {Number[]} regionValues Array of values, the same length as this.regions, giving a value to each region.
 * @param {RegionProvider~colorFunction} colorFunction A function which maps region values to color arrays.
 * @returns {Function} Function of type f(regionIndex) { return [r,g,b,a]; } which may return undefined.
 */
RegionProvider.prototype.getColorLookupFunc = function(
  regionValues,
  colorFunction
) {
  var colors = regionValues.map(colorFunction);
  return function(regionIndex) {
    return colors[regionIndex];
  };
};

/**
 * Function which maps region values to color arrays.
 * @callback RegionProvider~colorFunction
 * @param {Number} value The value for this region.
 * @returns {Number[]} Returns a colorArray in the form [r, g, b, a].
 */

/**
 * Returns the region variable of the given name, matching against the aliases provided.
 *
 * @param {String} varNames Array of variable names.
 * @returns {String} The name of the first column that matches any of the given aliases.
 */
RegionProvider.prototype.findRegionVariable = function(varNames) {
  return findVariableForAliases(varNames, this.aliases);
};

/**
 * If a disambiguation column is known for this provider, return a column matching its description.
 *
 * @param {String} varNames Array of variable names.
 * @returns {String} The name of the first column that matches any of the given disambiguation aliases.
 */
RegionProvider.prototype.findDisambigVariable = function(varNames) {
  if (!defined(this.disambigAliases) || this.disambigAliases.length === 0) {
    return undefined;
  }
  return findVariableForAliases(varNames, this.disambigAliases);
};

/**
 * Gets the feature associated with a given region.
 * @param {Object} region The region.
 * @param {Object} possibleFeature A feature that possibly corresponds to the region.  If it does, it will be returned.
 *                                 Otherwise, the matching feature will be requested from the region mapping server.
 * @return {Promise} A promise for the feature.
 */
RegionProvider.prototype.getRegionFeature = function(
  terria,
  region,
  possibleFeature
) {
  if (!defined(region)) {
    return when(undefined);
  }

  if (defined(possibleFeature) && possibleFeature.id === region.id) {
    return when(possibleFeature);
  }

  var url = this.analyticsWmsServer || this.server;
  if (terria.corsProxy.shouldUseProxy(url)) {
    url = terria.corsProxy.getURL(url);
  }

  url = new URI(url)
    .search("")
    .addQuery({
      service: "WFS",
      version: "1.1.0",
      request: "GetFeature",
      typeName: this.layerName,
      outputFormat: "JSON",
      cql_filter: "FID=" + region.FID
    })
    .toString();

  return loadJson(url).then(function(result) {
    if (defined(result) && defined(result.features)) {
      return result.features[0];
    } else {
      return undefined;
    }
  });
};

/**
 * Fetch a list of region IDs in feature ID (FID) order by querying a WFS server.
 * This is a slower fall-back method if we don't have a pre-computed JSON list available.
 * Returns a promise which resolves to an object whose 'values' property can be used as an argument in processRegionIds.
 * @private
 */
function loadRegionsFromWfs(regionProvider, propName) {
  if (regionProvider.serverType !== "WMS") {
    throw new DeveloperError(
      "Cannot fetch region ids for region providers that are not WMS"
    );
  }

  var baseuri = URI(regionProvider.server).addQuery({
    service: "wfs",
    version: "2.0",
    request: "getPropertyValue",
    typenames: regionProvider.layerName
  });

  // get the list of IDs that we will attempt to match against for this column
  var url = regionProvider.corsProxy.getURLProxyIfNecessary(
    baseuri.setQuery("valueReference", propName).toString()
  );

  return loadText(url).then(function(xml) {
    var obj = xml2json(xml);

    if (!defined(obj.member)) {
      console.log(xml);
      var exception = defined(obj.Exception)
        ? "<br/><br/>" + obj.Exception.ExceptionText
        : "";
      throw new TerriaError({
        title: i18next.t("map.regionProvider.csvRegionMappingTitle"),
        message: i18next.t(
          "map.regionProvider.csvRegionMappingMessageLoadError",
          { regionName: propName, exception: exception }
        )
      });
    }

    if (!(obj.member instanceof Array)) {
      obj.member = [obj.member];
    }
    if (obj.member.length === 1 && !defined(obj.member[0])) {
      throw new TerriaError({
        title: i18next.t("map.regionProvider.csvRegionMappingTitle"),
        message: i18next.t(
          "map.regionProvider.csvRegionMappingMessageZeroBoundariesFound",
          { regionName: propName }
        )
      });
    }
    return {
      values: obj.member.map(function(m) {
        return m[propName];
      })
    };
  });
}

/**
 * Given a list of region IDs in feature ID order, apply server replacements if needed, and build the this.regions array.
 * If no propertyName is supplied, also builds this._idIndex (a lookup by attribute for performance).
 * @private
 * @param {RegionProvider} regionProvider The RegionProvider instance.
 * @param {Array} values An array of string or numeric region IDs, eg. [10050, 10110, 10150, ...] or ['2060', '2061', '2062', ...]
 * @param {String} [propertyName] The property on that.regions elements, on which to save the id. Defaults to 'id'.
 * @param {String} replacementsProp Used as the second argument in a call to applyReplacements.
 */
function processRegionIds(
  regionProvider,
  values,
  propertyName,
  replacementsProp
) {
  var isNumeric = typeof values[0] === "number";

  var isDisambiguation = defined(propertyName);

  if (!isDisambiguation) {
    propertyName = "id";
  }
  // There is also generally a `layer` and `property` property in this file, which we ignore for now.
  values.forEach(function(value, index) {
    if (!defined(regionProvider.regions[index])) {
      regionProvider.regions[index] = {};
    }

    if (!isNumeric) {
      value = value.toLowerCase();
      // we apply server-side replacements while loading. If it ever turns out we need
      // to store the un-regexed version, we should add a line here.
      value = applyReplacements(regionProvider, value, replacementsProp);
    }

    regionProvider.regions[index][propertyName] = value;

    // store a lookup by attribute, for performance.
    if (!isDisambiguation) {
      if (!defined(regionProvider._idIndex[value])) {
        regionProvider._idIndex[value] = index;
      } else {
        // if we have already seen this value before, store an array of values, not one value.
        if (
          typeof regionProvider._idIndex[value] ===
          "object" /* meaning, array */
        ) {
          regionProvider._idIndex[value].push(index);
        } else {
          regionProvider._idIndex[value] = [
            regionProvider._idIndex[value],
            index
          ];
        }
      }

      // Here we make a big assumption that every region has a unique identifier (probably called FID), that it counts from zero,
      // and that regions are provided in sorted order from FID 0. We do this to avoid having to explicitly request
      // the FID column, which would double the amount of traffic per region dataset.
      // It is needed to simplify reverse lookups from complex matches (regexes and disambigs)
      regionProvider.regions[index][regionProvider.uniqueIdProp] = index;
    } // else nothing, we don't maintain an index of disambiguation values (it wouldn't be helpful)
  });
}

/**
 * Apply an array of regular expression replacements to a string. Also caches the applied replacements in regionProvider._appliedReplacements.
 * @private
 * @param {RegionProvider} regionProvider The RegionProvider instance.
 * @param {String} s The string.
 * @param {String} replacementsProp Name of a property containing [ [ regex, replacement], ... ], where replacement is a string which can contain '$1' etc.
 */
function applyReplacements(regionProvider, s, replacementsProp) {
  if (!defined(s)) {
    return undefined;
  }
  var r;
  if (typeof s === "number") {
    r = String(s);
  } else {
    r = s.toLowerCase().trim();
  }
  var replacements = regionProvider[replacementsProp];
  if (replacements === undefined || replacements.length === 0) {
    return r;
  }

  if (regionProvider._appliedReplacements[replacementsProp][r] !== undefined) {
    return regionProvider._appliedReplacements[replacementsProp][r];
  }

  replacements.forEach(function(rep) {
    r = r.replace(rep[2], rep[1]);
  });
  regionProvider._appliedReplacements[replacementsProp][s] = r;
  return r;
}

/**
 * Given a region code, try to find a region that matches it, using replacements, disambiguation, indexes and other wizardry.
 * @private
 * @param {RegionProvider} regionProvider The RegionProvider instance.
 * @param {String} code Code to search for. Falsy codes return -1.
 * @returns {Number} Zero-based index in list of regions if successful, or -1.
 */
function findRegionIndex(regionProvider, code, disambigCode) {
  if (!defined(code) || code === "") {
    // Note a code of 0 is ok
    return -1;
  }
  var processedCode = applyReplacements(
    regionProvider,
    code,
    "dataReplacements"
  );
  var id = regionProvider._idIndex[processedCode];
  if (!defined(id)) {
    // didn't find anything
    return -1;
  } else if (typeof id === "number") {
    // found an unambiguous match
    return id;
  } else {
    var ids = id; // found an ambiguous match
    if (!defined(disambigCode)) {
      // we have an ambiguous value, but nothing with which to disambiguate. We pick the first, warn.
      console.warn("Ambiguous value found in region mapping: " + processedCode);
      return ids[0];
    }
    var processedDisambigCode = applyReplacements(
      regionProvider,
      disambigCode,
      "disambigDataReplacements"
    );

    // Check out each of the matching IDs to see if the disambiguation field matches the one we have.
    for (var i = 0; i < ids.length; i++) {
      if (
        regionProvider.regions[ids[i]][regionProvider.disambigProp] ===
        processedDisambigCode
      ) {
        return ids[i];
      }
    }
  }
  return -1;
}

/**
 * Function interface for matching a URL to a {@link CatalogMember} constructor
 * for that URL.
 * @private
 * @callback RegionProvider~colorFunction
 * @param {Number} value The value for this region.
 * @returns {Number[]} Returns a colorArray in the form [r, g, b, a].
 */

function findVariableForAliases(varNames, aliases) {
  for (var j = 0; j < aliases.length; j++) {
    var re = new RegExp("^" + aliases[j] + "$", "i");
    for (var i = 0; i < varNames.length; i++) {
      if (re.test(varNames[i])) {
        return varNames[i];
      }
    }
  }
  return undefined;
}

module.exports = RegionProvider;
