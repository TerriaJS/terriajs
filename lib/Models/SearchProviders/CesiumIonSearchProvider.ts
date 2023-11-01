import Cesium from "../Cesium";
import SearchProvider from "./SearchProvider";
import { observable, makeObservable } from "mobx";
import Terria from "../Terria";
import { defaultValue } from "terriajs-cesium";
import Scene from "terriajs-cesium/Source/Scene/Scene";
import SearchProviderResults from "./SearchProviderResults";
import SearchResult from "./SearchResult";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import loadJson from "../../Core/loadJson";
interface CesiumIonSearchProviderOptions {
  terria: Terria;
  url?: string;
  key?: string;
  flightDurationSeconds?: number;
  primaryCountry?: string;
  culture?: string;
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
    this.url = defaultValue(
      options.url,
      "https://api.cesium.com/v1/geocode/search"
    );
    this.key = options.key;
    this.flightDurationSeconds = defaultValue(
      options.flightDurationSeconds,
      1.5
    );
  }

  protected async doSearch(
    searchText: string,
    results: SearchProviderResults
  ): Promise<void> {
    if (searchText === undefined || /^\s*$/.test(searchText)) {
      return Promise.resolve();
    }

    const response = await loadJson<CesiumIonGeocodeResult>(
      `${this.url}?text=${searchText}&access_token=${this.key}`
    );

    if (!response.features) {
      return;
    }

    results.results.push(
      ...response.features.map<SearchResult>((feature) => {
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
      })
    );
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
