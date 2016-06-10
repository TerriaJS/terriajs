var loadWithXhr = require('terriajs-cesium/Source/Core/loadWithXhr');
var defined = require('terriajs-cesium/Source/Core/defined');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defined = require('terriajs-cesium/Source/Core/defined');

var DEFAULT_MAX_RESULTS = 10;
var MIN_SCORE = 1;
var DATA61_GNAF_SEARCH_URL = 'http://gnaf.it.csiro.au/es/_search';

var GNAFApi = function(corsProxy, overrideUrl, overriddenLoadWithXhr) {
    this.url = corsProxy.getURLProxyIfNecessary(defaultValue(overrideUrl, DATA61_GNAF_SEARCH_URL));
    this.loadWithXhr = overriddenLoadWithXhr || loadWithXhr;
};

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

function sanitiseAddressNumber(number) {
    return number > 0 ? number : undefined;
}

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

function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

module.exports = GNAFApi;

