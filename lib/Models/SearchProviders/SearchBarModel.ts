import {
  action,
  computed,
  isObservableArray,
  makeObservable,
  observable
} from "mobx";
import { JsonObject } from "protomaps";
import DeveloperError from "terriajs-cesium/Source/Core/DeveloperError";
import RuntimeError from "terriajs-cesium/Source/Core/RuntimeError";
import Result from "../../Core/Result";
import TerriaError from "../../Core/TerriaError";
import CatalogSearchProviderMixin from "../../ModelMixins/SearchProviders/CatalogSearchProviderMixin";
import LocationSearchProviderMixin from "../../ModelMixins/SearchProviders/LocationSearchProviderMixin";
import { SearchBarTraits } from "../../Traits/SearchProviders/SearchBarTraits";
import SearchProviderTraits from "../../Traits/SearchProviders/SearchProviderTraits";
import CommonStrata from "../Definition/CommonStrata";
import CreateModel from "../Definition/CreateModel";
import { BaseModel } from "../Definition/Model";
import ModelPropertiesFromTraits from "../Definition/ModelPropertiesFromTraits";
import updateModelFromJson from "../Definition/updateModelFromJson";
import Terria from "../Terria";
import SearchProviderFactory from "./SearchProviderFactory";
import upsertSearchProviderFromJson from "./upsertSearchProviderFromJson";

export class SearchBarModel extends CreateModel(SearchBarTraits) {
  private locationSearchProviders = observable.map<string, BaseModel>();

  @observable
  catalogSearchProvider: CatalogSearchProviderMixin.Instance | undefined;

  constructor(readonly terria: Terria) {
    super("search-bar-model", terria);

    makeObservable(this);
  }

  updateModelConfig(config?: ModelPropertiesFromTraits<SearchBarTraits>) {
    if (config) {
      updateModelFromJson(
        this,
        CommonStrata.definition,
        config as never as JsonObject
      );
    }
    return this;
  }

  initializeSearchProviders(
    searchProviders: ModelPropertiesFromTraits<SearchProviderTraits>[]
  ) {
    const errors: TerriaError[] = [];

    if (!isObservableArray(searchProviders)) {
      errors.push(
        new TerriaError({
          sender: SearchProviderFactory,
          title: "SearchProviders",
          message: { key: "searchProvider.noSearchProviders" }
        })
      );
    }
    searchProviders?.forEach((searchProvider) => {
      const loadedModel = upsertSearchProviderFromJson(
        SearchProviderFactory,
        this.terria,
        CommonStrata.definition,
        searchProvider
      ).pushErrorTo(errors);

      if (LocationSearchProviderMixin.isMixedInto(loadedModel)) {
        loadedModel.showWarning();
      }
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
      throw new RuntimeError(
        "A SearchProvider with the specified ID already exists."
      );
    }

    if (!LocationSearchProviderMixin.isMixedInto(model)) {
      throw new RuntimeError(
        "SearchProvider must be a LocationSearchProvider."
      );
    }

    this.locationSearchProviders.set(model.uniqueId, model);
  }

  @computed
  get locationSearchProvidersArray() {
    return [...this.locationSearchProviders.entries()]
      .filter((entry) => {
        return LocationSearchProviderMixin.isMixedInto(entry[1]);
      })
      .map(function (entry) {
        return entry[1] as LocationSearchProviderMixin.Instance;
      });
  }
}
