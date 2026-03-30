import { http, HttpResponse } from "msw";
import CesiumIonSearchProvider from "../../../lib/Models/SearchProviders/CesiumIonSearchProvider";
import Terria from "../../../lib/Models//Terria";
import CommonStrata from "../../../lib/Models/Definition/CommonStrata";
import { worker } from "../../mocks/browser";

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
    searchProvider.setTrait(
      CommonStrata.definition,
      "url",
      "http://api.test.com"
    );
  });

  it("Handles valid results", async () => {
    worker.use(
      http.get("http://api.test.com", () => HttpResponse.json(fixture))
    );

    const result = searchProvider.search("test");
    await result.resultsCompletePromise;
    expect(result.results.length).toBe(1);
    expect(result.results[0].name).toBe("West End, Australia");
    expect(result.results[0].location?.latitude).toBe(-27.4822998046875);
  });

  it("Handles empty result", async () => {
    worker.use(http.get("http://api.test.com", () => HttpResponse.json([])));

    const result = searchProvider.search("test");
    await result.resultsCompletePromise;
    expect(result.results.length).toBe(0);
    expect(result.message?.content).toBe(
      "translate#viewModels.searchNoLocations"
    );
  });

  it("Handles error", async () => {
    worker.use(
      http.get("http://api.test.com", () =>
        HttpResponse.json({}, { status: 401 })
      )
    );

    const result = searchProvider.search("test");
    await result.resultsCompletePromise;
    expect(result.results.length).toBe(0);
    expect(result.message?.content).toBe(
      "translate#viewModels.searchErrorOccurred"
    );
  });
});
