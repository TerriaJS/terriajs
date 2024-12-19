import CesiumIonSearchProvider from "../../../lib/Models/SearchProviders/CesiumIonSearchProvider";
import Terria from "../../../lib/Models//Terria";
import CommonStrata from "../../../lib/Models/Definition/CommonStrata";

const fixture = {
  features: [
    {
      properties: {
        label: "West End, Australia"
      },
      bbox: [
        152.99620056152344, -27.490509033203125, 153.0145721435547,
        -27.474090576171875
      ]
    }
  ]
};

describe("CesiumIonSearchProvider", () => {
  let terria: Terria;
  let searchProvider: CesiumIonSearchProvider;

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });
    searchProvider = new CesiumIonSearchProvider("test-cesium-ion", terria);
    searchProvider.setTrait(CommonStrata.definition, "key", "testkey");
    searchProvider.setTrait(CommonStrata.definition, "url", "api.test.com");

    jasmine.Ajax.install();
  });

  afterEach(() => {
    jasmine.Ajax.uninstall();
  });

  it("Handles valid results", async () => {
    jasmine.Ajax.stubRequest(
      "api.test.com?text=test&access_token=testkey"
    ).andReturn({ responseText: JSON.stringify(fixture) });

    const result = searchProvider.search("test");
    await result.resultsCompletePromise;
    expect(result.results.length).toBe(1);
    expect(result.results[0].name).toBe("West End, Australia");
    expect(result.results[0].location?.latitude).toBe(-27.4822998046875);
  });

  it("Handles empty result", async () => {
    jasmine.Ajax.stubRequest(
      "api.test.com?text=test&access_token=testkey"
    ).andReturn({
      responseText: JSON.stringify([])
    });
    const result = searchProvider.search("test");
    await result.resultsCompletePromise;
    expect(result.results.length).toBe(0);
    expect(result.message?.content).toBe(
      "translate#viewModels.searchNoLocations"
    );
  });

  it("Handles error", async () => {
    jasmine.Ajax.stubRequest(
      "api.test.com?text=test&access_token=testkey"
    ).andReturn({
      status: 404
    });
    const result = searchProvider.search("test");
    await result.resultsCompletePromise;
    expect(result.results.length).toBe(0);
    expect(result.message?.content).toBe(
      "translate#viewModels.searchErrorOccurred"
    );
  });
});
