var when = require("terriajs-cesium/Source/ThirdParty/when").default;

var Terria = require("../../lib/Models/Terria");
var GnafSearchProviderViewModel = require("../../lib/ViewModels/GnafSearchProviderViewModel");
var knockout = require("terriajs-cesium/Source/ThirdParty/knockout").default;

var QUERY = "this is a search";
var FLIGHT_DURATION_SECONDS = 2;

describe("GnafSearchProvider", function() {
  var terria;
  var searchProvider;
  var gnafApi, geoCodeDeferred;

  beforeEach(function() {
    terria = new Terria({
      baseUrl: "./"
    });
    terria.currentViewer = {
      getCurrentExtent: jasmine.createSpy("getCurrentExtent"),
      zoomTo: jasmine.createSpy("zoomTo")
    };

    geoCodeDeferred = when.defer();

    gnafApi = {
      geoCode: jasmine.createSpy("geoCode").and.returnValue(geoCodeDeferred)
    };

    searchProvider = new GnafSearchProviderViewModel({
      terria: terria,
      gnafApi: gnafApi,
      flightDurationSeconds: FLIGHT_DURATION_SECONDS
    });
  });

  describe("search", function() {
    it("should set isSearching to true when search is in progress", function() {
      searchProvider.search(QUERY);

      expect(searchProvider.isSearching).toBe(true);

      geoCodeDeferred.resolve([]);

      expect(searchProvider.isSearching).toBe(false);
    });

    it("should provide a search message if no hits", function() {
      searchProvider.search(QUERY);

      geoCodeDeferred.resolve([]);

      expect(searchProvider.searchMessage.length).toBeGreaterThan(0);
      expect(searchProvider.searchMessage.toLowerCase().indexOf("error")).toBe(
        -1
      );
    });

    it("should provide an error message if there's an error", function() {
      searchProvider.search(QUERY);

      geoCodeDeferred.reject();

      expect(searchProvider.searchMessage.length).toBeGreaterThan(0);
      expect(
        searchProvider.searchMessage.toLowerCase().indexOf("error")
      ).toBeGreaterThan(-1);
    });

    it("should correctly change GnafApi results to search results", function() {
      searchProvider.search(QUERY);

      geoCodeDeferred.resolve([
        {
          name: "Test",
          locational: true,
          location: {
            latitude: 123,
            longitude: 321
          }
        },
        {
          name: "Test 2",
          locational: false,
          location: {
            latitude: 111,
            longitude: 222
          }
        }
      ]);

      expect(searchProvider.searchResults[0].name).toBe("Test");
      expect(searchProvider.searchResults[0].isImportant).toBe(true);
      expect(searchProvider.searchResults[1].name).toBe("Test 2");
      expect(searchProvider.searchResults[1].isImportant).toBe(false);
    });

    it("should provide the location of the result in the search result", function() {
      searchProvider.search(QUERY);

      geoCodeDeferred.resolve([
        {
          name: "Test",
          locational: true,
          location: {
            latitude: 123,
            longitude: 321
          }
        }
      ]);

      expect(searchProvider.searchResults[0].location.latitude).toBe(123);
      expect(searchProvider.searchResults[0].location.longitude).toBe(321);
    });

    it("should correctly create a clickAction function from the location", function() {
      searchProvider.search(QUERY);

      geoCodeDeferred.resolve([
        {
          name: "Test",
          locational: true,
          location: {
            latitude: 123,
            longitude: 321
          }
        }
      ]);

      searchProvider.searchResults[0].clickAction();

      expect(terria.currentViewer.zoomTo).toHaveBeenCalled();
      expect(
        terria.currentViewer.zoomTo.calls.argsFor(0)[0]
      ).not.toBeUndefined();
      expect(terria.currentViewer.zoomTo.calls.argsFor(0)[1]).toBe(
        FLIGHT_DURATION_SECONDS
      );
    });

    it("multiple calls to search() should result in the first search being cancelled.", function(done) {
      var resultsChangedCount = 0;

      var searchResultsSubscription = knockout
        .getObservable(searchProvider, "searchResults")
        .subscribe(function() {
          resultsChangedCount++;
        }, this);

      searchProvider.search(QUERY);
      expect(resultsChangedCount).toBe(1); // Each call to search adds one to results changed because it clears it.
      searchProvider.search(QUERY);
      expect(resultsChangedCount).toBe(2);

      geoCodeDeferred.resolve([
        {
          name: "Test",
          locational: true,
          location: {
            latitude: 123,
            longitude: 321
          }
        }
      ]);

      geoCodeDeferred.resolve([
        {
          name: "Test",
          locational: true,
          location: {
            latitude: 123,
            longitude: 321
          }
        }
      ]);

      setTimeout(function() {
        expect(resultsChangedCount).toBe(3);
        done();
      });

      searchResultsSubscription.dispose();
    });
  });
});
