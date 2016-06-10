var loadWithXhr = require('terriajs-cesium/Source/Core/loadWithXhr');
var defined = require('terriajs-cesium/Source/Core/defined');

var DEFAULT_MAX_RESULTS = 10;
var MIN_SCORE = 1;

var GNAFApi = function(url) {
    this.url = url;
};

GNAFApi.prototype.geoLocate = function(searchTerm, location, maxResults) {
    maxResults = maxResults || DEFAULT_MAX_RESULTS;

    var requestData = buildRequestData(searchTerm, maxResults);

    if (defined(location)) {
        addLocation(requestData, location);
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
        var hits = data.hits.hits.map(convertElasticSearchHit.bind(undefined, defined(location)));

        // If we got anything good return it, otherwise search outside the location.
        if (!defined(location) || hits.length === maxResults) {
            return hits;
        } else {
            return this.geoLocate(searchTerm, undefined, maxResults).then(function(nonLocationHits) {
                return hits.concat(nonLocationHits).slice(0, 10);
            });
        }
    }.bind(this));
};

function convertElasticSearchHit(locational, item) {
    var hit = item._source;

    return {
        id: hit.addressDetailPid,
        score: item._score,
        locational: locational,
        name: hit.d61Address.slice(0, 3).filter(function(string) {
            return string.length > 0;
        }).join(', '),
        flatNumber: sanitiseAddressNumber(hit.flat.number),
        level: sanitiseAddressNumber(hit.flat.number),
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
        postCode: hit.postCode,
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

function addLocation(requestData, location) {
    if (!isNumber(location.distance)) {
        throw new Error('location.distance must be a distance in metres');
    }

    if (!isNumber(location.longitude) || !isNumber(location.latitude)) {
        throw new Error('location.longitude or location.latitude were not valid numbers');
    }

    requestData.query.bool.must.push({
        geo_distance: {
            distance: location.distance + 'm',
            location: {lat: location.latitude, lon: location.longitude}
        }
    });
}

function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

module.exports = GNAFApi;

