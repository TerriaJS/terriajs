"use strict";

/*global require*/
var CoordinateSearchViewModel = require("../../lib/ViewModels/CoordinateSearchViewModel");
var Terria = require("../../lib/Models/Terria");

var QUERY = "-37.84,144.97";
var QUERYNORESULT = "-37.84,a144.97";
var FLIGHT_DURATION_SECONDS = 2;

describe("CoordinateSearchViewModel", function() {
  var terria;
  var searchProvider;
  beforeEach(function() {
    terria = new Terria({
      baseUrl: "./"
    });
    terria.currentViewer = {
      getCurrentExtent: jasmine.createSpy("getCurrentExtent"),
      zoomTo: jasmine.createSpy("zoomTo")
    };

    searchProvider = new CoordinateSearchViewModel({
      terria: terria,
      flightDurationSeconds: FLIGHT_DURATION_SECONDS
    });
  });

  describe("search", function() {
    it("should provide a search message if no hits", function() {
      searchProvider.search(QUERYNORESULT);

      expect(searchProvider.searchMessage.length).toBeGreaterThan(0);
    });
  });
  it("should provide the location of the result in the search result", function() {
    searchProvider.search(QUERY);

    expect(searchProvider.searchResults[0].location.latitude).toBe("-37.84");
    expect(searchProvider.searchResults[0].location.longitude).toBe("144.97");
  });

  it("should correctly create a clickAction function from the location", function() {
    searchProvider.search(QUERY);

    searchProvider.searchResults[0].clickAction();

    expect(terria.currentViewer.zoomTo).toHaveBeenCalled();
    expect(terria.currentViewer.zoomTo.calls.argsFor(0)[0]).not.toBeUndefined();
    expect(terria.currentViewer.zoomTo.calls.argsFor(0)[1]).toBe(
      FLIGHT_DURATION_SECONDS
    );
  });
});
