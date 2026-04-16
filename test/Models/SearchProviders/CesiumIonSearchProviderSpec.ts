import { delay, http, HttpResponse } from "msw";
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

    await searchProvider.search("test", true);
    expect(searchProvider.searchResult.results.length).toBe(1);
    expect(searchProvider.searchResult.results[0].name).toBe(
      "West End, Australia"
    );
    expect(searchProvider.searchResult.results[0].location?.latitude).toBe(
      -27.4822998046875
    );
  });

  it("Handles empty result", async () => {
    worker.use(http.get("http://api.test.com", () => HttpResponse.json([])));

    await searchProvider.search("test", true);
    expect(searchProvider.searchResult.results.length).toBe(0);
    expect(searchProvider.searchResult.message?.content).toBe(
      "translate#viewModels.searchNoLocations"
    );
  });

  it("Handles error", async () => {
    worker.use(
      http.get("http://api.test.com", () =>
        HttpResponse.json({}, { status: 401 })
      )
    );

    await searchProvider.search("test", true);
    expect(searchProvider.searchResult.results.length).toBe(0);
    expect(searchProvider.searchResult.message?.content).toBe(
      "translate#viewModels.searchErrorOccurred"
    );
  });

  it("cancels previous requests when a new search is made", async () => {
    worker.use(
      http.get("http://api.test.com", async ({ request }) => {
        const searchParams = new URL(request.url).searchParams;
        const text = searchParams.get("text");
        const accessToken = searchParams.get("access_token");
        if (accessToken !== "testkey") {
          return HttpResponse.json({}, { status: 401 });
        }

        if (text === "test1") {
          await delay(1000);
          return HttpResponse.json({});
        } else if (text === "test2") {
          return HttpResponse.json(fixture);
        }

        return HttpResponse.json({}, { status: 400 });
      })
    );

    const searchPromise1 = searchProvider.search("test1", true);
    const searchPromise2 = searchProvider.search("test2", true);

    await Promise.all([searchPromise1, searchPromise2]);

    expect(searchProvider.searchResult.results.length).toBe(1);
    expect(searchProvider.searchResult.results[0].name).toBe(
      "West End, Australia"
    );
  });
});
