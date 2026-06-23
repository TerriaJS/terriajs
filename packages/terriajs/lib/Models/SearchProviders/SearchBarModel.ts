import { keyFromSelector } from "i18next";
import {
  action,
  computed,
  isObservableArray,
  makeObservable,
  observable
} from "mobx";
import DeveloperError from "terriajs-cesium/Source/Core/DeveloperError";
import RuntimeError from "terriajs-cesium/Source/Core/RuntimeError";
import * as z from "zod";
import Result from "../../Core/Result";
import TerriaError from "../../Core/TerriaError";
import LocationSearchProviderMixin from "../../ModelMixins/SearchProviders/LocationSearchProviderMixin";
import SearchProviderTraits from "../../Traits/SearchProviders/SearchProviderTraits";
import CommonStrata from "../Definition/CommonStrata";
import { BaseModel } from "../Definition/Model";
import ModelPropertiesFromTraits from "../Definition/ModelPropertiesFromTraits";
import Terria from "../Terria";
import SearchProviderFactory from "./SearchProviderFactory";
import upsertSearchProviderFromJson from "./upsertSearchProviderFromJson";

export const SearchBarConfigSchema = z.strictObject({
  placeholder: z.string().default("translate#search.placeholder").meta({
    description:
      "Input text field placeholder shown when no input has been given yet. The string is translateable."
  }),
  recommendedListLength: z
    .number()
    .default(5)
    .meta({ description: "Maximum amount of entries in the suggestion list." }),
  flightDurationSeconds: z.number().default(1.5).meta({
    description:
      "The duration of the camera flight to an entered location, in seconds."
  }),
  minCharacters: z.number().default(3).meta({
    description: "Minimum number of characters required for search to start"
  }),
  showSearchInCatalog: z.boolean().default(true).meta({
    description: "Whether to show 'Search In Catalog' in search results"
  }),
  boundingBoxLimit: z
    .object({
      west: z.number(),
      south: z.number(),
      east: z.number(),
      north: z.number()
    })
    .optional()
    .meta({
      description:
        "Bounding box limits for the search results {west, south, east, north}"
    })
});

const defaultConfig = SearchBarConfigSchema.parse({});

export class SearchBarModel {
  @observable
  private _config: z.infer<typeof SearchBarConfigSchema> = defaultConfig;
  private locationSearchProviders = observable.map<string, BaseModel>();

  constructor(readonly terria: Terria) {
    makeObservable(this);
  }

  get config() {
    return this._config;
  }

  @action
  updateModelConfig(config?: Partial<z.infer<typeof SearchBarConfigSchema>>) {
    if (config) {
      this._config = SearchBarConfigSchema.parse({
        ...this._config,
        ...config
      });
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
          message: {
            key: keyFromSelector(($) => $.searchProvider.noSearchProviders)
          }
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
