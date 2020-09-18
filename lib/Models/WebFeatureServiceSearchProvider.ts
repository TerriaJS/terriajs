import i18next from "i18next";
import { observable, runInAction } from "mobx";
import defaultValue from "terriajs-cesium/Source/Core/defaultValue";
import URI from "urijs";
import loadXML from "../Core/loadXML";
import makeRealPromise from "../Core/makeRealPromise";
import zoomRectangleFromPoint from "../Map/zoomRectangleFromPoint";
import xml2json from "../ThirdParty/xml2json";
import SearchProvider from "./SearchProvider";
import SearchProviderResults from "./SearchProviderResults";
import SearchResult from "./SearchResult";
import Terria from "./Terria";

export interface WebFeatureServiceSearchProviderOptions {
  /** Base url for the service */
  wfsServiceUrl: string;
  /** Which property to look for the search text in */
  searchPropertyName: string;
  /** Type of the properties to search */
  searchPropertyTypeName: string;
  /** Convert a WFS feature to a search result */
  featureToSearchResultFunction: (feature: any) => SearchResult;
  terria: Terria;
  /** How long it takes to zoom in when a search result is clicked */
  flightDurationSeconds?: number;
  /** Apply a function to search text before it gets passed to the service. Useful for changing case */
  transformSearchText?: (searchText: string) => string;
  /** Return true if a feature should be included in search results */
  searchResultFilterFunction?: (feature: any) => boolean;
  /** Return a score that gets used to sort results (in descending order) */
  searchResultScoreFunction?: (feature: any, searchText: string) => number;
  /** name of the search provider */
  name: string;
}

export default class WebFeatureServiceSearchProvider extends SearchProvider {
  private _wfsServiceUrl: uri.URI;
  private _searchPropertyName: string;
  private _searchPropertyTypeName: string;
  private _featureToSearchResultFunction: (feature: any) => SearchResult;
  @observable flightDurationSeconds: number;
  readonly terria: Terria;
  private _transformSearchText: ((searchText: string) => string) | undefined;
  private _searchResultFilterFunction: ((feature: any) => boolean) | undefined;
  private _searchResultScoreFunction:
    | ((feature: any, searchText: string) => number)
    | undefined;

  constructor(options: WebFeatureServiceSearchProviderOptions) {
    super();
    this._wfsServiceUrl = new URI(options.wfsServiceUrl);
    this._searchPropertyName = options.searchPropertyName;
    this._searchPropertyTypeName = options.searchPropertyTypeName;
    this._featureToSearchResultFunction = options.featureToSearchResultFunction;
    this.terria = options.terria;
    this.flightDurationSeconds = defaultValue(
      options.flightDurationSeconds,
      1.5
    );
    this._transformSearchText = options.transformSearchText;
    this._searchResultFilterFunction = options.searchResultFilterFunction;
    this._searchResultScoreFunction = options.searchResultScoreFunction;
    this.name = options.name;
  }

  getXml(): Promise<string> {
    return makeRealPromise(loadXML(this._wfsServiceUrl.toString()));
  }

  protected doSearch(
    searchText: string,
    results: SearchProviderResults
  ): Promise<void> {
    results.message = undefined;

    const originalSearchText = searchText;

    searchText = searchText.trim();
    if (this._transformSearchText !== undefined) {
      searchText = this._transformSearchText(searchText);
    }
    if (searchText.length === 0) {
      return Promise.resolve();
    }

    // Support for matchCase="false" is patchy, but we try anyway
    const filter = `<ogc:Filter><ogc:PropertyIsLike wildCard="*" matchCase="false">
        <ogc:ValueReference>${this._searchPropertyName}</ogc:ValueReference>
        <ogc:Literal>*${searchText}*</ogc:Literal></ogc:PropertyIsLike></ogc:Filter>`;

    this._wfsServiceUrl.setSearch({
      service: "WFS",
      request: "GetFeature",
      typeName: this._searchPropertyTypeName,
      version: "1.1.0",
      srsName: "urn:ogc:def:crs:EPSG::4326", // srsName must be formatted like this for correct lat/long order  >:(
      filter: filter
    });

    return this.getXml()
      .then((xml: any) => {
        if (results.isCanceled) {
          // A new search has superseded this one, so ignore the result.
          return;
        }

        let json: any = xml2json(xml);
        console.log(json);
        let features: any[];
        if (json === undefined) {
          return;
        }

        if (json.member !== undefined) {
          features = json.member;
        } else if (json.featureMember !== undefined) {
          features = json.featureMember;
        } else {
          return;
        }

        // if there's only one feature, make it an array
        if (!Array.isArray(features)) {
          features = [features];
        }

        const resultSet = new Set();

        runInAction(() => {
          if (this._searchResultFilterFunction !== undefined) {
            features = features.filter(this._searchResultFilterFunction);
          }

          if (this._searchResultScoreFunction !== undefined) {
            features = features.sort(
              (featureA, featureB) =>
                this._searchResultScoreFunction!(featureB, originalSearchText) -
                this._searchResultScoreFunction!(featureA, originalSearchText)
            );
          }

          let searchResults = features
            .map(this._featureToSearchResultFunction)
            .map(result => {
              result.clickAction = createZoomToFunction(this, result.location);
              return result;
            });

          // If we don't have a scoring function, sort the search results now
          // We can't do this earlier because we don't know what the schema of the unprocessed feature looks like
          if (this._searchResultScoreFunction === undefined) {
            // Put shorter results first
            // They have a larger percentage of letters that the user actually typed in them
            searchResults = searchResults.sort(
              (featureA, featureB) =>
                featureA.name.length - featureB.name.length
            );
          }

          // Remove results that have the same name and are close to each other
          searchResults = searchResults.filter(result => {
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
      .catch(e => {
        if (results.isCanceled) {
          // A new search has superseded this one, so ignore the result.
          return;
        }
        results.message = i18next.t("viewModels.searchErrorOccurred");
      });
  }
}

function createZoomToFunction(
  model: WebFeatureServiceSearchProvider,
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

  return function() {
    model.terria.currentViewer.zoomTo(rectangle, model.flightDurationSeconds);
  };
}
