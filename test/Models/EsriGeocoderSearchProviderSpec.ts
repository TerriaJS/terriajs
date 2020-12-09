import SearchProviderResults from "../../lib/Models/SearchProviderResults";
import Terria from "../../lib/Models/Terria";
import EsriGeocoderSearchProvider from "./../../lib/Models/EsriGeocoderSearchProvider";

export class ExtendedEsriGeocoderSearchProvider extends EsriGeocoderSearchProvider {
  doSearch(
    searchText: string,
    searchResults: SearchProviderResults
  ): Promise<void> {
    return super.doSearch(searchText, searchResults);
  }
}

describe("EsriGeocoderSearchProvider", function() {
  let terria: Terria;
  let searchProvider: ExtendedEsriGeocoderSearchProvider;
  beforeEach(function() {
    terria = new Terria();
    searchProvider = new ExtendedEsriGeocoderSearchProvider({
      terria: terria,
      key: "",
      countryCodes: ["AUS", "FRA"],
      primaryCountryCode: "AUS"
    });
  });

  afterEach(function() {
    jasmine.Ajax.uninstall();
  });

  it("find a simple location", function(done) {
    jasmine.Ajax.install();
    jasmine.Ajax.stubRequest(
      new RegExp(
        "geocode\\.arcgis\\.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates/\\?f=json&SingleLine=la%20tour%20du%20pin"
      )
    ).andReturn({
      responseText: JSON.stringify({
        spatialReference: {
          wkid: 4326,
          latestWkid: 4326
        },
        candidates: [
          {
            address: "La Tour-du-Pin, Isère, Auvergne-Rhône-Alpes",
            location: {
              x: 5.443940000000055,
              y: 45.56375000000003
            },
            score: 100,
            attributes: {
              City: "La Tour-du-Pin",
              Country: "FRA"
            },
            extent: {
              xmin: 5.427940000000055,
              ymin: 45.54775000000003,
              xmax: 5.459940000000055,
              ymax: 45.579750000000029
            }
          },
          {
            address: "La Tour du Pin, Cohennoz, Savoie, Auvergne-Rhône-Alpes",
            location: {
              x: 6.514430000000061,
              y: 45.784560000000059
            },
            score: 100,
            attributes: {
              City: "Cohennoz",
              Country: "FRA"
            },
            extent: {
              xmin: 6.504430000000061,
              ymin: 45.77456000000006,
              xmax: 6.524430000000061,
              ymax: 45.794560000000057
            }
          },
          {
            address:
              "La Tour du Pin, Les Bois d'Anjou, Maine-et-Loire, Pays de la Loire",
            location: {
              x: -0.16171999999994569,
              y: 47.49654000000004
            },
            score: 100,
            attributes: {
              City: "Les Bois d'Anjou",
              Country: "FRA"
            },
            extent: {
              xmin: -0.1717199999999457,
              ymin: 47.48654000000004,
              xmax: -0.15171999999994568,
              ymax: 47.50654000000004
            }
          }
        ]
      })
    });
    const searchResults: SearchProviderResults = new SearchProviderResults(
      searchProvider
    );
    searchProvider.doSearch("la tour du pin", searchResults).then(function() {
      expect(searchResults.results.length).toEqual(3);
      done();
    });
  });
});
