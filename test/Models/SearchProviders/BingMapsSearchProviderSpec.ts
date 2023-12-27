import { runInAction } from "mobx";
import Resource from "terriajs-cesium/Source/Core/Resource";
import LocationSearchProviderMixin from "../../../lib/ModelMixins/SearchProviders/LocationSearchProviderMixin";
import BingMapsSearchProvider from "../../../lib/Models/SearchProviders/BingMapsSearchProvider";
import Terria from "../../../lib/Models/Terria";

import * as loadJsonp from "../../../lib/Core/loadJsonp";
import CommonStrata from "../../../lib/Models/Definition/CommonStrata";

describe("BingMapsSearchProvider", function () {
  let terria: Terria;
  let bingMapsSearchProvider: BingMapsSearchProvider;

  beforeEach(async function () {
    terria = new Terria({
      baseUrl: "./"
    });
    bingMapsSearchProvider = new BingMapsSearchProvider("test", terria);
  });

  it(" - properly mixed", () => {
    expect(
      LocationSearchProviderMixin.isMixedInto(bingMapsSearchProvider)
    ).toBeTruthy();
  });

  it(" - propperly defines default url", () => {
    expect(bingMapsSearchProvider.url).toEqual("https://dev.virtualearth.net/");
  });

  it(" - propperly sets query parameters", () => {
    runInAction(() => {
      bingMapsSearchProvider.setTrait(
        CommonStrata.definition,
        "key",
        "test-key"
      );
      bingMapsSearchProvider.setTrait(
        CommonStrata.definition,
        "minCharacters",
        3
      );
      bingMapsSearchProvider.setTrait(
        CommonStrata.definition,
        "mapCenter",
        false
      );
    });
    const test = spyOn(loadJsonp, "loadJsonp").and.returnValue(
      Promise.resolve({
        resourceSets: []
      })
    );

    const searchResult = bingMapsSearchProvider.search("test");

    expect(test).toHaveBeenCalledWith(
      new Resource({
        url: "https://dev.virtualearth.net/REST/v1/Locations",
        queryParameters: {
          culture: "en-au",
          query: "test",
          key: "test-key",
          maxResults: 5
        }
      }),
      "jsonp"
    );
  });

  it(" - propperly sort the search results", async () => {
    runInAction(() => {
      bingMapsSearchProvider.setTrait(
        CommonStrata.definition,
        "key",
        "test-key"
      );
      bingMapsSearchProvider.setTrait(
        CommonStrata.definition,
        "minCharacters",
        3
      );
      bingMapsSearchProvider.setTrait(
        CommonStrata.definition,
        "mapCenter",
        false
      );
    });
    const test = spyOn(loadJsonp, "loadJsonp").and.returnValue(
      Promise.resolve({
        resourceSets: [
          {
            resources: [
              {
                name: "test result 1",
                address: {
                  countryRegion: "Italy"
                },
                point: {
                  type: "Point",
                  coordinates: [46.06452179, 12.08810234]
                },
                bbox: [
                  46.06022262573242, 12.072776794433594, 46.06576919555664,
                  12.101446151733398
                ]
              },
              {
                name: "test result 2",
                address: {
                  countryRegion: "Australia"
                },
                point: {
                  type: "Point",
                  coordinates: [46.06452179, 12.08810234]
                },
                bbox: [
                  45.96084213256836, 11.978724479675293, 46.09341049194336,
                  12.2274169921875
                ]
              },
              {
                name: undefined
              }
            ]
          }
        ]
      })
    );

    const searchResult = await bingMapsSearchProvider.search("test");

    expect(searchResult.results.length).toEqual(2);
    expect(searchResult.message).toBeUndefined();
    expect(searchResult.results[0].name).toEqual("test result 2");
    expect(searchResult.results[1].name).toEqual("test result 1, Italy");
  });
});
