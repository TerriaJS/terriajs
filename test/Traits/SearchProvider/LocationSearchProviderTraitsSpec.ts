import Terria from "../../../lib/Models/Terria";
import BingMapsSearchProvider from "../../../lib/Models/SearchProvider/BingMapsSearchProvider";
import LocationSearchProviderMixin from "../../../lib/ModelMixins/SearchProvider/LocationSearchProviderMixin";

describe("LocationSearchProviderTraits", function() {
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

  it(" - propperly defines default recommendedListLength", function() {
    expect(bingMapsSearchProvider.recommendedListLength).toEqual(5);
  });

  it(" - propperly defines default flightDurationSeconds", function() {
    expect(bingMapsSearchProvider.flightDurationSeconds).toEqual(1.5);
  });

  it(" - propperly defines default isOpen", function() {
    expect(bingMapsSearchProvider.isOpen).toEqual(true);
  });
});
