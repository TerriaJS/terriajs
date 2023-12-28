import CesiumIonSearchProvider from "../../../lib/Models/SearchProviders/CesiumIonSearchProvider";
import Terria from "../../../lib/Models//Terria";
import * as loadJson from "../../../lib/Core/loadJson";
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

  beforeEach(async function () {
    terria = new Terria({
      baseUrl: "./"
    });
    searchProvider = new CesiumIonSearchProvider("test-cesium-ion", terria);
    searchProvider.setTrait(CommonStrata.definition, "key", "testkey");
    searchProvider.setTrait(CommonStrata.definition, "url", "api.test.com");
  });

  it("Handles valid results", async () => {
    spyOn(loadJson, "default").and.returnValue(
      new Promise((resolve) => resolve(fixture))
    );

    const result = await searchProvider.search("test");
    expect(loadJson.default).toHaveBeenCalledWith(
      "api.test.com?text=test&access_token=testkey"
    );
    expect(result.results.length).toBe(1);
    expect(result.results[0].name).toBe("West End, Australia");
    expect(result.results[0].location?.latitude).toBe(-27.4822998046875);
  });

  it("Handles empty result", async () => {
    spyOn(loadJson, "default").and.returnValue(
      new Promise((resolve) => resolve([]))
    );
    const result = await searchProvider.search("test");
    console.log(result);
    expect(result.results.length).toBe(0);
    expect(result.message?.content).toBe(
      "translate#viewModels.searchNoLocations"
    );
  });

  it("Handles error", async () => {
    spyOn(loadJson, "default").and.throwError("error");
    const result = await searchProvider.search("test");
    expect(result.results.length).toBe(0);
    expect(result.message?.content).toBe(
      "translate#viewModels.searchErrorOccurred"
    );
  });
});
