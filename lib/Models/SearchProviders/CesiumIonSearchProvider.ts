import SearchProvider from "./SearchProvider";
import { observable, makeObservable, runInAction } from "mobx";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import defaultValue from "terriajs-cesium/Source/Core/defaultValue";
import i18next from "i18next";
import Terria from "../Terria";
import SearchProviderResults from "./SearchProviderResults";
import SearchResult from "./SearchResult";
import loadJson from "../../Core/loadJson";
import {
  Category,
  SearchAction
} from "../../Core/AnalyticEvents/analyticEvents";

interface CesiumIonSearchProviderOptions {
  terria: Terria;
  url?: string;
  key: string;
  flightDurationSeconds?: number;
}

interface CesiumIonGeocodeResultFeature {
  bbox: [number, number, number, number];
  properties: { label: string };
}

interface CesiumIonGeocodeResult {
  features: CesiumIonGeocodeResultFeature[];
}

export default class CesiumIonSearchProvider extends SearchProvider {
  readonly terria: Terria;
  @observable key: string | undefined;
  @observable flightDurationSeconds: number;
  @observable url: string;

  constructor(options: CesiumIonSearchProviderOptions) {
    super();

    makeObservable(this);

    this.terria = options.terria;
    this.name = i18next.t("viewModels.searchLocations");
    this.url = defaultValue(
      options.url,
      "https://api.cesium.com/v1/geocode/search"
    );
    this.key = options.key;
    this.flightDurationSeconds = defaultValue(
      options.flightDurationSeconds,
      1.5
    );

    if (!this.key) {
      console.warn(
        "The " +
          this.name +
          " geocoder will always return no results because a CesiumIon key has not been provided. Please get a CesiumIon key from ion.cesium.com, ensure it has geocoding permission and add it to parameters.cesiumIonAccessToken in config.json."
      );
    }
  }

  protected async doSearch(
    searchText: string,
    searchResults: SearchProviderResults
  ): Promise<void> {
    if (searchText === undefined || /^\s*$/.test(searchText)) {
      return Promise.resolve();
    }

    this.terria.analytics?.logEvent(
      Category.search,
      SearchAction.cesium,
      searchText
    );

    let response: CesiumIonGeocodeResult;
    try {
      response = await loadJson<CesiumIonGeocodeResult>(
        `${this.url}?text=${searchText}&access_token=${this.key}`
      );
    } catch (e) {
      runInAction(() => {
        searchResults.message = i18next.t("viewModels.searchErrorOccurred");
      });
      return;
    }

    runInAction(() => {
      if (!response.features) {
        searchResults.message = i18next.t("viewModels.searchNoLocations");
        return;
      }

      if (response.features.length === 0) {
        searchResults.message = i18next.t("viewModels.searchNoLocations");
      }

      searchResults.results = response.features.map<SearchResult>((feature) => {
        const [w, s, e, n] = feature.bbox;
        const rectangle = Rectangle.fromDegrees(w, s, e, n);

        return new SearchResult({
          name: feature.properties.label,
          clickAction: createZoomToFunction(this, rectangle),
          location: {
            latitude: (s + n) / 2,
            longitude: (e + w) / 2
          }
        });
      });
    });
  }
}

function createZoomToFunction(
  model: CesiumIonSearchProvider,
  rectangle: Rectangle
) {
  return function () {
    const terria = model.terria;
    terria.currentViewer.zoomTo(rectangle, model.flightDurationSeconds);
  };
}
