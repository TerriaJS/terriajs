import i18next from "i18next";
import { observable, runInAction } from "mobx";
import defaultValue from "terriajs-cesium/Source/Core/defaultValue";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import Resource from "terriajs-cesium/Source/Core/Resource";
import isDefined from "../Core/isDefined";
import loadJson from "../Core/loadJson";
import SearchProvider from "./SearchProvider";
import SearchProviderResults from "./SearchProviderResults";
import SearchResult from "./SearchResult";
import Terria from "./Terria";

interface EsriGeocoderSearchProviderOptions {
  terria: Terria;
  /**
   * Url of World Geocoder instance
   */
  url?: string;
  /**
   * Key to use with requests
   */
  key?: string;
  /**
   * 

   * Countries in which to search for location, default ["AUS"]
   * For full list of countries check https://developers.arcgis.com/rest/geocode/api-reference/geocode-coverage.htm
   */
  countryCodes: string[];
  /**
   * Country to prioritise in the results
   */
  primaryCountryCode?: string;
  /**
   * Categories to search for. Default ["Address", "Populated Place"].
   * For full list of available categories check https://developers.arcgis.com/rest/geocode/api-reference/geocoding-category-filtering.htm
   */
  categories?: string[];
  flightDurationSeconds?: number;
}

/**
 * Implementation of Esri World Geocoder. Check the licence terms on the ESRI website before using.
 * Details available on https://developers.arcgis.com/features/geocoding/.
 * Rest API documentation available on https://developers.arcgis.com/rest/geocode/api-reference/geocoding-find-address-candidates.htm.
 * 
 * @example
 * new EsriGeocoderSearchProvider({
    terria: terria,
    key: "",
    countryCodes: ["AUS", "FRA"],
    primaryCountryCode: "AUS"
  })
 */
export default class EsriGeocoderSearchProvider extends SearchProvider {
  readonly terria: Terria;
  @observable url: string;
  @observable key: string | undefined;
  @observable flightDurationSeconds: number;
  @observable countryCodes: string[];
  @observable primaryCountryCode?: string;
  @observable categories: string[];

  constructor(options: EsriGeocoderSearchProviderOptions) {
    super();
    this.terria = options.terria;
    this.name = i18next.t("viewModels.searchLocations");
    this.url = defaultValue(
      options.url,
      "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates"
    );
    if (this.url.length > 0 && this.url[this.url.length - 1] !== "/") {
      this.url += "/";
    }
    this.key = options.key;
    this.flightDurationSeconds = defaultValue(
      options.flightDurationSeconds,
      1.5
    );
    this.primaryCountryCode = options.primaryCountryCode;
    this.countryCodes = defaultValue(options.countryCodes, ["AUS"]);
    this.categories = defaultValue(options.categories, [
      "Address",
      "Populated Place"
    ]);
    if (!this.key) {
      console.warn(
        `The ${this.name} geocoder might encounter limitation or return no results because a Esri Geocoder Api key has not been provided. Please add esri geocoder api key to parameters.esriGeocoderKey in config.json.`
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

    this.terria.analytics.logEvent("search", "esri", searchText);

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

    let countryCodes = this.countryCodes;
    // Check if the `primaryCountryCode` exists inside the countryCode, and add if not. Otherwise we won't get any results for primary country.
    if (
      this.primaryCountryCode &&
      countryCodes.indexOf(this.primaryCountryCode) === -1
    ) {
      countryCodes.push(this.primaryCountryCode);
    }

    const promise: Promise<any> = loadJson(
      new Resource({
        url: this.url,
        queryParameters: {
          f: "json",
          SingleLine: searchText,
          key: this.key,
          // supply the user location to prioritise the closer results
          location: `${longitudeDegrees}, ${latitudeDegrees}`,
          category: this.categories.join(","),
          // We need country to prioritise results based on Country code
          outFields: "City,Country",
          sourceCountry: countryCodes.join(","),
          // if the street number is not found, put the pin on the correct side of the street when available
          matchOutOfRange: true,
          // we are not storing the results of geocoding
          forStorage: false
        }
      })
    );

    return promise
      .then(result => {
        if (searchResults.isCanceled) {
          // A new search has superseded this one, so ignore the result.
          return;
        }

        const candidatesSet = result.candidates;
        if (!isDefined(candidatesSet) || candidatesSet.length === 0) {
          searchResults.message = i18next.t("viewModels.searchNoLocations");
          return;
        }

        const primaryCountryLocations: SearchResult[] = [];
        const otherLocations: SearchResult[] = [];

        for (let i = 0; i < candidatesSet.length; i++) {
          const candidate = candidatesSet[i];
          let name = candidate.address;
          if (!isDefined(name)) {
            continue;
          }
          let list = primaryCountryLocations;
          let isImportant = true;
          if (
            isDefined(this.primaryCountryCode) &&
            this.primaryCountryCode !== candidate.attributes.Country
          ) {
            list = otherLocations;
            isImportant = false;
          }
          list.push(
            new SearchResult({
              name: name,
              isImportant: isImportant,
              clickAction: createZoomToFunction(this, candidate),
              location: {
                latitude: candidate.location.y,
                longitude: candidate.location.x
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

function createZoomToFunction(
  model: EsriGeocoderSearchProvider,
  candidate: any
) {
  const extent = candidate.extent;
  const rectangle = Rectangle.fromDegrees(
    extent.xmin,
    extent.ymin,
    extent.xmax,
    extent.ymax
  );
  return function() {
    const terria = model.terria;
    terria.currentViewer.zoomTo(rectangle, model.flightDurationSeconds);
  };
}
