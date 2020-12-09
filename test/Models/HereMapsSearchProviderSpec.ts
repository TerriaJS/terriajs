import Terria from "../../lib/Models/Terria";
import SearchProviderResults from "../../lib/Models/SearchProviderResults";
import HereMapsSearchProvider from "../../lib/Models/HereSearchProvider";

class ExtendedHereMapsSearchProvider extends HereMapsSearchProvider {
  doSearch(
    searchText: string,
    searchResults: SearchProviderResults
  ): Promise<void> {
    return super.doSearch(searchText, searchResults);
  }
}

describe("HereMapsSearchProvider", function() {
  let terria: Terria;
  let searchProvider: ExtendedHereMapsSearchProvider;

  beforeEach(function() {
    terria = new Terria();
    searchProvider = new ExtendedHereMapsSearchProvider({
      terria: terria,
      key: terria.configParameters.hereMapsKey!,
      countryCodes: ["FRA"],
      primaryCountryCode: "AUS",
      limit: 10
    });
  });

  afterEach(function() {
    jasmine.Ajax.uninstall();
  });

  it("find a simple location", function(done) {
    jasmine.Ajax.install();
    jasmine.Ajax.stubRequest(
      new RegExp(
        "discover\\.search\\.hereapi\\.com/v1/discover\\?in=countryCode%3AFRA&q=la%20tour%20du%20pin&limit=10"
      )
    ).andReturn({
      responseText: JSON.stringify({
        items: [
          {
            title: "La Tour-du-Pin, Auvergne-Rhône-Alpes, France",
            id: "here:cm:namedplace:20051650",
            resultType: "locality",
            localityType: "city",
            address: {
              label: "La Tour-du-Pin, Auvergne-Rhône-Alpes, France",
              countryCode: "FRA",
              countryName: "France",
              state: "Auvergne-Rhône-Alpes",
              county: "Isère",
              city: "La Tour-du-Pin",
              postalCode: "38110"
            },
            position: { lat: 45.56375, lng: 5.44394 },
            distance: 14761281,
            mapView: {
              west: 5.43401,
              south: 45.5558,
              east: 5.45772,
              north: 45.59301
            }
          },
          {
            title: "La Tour du Pin, Cohennoz, Auvergne-Rhône-Alpes, France",
            id: "here:cm:poi:1010132632",
            resultType: "locality",
            localityType: "district",
            address: {
              label: "La Tour du Pin, Cohennoz, Auvergne-Rhône-Alpes, France",
              countryCode: "FRA",
              countryName: "France",
              state: "Auvergne-Rhône-Alpes",
              county: "Savoie",
              city: "Cohennoz",
              district: "La Tour du Pin"
            },
            position: { lat: 45.78456, lng: 6.51443 },
            distance: 14675198,
            mapView: {
              west: 6.51442,
              south: 45.78412,
              east: 6.51477,
              north: 45.78489
            }
          }
        ]
      })
    });

    const searchResults: SearchProviderResults = new SearchProviderResults(
      searchProvider
    );
    searchProvider.doSearch("la tour du pin", searchResults).then(function() {
      expect(searchResults.results.length).toEqual(2);
      done();
    });
  });
});
