import LocationSearchProviderMixin from "../../../lib/ModelMixins/SearchProviders/LocationSearchProviderMixin";
import BingMapsSearchProvider from "../../../lib/Models/SearchProviders/BingMapsSearchProvider";
import Terria from "../../../lib/Models/Terria";

describe("BingMapsSearchProviderTraits", function() {
  let terria: Terria;
  let bingMapsSearchProvider: BingMapsSearchProvider;
  beforeEach(async function() {
    terria = new Terria({
      baseUrl: "./"
    });
    bingMapsSearchProvider = new BingMapsSearchProvider("test", terria);
  });

  it(" - properly mixed", function() {
    expect(
      LocationSearchProviderMixin.isMixedInto(bingMapsSearchProvider)
    ).toBeTruthy();
  });

  describe(" - default values", function() {
    it(" - propperly defines default url", function() {
      expect(bingMapsSearchProvider.url).toEqual(
        "https://dev.virtualearth.net/"
      );
    });
  });
});
