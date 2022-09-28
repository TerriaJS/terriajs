import { observable, runInAction } from "mobx";
import defaultValue from "terriajs-cesium/Source/Core/defaultValue";
import defined from "terriajs-cesium/Source/Core/defined";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import Resource from "terriajs-cesium/Source/Core/Resource";
import loadJsonp from "../../Core/loadJsonp";
import SearchProvider from "./SearchProvider";
import SearchResult from "./SearchResult";
import Terria from "../Terria";
import SearchProviderResults from "./SearchProviderResults";
import i18next from "i18next";
import {
  Category,
  SearchAction
} from "../../Core/AnalyticEvents/analyticEvents";

interface BingMapsSearchProviderOptions {
  terria: Terria;
  url?: string;
  key?: string;
  flightDurationSeconds?: number;
  primaryCountry?: string;
  culture?: string;
}

export default class BingMapsSearchProvider extends SearchProvider {
  readonly terria: Terria;
  @observable url: string;
  @observable key: string | undefined;
  @observable flightDurationSeconds: number;
  @observable primaryCountry: string;
  @observable culture: string;

  constructor(options: BingMapsSearchProviderOptions) {
    super();

    this.terria = options.terria;
    this.name = i18next.t("viewModels.searchLocations");
    this.url = defaultValue(options.url, "https://dev.virtualearth.net/");
    if (this.url.length > 0 && this.url[this.url.length - 1] !== "/") {
      this.url += "/";
    }
    this.key = options.key;
    this.flightDurationSeconds = defaultValue(
      options.flightDurationSeconds,
      1.5
    );
    this.primaryCountry = defaultValue(options.primaryCountry, "Australia");
    this.culture = defaultValue(options.culture, "en-au");

    if (!this.key) {
      console.warn(
        "The " +
          this.name +
          " geocoder will always return no results because a Bing Maps key has not been provided. Please get a Bing Maps key from bingmapsportal.com and add it to parameters.bingMapsKey in config.json."
      );
    }
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

    this.terria.analytics?.logEvent(
      Category.search,
      SearchAction.bing,
      searchText
    );

    let longitudeDegrees;
    let latitudeDegrees;

    const view = this.terria.currentViewer.getCurrentCameraView();
    if (view.position !== undefined) {
      const cameraPositionCartographic =
        Ellipsoid.WGS84.cartesianToCartographic(view.position);
      longitudeDegrees = CesiumMath.toDegrees(
        cameraPositionCartographic.longitude
      );
      latitudeDegrees = CesiumMath.toDegrees(
        cameraPositionCartographic.latitude
      );
    } else {
      const center = Rectangle.center(view.rectangle);
      longitudeDegrees = CesiumMath.toDegrees(center.longitude);
      latitudeDegrees = CesiumMath.toDegrees(center.latitude);
    }

    const promise: Promise<any> = loadJsonp(
      new Resource({
        url:
          this.url +
          "REST/v1/Locations?culture=" +
          this.culture +
          "&userLocation=" +
          latitudeDegrees +
          "," +
          longitudeDegrees,
        queryParameters: {
          query: searchText,
          key: this.key
        }
      }),
      "jsonp"
    );

    return promise
      .then((result) => {
        if (searchResults.isCanceled) {
          // A new search has superseded this one, so ignore the result.
          return;
        }

        if (result.resourceSets.length === 0) {
          searchResults.message = i18next.t("viewModels.searchNoLocations");
          return;
        }

        var resourceSet = result.resourceSets[0];
        if (resourceSet.resources.length === 0) {
          searchResults.message = i18next.t("viewModels.searchNoLocations");
          return;
        }

        const primaryCountryLocations: any[] = [];
        const otherLocations: any[] = [];

        // Locations in the primary country go on top, locations elsewhere go undernearth and we add
        // the country name to them.
        for (let i = 0; i < resourceSet.resources.length; ++i) {
          const resource = resourceSet.resources[i];

          let name = resource.name;
          if (!defined(name)) {
            continue;
          }

          let list = primaryCountryLocations;
          let isImportant = true;

          const country = resource.address
            ? resource.address.countryRegion
            : undefined;
          if (defined(this.primaryCountry) && country !== this.primaryCountry) {
            // Add this location to the list of other locations.
            list = otherLocations;
            isImportant = false;

            // Add the country to the name, if it's not already there.
            if (
              defined(country) &&
              name.lastIndexOf(country) !== name.length - country.length
            ) {
              name += ", " + country;
            }
          }

          list.push(
            new SearchResult({
              name: name,
              isImportant: isImportant,
              clickAction: createZoomToFunction(this, resource),
              location: {
                latitude: resource.point.coordinates[0],
                longitude: resource.point.coordinates[1]
              }
            })
          );
        }

        runInAction(() => {
          searchResults.results.push(...primaryCountryLocations);
          searchResults.results.push(...otherLocations);
        });

        if (searchResults.results.length === 0) {
          searchResults.message = i18next.t("viewModels.searchNoLocations");
        }
      })
      .catch(() => {
        if (searchResults.isCanceled) {
          // A new search has superseded this one, so ignore the result.
          return;
        }

        searchResults.message = i18next.t("viewModels.searchErrorOccurred");
      });
  }
}

function createZoomToFunction(model: BingMapsSearchProvider, resource: any) {
  const [south, west, north, east] = resource.bbox;
  const rectangle = Rectangle.fromDegrees(west, south, east, north);

  return function () {
    const terria = model.terria;
    terria.currentViewer.zoomTo(rectangle, model.flightDurationSeconds);
  };
}
