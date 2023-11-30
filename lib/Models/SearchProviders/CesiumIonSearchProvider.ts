import i18next from "i18next";
import { makeObservable, override, runInAction } from "mobx";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";

import {
  Category,
  SearchAction
} from "../../Core/AnalyticEvents/analyticEvents";
import loadJson from "../../Core/loadJson";
import { applyTranslationIfExists } from "../../Language/languageHelpers";
import LocationSearchProviderMixin from "../../ModelMixins/SearchProviders/LocationSearchProviderMixin";
import CesiumIonSearchProviderTraits from "../../Traits/SearchProviders/CesiumIonSearchProviderTraits";
import CreateModel from "../Definition/CreateModel";
import Terria from "../Terria";
import SearchProviderResults from "./SearchProviderResults";
import SearchResult from "./SearchResult";
import CommonStrata from "../Definition/CommonStrata";

interface CesiumIonGeocodeResultFeature {
  bbox: [number, number, number, number];
  properties: { label: string };
}

interface CesiumIonGeocodeResult {
  features: CesiumIonGeocodeResultFeature[];
}

export default class CesiumIonSearchProvider extends LocationSearchProviderMixin(
  CreateModel(CesiumIonSearchProviderTraits)
) {
  static readonly type = "cesium-ion-search-provider";

  get type() {
    return CesiumIonSearchProvider.type;
  }

  constructor(uniqueId: string | undefined, terria: Terria) {
    super(uniqueId, terria);

    makeObservable(this);

    runInAction(() => {
      if (!!this.terria.configParameters.cesiumIonAccessToken) {
        this.setTrait(
          CommonStrata.defaults,
          "key",
          this.terria.configParameters.cesiumIonAccessToken
        );
      }
    });
  }

  @override
  override showWarning() {
    if (!this.key || this.key === "") {
      console.warn(
        `The ${applyTranslationIfExists(this.name, i18next)}(${
          this.type
        }) geocoder will always return no results because a CesiumIon key has not been provided. Please get a CesiumIon key from ion.cesium.com, ensure it has geocoding permission and add it to searchProvider.key or parameters.cesiumIonAccessToken in config.json.`
      );
    }
  }

  protected logEvent(searchText: string): void {
    this.terria.analytics?.logEvent(
      Category.search,
      SearchAction.cesium,
      searchText
    );
  }

  protected async doSearch(
    searchText: string,
    searchResults: SearchProviderResults
  ): Promise<void> {
    searchResults.results.length = 0;
    searchResults.message = undefined;

    let response: CesiumIonGeocodeResult;
    try {
      response = await loadJson<CesiumIonGeocodeResult>(
        `${this.url}?text=${searchText}&access_token=${this.key}`
      );
    } catch (e) {
      searchResults.message = {
        content: "translate#viewModels.searchErrorOccurred"
      };
      return;
    }

    runInAction(() => {
      if (!response.features || response.features.length === 0) {
        searchResults.message = {
          content: "translate#viewModels.searchNoLocations"
        };
        return;
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
