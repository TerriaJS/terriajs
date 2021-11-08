import WebMapServiceCatalogItem from "../../lib/Models/Catalog/Ows/WebMapServiceCatalogItem";
import Terria from "../../lib/Models/Terria";

describe("WebMapServiceCatalogItem", function() {
  it("derives getCapabilitiesUrl from url if getCapabilitiesUrl is not specified", function() {
    const terria = new Terria();
    const wms = new WebMapServiceCatalogItem("test", terria);
    wms.setTrait("definition", "url", "foo.bar.baz");
    expect(wms.getCapabilitiesUrl).toBeDefined();
    expect(wms.url).toBeDefined();
    expect(
      wms.getCapabilitiesUrl &&
        wms.getCapabilitiesUrl.indexOf(wms.url || "undefined") === 0
    ).toBe(true);
  });
});
