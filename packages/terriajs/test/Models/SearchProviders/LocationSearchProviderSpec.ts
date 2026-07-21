import { runInAction } from "mobx";
import LocationSearchProviderMixin from "../../../lib/ModelMixins/SearchProviders/LocationSearchProviderMixin";
import CommonStrata from "../../../lib/Models/Definition/CommonStrata";
import BingMapsSearchProvider from "../../../lib/Models/SearchProviders/BingMapsSearchProvider";
import Terria from "../../../lib/Models/Terria";

describe("LocationSearchProvider", function () {
  let terria: Terria;
  let bingMapsSearchProvider: BingMapsSearchProvider;
  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });
    bingMapsSearchProvider = new BingMapsSearchProvider("test", terria);
  });

  it(" - properly mixed", function () {
    expect(
      LocationSearchProviderMixin.isMixedInto(bingMapsSearchProvider)
    ).toBeTruthy();
  });

  it(" - propperly defines default recommendedListLength", function () {
    expect(bingMapsSearchProvider.recommendedListLength).toEqual(5);
  });

  it(" - propperly defines default flightDurationSeconds", function () {
    expect(bingMapsSearchProvider.flightDurationSeconds).toEqual(1.5);
  });

  it(" - propperly defines default isOpen", function () {
    expect(bingMapsSearchProvider.isOpen).toEqual(true);
  });

  describe("searchBarModel fallback", function () {
    it(" - reads recommendedListLength from searchBarModel when not set on provider", function () {
      runInAction(() => {
        terria.searchBarModel.config.recommendedListLength = 10;
      });
      expect(bingMapsSearchProvider.recommendedListLength).toEqual(10);
    });

    it(" - reads flightDurationSeconds from searchBarModel when not set on provider", function () {
      runInAction(() => {
        terria.searchBarModel.config.flightDurationSeconds = 3.0;
      });
      expect(bingMapsSearchProvider.flightDurationSeconds).toEqual(3.0);
    });

    it(" - provider recommendedListLength takes precedence over searchBarModel", function () {
      runInAction(() => {
        terria.searchBarModel.config.recommendedListLength = 10;
      });
      bingMapsSearchProvider.setTrait(
        CommonStrata.definition,
        "recommendedListLength",
        3
      );
      expect(bingMapsSearchProvider.recommendedListLength).toEqual(3);
    });

    it(" - provider flightDurationSeconds takes precedence over searchBarModel", function () {
      runInAction(() => {
        terria.searchBarModel.config.flightDurationSeconds = 3.0;
      });
      bingMapsSearchProvider.setTrait(
        CommonStrata.definition,
        "flightDurationSeconds",
        0.5
      );
      expect(bingMapsSearchProvider.flightDurationSeconds).toEqual(0.5);
    });
  });
});
