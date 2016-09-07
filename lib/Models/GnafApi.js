'use strict';

var loadWithXhr = require('terriajs-cesium/Source/Core/loadWithXhr');
var defined = require('terriajs-cesium/Source/Core/defined');
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var CesiumMath = require('terriajs-cesium/Source/Core/Math');
var when = require('terriajs-cesium/Source/ThirdParty/when');

var DEFAULT_MAX_RESULTS = 10;
var DEFAULT_BATCH_SIZE = 10;
var DEFAULT_MAX_SIMULTANEOUS_REQUESTS = 1;
var DATA61_GNAF_SEARCH_URL = 'http://gnaf.nationalmap.nicta.com.au/es/_search';
var DATA61_GNAF_BULK_SEARCH_URL = 'http://gnaf.nationalmap.nicta.com.au/es/_msearch';

/**
 * Simple JS Api for the Data61 ElasticSearch GNAF service.
 *
 * @param {CorsProxy} corsProxy CorsProxy to use to determine whether calls need to go through the terria proxy.
 * @param {String} [overrideUrl] The URL to use to query the service - will default if not provided.
 * @constructor
 */
var GnafApi = function(corsProxy, overrideUrl) {
    this.url = corsProxy.getURLProxyIfNecessary(defaultValue(overrideUrl, DATA61_GNAF_SEARCH_URL));
    this.bulk_url = corsProxy.getURLProxyIfNecessary(defaultValue(overrideUrl, DATA61_GNAF_BULK_SEARCH_URL));
};

/**
 * Geocodes a plain-text address. Returns results along with their scores.
 *
 * If a bounding box is provided, this is queried first - if that query doesn't get a number of results >= to maxResults,
 * the query will be tried again without the bounding box and these results added to the end of the results from the
 * initial query. Results that were within the initial bounding box will have {locational: true} set in their object.
 * Results that are present in both searches will only appear once with locational set to true.
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
        headers: {
            Accept: 'application/json'
        },
        preferText: true,
        method: 'POST',
        data: JSON.stringify(requestData)
    }).then(function(raw) {
        var data = JSON.parse(raw);
        var hits = data.hits.hits.map(convertElasticSearchHit.bind(undefined, defined(rectangle)));
        // If we got anything good return it, otherwise search outside the location.
        if (!defined(rectangle) || hits.length === maxResults) {
            return hits;
        } else {
            var hitIds = hits.reduce(function(soFar, hit) {
                soFar[hit.id] = true;
                return soFar;
            }, {});

            return this.geoCode(searchTerm, undefined, maxResults).then(function(nonLocationHits) {
                var filteredNonLocationHits = nonLocationHits.filter(function(hit) {
                    return !hitIds[hit.id];
                });

                return hits.concat(filteredNonLocationHits).slice(0, maxResults);
            });
        }
    }.bind(this));
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
GnafApi.prototype.bulkGeoCode = function(searchTermList, rectangle, batchSize, maxSimultaneousRequests) {
    batchSize = batchSize || DEFAULT_BATCH_SIZE;
    maxSimultaneousRequests = maxSimultaneousRequests || DEFAULT_MAX_SIMULTANEOUS_REQUESTS;
    var searchTermBatches = splitIntoBatches(searchTermList, batchSize);
    var searchTermBatchesRequests = splitIntoBatches(searchTermBatches, maxSimultaneousRequests);

    var i = 0;
    var mergedResults = [];
    return this._runThrottledRequests(i, mergedResults, searchTermBatchesRequests, rectangle);
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
GnafApi.prototype._runThrottledRequests = function(i, mergedResults, searchTermBatchesRequests, rectangle) {
    if (i === searchTermBatchesRequests.length) {
        return mergedResults;
    }
    var that = this;
    var promises = searchTermBatchesRequests[i].map(function(searchTermList) { return that._bulkGeocodeSingleRequest(searchTermList, rectangle); });

    return when.all(promises).then( function(results) {
        for (var j=0; j<results.length; j++) {
            mergedResults = mergedResults.concat(results[j]);
        }
        return that._runThrottledRequests(i+1, mergedResults, searchTermBatchesRequests, rectangle);
    }).otherwise(function(e) {
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
GnafApi.prototype._bulkGeocodeSingleRequest = function(searchTermList, rectangle) {

    var requestData = "";
    for (var i=0; i<searchTermList.length; i++) {
        var searchTerm = searchTermList[i];
        requestData += "{}\n" + JSON.stringify(buildRequestData(searchTerm, 1)) + "\n";
    }

    if (defined(rectangle)) {
        addBoundingBox(requestData, rectangle);
    }

    return loadWithXhr({
        url: this.bulk_url,
        headers: {
            Accept: 'application/json'
        },
        preferText: true,
        method: 'POST',
        data: requestData
    }).then(function(raw) {
        var data = JSON.parse(raw);
        var hits = [];
        for (var i=0; i<data.responses.length; i++) {
            var response = data.responses[i];
            if (defined(response.hits) && defined(response.hits.hits)) {
                hits.push(response.hits.hits.map(convertElasticSearchHit.bind(undefined, defined(rectangle)))[0]);
            }
        }
        return hits;
    }.bind(this));
};

/**
 * Converts from the ElasticSearch schema to a neater one better suited to addresses.
 *
 * @param {boolean} locational Whether to set locational to true - this is set for results that came up within the bounding box
 *      passed to {@link #geoCode}.
 * @param {object} item The elasticsearch schema object to convert.
 */
function convertElasticSearchHit(locational, item) {
    var hit = item._source;

    return {
        id: item._id,
        score: item._score,
        locational: locational,
        name: hit.d61Address.slice(0, 3).filter(function(string) {
            return string.length > 0;
        }).join(', '),
        flatNumber: sanitiseAddressNumber(hit.flat.number),
        level: sanitiseAddressNumber(hit.level.number),
        numberFirst: sanitiseAddressNumber(hit.numberFirst.number),
        numberLast: sanitiseAddressNumber(hit.numberLast.number),
        street: hit.street,
        localityName: hit.localityName,
        localityVariantNames: hit.localityVariant.map(function(locality) {
            return locality.localityName;
        }),
        state: {
            abbreviation: hit.stateAbbreviation,
            name: hit.stateName
        },
        postCode: hit.postcode,
        location: {
            latitude: hit.location.lat,
            longitude: hit.location.lon
        }
    };
}

/**
 * Sanitises a number (e.g. flat number, unit number etc) from elasticsearch - these are set to -1 if they don't exist,
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
    // Replace commas and slashes with spaces because the geocoder works better with spaces
    var processedSearchTerm = searchTerm.replace(/,/gi, " ");
    processedSearchTerm = processedSearchTerm.replace(/\//gi, " ");
    return {
        query: {
            match: {
                d61Address: {
                    query: processedSearchTerm,
                    fuzziness: 2,
                    prefix_length: 2
                }
            }
        },
        rescore: {
            query: {
                rescore_query: {
                    match: {
                        d61Address: {
                            query: processedSearchTerm
                        }
                    }
                },
                query_weight: 0
            }
        },
        size: maxResults
    };
}

/**
 * Adds a bounding box filter to the search query for elastic search. This simply modifies requestData and returns nothing.
 *
 * @param {object} requestData Request data to modify
 * @param {Rectangle} rectangle rectangle to source the bounding box from.
 */
function addBoundingBox(requestData, rectangle) {
    requestData.filter = {
        geo_bounding_box: {
            location: {
                top_left: {
                    lat: CesiumMath.toDegrees(rectangle.north),
                    lon: CesiumMath.toDegrees(rectangle.west)
                },
                bottom_right: {
                    lat: CesiumMath.toDegrees(rectangle.south),
                    lon: CesiumMath.toDegrees(rectangle.east)
                }
            }
        }
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
    for (var maxSlice=batchSize; maxSlice<Infinity; maxSlice+=batchSize) {
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

