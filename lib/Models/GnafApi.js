"use strict";

var loadWithXhr = require("../Core/loadWithXhr");
var defined = require("terriajs-cesium/Source/Core/defined").default;
var defaultValue = require("terriajs-cesium/Source/Core/defaultValue").default;
var CesiumMath = require("terriajs-cesium/Source/Core/Math").default;
var when = require("terriajs-cesium/Source/ThirdParty/when").default;

var DEFAULT_MAX_RESULTS = 10;
var DEFAULT_BATCH_SIZE = 40;
var DEFAULT_MAX_SIMULTANEOUS_REQUESTS = 1;
var DATA61_GNAF_SEARCH_URL = "http://gnaf.nationalmap.nicta.com.au/v2/search";
var DATA61_GNAF_BULK_SEARCH_URL =
  "http://gnaf.nationalmap.nicta.com.au/v2/bulkSearch";

/**
 * Simple JS Api for the Data61 Lucene GNAF service.
 *
 * @param {CorsProxy} corsProxy CorsProxy to use to determine whether calls need to go through the terria proxy.
 * @param {String} [overrideUrl] The URL to use to query the service - will default if not provided.
 * @constructor
 */
var GnafApi = function(corsProxy, overrideUrl) {
  this.url = corsProxy.getURLProxyIfNecessary(
    defaultValue(overrideUrl, DATA61_GNAF_SEARCH_URL)
  );
  this.bulk_url = corsProxy.getURLProxyIfNecessary(
    defaultValue(overrideUrl, DATA61_GNAF_BULK_SEARCH_URL)
  );
};

/**
 * Geocodes a plain-text address. Returns results along with their scores.
 *
 * If a bounding box is provided, this is queried, and all results that are returned must lie within the bounding box.
 *
 * @param {string} searchTerm The address to geocode
 * @param {Rectangle} [rectangle] An optional rectangle describing a box to search within. If this is not provided then
 *      everywhere is searched.
 * @param {number} [maxResults] The maximum number of results to return - defaults to 10.
 * @returns {Promise} Promise that resolves when the search is done.
 */
GnafApi.prototype.geoCode = function(searchTerm, rectangle, maxResults) {
  maxResults = maxResults || DEFAULT_MAX_RESULTS;

  var requestData = buildRequestData(searchTerm, maxResults);

  if (defined(rectangle)) {
    addBoundingBox(requestData, rectangle);
  }

  return loadWithXhr({
    url: this.url,
    method: "POST",
    data: JSON.stringify(requestData),
    headers: { "Content-Type": "application/json" },
    responseType: "json"
  }).then(
    function(data) {
      var hits = data.hits.map(
        convertLuceneHit.bind(undefined, defined(rectangle))
      );
      return hits;
    }.bind(this)
  );
};

/**
 * Bulk geocodes in batches with a list of plain-text address. Returns results along with their scores.
 *
 * If a bounding box is provided, this is used and no results will be returned from outside the bounding box.
 *
 * @param {Array} searchTermList A list of strings representing the addresses to geocode
 * @param {Rectangle} [rectangle] An optional rectangle describing a box to search within. If this is not provided then
 *      everywhere is searched.
 * @param {number} [batchSize=DEFAULT_BATCH_SIZE] Maximum number of addresses in each request.
 * @param {number} [maxSimultaneousRequests=DEFAULT_MAX_SIMULTANEOUS_REQUESTS] Maximum number of requests submitted at one time.
 * @returns {Promise} Promise that resolves when the search is done.
 */
GnafApi.prototype.bulkGeoCode = function(
  searchTermList,
  rectangle,
  batchSize,
  maxSimultaneousRequests
) {
  batchSize = batchSize || DEFAULT_BATCH_SIZE;
  maxSimultaneousRequests =
    maxSimultaneousRequests || DEFAULT_MAX_SIMULTANEOUS_REQUESTS;
  var searchTermBatches = splitIntoBatches(searchTermList, batchSize);
  var searchTermBatchesRequests = splitIntoBatches(
    searchTermBatches,
    maxSimultaneousRequests
  );

  var i = 0;
  var mergedResults = [];
  return this._runThrottledRequests(
    i,
    mergedResults,
    searchTermBatchesRequests,
    rectangle
  );
};

/**
 * Run requests in batches, where the query term has also been batched. For example, make 2 requests at once to the
 * server with 3 addresses in each. In this case, searchTermBatchesRequests would look like: [[["a", "b", "c"], ["d",
 * "e", "f"]], [["g", "h"]]]
 *
 * @param {number} i index of searchTermBatchesRequests to take request list from
 * @param {Array} results of running requests as one array, should be empty initially
 * @param {Array} searchTermBatchesRequests Array where each item contains up to the maximum number of simultaneous
 *                requests, and each request contains up to the maximum number of addresses to query.
 * @return results in a single array.
 * @private
 */
GnafApi.prototype._runThrottledRequests = function(
  i,
  mergedResults,
  searchTermBatchesRequests,
  rectangle
) {
  if (i === searchTermBatchesRequests.length) {
    return mergedResults;
  }
  var that = this;
  var promises = searchTermBatchesRequests[i].map(function(searchTermList) {
    return that._bulkGeocodeSingleRequest(searchTermList, rectangle);
  });

  return when
    .all(promises)
    .then(function(results) {
      for (var j = 0; j < results.length; j++) {
        mergedResults = mergedResults.concat(results[j]);
      }
      return that._runThrottledRequests(
        i + 1,
        mergedResults,
        searchTermBatchesRequests,
        rectangle
      );
    })
    .otherwise(function(e) {
      throw e;
    });
};

/**
 * Bulk geocodes with a list of plain-text address in a single request. Returns results along with their scores.
 *
 * If a bounding box is provided, this is used. No results will be returned from outside the bounding box.
 *
 * @param {Array} searchTermList A list of strings representing the addresses to geocode
 * @param {Rectangle} [rectangle] An optional rectangle describing a box to search within. If this is not provided then
 *      everywhere is searched.
 * @returns {Promise} Promise that resolves when the search is done.
 * @private
 */
GnafApi.prototype._bulkGeocodeSingleRequest = function(
  searchTermList,
  rectangle
) {
  var requestData = buildRequestData(searchTermList, 1);

  if (defined(rectangle)) {
    addBoundingBox(requestData, rectangle);
  }

  return loadWithXhr({
    url: this.bulk_url,
    method: "POST",
    data: JSON.stringify(requestData),
    headers: { "Content-Type": "application/json" },
    responseType: "json"
  }).then(
    function(data) {
      var hits = [];
      for (var i = 0; i < data.length; i++) {
        var response = data[i];
        if (defined(response.hits)) {
          hits.push(
            response.hits.map(
              convertLuceneHit.bind(undefined, defined(rectangle))
            )[0]
          );
        }
      }
      return hits;
    }.bind(this)
  );
};

/**
 * Converts from the Lucene schema to a neater one better suited to addresses.
 *
 * @param {boolean} locational Whether to set locational to true - this is set for results that came up within the bounding box
 *      passed to {@link #geoCode}.
 * @param {object} item The lucene schema object to convert.
 */
function convertLuceneHit(locational, item) {
  var jsonInfo = JSON.parse(item.json);

  return {
    score: item.score,
    locational: locational,
    name: item.d61Address
      .slice(0, 3)
      .filter(function(string) {
        return string.length > 0;
      })
      .join(", "),
    flatNumber: sanitiseAddressNumber(jsonInfo.flat.number),
    level: sanitiseAddressNumber(jsonInfo.level.number),
    numberFirst: sanitiseAddressNumber(jsonInfo.numberFirst.number),
    numberLast: sanitiseAddressNumber(jsonInfo.numberLast.number),
    street: jsonInfo.street,
    localityName: jsonInfo.localityName,
    localityVariantNames: jsonInfo.localityVariant.map(function(locality) {
      return locality.localityName;
    }),
    state: {
      abbreviation: jsonInfo.stateAbbreviation,
      name: jsonInfo.stateName
    },
    postCode: jsonInfo.postcode,
    location: {
      latitude: jsonInfo.location.lat,
      longitude: jsonInfo.location.lon
    }
  };
}

/**
 * Sanitises a number (e.g. flat number, unit number etc) from lucene - these are set to -1 if they don't exist,
 * we'd prefer if they were undefined.
 */
function sanitiseAddressNumber(number) {
  return number > 0 ? number : undefined;
}

/**
 * Builds the data to be POSTed to elastic search.
 *
 * @param {string} searchTerm The plain-text query to search for.
 * @param {number} maxResults The max number of results to search for.
 */
function buildRequestData(searchTerm, maxResults) {
  var requestData = {
    numHits: maxResults,
    fuzzy: {
      maxEdits: 2,
      minLength: 5,
      prefixLength: 2
    }
  };

  if (searchTerm instanceof Array) {
    requestData["addresses"] = searchTerm.map(processAddress);
  } else {
    requestData["addr"] = processAddress(searchTerm);
  }
  return requestData;
}

/**
 * Processes a single address to make it more palatable for the search engine.
 *
 * @param {string} address Address to process
 * @return {string} Processed address
 */
function processAddress(address) {
  var processedSearchTerm = address.replace(/,/gi, " ");
  return processedSearchTerm.replace(/\//gi, " ");
}

/**
 * Adds a bounding box filter to the search query for elastic search. This simply modifies requestData and returns nothing.
 *
 * @param {object} requestData Request data to modify
 * @param {Rectangle} rectangle rectangle to source the bounding box from.
 */
function addBoundingBox(requestData, rectangle) {
  requestData["box"] = {
    minLat: CesiumMath.toDegrees(rectangle.south),
    maxLon: CesiumMath.toDegrees(rectangle.east),
    maxLat: CesiumMath.toDegrees(rectangle.north),
    minLon: CesiumMath.toDegrees(rectangle.west)
  };
}

/**
 * Breaks an array into pieces, putting them in another array.
 *
 * @param {Array} arrayToSplit array to split
 * @param {number} batchSize maximum number of items in each array at end
 * @return array containing other arrays, which contain a maxiumum number of items in each.
 */
function splitIntoBatches(arrayToSplit, batchSize) {
  var arrayBatches = [];
  var minSlice = 0;
  var finish = false;
  for (var maxSlice = batchSize; maxSlice < Infinity; maxSlice += batchSize) {
    if (maxSlice >= arrayToSplit.length) {
      maxSlice = arrayToSplit.length;
      finish = true;
    }
    arrayBatches.push(arrayToSplit.slice(minSlice, maxSlice));
    minSlice = maxSlice;
    if (finish) {
      break;
    }
  }
  return arrayBatches;
}

// For testing only
GnafApi._splitIntoBatches = splitIntoBatches;

module.exports = GnafApi;
