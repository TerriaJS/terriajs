import { configure } from "mobx";
import AustralianGazetteerSearchProvider from "../../../lib/Models/SearchProviders/AustralianGazetteerSearchProvider";
import Terria from "../../../lib/Models/Terria";

import wfsResponseXml from "../../../wwwroot/test/WFS/getWithFilter.xml";

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
    await searchProvider.search("Fred", true);

    expect(searchProvider.getXml).toHaveBeenCalledTimes(1);
    expect(searchProvider.searchResult).toBeDefined();
    expect(searchProvider.searchResult.results.length > 0).toBeTruthy();
  });
});
