import { Feature, Point } from "geojson";
import i18next from "i18next";
import { action, makeObservable, override, runInAction } from "mobx";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import Resource from "terriajs-cesium/Source/Core/Resource";
import {
  Category,
  SearchAction
} from "../../Core/AnalyticEvents/analyticEvents";
import isDefined from "../../Core/isDefined";
import { loadJsonAbortable } from "../../Core/loadJson";
import { applyTranslationIfExists } from "../../Language/languageHelpers";
import prettifyCoordinates from "../../Map/Vector/prettifyCoordinates";
import LocationSearchProviderMixin, {
  getMapCenter
} from "../../ModelMixins/SearchProviders/LocationSearchProviderMixin";
import MapboxSearchProviderTraits from "../../Traits/SearchProviders/MapboxSearchProviderTraits";
import CommonStrata from "../Definition/CommonStrata";
import CreateModel from "../Definition/CreateModel";
import Terria from "../Terria";
import SearchResult from "./SearchResult";

enum MapboxGeocodeDirection {
  Forward = "forward",
  Reverse = "reverse"
}

interface MapboxGeocodingResponse {
  features: Feature<Point>[];
  type: string;
  attribution?: string;
}

export default class MapboxSearchProvider extends LocationSearchProviderMixin(
  CreateModel(MapboxSearchProviderTraits)
) {
  static readonly type = "mapbox-search-provider";

  get type() {
    return MapboxSearchProvider.type;
  }

  constructor(uniqueId: string | undefined, terria: Terria) {
    super(uniqueId, terria);

    makeObservable(this);
  }

  @override
  override showWarning() {
    if (!this.accessToken || this.accessToken === "") {
      console.warn(
        `The ${applyTranslationIfExists(this.name, i18next)}(${
          this.type
        }) geocoder will always return no results because a Mapbox token has not been provided. Please get a token from mapbox.com and add it to parameters.mapboxSearchProviderAccessToken in config.json.`
      );
    }
  }

  protected logEvent(searchText: string) {
    this.terria.analytics?.logEvent(
      Category.search,
      SearchAction.mapbox,
      searchText
    );
  }

  @action
  protected async doSearch(
    searchText: string,
    abortSignal: AbortSignal
  ): Promise<void> {
    this.searchResult.clear();

    const isCoordinate = RegExp(
      /^-?([0-9]{1,2}|1[0-7][0-9]|180)(\.[0-9]{1,17})$/
    );
    const isCSCoordinatePair = RegExp(
      /([+-]?\d+\.?\d+)\s*,\s*([+-]?\d+\.?\d+)/
    );
    let searchDirection = isCSCoordinatePair.test(searchText)
      ? MapboxGeocodeDirection.Reverse
      : MapboxGeocodeDirection.Forward;

    let queryParams = {
      access_token: this.accessToken,
      autocomplete: this.partialMatch,
      language: this.language
    };

    //check if geocoder should be reverse and set up.
    if (searchDirection === MapboxGeocodeDirection.Reverse) {
      let lonLat = searchText.split(/\s+/).join("").split(",");
      if (
        lonLat.length === 2 &&
        isCoordinate.test(lonLat[0]) &&
        isCoordinate.test(lonLat[1])
      ) {
        // need to reverse the coord order if true.
        if (this.latLonSearchOrder) {
          lonLat = lonLat.reverse();
        }

        const [lonf, latf] = lonLat.map(parseFloat);

        if (this.showCoordinatesInReverseGeocodeResult) {
          const prettyCoords = prettifyCoordinates(lonf, latf);
          this.searchResult.results.push(
            new SearchResult({
              name: `${prettyCoords.latitude}, ${prettyCoords.longitude}`,
              clickAction: createZoomToFunction(this, {
                geometry: {
                  coordinates: [lonf, latf]
                },
                properties: {}
              }),
              location: {
                longitude: lonf,
                latitude: latf
              }
            })
          );
        }

        queryParams = {
          ...queryParams,
          ...{
            longitude: lonLat[0],
            latitude: lonLat[1],
            limit: 1 //limit for reverse geocoder is per type
          }
        };
      } else {
        //if lonLat fails to parse, then assume is forward geocode
        searchDirection = MapboxGeocodeDirection.Forward;
      }
    }

    const searchQuery = new Resource({
      url: new URL(searchDirection, this.url).toString(),
      queryParameters: queryParams
    });

    if (searchDirection === MapboxGeocodeDirection.Forward) {
      searchQuery.appendQueryParameters({
        q: searchText,
        limit: this.limit
      });
    }

    if (searchDirection === MapboxGeocodeDirection.Forward && this.mapCenter) {
      const mapCenter = getMapCenter(this.terria);

      searchQuery.appendQueryParameters({
        proximity: `${mapCenter.longitude}, ${mapCenter.latitude}`
      });
    }

    if (
      searchDirection === MapboxGeocodeDirection.Forward &&
      this.terria.searchBarModel.boundingBoxLimit
    ) {
      const bbox = this.terria.searchBarModel.boundingBoxLimit;
      if (
        isDefined(bbox.west) &&
        isDefined(bbox.north) &&
        isDefined(bbox.east) &&
        isDefined(bbox.south)
      ) {
        searchQuery.appendQueryParameters({
          bbox: [bbox.west, bbox.north, bbox.east, bbox.south].join(",")
        });
      }
    }

    if (this.country) {
      searchQuery.appendQueryParameters({
        country: this.country
      });
    }

    if (this.types) {
      searchQuery.appendQueryParameters({
        types: this.types
      });
    }

    if (this.worldview) {
      searchQuery.appendQueryParameters({
        worldview: this.worldview
      });
    }

    const promise: Promise<any> = loadJsonAbortable(searchQuery, {
      abortSignal
    });
    return promise
      .then((result: MapboxGeocodingResponse) => {
        if (abortSignal.aborted) {
          // A new search has superseded this one, so ignore the result.
          return;
        }

        if (
          (result.features.length === 0 &&
            searchDirection === MapboxGeocodeDirection.Forward) ||
          //in the case where coordinate result is true, list is
          //not empty.
          (result.features.length === 0 &&
            searchDirection === MapboxGeocodeDirection.Reverse &&
            this.showCoordinatesInReverseGeocodeResult === false)
        ) {
          this.searchResult.noResults("translate#viewModels.searchNoLocations");

          return;
        }

        const locations: SearchResult[] = result.features
          .filter(
            (feat) =>
              feat.properties && feat.geometry && feat.properties.full_address
          )
          .map((feat) => {
            return new SearchResult({
              name: feat.properties!.full_address,
              clickAction: createZoomToFunction(this, feat),
              location: {
                latitude: feat.geometry.coordinates[1],
                longitude: feat.geometry.coordinates[0]
              }
            });
          });

        runInAction(() => {
          this.searchResult.results.push(...locations);
        });

        if (this.searchResult.results.length === 0) {
          this.searchResult.noResults("translate#viewModels.searchNoLocations");
        }
        const attribution = result.attribution;
        if (attribution) {
          runInAction(() => {
            this.setTrait(CommonStrata.underride, "attributions", [
              attribution
            ]);
          });
        }
      })
      .catch(() => {
        if (abortSignal.aborted) {
          // This search was aborted, so ignore the result.
          return;
        }

        this.searchResult.errorOccurred();
      });
  }
}

function createZoomToFunction(model: MapboxSearchProvider, resource: any) {
  // mapbox doesn't return a bbox for street names etc, so we
  // need to create it ourselves.
  const [west, north, east, south] = resource.properties.bbox ?? [
    resource.geometry.coordinates[0] - 0.01,
    resource.geometry.coordinates[1] - 0.01,
    resource.geometry.coordinates[0] + 0.01,
    resource.geometry.coordinates[1] + 0.01
  ];
  const rectangle = Rectangle.fromDegrees(west, south, east, north);

  return function () {
    const terria = model.terria;
    terria.currentViewer.zoomTo(rectangle, model.flightDurationSeconds);
  };
}
