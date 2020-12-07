import Terria from "./Terria";
import SearchProvider from "./SearchProvider";
import { observable, runInAction } from "mobx/lib/mobx";
import defaultValue from "terriajs-cesium/Source/Core/defaultValue";
import i18next from "i18next";
import SearchProviderResults from "./SearchProviderResults";
import Resource from "terriajs-cesium/Source/Core/Resource";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import loadJson from "./../Core/loadJson";
import SearchResult from "./SearchResult";
import defined from "terriajs-cesium/Source/Core/defined";
import isDefined from "../Core/isDefined";

/**
 * configuration example
 * @example
 * new HereMapsSearchProviderViewModel({
      terria: terria,
      key: terria.configParameters.hereMapsKey,
      countryCodes: ["AUS", "NZL"],
      primaryCountryCode: "AUS",
      limit: 10
   })
 */

interface HereMapsSearchProviderOptions {
  terria: Terria;
  key: string;
  url?: string;
  flightDurationSeconds?: number;
  limit?: number;
  countryCodes: string[];
  primaryCountryCode?: string;
}

export default class HereMapsSearchProvider extends SearchProvider {
  readonly terria: Terria;
  @observable url: string;
  @observable key: string;
  @observable flightDurationSeconds: number;
  @observable limit: number;
  @observable countryCodes: string[];
  @observable primaryCountryCode: string;

  constructor(options: HereMapsSearchProviderOptions) {
    super();
    this.terria = options.terria;
    this.name = i18next.t("viewModels.searchLocations");
    this.key = options.key;
    this.url = defaultValue(
      options.url,
      "https://discover.search.hereapi.com/v1/"
    );
    if (this.url.length > 0 && this.url[this.url.length - 1] !== "/") {
      this.url += "/";
    }

    this.flightDurationSeconds = defaultValue(
      options.flightDurationSeconds,
      1.5
    );

    this.limit = defaultValue(options.limit, 5);

    this.countryCodes = defaultValue(options.countryCodes, []);

    this.primaryCountryCode = defaultValue(options.primaryCountryCode, "AUS");
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

    this.terria.analytics.logEvent("search", "here", searchText);

    let longitudeDegrees;
    let latitudeDegrees;

    const view = this.terria.currentViewer.getCurrentCameraView();
    if (view.position !== undefined) {
      const cameraPositionCartographic = Ellipsoid.WGS84.cartesianToCartographic(
        view.position
      );
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

    const countryCodeQuery =
      this.countryCodes.length > 0
        ? "?in=countryCode:" + this.countryCodes.join(",")
        : "";

    const resource = new Resource({
      url: this.url + "discover" + countryCodeQuery,
      queryParameters: {
        q: searchText,
        limit: this.limit,
        at: latitudeDegrees + "," + longitudeDegrees,
        apiKey: this.key,
        lng: i18next.language
      }
    });

    const promise: Promise<any> = loadJson(resource);

    return promise
      .then(result => {
        if (searchResults.isCanceled) {
          // A new search has superseded this one, so ignore the result.
          return;
        }

        if (result.items.length === 0) {
          searchResults.message = i18next.t("viewModels.searchNoLocations");
          return;
        }

        const primaryCountryLocations: SearchResult[] = [];
        const otherLocations: SearchResult[] = [];
        for (let i = 0; i < result.items.length; ++i) {
          const resource = result.items[i];
          let name = resource.title;
          if (!defined(name)) {
            continue;
          }

          let list = primaryCountryLocations;
          let isImportant = true;

          const countryCode = resource.address
            ? resource.address.countryCode
            : undefined;
          if (
            defined(this.primaryCountryCode) &&
            countryCode !== this.primaryCountryCode
          ) {
            // Add this location to the list of other locations.
            list = otherLocations;
            isImportant = false;
          }

          list.push(
            new SearchResult({
              name: name,
              isImportant: isImportant,
              clickAction: createZoomToFunction(this, resource),
              location: {
                latitude: resource.position.lat,
                longitude: resource.position.lng
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

function createZoomToFunction(model: HereMapsSearchProvider, resource: any) {
  let south, west, north, east;
  const mapView = resource.mapView;
  if (isDefined(mapView)) {
    south = mapView.south;
    west = mapView.west;
    north = mapView.north;
    east = mapView.east;
  } else {
    const position = resource.position;
    const lat = position.lat;
    const lon = position.lng;
    south = lat - 0.01;
    north = lat + 0.01;
    east = lon + 0.01;
    west = lon - 0.01;
  }

  const rectangle: Rectangle = Rectangle.fromDegrees(west, south, east, north);

  return function() {
    const terria = model.terria;
    terria.currentViewer.zoomTo(rectangle, model.flightDurationSeconds);
  };
}
