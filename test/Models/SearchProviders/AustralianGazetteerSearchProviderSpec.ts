import { configure } from "mobx";
import AustralianGazetteerSearchProvider from "../../../lib/Models/SearchProviders/AustralianGazetteerSearchProvider";
import Terria from "../../../lib/Models/Terria";

const wfsResponseXml = require("raw-loader!../../../wwwroot/test/WFS/getWithFilter.xml");

configure({
  enforceActions: "observed",
  computedRequiresReaction: true
});

describe("GazetteerSearchProvider", function () {
  let searchProvider: AustralianGazetteerSearchProvider;
  beforeEach(function () {
    searchProvider = new AustralianGazetteerSearchProvider(
      "test",
      new Terria()
    );
  });

  it(" type", function () {
    expect(searchProvider.type).toEqual(AustralianGazetteerSearchProvider.type);
  });

  it("queries the web feature service and returns search results", async function () {
    spyOn(searchProvider, "getXml").and.returnValue(
      Promise.resolve(wfsResponseXml)
    );
    const results = searchProvider.search("Fred");
    return results.resultsCompletePromise.then(() => {
      expect(searchProvider.getXml).toHaveBeenCalledTimes(1);
      expect(results).toBeDefined();
      expect(results.results.length > 0).toBeTruthy();
    });
  });
});
