import { action, autorun, makeObservable, runInAction } from "mobx";
import {
  Category,
  SearchAction
} from "../../Core/AnalyticEvents/analyticEvents";
import { TerriaErrorSeverity } from "../../Core/TerriaError";
import GroupMixin from "../../ModelMixins/GroupMixin";
import ReferenceMixin from "../../ModelMixins/ReferenceMixin";
import CatalogSearchProviderMixin from "../../ModelMixins/SearchProviders/CatalogSearchProviderMixin";
import CatalogSearchProviderTraits from "../../Traits/SearchProviders/CatalogSearchProviderTraits";
import CommonStrata from "../Definition/CommonStrata";
import CreateModel from "../Definition/CreateModel";
import { BaseModel } from "../Definition/Model";
import Terria from "../Terria";
import SearchProviderResult from "./SearchProviderResults";
import SearchResult from "./SearchResult";

type UniqueIdString = string;
type ResultMap = Map<UniqueIdString, boolean>;

export function loadAndSearchCatalogRecursively(
  models: BaseModel[],
  searchTextLowercase: string,
  searchResults: SearchProviderResult,
  resultMap: ResultMap,
  abortSignal: AbortSignal,
  iteration: number = 0
): Promise<void> {
  // checkTerriaAgainstResults(terria, searchResults)
  // don't go further than 10 deep, but also if we have references that never
  // resolve to a target, might overflow
  if (iteration > 10 || abortSignal.aborted) {
    return Promise.resolve();
  }
  // add some public interface for terria's `models`?
  const referencesAndGroupsToLoad: any[] = models.filter((model: any) => {
    if (resultMap.get(model.uniqueId) === undefined) {
      const modelToSave = model.target || model;
      // Use a flattened string of definition data later,
      // without only checking name/id/descriptions?
      // saveModelToJson(modelToSave, {
      //   includeStrata: [CommonStrata.definition]
      // });
      autorun((reaction) => {
        const searchString = `${modelToSave.name} ${modelToSave.uniqueId} ${modelToSave.description}`;
        const matchesString =
          searchString.toLowerCase().indexOf(searchTextLowercase) !== -1;
        resultMap.set(model.uniqueId, matchesString);
        if (matchesString) {
          runInAction(() => {
            searchResults.results.push(
              new SearchResult({
                name: modelToSave.name,
                catalogItem: modelToSave
              })
            );
          });
        }
        reaction.dispose();
      });
    }

    if (ReferenceMixin.isMixedInto(model) || GroupMixin.isMixedInto(model)) {
      return true;
    }
    // Could also check for loadMembers() here, but will be even slower
    // (relies on external non-magda services to be performant)

    return false;
  });

  // If we have no members to load
  if (referencesAndGroupsToLoad.length === 0) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    autorun((reaction) => {
      Promise.all(
        referencesAndGroupsToLoad.map(async (model) => {
          if (abortSignal.aborted) {
            return;
          }
          if (ReferenceMixin.isMixedInto(model)) {
            // TODO: could handle errors better here
            (await model.loadReference()).throwIfError();
          }
          // TODO: investigate performant route for calling loadMembers on additional groupmixins
          // else if (GroupMixin.isMixedInto(model)) {
          //   return model.loadMembers();
          // }
        })
      )
        .then(() => {
          // Then call this function again to see if new child references were loaded in
          resolve(
            loadAndSearchCatalogRecursively(
              models,
              searchTextLowercase,
              searchResults,
              resultMap,
              abortSignal,
              iteration + 1
            )
          );
        })
        .catch((error) => {
          reject(error);
        });
      reaction.dispose();
    });
  });
}

export default class CatalogSearchProvider extends CatalogSearchProviderMixin(
  CreateModel(CatalogSearchProviderTraits)
) {
  static readonly type = "catalog-search-provider";
  debounceTime = 300;

  constructor(id: string | undefined, terria: Terria) {
    super(id, terria);

    makeObservable(this);

    this.setTrait(
      CommonStrata.defaults,
      "minCharacters",
      terria.searchBarModel.minCharacters
    );
  }

  get type() {
    return CatalogSearchProvider.type;
  }

  protected logEvent(searchText: string) {
    this.terria.analytics?.logEvent(
      Category.search,
      SearchAction.catalog,
      searchText
    );
  }

  @action
  protected async doSearch(
    searchText: string,
    abortSignal: AbortSignal
  ): Promise<void> {
    this.searchResult.clear();

    // Load catalogIndex if needed
    if (this.terria.catalogIndex && !this.terria.catalogIndex.loadPromise) {
      try {
        await this.terria.catalogIndex.load();
      } catch (e) {
        this.terria.raiseErrorToUser(
          e,
          "Failed to load catalog index. Searching may be slow/inaccurate"
        );
      }
    }

    const resultMap: ResultMap = new Map();

    try {
      if (this.terria.catalogIndex?.searchIndex) {
        const results = await this.terria.catalogIndex.search(searchText);
        this.searchResult.results = results;
      } else {
        await loadAndSearchCatalogRecursively(
          this.terria.modelValues,
          searchText.toLowerCase(),
          this.searchResult,
          resultMap,
          abortSignal
        );
      }

      this.searchResult.state = "idle";

      if (abortSignal.aborted) {
        // A new search has superseded this one, so ignore the result.
        return;
      }

      this.terria.catalogReferencesLoaded = true;

      if (this.searchResult.results.length === 0) {
        this.searchResult.noResults(
          "translate#viewModels.searchNoCatalogueItem"
        );
      }
    } catch (e) {
      this.terria.raiseErrorToUser(e, {
        message: "An error occurred while searching",
        severity: TerriaErrorSeverity.Warning
      });
      if (abortSignal.aborted) {
        // A new search has superseded this one, so ignore the result.
        return;
      }

      this.searchResult.errorOccurred();
    }
  }
}
