"use strict";

var CatalogItem = require("../../lib/Models/CatalogItem");
var NominatimSearchProviderViewModel = require("../../lib/ViewModels/NominatimSearchProviderViewModel");
var Terria = require("../../lib/Models/Terria");

describe("NominatimSearchProviderViewModel", function() {
  var terria;
  var searchProvider;

  beforeEach(function() {
    terria = new Terria({
      baseUrl: "./"
    });

    searchProvider = new NominatimSearchProviderViewModel({
      terria: terria,
      countryCodes: "fr"
    });
  });

  afterEach(function() {
    searchProvider = undefined;
  });

  it("find a simple location", function(done) {
    jasmine.Ajax.install();

    jasmine.Ajax.stubRequest(
      new RegExp(
        "nominatim\\.openstreetmap\\.org/search\\?q=la%20tour%20du%20pin&bounded=1&format=json&countrycodes=fr&limit=2"
      )
    ).andReturn({
      responseText: JSON.stringify([
        {
          place_id: "127736185",
          licence:
            "Data © OpenStreetMap contributors, ODbL 1.0. http://www.openstreetmap.org/copyright",
          osm_type: "relation",
          osm_id: "91235",
          boundingbox: ["45.5559923", "45.5927145", "5.4340082", "5.4577117"],
          lat: "45.5666202",
          lon: "5.4424054",
          display_name:
            "La Tour-du-Pin, Isère, Rhône-Alpes, Metropolitan France, 38110, France",
          class: "boundary",
          type: "administrative",
          importance: 0.88457091446737,
          icon:
            "http://nominatim.openstreetmap.org/images/mapicons/poi_boundary_administrative.p.20.png"
        },
        {
          place_id: "127908816",
          licence:
            "Data © OpenStreetMap contributors, ODbL 1.0. http://www.openstreetmap.org/copyright",
          osm_type: "relation",
          osm_id: "1680027",
          boundingbox: ["45.3651102", "45.8836319", "5.0723664", "5.7197606"],
          lat: "45.62392705",
          lon: "5.34721322521346",
          display_name:
            "La Tour-du-Pin, Isère, Rhône-Alpes, Metropolitan France, France",
          class: "boundary",
          type: "administrative",
          importance: 0.73766926065964,
          icon:
            "http://nominatim.openstreetmap.org/images/mapicons/poi_boundary_administrative.p.20.png"
        }
      ])
    });

    jasmine.Ajax.stubRequest(
      new RegExp(
        "nominatim\\.openstreetmap\\.org/search\\?q=la%20tour%20du%20pin&format=json&countrycodes=fr&limit=2"
      )
    ).andReturn({
      responseText: JSON.stringify([
        {
          place_id: "127736185",
          licence:
            "Data © OpenStreetMap contributors, ODbL 1.0. http://www.openstreetmap.org/copyright",
          osm_type: "relation",
          osm_id: "91235",
          boundingbox: ["45.5559923", "45.5927145", "5.4340082", "5.4577117"],
          lat: "45.5666202",
          lon: "5.4424054",
          display_name:
            "La Tour-du-Pin, Isère, Rhône-Alpes, Metropolitan France, 38110, France",
          class: "boundary",
          type: "administrative",
          importance: 0.88457091446737,
          icon:
            "https://nominatim.openstreetmap.org/images/mapicons/poi_boundary_administrative.p.20.png"
        },
        {
          place_id: "127908816",
          licence:
            "Data © OpenStreetMap contributors, ODbL 1.0. http://www.openstreetmap.org/copyright",
          osm_type: "relation",
          osm_id: "1680027",
          boundingbox: ["45.3651102", "45.8836319", "5.0723664", "5.7197606"],
          lat: "45.62392705",
          lon: "5.34721322521346",
          display_name:
            "La Tour-du-Pin, Isère, Rhône-Alpes, Metropolitan France, France",
          class: "boundary",
          type: "administrative",
          importance: 0.73766926065964,
          icon:
            "https://nominatim.openstreetmap.org/images/mapicons/poi_boundary_administrative.p.20.png"
        }
      ])
    });

    var catalogGroup = terria.catalog.group;

    var item = new CatalogItem(terria);
    item.name = "Thing to find";
    catalogGroup.add(item);

    searchProvider.search("la tour du pin").then(function() {
      expect(searchProvider.searchResults.length > 0).toBe(true);
      done();
    });
  });

  it("finds catalog items only located in France", function(done) {
    jasmine.Ajax.install();

    jasmine.Ajax.stubRequest(
      new RegExp(
        "nominatim\\.openstreetmap\\.org/search\\?q=place&bounded=1&format=json&countrycodes=fr&limit=2"
      )
    ).andReturn({
      responseText: JSON.stringify([
        {
          place_id: "127472260",
          licence:
            "Data © OpenStreetMap contributors, ODbL 1.0. http://www.openstreetmap.org/copyright",
          osm_type: "relation",
          osm_id: "272025",
          boundingbox: ["44.9891976", "45.0444328", "4.7504141", "4.813242"],
          lat: "45.01",
          lon: "4.78165",
          display_name:
            "Plats, Tournon-sur-Rhône, Ardèche, Rhône-Alpes, Metropolitan France, 07300, France",
          class: "boundary",
          type: "administrative",
          importance: 0.51799903507502,
          icon:
            "http://nominatim.openstreetmap.org/images/mapicons/poi_boundary_administrative.p.20.png"
        },
        {
          place_id: "127792828",
          licence:
            "Data © OpenStreetMap contributors, ODbL 1.0. http://www.openstreetmap.org/copyright",
          osm_type: "relation",
          osm_id: "1113941",
          boundingbox: ["48.2326423", "48.3013201", "-0.8241324", "-0.7290976"],
          lat: "48.2534179",
          lon: "-0.777203",
          display_name:
            "Placé, Mayenne, Pays de la Loire, Metropolitan France, 53240, France",
          class: "boundary",
          type: "administrative",
          importance: 0.4900911650427,
          icon:
            "http://nominatim.openstreetmap.org/images/mapicons/poi_boundary_administrative.p.20.png"
        }
      ])
    });

    jasmine.Ajax.stubRequest(
      new RegExp(
        "nominatim\\.openstreetmap\\.org/search\\?q=place&format=json&countrycodes=fr&limit=2"
      )
    ).andReturn({
      responseText: JSON.stringify([
        {
          place_id: "127472260",
          licence:
            "Data © OpenStreetMap contributors, ODbL 1.0. http://www.openstreetmap.org/copyright",
          osm_type: "relation",
          osm_id: "272025",
          boundingbox: ["44.9891976", "45.0444328", "4.7504141", "4.813242"],
          lat: "45.01",
          lon: "4.78165",
          display_name:
            "Plats, Tournon-sur-Rhône, Ardèche, Rhône-Alpes, Metropolitan France, 07300, France",
          class: "boundary",
          type: "administrative",
          importance: 0.51799903507502,
          icon:
            "http://nominatim.openstreetmap.org/images/mapicons/poi_boundary_administrative.p.20.png"
        },
        {
          place_id: "127792828",
          licence:
            "Data © OpenStreetMap contributors, ODbL 1.0. http://www.openstreetmap.org/copyright",
          osm_type: "relation",
          osm_id: "1113941",
          boundingbox: ["48.2326423", "48.3013201", "-0.8241324", "-0.7290976"],
          lat: "48.2534179",
          lon: "-0.777203",
          display_name:
            "Placé, Mayenne, Pays de la Loire, Metropolitan France, 53240, France",
          class: "boundary",
          type: "administrative",
          importance: 0.4900911650427,
          icon:
            "http://nominatim.openstreetmap.org/images/mapicons/poi_boundary_administrative.p.20.png"
        }
      ])
    });

    var catalogGroup = terria.catalog.group;

    var item = new CatalogItem(terria);
    item.name = "Thing to find";
    catalogGroup.add(item);

    searchProvider.search("place").then(function() {
      expect(searchProvider.searchResults.length > 0).toBe(true);
      for (var i = 0; i < searchProvider.searchResults.length; ++i) {
        expect(searchProvider.searchResults[i].name).toContain("France");
      }
      done();
    });
  });
});
