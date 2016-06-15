'use strict';

var when = require('terriajs-cesium/Source/ThirdParty/when');
var Rectangle = require('terriajs-cesium/Source/Core/Rectangle');
var loadWithXhr = require('terriajs-cesium/Source/Core/loadWithXhr');

var GNAFApi = require('../../lib/Models/GNAFApi');
var CorsProxy = require('../../lib/Core/CorsProxy');
var CustomMatchers = require('../Utility/CustomMatchers');

var UNPROXIED_URL = 'http://example.com';
var PROXIED_URL = 'http://proxy/example.com';
var SEARCH_TERM = 'bananas';
// Rectangle is west, south, east, north
var RECTANGLE = Rectangle.fromDegrees(1, 2, 3, 4);

describe('GNAFApi', function() {
    var gnafApi, loadDeferredFirst, loadDeferredSecond, corsProxy;

    beforeEach(function() {
        jasmine.addMatchers(CustomMatchers);
        var loadDeferredCount = 1;

        loadDeferredFirst = when.defer();
        loadDeferredSecond = when.defer();

        spyOn(loadWithXhr, 'load').and.callFake(function(url, responseType, method, data, headers, deferred) {
            if (loadDeferredCount === 1) {
                deferred.resolve(loadDeferredFirst);
            } else {
                deferred.resolve(loadDeferredSecond);
            }
            loadDeferredCount++;
        });

        corsProxy = new CorsProxy();
        spyOn(corsProxy, 'getURLProxyIfNecessary').and.returnValue(PROXIED_URL);

        gnafApi = new GNAFApi(corsProxy, UNPROXIED_URL, loadWithXhr);
    });

    it('should pass searchTerm through to elasticsearch', function() {
        gnafApi.geoCode(SEARCH_TERM);

        expect(getXhrArgs().query.bool.must[0].match.d61Address.query).toBe(SEARCH_TERM);
    });

    it('should make calls to the URL passed to it', function() {
        gnafApi.geoCode(SEARCH_TERM);

        expect(loadWithXhr.load.calls.argsFor(0)[0]).toBe(PROXIED_URL);
    });

    it('should have a default for URL', function() {
        var newCorsProxy = new CorsProxy();
        spyOn(newCorsProxy, 'getURLProxyIfNecessary').and.returnValue('another url');

        var newGnafApi = new GNAFApi(newCorsProxy, undefined, loadWithXhr);

        expect(newCorsProxy.getURLProxyIfNecessary.calls.argsFor(0)[0].length).toBeGreaterThan(0);
        newGnafApi.geoCode(SEARCH_TERM);

        expect(loadWithXhr.load.calls.argsFor(0)[0]).toBe('another url');
    });

    it('should convert results from elastic search scheme to something nicer', function(done) {
        var geoCodeCall = gnafApi.geoCode(SEARCH_TERM);

        loadDeferredFirst.resolve(JSON.stringify(EXAMPLE_RESPONSE));

        geoCodeCall.then(function(results) {
            expect(results.length).toBe(3);

            var hit1 = results[0];
            var hit2 = results[1];

            expect(hit1.id).toBe('GASA_415329873');
            expect(hit1.name).toBe('17 CLIFFORD WAY, VALLEY VIEW SA 5093');
            expect(hit1.score).toBe(2.5471735);
            expect(hit1.flatNumber).toBe(3);
            expect(hit1.level).toBe(2);
            expect(hit1.numberFirst).toBe(17);
            expect(hit1.numberLast).toBe(54);
            expect(hit1.street.name).toBe('CLIFFORD');
            expect(hit1.street.typeName).toBe('WAY');
            expect(hit1.localityName).toBe('VALLEY VIEW');
            expect(hit1.localityVariantNames).toEqual(['INGLEBURN MILPO', 'ST ANDREWS']);
            expect(hit1.state.abbreviation).toBe('SA');
            expect(hit1.state.name).toBe('SOUTH AUSTRALIA');
            expect(hit1.postCode).toBe('5093');
            expect(hit1.location.latitude).toBe(-34.83720711);
            expect(hit1.location.longitude).toBe(138.6667804);

            expect(hit2.name).toBe('17 CLIFFORD STREET, BAYSWATER VIC 3153');
            expect(hit2.flatNumber).toBeUndefined();
            expect(hit2.levelNumber).toBeUndefined();
            expect(hit2.numberLast).toBeUndefined();
            expect(hit2.localityVariantNames).toEqual([]);
        }).then(done).otherwise(fail);
    });

    it('should pass an XHR error back to its promise', function(done) {
        var geoCodeCall = gnafApi.geoCode(SEARCH_TERM);

        loadDeferredFirst.reject(new Error('too bad'));

        geoCodeCall.then(fail).otherwise(function(error) {
            expect(error.message).toBe('too bad');
        }).then(done).otherwise(fail);
    });

    describe('location', function() {
        it('should not be passed to elasticsearch if not passed to geoCode()', function() {
            gnafApi.geoCode(SEARCH_TERM);

            expect(getXhrArgs().filter).toBeUndefined();
        });

        it('should be passed to elasticsearch if present as arg to geoCode()', function() {
            gnafApi.geoCode(SEARCH_TERM, RECTANGLE);

            var location = getXhrArgs().filter.geo_bounding_box.location;
            expect(location.top_left.lat).toBe(4);
            expect(location.top_left.lon).toBe(1);
            expect(location.bottom_right.lat).toBe(2);
            expect(location.bottom_right.lon).toEqualEpsilon(3, 0.001);
        });
    });

    describe('max results', function() {
        it('should be passed through', function() {
            var CUSTOM_MAX_RESULTS = 5;

            gnafApi.geoCode(SEARCH_TERM, undefined, CUSTOM_MAX_RESULTS);

            expect(getXhrArgs().size).toBe(CUSTOM_MAX_RESULTS);
        });

        it('should have a reasonable default if none is specified', function() {
            gnafApi.geoCode(SEARCH_TERM);

            expect(getXhrArgs().size).toBeGreaterThan(0);
        });
    });

    describe('a second request', function() {
        it('should be made if a bounding box is passed and the first request does not return enough for max results', function(done) {
            var geoCodeCall = gnafApi.geoCode(SEARCH_TERM, RECTANGLE, 4);

            loadDeferredFirst.resolve(JSON.stringify(EXAMPLE_RESPONSE));
            loadDeferredSecond.resolve(JSON.stringify(EXAMPLE_SECOND_RESPONSE));

            geoCodeCall.then(function(results) {
                expect(loadWithXhr.load.calls.count()).toBe(2);
            }).then(done).otherwise(fail);
        });

        it('should have its unique results concatenated to the first request\'s results', function(done) {
            var geoCodeCall = gnafApi.geoCode(SEARCH_TERM, RECTANGLE, 6);

            loadDeferredFirst.resolve(JSON.stringify(EXAMPLE_RESPONSE));
            loadDeferredSecond.resolve(JSON.stringify(EXAMPLE_SECOND_RESPONSE));

            geoCodeCall.then(function(results) {
                // There's one duplicate (as resolved by id) so count should be 5
                expect(results.length).toBe(5);

                expect(results[0].id).toBe('GASA_415329873');
                expect(results[1].id).toBe('GAVIC421677561');
                expect(results[2].id).toBe('GAWA_147270166');
                expect(results[3].id).toBe('THIS_IS_A_FAKE_ID_1');
                expect(results[4].id).toBe('THIS_IS_A_FAKE_ID_2');

                // The first 3 results were from the bounding-box search, so they're locational. The rest are not.
                expect(results[0].locational).toBe(true);
                expect(results[1].locational).toBe(true);
                expect(results[2].locational).toBe(true);
                expect(results[3].locational).toBe(false);
                expect(results[4].locational).toBe(false);
            }).then(done).otherwise(fail);
        });

        it('should only provide maxResults hits even if the combined results number higher than that', function(done) {
            var geoCodeCall = gnafApi.geoCode(SEARCH_TERM, RECTANGLE, 4);

            loadDeferredFirst.resolve(JSON.stringify(EXAMPLE_RESPONSE));
            loadDeferredSecond.resolve(JSON.stringify(EXAMPLE_SECOND_RESPONSE));

            geoCodeCall.then(function(results) {
                expect(results.length).toBe(4);
            }).then(done).otherwise(fail);
        });

        it('should pass its failure through its promise', function(done) {
            var geoCodeCall = gnafApi.geoCode(SEARCH_TERM, RECTANGLE, 4);

            loadDeferredFirst.resolve(JSON.stringify(EXAMPLE_RESPONSE));
            loadDeferredSecond.reject(new Error('too bad'));

            geoCodeCall.then(fail).otherwise(function(error) {
                expect(error.message).toBe('too bad');
            }).then(done);
        });

        describe('should not be made if', function() {
            it('the first request returns enough for max results', function(done) {
                var geoCodeCall = gnafApi.geoCode(SEARCH_TERM, RECTANGLE, 3);

                loadDeferredFirst.resolve(JSON.stringify(EXAMPLE_RESPONSE));

                geoCodeCall.then(function(results) {
                    expect(loadWithXhr.load.calls.count()).toBe(1);
                }).then(done).otherwise(fail);
            });

            it('no bounding box is passed', function(done) {
                var geoCodeCall = gnafApi.geoCode(SEARCH_TERM, undefined, 4);

                loadDeferredFirst.resolve(JSON.stringify(EXAMPLE_RESPONSE));

                geoCodeCall.then(function(results) {
                    expect(loadWithXhr.load.calls.count()).toBe(1);
                }).then(done).otherwise(fail);
            });
        });
    });

    function getXhrArgs() {
        return JSON.parse(loadWithXhr.load.calls.argsFor(0)[3]);
    }
});

var EXAMPLE_RESPONSE = {
    "took": 122,
    "timed_out": false,
    "_shards": {"total": 5, "successful": 5, "failed": 0},
    "hits": {
        "total": 3,
        "max_score": 2.5471735,
        "hits": [{
            "_index": "gnaf",
            "_type": "gnaf",
            "_id": "GASA_415329873",
            "_score": 2.5471735,
            "_source": {
                "addressDetailPid": "GASA_415329873",
                "addressSiteName": null,
                "buildingName": null,
                "flatTypeCode": "D61_NULL",
                "flatTypeName": "D61_NULL",
                "flat": {"prefix": "D61_NULL", "number": 3, "suffix": "D61_NULL"},
                "levelTypeCode": "D61_NULL",
                "levelTypeName": "D61_NULL",
                "level": {"prefix": "D61_NULL", "number": 2, "suffix": "D61_NULL"},
                "numberFirst": {"prefix": "D61_NULL", "number": 17, "suffix": "D61_NULL"},
                "numberLast": {"prefix": "D61_NULL", "number": 54, "suffix": "D61_NULL"},
                "street": {
                    "name": "CLIFFORD",
                    "typeCode": "WAY",
                    "typeName": "WAY",
                    "suffixCode": "D61_NULL",
                    "suffixName": "D61_NULL"
                },
                "localityName": "VALLEY VIEW",
                "stateAbbreviation": "SA",
                "stateName": "SOUTH AUSTRALIA",
                "postcode": "5093",
                "aliasPrincipal": "P",
                "primarySecondary": "0",
                "location": {"lat": -34.83720711, "lon": 138.6667804},
                "streetVariant": [],
                "localityVariant": [{localityName: "INGLEBURN MILPO"}, {localityName: "ST ANDREWS"}],
                "d61Address": ["", "17 CLIFFORD WAY", "VALLEY VIEW SA 5093", "INGLEBURN MILPO SA", "ST ANDREWS SA"]
            }
        }, {
            "_index": "gnaf",
            "_type": "gnaf",
            "_id": "GAVIC421677561",
            "_score": 2.5471735,
            "_source": {
                "addressDetailPid": "GAVIC421677561",
                "addressSiteName": null,
                "buildingName": null,
                "flatTypeCode": "D61_NULL",
                "flatTypeName": "D61_NULL",
                "flat": {"prefix": "D61_NULL", "number": -1, "suffix": "D61_NULL"},
                "levelTypeCode": "D61_NULL",
                "levelTypeName": "D61_NULL",
                "level": {"prefix": "D61_NULL", "number": -1, "suffix": "D61_NULL"},
                "numberFirst": {"prefix": "D61_NULL", "number": 17, "suffix": "D61_NULL"},
                "numberLast": {"prefix": "D61_NULL", "number": -1, "suffix": "D61_NULL"},
                "street": {
                    "name": "CLIFFORD",
                    "typeCode": "STREET",
                    "typeName": "ST",
                    "suffixCode": "D61_NULL",
                    "suffixName": "D61_NULL"
                },
                "localityName": "BAYSWATER",
                "stateAbbreviation": "VIC",
                "stateName": "VICTORIA",
                "postcode": "3153",
                "aliasPrincipal": "P",
                "primarySecondary": "0",
                "location": {"lat": -37.854041, "lon": 145.25672},
                "streetVariant": [],
                "localityVariant": [],
                "d61Address": ["", "17 CLIFFORD STREET", "BAYSWATER VIC 3153"]
            }
        }, {
            "_index": "gnaf",
            "_type": "gnaf",
            "_id": "GAWA_147270166",
            "_score": 2.5231092,
            "_source": {
                "addressDetailPid": "GAWA_147270166",
                "addressSiteName": null,
                "buildingName": null,
                "flatTypeCode": "D61_NULL",
                "flatTypeName": "D61_NULL",
                "flat": {"prefix": "D61_NULL", "number": -1, "suffix": "D61_NULL"},
                "levelTypeCode": "D61_NULL",
                "levelTypeName": "D61_NULL",
                "level": {"prefix": "D61_NULL", "number": -1, "suffix": "D61_NULL"},
                "numberFirst": {"prefix": "D61_NULL", "number": 17, "suffix": "D61_NULL"},
                "numberLast": {"prefix": "D61_NULL", "number": -1, "suffix": "D61_NULL"},
                "street": {
                    "name": "CLIFFORD",
                    "typeCode": "WAY",
                    "typeName": "WAY",
                    "suffixCode": "D61_NULL",
                    "suffixName": "D61_NULL"
                },
                "localityName": "BULL CREEK",
                "stateAbbreviation": "WA",
                "stateName": "WESTERN AUSTRALIA",
                "postcode": "6149",
                "aliasPrincipal": "P",
                "primarySecondary": "0",
                "location": {"lat": -32.04985373, "lon": 115.85612991},
                "streetVariant": [],
                "localityVariant": [],
                "d61Address": ["", "17 CLIFFORD WAY", "BULL CREEK WA 6149"]
            }
        }]
    }
};

// This is the first response but with second two ids changed.
var EXAMPLE_SECOND_RESPONSE = {
    "took": 122,
    "timed_out": false,
    "_shards": {"total": 5, "successful": 5, "failed": 0},
    "hits": {
        "total": 3,
        "max_score": 2.5471735,
        "hits": [{
            "_index": "gnaf",
            "_type": "gnaf",
            "_id": "GASA_415329873",
            "_score": 2.5471735,
            "_source": {
                "addressDetailPid": "GASA_415329873",
                "addressSiteName": null,
                "buildingName": null,
                "flatTypeCode": "D61_NULL",
                "flatTypeName": "D61_NULL",
                "flat": {"prefix": "D61_NULL", "number": 3, "suffix": "D61_NULL"},
                "levelTypeCode": "D61_NULL",
                "levelTypeName": "D61_NULL",
                "level": {"prefix": "D61_NULL", "number": 2, "suffix": "D61_NULL"},
                "numberFirst": {"prefix": "D61_NULL", "number": 17, "suffix": "D61_NULL"},
                "numberLast": {"prefix": "D61_NULL", "number": 54, "suffix": "D61_NULL"},
                "street": {
                    "name": "CLIFFORD",
                    "typeCode": "WAY",
                    "typeName": "WAY",
                    "suffixCode": "D61_NULL",
                    "suffixName": "D61_NULL"
                },
                "localityName": "VALLEY VIEW",
                "stateAbbreviation": "SA",
                "stateName": "SOUTH AUSTRALIA",
                "postcode": "5093",
                "aliasPrincipal": "P",
                "primarySecondary": "0",
                "location": {"lat": -34.83720711, "lon": 138.6667804},
                "streetVariant": [],
                "localityVariant": [{localityName: "INGLEBURN MILPO"}, {localityName: "ST ANDREWS"}],
                "d61Address": ["", "17 CLIFFORD WAY", "VALLEY VIEW SA 5093", "INGLEBURN MILPO SA", "ST ANDREWS SA"]
            }
        }, {
            "_index": "gnaf",
            "_type": "gnaf",
            "_id": "THIS_IS_A_FAKE_ID_1",
            "_score": 2.5471735,
            "_source": {
                "addressDetailPid": "THIS_IS_A_FAKE_ID_1",
                "addressSiteName": null,
                "buildingName": null,
                "flatTypeCode": "D61_NULL",
                "flatTypeName": "D61_NULL",
                "flat": {"prefix": "D61_NULL", "number": -1, "suffix": "D61_NULL"},
                "levelTypeCode": "D61_NULL",
                "levelTypeName": "D61_NULL",
                "level": {"prefix": "D61_NULL", "number": -1, "suffix": "D61_NULL"},
                "numberFirst": {"prefix": "D61_NULL", "number": 17, "suffix": "D61_NULL"},
                "numberLast": {"prefix": "D61_NULL", "number": -1, "suffix": "D61_NULL"},
                "street": {
                    "name": "CLIFFORD",
                    "typeCode": "STREET",
                    "typeName": "ST",
                    "suffixCode": "D61_NULL",
                    "suffixName": "D61_NULL"
                },
                "localityName": "BAYSWATER",
                "stateAbbreviation": "VIC",
                "stateName": "VICTORIA",
                "postcode": "3153",
                "aliasPrincipal": "P",
                "primarySecondary": "0",
                "location": {"lat": -37.854041, "lon": 145.25672},
                "streetVariant": [],
                "localityVariant": [],
                "d61Address": ["", "17 CLIFFORD STREET", "BAYSWATER VIC 3153"]
            }
        }, {
            "_index": "gnaf",
            "_type": "gnaf",
            "_id": "THIS_IS_A_FAKE_ID_2",
            "_score": 2.5231092,
            "_source": {
                "addressDetailPid": "THIS_IS_A_FAKE_ID_2",
                "addressSiteName": null,
                "buildingName": null,
                "flatTypeCode": "D61_NULL",
                "flatTypeName": "D61_NULL",
                "flat": {"prefix": "D61_NULL", "number": -1, "suffix": "D61_NULL"},
                "levelTypeCode": "D61_NULL",
                "levelTypeName": "D61_NULL",
                "level": {"prefix": "D61_NULL", "number": -1, "suffix": "D61_NULL"},
                "numberFirst": {"prefix": "D61_NULL", "number": 17, "suffix": "D61_NULL"},
                "numberLast": {"prefix": "D61_NULL", "number": -1, "suffix": "D61_NULL"},
                "street": {
                    "name": "CLIFFORD",
                    "typeCode": "WAY",
                    "typeName": "WAY",
                    "suffixCode": "D61_NULL",
                    "suffixName": "D61_NULL"
                },
                "localityName": "BULL CREEK",
                "stateAbbreviation": "WA",
                "stateName": "WESTERN AUSTRALIA",
                "postcode": "6149",
                "aliasPrincipal": "P",
                "primarySecondary": "0",
                "location": {"lat": -32.04985373, "lon": 115.85612991},
                "streetVariant": [],
                "localityVariant": [],
                "d61Address": ["", "17 CLIFFORD WAY", "BULL CREEK WA 6149"]
            }
        }]
    }
};
