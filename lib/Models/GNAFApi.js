var loadWithXhr = require('terriajs-cesium/Source/Core/loadWithXhr');
var defined = require('terriajs-cesium/Source/Core/defined');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');

var DEFAULT_MAX_RESULTS = 10;
var MIN_SCORE = 1;
var DATA61_GNAF_SEARCH_URL = 'http://gnaf.it.csiro.au/es/_search';

/**
 * Simple JS Api for the Data61 ElasticSearch GNAF service.
 *
 * @param corsProxy CorsProxy to use to determine whether calls need to go through the terria proxy.
 * @param [overrideUrl] The URL to use to query the service - will default if not provided
 * @param [overriddenLoadWithXhr] loadWithXhr function matching the signature of the one provided by Cesium - provided
 *      mainly for use in unit tests.
 * @constructor
 */
var GNAFApi = function(corsProxy, overrideUrl, overriddenLoadWithXhr) {
    this.url = corsProxy.getURLProxyIfNecessary(defaultValue(overrideUrl, DATA61_GNAF_SEARCH_URL));
    this.loadWithXhr = overriddenLoadWithXhr || loadWithXhr;
};

/**
 * Geocodes a plain-text address. Returns results along with their scores.
 *
 * If a bounding box is provided, this is queried first - if that query doesn't get a number of results >= to maxResults,
 * the query will be tried again without the bounding box and these results added to the end of the results from the
 * initial query. Results that were within the initial bounding box will have {locational: true} set in their object.
 * Results that are present in both searches will only appear once with locational set to true.
 *
 * @param searchTerm The address to geocode
 * @param [boundingBox] An optional object with the format {topLeft: {latitude, longitude}, bottomRight: {latitude, longitude}}
 *      describing a box to search within. If this is not provided then everywhere is searched.
 * @param [maxResults] The maximum number of results to return - defaults to 10.
 * @returns {Promise} Promise that resolves when the search is done.
 */
GNAFApi.prototype.geoCode = function(searchTerm, boundingBox, maxResults) {
    maxResults = maxResults || DEFAULT_MAX_RESULTS;

    var requestData = buildRequestData(searchTerm, maxResults);

    if (defined(boundingBox)) {
        addBoundingBox(requestData, boundingBox);
    }

    return this.loadWithXhr({
        url: this.url,
        headers: {
            Accept: 'application/json'
        },
        preferText: true,
        method: 'POST',
        data: JSON.stringify(requestData)
    }).then(function(raw) {
        var data = JSON.parse(raw);
        var hits = data.hits.hits.map(convertElasticSearchHit.bind(undefined, defined(boundingBox)));
        // If we got anything good return it, otherwise search outside the location.
        if (!defined(boundingBox) || hits.length === maxResults) {
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
 * Converts from the ElasticSearch schema to a neater one better suited to addresses.
 *
 * @param locational Whether to set locational to true - this is set for results that came up within the bounding box
 *      passed to {@link #geoCode}.
 * @param item The elasticsearch schema object to convert.
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
 * @param searchTerm The plain-text query to search for.
 * @param maxResults The max number of results to search for.
 */
function buildRequestData(searchTerm, maxResults) {
    return {
        query: {
            bool: {
                must: [{
                    match: {
                        d61Address: {
                            query: searchTerm,
                            fuzziness: 2,
                            prefix_length: 2
                        }
                    }
                }]
            }
        },
        min_score: MIN_SCORE,
        size: maxResults
    };
}

/**
 * Adds a bounding box filter to the search query for elastic search. This simply modifies requestData and returns nothing.
 *
 * @param requestData Request data to modify
 * @param location Bounding box in the format {topLeft: {latitude, longitude}, bottomRight: {latitude, longitude}}.
 */
function addBoundingBox(requestData, location) {
    if (!isNumber(location.topLeft.longitude) || !isNumber(location.topLeft.latitude) ||
        !isNumber(location.bottomRight.longitude) || !isNumber(location.bottomRight.latitude)) {
        throw new DeveloperError('Longitude or latitude passed were not valid numbers');
    }

    requestData.filter = {
        geo_bounding_box: {
            location: {
                top_left: {
                    lat: location.topLeft.latitude,
                    lon: location.topLeft.longitude
                },
                bottom_right: {
                    lat: location.bottomRight.latitude,
                    lon: location.bottomRight.longitude
                }
            }
        }
    };
}

/**
 * Determines whether the argument is a number.
 */
function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

module.exports = GNAFApi;

