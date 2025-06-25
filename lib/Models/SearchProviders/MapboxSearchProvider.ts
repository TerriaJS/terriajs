import i18next from "i18next";
import { makeObservable, override, runInAction } from "mobx";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import Resource from "terriajs-cesium/Source/Core/Resource";
import defined from "terriajs-cesium/Source/Core/defined";
import {
    Category,
    SearchAction
} from "../../Core/AnalyticEvents/analyticEvents";
import loadJson from "../../Core/loadJson";
import { applyTranslationIfExists } from "../../Language/languageHelpers";
import LocationSearchProviderMixin, {
    getMapCenter
} from "../../ModelMixins/SearchProviders/LocationSearchProviderMixin";
import MapboxSearchProviderTraits from "../../Traits/SearchProviders/MapboxSearchProviderTraits";
import CreateModel from "../Definition/CreateModel";
import Terria from "../Terria";
import CommonStrata from "./../Definition/CommonStrata";
import SearchProviderResults from "./SearchProviderResults";
import SearchResult from "./SearchResult";
import { regexMatches } from "../../Core/regexMatches";
import { Feature, Point } from "@turf/helpers";

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

        runInAction(() => {
            if (this.terria.configParameters.mapboxSearchProviderAccessToken) {
                this.setTrait(
                    CommonStrata.defaults,
                    "accessToken",
                    this.terria.configParameters.mapboxSearchProviderAccessToken
                );
            }
            if (this.terria.configParameters.locationSearchBoundingBox) {
                this.setTrait(
                    CommonStrata.defaults,
                    "bbox",
                    this.terria.configParameters.locationSearchBoundingBox.join(", ") //TODO check this
                );
            }
        });
    }

    @override
    override showWarning() {
        if (!this.accessToken || this.accessToken === "") {
            console.warn(
                `The ${applyTranslationIfExists(this.name, i18next)}(${this.type
                }) geocoder will always return no results because a Mapbox token has not been provided. Please get a token from bingmapsportal.com and add it to parameters.bingMapsKey in config.json.`
            );
        }
    }

    protected logEvent(searchText: string) {
        this.terria.analytics?.logEvent(
            Category.search,
            SearchAction.bing,
            searchText
        );
    }

    protected doSearch(
        searchText: string,
        searchResults: SearchProviderResults
    ): Promise<void> {
        searchResults.results.length = 0;
        searchResults.message = undefined;
        const searchDirection = regexMatches(
            /^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/,
            searchText) ? "reverse" : "forward";

        const searchQuery = new Resource({
            url: new URL(searchDirection, this.url).toString(),
            queryParameters: {
                q: searchText,
                access_token: this.accessToken,
                autocomplete: this.autocomplete,
                language: this.language,
                limit: this.limit,
            }
        });

        if (this.mapCenter) {
            const mapCenter = getMapCenter(this.terria);

            searchQuery.appendQueryParameters({
                proximity: `${mapCenter.longitude}, ${mapCenter.latitude}`
            });
        }

        const promise: Promise<any> = loadJson(searchQuery);
        return promise
            .then((result) => {
                if (searchResults.isCanceled) {
                    // A new search has superseded this one, so ignore the result.
                    return;
                }
                if (result.resourceSets.length === 0) {
                    searchResults.message = {
                        content: "translate#viewModels.searchNoLocations"
                    };
                    return;
                }

                const resourceSet = result.resourceSets[0];
                if (resourceSet.resources.length === 0) {
                    searchResults.message = {
                        content: "translate#viewModels.searchNoLocations"
                    };
                    return;
                }


                const locations: SearchResult[] = (result.features as Feature<Point>[])
                    .filter(
                        (feat) =>
                            feat.properties && feat.geometry && feat.properties.full_address
                    )
                    // .sort((a, b) => b.properties!.importance - a.properties!.importance)
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
                    searchResults.results.push(...locations);
                });

                if (searchResults.results.length === 0) {
                    searchResults.message = {
                        content: "translate#viewModels.searchNoLocations"
                    };
                }
            })
            .catch(() => {
                if (searchResults.isCanceled) {
                    // A new search has superseded this one, so ignore the result.
                    return;
                }

                searchResults.message = {
                    content: "translate#viewModels.searchErrorOccurred"
                };
            });
    }

//     protected sortByPriority(resources: any[]) {
//         const primaryCountryLocations: any[] = [];
//         const otherLocations: any[] = [];

//         // Locations in the primary country go on top, locations elsewhere go undernearth and we add
//         // the country name to them.
//         for (let i = 0; i < resources.length; ++i) {
//             const resource = resources[i];

//             // let name = resource.name;
//             // if (!defined(name)) {
//             //     continue;
//             // }

//             // let list = primaryCountryLocations;
//             // let isImportant = true;

//             // const country = resource.address
//             //     ? resource.address.countryRegion
//             //     : undefined;
//             // if (defined(this.) && country !== this.primaryCountry) {
//             //     // Add this location to the list of other locations.
//             //     list = otherLocations;
//             //     isImportant = false;

//             //     // Add the country to the name, if it's not already there.
//             //     if (
//             //         defined(country) &&
//             //         name.lastIndexOf(country) !== name.length - country.length
//             //     ) {
//             //         name += ", " + country;
//             //     }
//             // }

//             // list.push(
//             //     new SearchResult({
//             //         name: name,
//             //         isImportant: isImportant,
//             //         clickAction: createZoomToFunction(this, resource),
//             //         location: {
//             //             latitude: resource.point.coordinates[0],
//             //             longitude: resource.point.coordinates[1]
//             //         }
//             //     })
//             // );
//         }

//         return {
//             primaryCountry: primaryCountryLocations,
//             other: otherLocations
//         };
//     }
}

function createZoomToFunction(model: MapboxSearchProvider, resource: any) {
    const [south, west, north, east] = resource.bbox;
    const rectangle = Rectangle.fromDegrees(west, south, east, north);

    return function () {
        const terria = model.terria;
        terria.currentViewer.zoomTo(rectangle, model.flightDurationSeconds);
    };
}
