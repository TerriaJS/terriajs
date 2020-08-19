import Terria from "./Terria";
import SearchProvider from "./SearchProvider";
import defaultValue from "terriajs-cesium/Source/Core/defaultValue";
import { observable, runInAction } from "mobx";
import SearchProviderResults from "./SearchProviderResults";
import loadJson from "../Core/loadJson";
import Resource from "terriajs-cesium/Source/Core/Resource";
import when from "terriajs-cesium/Source/ThirdParty/when";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import i18next from "i18next";
import defined from "terriajs-cesium/Source/Core/defined";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import SearchResult from "./SearchResult";

interface NominatimSearchProviderOptions {
  terria: Terria;
  url?: string;
  flightDurationSeconds?: number;
  countryCodes?: string[];
}

export default class NominatimSearchProvider extends SearchProvider {
  readonly terria: Terria;
  @observable url: string;
  @observable flightDurationSeconds: number;
  @observable limitBounded: number;
  @observable limitOthers: number;
  @observable countryCodes: string[];

  constructor(options: NominatimSearchProviderOptions) {
    super();
    this.terria = options.terria;
    this.url = defaultValue(
      options.url,
      "https://nominatim.openstreetmap.org/"
    );
    if (this.url.length > 0 && this.url[this.url.length - 1] !== "/") {
      this.url += "/";
    }
    this.flightDurationSeconds = defaultValue(
      options.flightDurationSeconds,
      1.5
    );
    this.countryCodes = defaultValue(options.countryCodes, []);
    this.limitBounded = 2;
    this.limitOthers = 2;
  }

  protected doSearch(
    searchText: string,
    searchResults: SearchProviderResults
  ): Promise<void> {
    searchResults.results.length = 0;
    searchResults.message = undefined;

    if (searchText === undefined || /^\s*$/.test(searchText)) {
      return Promise.resolve();
    }

    this.terria.analytics.logEvent("search", "nominatim", searchText);
    const bbox = [];
    const view = this.terria.currentViewer.getCurrentCameraView();
    const rectangle = view.rectangle;
    bbox.push(CesiumMath.toDegrees(rectangle.west));
    bbox.push(CesiumMath.toDegrees(rectangle.north));
    bbox.push(CesiumMath.toDegrees(rectangle.east));
    bbox.push(CesiumMath.toDegrees(rectangle.south));

    const promiseBounded: Promise<any> = loadJson(
      new Resource({
        url: this.url + "search",
        queryParameters: {
          q: searchText,
          limit: this.limitOthers,
          countrycodes: this.countryCodes,
          format: "json",
          bounded: 1,
          viewbox: bbox.join(",")
        }
      })
    );

    const promiseOthers: Promise<any> = loadJson(
      new Resource({
        url: this.url + "search",
        queryParameters: {
          q: searchText,
          limit: this.limitOthers,
          countrycodes: this.countryCodes.join(","),
          format: "json"
        }
      })
    );

    return when.all([promiseBounded, promiseOthers]).then((result: any) => {
      if (searchResults.isCanceled) {
        // A new search has superseded this one, so ignore the result.
        return;
      }

      if (result.length === 0) {
        searchResults.message = i18next.t("viewModels.searchNoLocations");
        return;
      }
      const locations: SearchResult[] = [];
      // Locations in the bounded query go on top, locations elsewhere go undernearth
      const findDbl = function(locations: SearchResult[], place_id: string) {
        return locations.filter(function(location) {
          return location.id === place_id;
        })[0];
      };

      for (let i = 0; i < result.length; ++i) {
        for (let j = 0; j < result[i].length; ++j) {
          const resource = result[i][j];
          var name = resource.display_name;
          if (!defined(name)) {
            continue;
          }

          if (!findDbl(locations, resource.place_id)) {
            locations.push(
              new SearchResult({
                id: resource.place_id,
                name: name,
                isImportant: true,
                clickAction: createZoomToFunction(this, resource),
                location: {
                  latitude: resource.lat,
                  longitude: resource.lon
                }
              })
            );
          }
        }
      }
      runInAction(() => {
        searchResults.results.push(...locations);
      });

      if (searchResults.results.length === 0) {
        searchResults.message = i18next.t("viewModels.searchNoLocations");
      }
    });
  }
}

function createZoomToFunction(model: NominatimSearchProvider, resource: any) {
  const [south, north, west, east] = resource.boundingbox;
  const rectangle = Rectangle.fromDegrees(west, south, east, north);

  return function() {
    const terria = model.terria;
    terria.currentViewer.zoomTo(rectangle, model.flightDurationSeconds);
  };
}
