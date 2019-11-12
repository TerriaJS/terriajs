"use strict";

var when = require("terriajs-cesium/Source/ThirdParty/when").default;
var Rectangle = require("terriajs-cesium/Source/Core/Rectangle").default;
var loadWithXhr = require("../../lib/Core/loadWithXhr");

var GnafApi = require("../../lib/Models/GnafApi");
var CorsProxy = require("../../lib/Core/CorsProxy");
var CustomMatchers = require("../Utility/CustomMatchers");

var UNPROXIED_URL = "http://example.com";
var PROXIED_URL = "http://proxy/example.com";
var SEARCH_TERM = "bananas";
var ANOTHER_SEARCH_TERM = "papayas";
// Rectangle is west, south, east, north
var RECTANGLE = Rectangle.fromDegrees(1, 2, 3, 4);

describe("GnafApi", function() {
  var gnafApi, loadDeferredFirst, loadDeferredSecond, corsProxy;

  beforeEach(function() {
    jasmine.addMatchers(CustomMatchers);
    var loadDeferredCount = 1;

    loadDeferredFirst = when.defer();
    loadDeferredSecond = when.defer();

    spyOn(loadWithXhr, "load").and.callFake(function(
      url,
      responseType,
      method,
      data,
      headers,
      deferred
    ) {
      if (loadDeferredCount === 1) {
        deferred.resolve(loadDeferredFirst);
      } else {
        deferred.resolve(loadDeferredSecond);
      }
      loadDeferredCount++;
    });

    corsProxy = new CorsProxy();
    spyOn(corsProxy, "getURLProxyIfNecessary").and.returnValue(PROXIED_URL);

    gnafApi = new GnafApi(corsProxy, UNPROXIED_URL, loadWithXhr);
  });

  it("should pass searchTerm through to lucene", function() {
    gnafApi.geoCode(SEARCH_TERM);

    expect(getXhrArgs().addr).toBe(SEARCH_TERM);
  });

  it("should make calls to the URL passed to it", function() {
    gnafApi.geoCode(SEARCH_TERM);

    expect(loadWithXhr.load.calls.argsFor(0)[0]).toBe(PROXIED_URL);
  });

  it("should have a default for URL", function() {
    var newCorsProxy = new CorsProxy();
    spyOn(newCorsProxy, "getURLProxyIfNecessary").and.returnValue(
      "another url"
    );

    var newGnafApi = new GnafApi(newCorsProxy, undefined, loadWithXhr);

    expect(
      newCorsProxy.getURLProxyIfNecessary.calls.argsFor(0)[0].length
    ).toBeGreaterThan(0);
    newGnafApi.geoCode(SEARCH_TERM);

    expect(loadWithXhr.load.calls.argsFor(0)[0]).toBe("another url");
  });

  it("should convert results from lucene search scheme to something nicer", function(done) {
    var geoCodeCall = gnafApi.geoCode(SEARCH_TERM);

    loadDeferredFirst.resolve(EXAMPLE_RESPONSE);

    geoCodeCall
      .then(function(results) {
        expect(results.length).toBe(3);

        var hit1 = results[0];
        var hit2 = results[1];

        expect(hit1.name).toBe("17 CLIFFORD WAY, VALLEY VIEW SA 5093");
        expect(hit1.score).toBe(2.5471735);
        expect(hit1.flatNumber).toBe(3);
        expect(hit1.level).toBe(2);
        expect(hit1.numberFirst).toBe(17);
        expect(hit1.numberLast).toBe(54);
        expect(hit1.street.name).toBe("CLIFFORD");
        expect(hit1.street.typeName).toBe("WAY");
        expect(hit1.localityName).toBe("VALLEY VIEW");
        expect(hit1.localityVariantNames).toEqual([
          "INGLEBURN MILPO",
          "ST ANDREWS"
        ]);
        expect(hit1.state.abbreviation).toBe("SA");
        expect(hit1.state.name).toBe("SOUTH AUSTRALIA");
        expect(hit1.postCode).toBe("5093");
        expect(hit1.location.latitude).toBe(-34.83720711);
        expect(hit1.location.longitude).toBe(138.6667804);

        expect(hit2.name).toBe("17 CLIFFORD STREET, BAYSWATER VIC 3153");
        expect(hit2.flatNumber).toBeUndefined();
        expect(hit2.levelNumber).toBeUndefined();
        expect(hit2.numberLast).toBeUndefined();
        expect(hit2.localityVariantNames).toEqual([]);
      })
      .then(done)
      .otherwise(fail);
  });

  it("should pass an XHR error back to its promise", function(done) {
    var geoCodeCall = gnafApi.geoCode(SEARCH_TERM);

    loadDeferredFirst.reject(new Error("too bad"));

    geoCodeCall
      .then(fail)
      .otherwise(function(error) {
        expect(error.message).toBe("too bad");
      })
      .then(done)
      .otherwise(fail);
  });

  it("should split array into batches properly", function() {
    var arrayToSplit = ["a", "b", "c", "d", "e", "f", "g", "h"];
    var batchSize = 3;
    var splitArray = GnafApi._splitIntoBatches(arrayToSplit, batchSize);
    expect(splitArray[0]).toEqual(["a", "b", "c"]);
    expect(splitArray[1]).toEqual(["d", "e", "f"]);
    expect(splitArray[2]).toEqual(["g", "h"]);

    batchSize = 2;
    var innerSplitArray = GnafApi._splitIntoBatches(splitArray, batchSize);
    expect(innerSplitArray[0]).toEqual([["a", "b", "c"], ["d", "e", "f"]]);
    expect(innerSplitArray[1]).toEqual([["g", "h"]]);
  });

  it("should bulk geocode search terms if asked", function() {
    gnafApi._bulkGeocodeSingleRequest([SEARCH_TERM, ANOTHER_SEARCH_TERM]);
    // Bulk geocode search term is not valid json because it has multiple root elements
    var xhrArgsStr = loadWithXhr.load.calls.argsFor(0)[3];

    expect(xhrArgsStr).toBe(EXAMPLE_BULK_REQUEST_STR);
  });

  it("should convert results from a bulk lucene search scheme to hits", function(done) {
    var geoCodeCall = gnafApi.bulkGeoCode([SEARCH_TERM, ANOTHER_SEARCH_TERM]);

    loadDeferredFirst.resolve(EXAMPLE_BULK_RESPONSE);

    geoCodeCall
      .then(function(results) {
        console.log(results);

        var hit1 = results[0];
        var hit2 = results[1];

        expect(hit1.name).toBe(
          "7 LONDON CIRCUIT, CITY ACT 2601, CANBERRA ACT 2601"
        );
        expect(hit1.score).toBe(0.5140168070793152);
        expect(hit1.numberFirst).toBe(7);
        expect(hit1.numberLast).toBeUndefined();
        expect(hit1.street.name).toBe("LONDON");
        expect(hit1.street.typeName).toBe("CCT");
        expect(hit1.localityName).toBe("CITY");
        expect(hit1.location.latitude).toBe(-35.28150121);
        expect(hit1.location.longitude).toBe(149.12512965);

        expect(hit2.name).toBe(
          "POLICE STATION, 18 LONDON CIRCUIT, CITY ACT 2601"
        );
        expect(hit2.flatNumber).toBeUndefined();
        expect(hit2.levelNumber).toBeUndefined();
        expect(hit2.numberLast).toBeUndefined();
      })
      .then(done)
      .otherwise(fail);
  });

  describe("location", function() {
    it("should not be passed to lucene if not passed to geoCode()", function() {
      gnafApi.geoCode(SEARCH_TERM);

      expect(getXhrArgs().box).toBeUndefined();
    });

    it("should be passed to lucene if present as arg to geoCode()", function() {
      gnafApi.geoCode(SEARCH_TERM, RECTANGLE);

      var location = getXhrArgs().box;
      expect(location.maxLat).toBe(4);
      expect(location.minLon).toBe(1);
      expect(location.minLat).toBe(2);
      expect(location.maxLon).toEqualEpsilon(3, 0.001);
    });
  });

  describe("max results", function() {
    it("should be passed through", function() {
      var CUSTOM_MAX_RESULTS = 5;

      gnafApi.geoCode(SEARCH_TERM, undefined, CUSTOM_MAX_RESULTS);

      expect(getXhrArgs().numHits).toBe(CUSTOM_MAX_RESULTS);
    });

    it("should have a reasonable default if none is specified", function() {
      gnafApi.geoCode(SEARCH_TERM);

      expect(getXhrArgs().numHits).toBeGreaterThan(0);
    });
  });

  function getXhrArgs() {
    return JSON.parse(loadWithXhr.load.calls.argsFor(0)[3]);
  }
});

var EXAMPLE_RESPONSE = {
  total: 3,
  max_score: 2.5471735,
  hits: [
    {
      _id: "GASA_415329873",
      score: 2.5471735,
      d61Address: [
        "",
        "17 CLIFFORD WAY",
        "VALLEY VIEW SA 5093",
        "INGLEBURN MILPO SA",
        "ST ANDREWS SA"
      ],
      json:
        '{\
            "addressDetailPid": "GASA_415329873",\
            "addressSiteName": null,\
            "buildingName": null,\
            "flatTypeCode": "D61_NULL",\
            "flatTypeName": "D61_NULL",\
            "flat": {"prefix": "D61_NULL", "number": 3, "suffix": "D61_NULL"},\
            "levelTypeCode": "D61_NULL",\
            "levelTypeName": "D61_NULL",\
            "level": {"prefix": "D61_NULL", "number": 2, "suffix": "D61_NULL"},\
            "numberFirst": {"prefix": "D61_NULL", "number": 17, "suffix": "D61_NULL"},\
            "numberLast": {"prefix": "D61_NULL", "number": 54, "suffix": "D61_NULL"},\
            "street": {\
                "name": "CLIFFORD",\
                "typeCode": "WAY",\
                "typeName": "WAY",\
                "suffixCode": "D61_NULL",\
                "suffixName": "D61_NULL"\
            },\
            "localityName": "VALLEY VIEW",\
            "stateAbbreviation": "SA",\
            "stateName": "SOUTH AUSTRALIA",\
            "postcode": "5093",\
            "aliasPrincipal": "P",\
            "primarySecondary": "0",\
            "location": {"lat": -34.83720711, "lon": 138.6667804},\
            "streetVariant": [],\
            "localityVariant": [{"localityName": "INGLEBURN MILPO"}, {"localityName": "ST ANDREWS"}]\
        }'
    },
    {
      _id: "GAVIC421677561",
      score: 2.5471735,
      d61Address: ["", "17 CLIFFORD STREET", "BAYSWATER VIC 3153"],
      json:
        '{\
            "addressDetailPid": "GAVIC421677561",\
            "addressSiteName": null,\
            "buildingName": null,\
            "flatTypeCode": "D61_NULL",\
            "flatTypeName": "D61_NULL",\
            "flat": {"prefix": "D61_NULL", "number": -1, "suffix": "D61_NULL"},\
            "levelTypeCode": "D61_NULL",\
            "levelTypeName": "D61_NULL",\
            "level": {"prefix": "D61_NULL", "number": -1, "suffix": "D61_NULL"},\
            "numberFirst": {"prefix": "D61_NULL", "number": 17, "suffix": "D61_NULL"},\
            "numberLast": {"prefix": "D61_NULL", "number": -1, "suffix": "D61_NULL"},\
            "street": {\
                "name": "CLIFFORD",\
                "typeCode": "STREET",\
                "typeName": "ST",\
                "suffixCode": "D61_NULL",\
                "suffixName": "D61_NULL"\
            },\
            "localityName": "BAYSWATER",\
            "stateAbbreviation": "VIC",\
            "stateName": "VICTORIA",\
            "postcode": "3153",\
            "aliasPrincipal": "P",\
            "primarySecondary": "0",\
            "location": {"lat": -37.854041, "lon": 145.25672},\
            "streetVariant": [],\
            "localityVariant": []\
        }'
    },
    {
      _id: "GAWA_147270166",
      score: 2.5231092,
      d61Address: ["", "17 CLIFFORD WAY", "BULL CREEK WA 6149"],
      json:
        '{\
            "addressDetailPid": "GAWA_147270166",\
            "addressSiteName": null,\
            "buildingName": null,\
            "flatTypeCode": "D61_NULL",\
            "flatTypeName": "D61_NULL",\
            "flat": {"prefix": "D61_NULL", "number": -1, "suffix": "D61_NULL"},\
            "levelTypeCode": "D61_NULL",\
            "levelTypeName": "D61_NULL",\
            "level": {"prefix": "D61_NULL", "number": -1, "suffix": "D61_NULL"},\
            "numberFirst": {"prefix": "D61_NULL", "number": 17, "suffix": "D61_NULL"},\
            "numberLast": {"prefix": "D61_NULL", "number": -1, "suffix": "D61_NULL"},\
            "street": {\
                "name": "CLIFFORD",\
                "typeCode": "WAY",\
                "typeName": "WAY",\
                "suffixCode": "D61_NULL",\
                "suffixName": "D61_NULL"\
            },\
            "localityName": "BULL CREEK",\
            "stateAbbreviation": "WA",\
            "stateName": "WESTERN AUSTRALIA",\
            "postcode": "6149",\
            "aliasPrincipal": "P",\
            "primarySecondary": "0",\
            "location": {"lat": -32.04985373, "lon": 115.85612991},\
            "streetVariant": [],\
            "localityVariant": []\
        }'
    }
  ]
};

var EXAMPLE_BULK_RESPONSE = [
  {
    totalHits: 188556,
    elapsedSecs: 1.003000020980835,
    hits: [
      {
        score: 0.5140168070793152,
        json:
          '{"location":{"lat":-35.28150121,"lon":149.12512965},"streetVariant":[],"stateName":"AUSTRALIAN CAPITAL TERRITORY","flat":{"number":5},"localityVariant":[{"localityName":"CANBERRA"},{"localityName":"CANBERRA CITY"},{"localityName":"ACTON"},{"localityName":"CANBERRA CENTRAL"}],"postcode":"2601","numberFirst":{"number":7},"numberLast":{},"flatTypeCode":"SHOP","primarySecondary":"S","localityName":"CITY","street":{"name":"LONDON","typeCode":"CIRCUIT","typeName":"CCT"},"stateAbbreviation":"ACT","addressDetailPid":"GAACT717882426","flatTypeName":"SHOP","aliasPrincipal":"P","level":{}}',
        d61Address: [
          "7 LONDON CIRCUIT",
          "CITY ACT 2601",
          "CANBERRA ACT 2601",
          "CANBERRA CITY ACT 2601",
          "ACTON ACT 2601",
          "CANBERRA CENTRAL ACT 2601"
        ],
        d61AddressNoAlias: "7 LONDON CIRCUIT CITY ACT 2601"
      }
    ]
  },
  {
    totalHits: 187021,
    elapsedSecs: 0.42900002002716064,
    hits: [
      {
        score: 0.49911782145500183,
        json:
          '{"location":{"lat":-35.28088698,"lon":149.12622398},"streetVariant":[],"stateName":"AUSTRALIAN CAPITAL TERRITORY","flat":{},"localityVariant":[{"localityName":"CANBERRA"},{"localityName":"CANBERRA CITY"},{"localityName":"ACTON"},{"localityName":"CANBERRA CENTRAL"}],"postcode":"2601","numberFirst":{"number":18},"numberLast":{},"buildingName":"POLICE STATION","localityName":"CITY","street":{"name":"LONDON","typeCode":"CIRCUIT","typeName":"CCT"},"stateAbbreviation":"ACT","addressDetailPid":"GAACT714873042","aliasPrincipal":"P","level":{}}',
        d61Address: [
          "POLICE STATION",
          "18 LONDON CIRCUIT",
          "CITY ACT 2601",
          "CANBERRA ACT 2601",
          "CANBERRA CITY ACT 2601",
          "ACTON ACT 2601",
          "CANBERRA CENTRAL ACT 2601"
        ],
        d61AddressNoAlias: "POLICE STATION 18 LONDON CIRCUIT CITY ACT 2601"
      }
    ]
  }
];

var EXAMPLE_BULK_REQUEST_STR =
  '{"numHits":1,"fuzzy":{"maxEdits":2,"minLength":5,"prefixLength":2},"addresses":["bananas","papayas"]}';
