import BingMapsSearchProvider from "../../../lib/Models/SearchProvider/BingMapsSearchProvider";
import Terria from "../../../lib/Models/Terria";

describe("BingMapsSearchProvider", function() {
  let searchProvider: BingMapsSearchProvider;
  beforeEach(function() {
    searchProvider = new BingMapsSearchProvider("test", new Terria());
    jasmine.Ajax.install();
    jasmine.Ajax.stubRequest(/https:\/\/dev.virtualearth.net/i).andReturn({
      responseText: JSON.stringify({
        resourceSets: [
          {
            estimatedTotal: 1,
            resources: [
              {
                address: {
                  addressLine: "Borgo Garibaldi",
                  adminDistrict: "Veneto",
                  adminDistrict2: "Belluno",
                  countryRegion: "Italy",
                  formattedAddress: "Borgo Garibaldi, 32026 Borgo Valbelluna",
                  locality: "Borgo Valbelluna",
                  postalCode: "32026"
                },
                bbox: [46.06294, 12.08387, 46.06359, 12.08573],
                confidence: "Medium",
                entityType: "RoadBlock",
                name: "Borgo Garibaldi, 32026 Borgo Valbelluna",
                point: { type: "Point", coordinates: [46.06323, 12.0848] }
              }
            ]
          }
        ]
      })
    });
  });

  afterEach(function() {
    jasmine.Ajax.uninstall();
  });

  it(" type", function() {
    expect(searchProvider.type).toEqual(BingMapsSearchProvider.type);
  });

  it("find location", function(done) {
    const results = searchProvider.search("melb");
    expect(results).toBeDefined();
    expect(results.results.length).toEqual(1);
    expect(results.results[0].name).toEqual(
      "Borgo Garibaldi, 32026 Borgo Valbelluna"
    );
    done();
  });
});
