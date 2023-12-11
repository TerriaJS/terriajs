import { makeObservable, runInAction } from "mobx";
import Resource from "terriajs-cesium/Source/Core/Resource";
import URI from "urijs";
import AbstractConstructor from "../../Core/AbstractConstructor";
import zoomRectangleFromPoint from "../../Map/Vector/zoomRectangleFromPoint";
import Model from "../../Models/Definition/Model";
import SearchProviderResults from "../../Models/SearchProviders/SearchProviderResults";
import SearchResult from "../../Models/SearchProviders/SearchResult";
import xml2json from "../../ThirdParty/xml2json";
import WebFeatureServiceSearchProviderTraits from "../../Traits/SearchProviders/WebFeatureServiceSearchProviderTraits";
import LocationSearchProviderMixin from "./LocationSearchProviderMixin";

function WebFeatureServiceSearchProviderMixin<
  T extends AbstractConstructor<Model<WebFeatureServiceSearchProviderTraits>>
>(Base: T) {
  abstract class WebFeatureServiceSearchProviderMixin extends LocationSearchProviderMixin(
    Base
  ) {
    constructor(...args: any[]) {
      super(...args);
      makeObservable(this);
    }

    protected abstract featureToSearchResultFunction: (
      feature: any
    ) => SearchResult;
    protected abstract transformSearchText:
      | ((searchText: string) => string)
      | undefined;
    protected abstract searchResultFilterFunction:
      | ((feature: any) => boolean)
      | undefined;
    protected abstract searchResultScoreFunction:
      | ((feature: any, searchText: string) => number)
      | undefined;

    cancelRequest?: () => void;

    private _waitingForResults: boolean = false;

    getXml(url: string): Promise<XMLDocument> {
      const resource = new Resource({ url });
      this._waitingForResults = true;
      const xmlPromise = resource.fetchXML()!;
      this.cancelRequest = resource.request.cancelFunction;
      return xmlPromise.finally(() => {
        this._waitingForResults = false;
      });
    }

    protected doSearch(
      searchText: string,
      results: SearchProviderResults
    ): Promise<void> {
      results.results.length = 0;
      results.message = undefined;

      if (this._waitingForResults) {
        // There's been a new search! Cancel the previous one.
        if (this.cancelRequest !== undefined) {
          this.cancelRequest();
          this.cancelRequest = undefined;
        }
        this._waitingForResults = false;
      }

      const originalSearchText = searchText;

      searchText = searchText.trim();
      if (this.transformSearchText !== undefined) {
        searchText = this.transformSearchText(searchText);
      }
      if (searchText.length < 2) {
        return Promise.resolve();
      }

      // Support for matchCase="false" is patchy, but we try anyway
      const filter = `<ogc:Filter><ogc:PropertyIsLike wildCard="*" matchCase="false">
          <ogc:ValueReference>${this.searchPropertyName}</ogc:ValueReference>
          <ogc:Literal>*${searchText}*</ogc:Literal></ogc:PropertyIsLike></ogc:Filter>`;

      const _wfsServiceUrl = new URI(this.url);
      _wfsServiceUrl.setSearch({
        service: "WFS",
        request: "GetFeature",
        typeName: this.searchPropertyTypeName,
        version: "1.1.0",
        srsName: "urn:ogc:def:crs:EPSG::4326", // srsName must be formatted like this for correct lat/long order  >:(
        filter: filter
      });

      return this.getXml(_wfsServiceUrl.toString())
        .then((xml: any) => {
          let json: any = xml2json(xml);
          let features: any[];
          if (json === undefined) {
            results.message = {
              content: "translate#viewModels.searchErrorOccurred"
            };
            return;
          }

          if (json.member !== undefined) {
            features = json.member;
          } else if (json.featureMember !== undefined) {
            features = json.featureMember;
          } else {
            results.message = {
              content: "translate#viewModels.searchNoPlaceNames"
            };
            return;
          }

          // if there's only one feature, make it an array
          if (!Array.isArray(features)) {
            features = [features];
          }

          const resultSet = new Set();

          runInAction(() => {
            if (this.searchResultFilterFunction !== undefined) {
              features = features.filter(this.searchResultFilterFunction);
            }

            if (features.length === 0) {
              results.message = {
                content: "translate#viewModels.searchNoPlaceNames"
              };
              return;
            }

            if (this.searchResultScoreFunction !== undefined) {
              features = features.sort(
                (featureA, featureB) =>
                  this.searchResultScoreFunction!(
                    featureB,
                    originalSearchText
                  ) -
                  this.searchResultScoreFunction!(featureA, originalSearchText)
              );
            }

            let searchResults = features
              .map(this.featureToSearchResultFunction)
              .map((result) => {
                result.clickAction = createZoomToFunction(
                  this,
                  result.location
                );
                return result;
              });

            // If we don't have a scoring function, sort the search results now
            // We can't do this earlier because we don't know what the schema of the unprocessed feature looks like
            if (this.searchResultScoreFunction === undefined) {
              // Put shorter results first
              // They have a larger percentage of letters that the user actually typed in them
              searchResults = searchResults.sort(
                (featureA, featureB) =>
                  featureA.name.length - featureB.name.length
              );
            }

            // Remove results that have the same name and are close to each other
            searchResults = searchResults.filter((result) => {
              const hash = `${result.name},${result.location?.latitude.toFixed(
                1
              )},${result.location?.longitude.toFixed(1)}`;
              if (resultSet.has(hash)) {
                return false;
              }
              resultSet.add(hash);
              return true;
            });

            // append new results to all results
            results.results.push(...searchResults);
          });
        })
        .catch((e) => {
          if (results.isCanceled) {
            // A new search has superseded this one, so ignore the result.
            return;
          }
          results.message = {
            content: "translate#viewModels.searchErrorOccurred"
          };
        });
    }

    get isWebFeatureServiceSearchProviderMixin() {
      return true;
    }
  }

  return WebFeatureServiceSearchProviderMixin;
}

namespace WebFeatureServiceSearchProviderMixin {
  export interface Instance
    extends InstanceType<
      ReturnType<typeof WebFeatureServiceSearchProviderMixin>
    > {}

  export function isMixedInto(model: any): model is Instance {
    return model && model.isWebFeatureServiceSearchProviderMixin;
  }
}
export default WebFeatureServiceSearchProviderMixin;

function createZoomToFunction(
  model: WebFeatureServiceSearchProviderMixin.Instance,
  location: any
) {
  // Server does not return information of a bounding box, just a location.
  // bboxSize is used to expand a point
  var bboxSize = 0.2;
  var rectangle = zoomRectangleFromPoint(
    location.latitude,
    location.longitude,
    bboxSize
  );

  const flightDurationSeconds: number =
    model.flightDurationSeconds ||
    model.terria.searchBarModel.flightDurationSeconds;

  return function () {
    model.terria.currentViewer.zoomTo(rectangle, flightDurationSeconds);
  };
}
