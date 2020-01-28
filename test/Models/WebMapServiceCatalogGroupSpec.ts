import WebMapServiceCatalogGroup from "../../lib/Models/WebMapServiceCatalogGroup";
import { autorun, runInAction } from "mobx";
import Terria from "../../lib/Models/Terria";

describe("WebMapServiceCatalogGroup", function() {
  it("derives getCapabilitiesUrl from url if getCapabilitiesUrl is not specified", function() {
    const terria = new Terria();
    const wms = new WebMapServiceCatalogGroup("test", terria);
    wms.setTrait("definition", "url", "http://www.example.com");
    expect(wms.getCapabilitiesUrl).toBeDefined();
    expect(wms.url).toBeDefined();
    expect(
      wms.getCapabilitiesUrl &&
        wms.getCapabilitiesUrl.indexOf(wms.url || "undefined") === 0
    ).toBe(true);
  });

  it("loads", async function() {
    expect().nothing();
    const terria = new Terria();
    const wms = new WebMapServiceCatalogGroup("test", terria);
    runInAction(() => {
      wms.setTrait("definition", "url", "test/WMS/single_metadata_url.xml");
    });
    autorun(() => {
      console.log(wms.members);
    });
  });
});
