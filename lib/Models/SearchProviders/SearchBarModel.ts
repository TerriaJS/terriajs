import { action, isObservableArray, observable } from "mobx";
import { DeveloperError } from "terriajs-cesium";
import Result from "../../Core/Result";
import TerriaError from "../../Core/TerriaError";
import { SearchBarTraits } from "../../Traits/SearchProviders/SearchBarTraits";
import CommonStrata from "../Definition/CommonStrata";
import CreateModel from "../Definition/CreateModel";
import { BaseModel } from "../Definition/Model";
import Terria from "../Terria";
import SearchProviderFactory from "./SearchProviderFactory";
import upsertSearchProviderFromJson from "./upsertSearchProviderFromJson";

export class SearchBarModel extends CreateModel(SearchBarTraits) {
  private locationSearchProviders = observable.map<string, BaseModel>();

  constructor(readonly terria: Terria) {
    super("search-bar-model", terria);
  }

  initializeSearchProviders() {
    const errors: TerriaError[] = [];

    const searchProviders = this.terria.configParameters.searchProviders;

    if (!isObservableArray(searchProviders)) {
      errors.push(
        new TerriaError({
          sender: SearchProviderFactory,
          title: "SearchProviders",
          message: { key: "searchProvider.noSearchProviders" }
        })
      );
    }
    searchProviders?.forEach(searchProvider => {
      upsertSearchProviderFromJson(
        SearchProviderFactory,
        this.terria,
        CommonStrata.definition,
        searchProvider
      ).pushErrorTo(errors);
    });

    return new Result(
      undefined,
      TerriaError.combine(
        errors,
        "An error occurred while loading search providers"
      )
    );
  }

  /**
   * Add new SearchProvider to the list of SearchProviders.
   */
  @action
  addSearchProvider(model: BaseModel) {
    if (model.uniqueId === undefined) {
      throw new DeveloperError(
        "A SearchProvider without a `uniqueId` cannot be added."
      );
    }

    if (this.locationSearchProviders.has(model.uniqueId)) {
      console.log(
        new DeveloperError(
          "A SearchProvider with the specified ID already exists."
        )
      );
    }

    this.locationSearchProviders.set(model.uniqueId, model);
  }

  get locationSearchProvidersArray() {
    return [...this.locationSearchProviders.entries()].map(function(entry) {
      return entry[1];
    });
  }
}
