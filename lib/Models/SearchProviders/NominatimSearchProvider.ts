import { Feature, Point } from "geojson";
import { action, makeObservable } from "mobx";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import Resource from "terriajs-cesium/Source/Core/Resource";
import {
  Category,
  SearchAction
} from "../../Core/AnalyticEvents/analyticEvents";
import { loadJsonAbortable } from "../../Core/loadJson";
import LocationSearchProviderMixin from "../../ModelMixins/SearchProviders/LocationSearchProviderMixin";
import NominatimSearchProviderTraits from "../../Traits/SearchProviders/NominatimSearchProviderTraits";
import CreateModel from "../Definition/CreateModel";
import Terria from "../Terria";
import SearchResult from "./SearchResult";

export default class NominatimSearchProvider extends LocationSearchProviderMixin(
  CreateModel(NominatimSearchProviderTraits)
) {
  static readonly type = "nominatim-search-provider";

  get type() {
    return NominatimSearchProvider.type;
  }

  constructor(uniqueId: string | undefined, terria: Terria) {
    super(uniqueId, terria);

    console.warn(
      "%c" +
        "This map is using the Nominatim search provider. It is not recommended for production use, consider using a different search provider instead.",
      "color: white; font-size: 24px; font-weight: bold; font-family: Helvetica, sans-serif;"
    );

    makeObservable(this);
  }

  protected logEvent(searchText: string) {
    this.terria.analytics?.logEvent(
      Category.search,
      SearchAction.nominatim,
      searchText
    );
  }

  @action
  protected async doSearch(
    searchText: string,
    abortSignal: AbortSignal
  ): Promise<void> {
    this.searchResult.clear();

    const view = this.terria.currentViewer.getCurrentCameraView();
    const bboxStr =
      CesiumMath.toDegrees(view.rectangle.west) +
      ", " +
      CesiumMath.toDegrees(view.rectangle.north) +
      ", " +
      CesiumMath.toDegrees(view.rectangle.east) +
      ", " +
      CesiumMath.toDegrees(view.rectangle.south);

    try {
      const result = await loadJsonAbortable(
        new Resource({
          url: this.url,
          queryParameters: {
            q: searchText,
            viewbox: bboxStr,
            bounded: 0,
            format: "geojson",
            countrycodes: this.countryCodes,
            limit: this.maxResults
          }
        }),
        { abortSignal }
      );
      if (abortSignal.aborted) {
        // This search is aborted, so ignore the result.
        return;
      }

      if (
        !result?.features ||
        !Array.isArray(result.features) ||
        result.features.length === 0
      ) {
        this.searchResult.noResults("translate#viewModels.searchNoLocations");

        return;
      }

      const locations: SearchResult[] = (result.features as Feature<Point>[])
        .filter(
          (feat) =>
            feat.properties && feat.geometry && feat.properties.display_name
        )
        .sort((a, b) => b.properties!.importance - a.properties!.importance)
        .map((feat) => {
          return new SearchResult({
            name: feat.properties!.display_name,
            clickAction: createZoomToFunction(this, feat),
            location: {
              latitude: feat.geometry.coordinates[1],
              longitude: feat.geometry.coordinates[0]
            }
          });
        });

      this.searchResult.results.push(...locations);

      if (this.searchResult.results.length === 0) {
        this.searchResult.noResults("translate#viewModels.searchNoLocations");
      }
    } catch {
      if (abortSignal.aborted) {
        // A new search has superseded this one, so ignore the result.
        return;
      }

      this.searchResult.errorOccurred();
    }
  }
}

function createZoomToFunction(
  model: NominatimSearchProvider,
  resource: Feature<Point>
) {
  const [west, south, east, north] = resource.bbox!;
  const rectangle = Rectangle.fromDegrees(west, south, east, north);

  return function () {
    const terria = model.terria;
    terria.currentViewer.zoomTo(rectangle, model.flightDurationSeconds);
  };
}
