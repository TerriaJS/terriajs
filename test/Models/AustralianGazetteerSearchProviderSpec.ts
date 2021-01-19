import { configure } from "mobx";
import createAustralianGazetteerSearchProvider from "../../lib/Models/SearchProvider/AustralianGazetteerSearchProvider";
import Terria from "../../lib/Models/Terria";
import WebFeatureServiceSearchProvider from "../../lib/Models/SearchProvider/WebFeatureServiceSearchProvider";

const wfsResponseXml = require("raw-loader!../../wwwroot/test/WFS/getWithFilter.xml");

configure({
  enforceActions: "observed",
  computedRequiresReaction: true
});

describe("GazetteerSearchProvider", function() {
  let searchProvider: WebFeatureServiceSearchProvider;
  beforeEach(function() {
    searchProvider = createAustralianGazetteerSearchProvider(new Terria());
  });
  it("queries the web feature service and returns search results", async function() {
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
