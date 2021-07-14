import { autorun, observable, runInAction } from "mobx";
import {
  Category,
  SearchAction
} from "../../Core/AnalyticEvents/analyticEvents";
import GroupMixin from "../../ModelMixins/GroupMixin";
import ReferenceMixin from "../../ModelMixins/ReferenceMixin";
import SearchProviderMixin from "../../ModelMixins/SearchProvider/SearchProviderMixin";
import CatalogSearchProviderTraits from "../../Traits/SearchProvider/CatalogSearchProviderTraits";
import CreateModel from "../CreateModel";
import Terria from "../Terria";
import SearchProviderResults from "./SearchProviderResults";
import SearchResult from "./SearchResult";

type UniqueIdString = string;
type ResultMap = Map<UniqueIdString, boolean>;

export function loadAndSearchCatalogRecursively(
  terria: Terria,
  searchTextLowercase: string,
  searchResults: SearchProviderResults,
  resultMap: ResultMap,
  iteration: number = 0
): Promise<Terria> {
  // checkTerriaAgainstResults(terria, searchResults)
  // don't go further than 10 deep, but also if we have references that never
  // resolve to a target, might overflow
  if (iteration > 10) {
    return Promise.resolve(terria);
  }
  // add some public interface for terria's `models`?
  const referencesAndGroupsToLoad: any[] = Array.from(
    (<any>terria).models.values()
  ).filter((model: any) => {
    if (resultMap.get(model.uniqueId) === undefined) {
      const modelToSave = model.target || model;
      // Use a flattened string of definition data later,
      // without only checking name/id/descriptions?
      // saveModelToJson(modelToSave, {
      //   includeStrata: [CommonStrata.definition]
      // });
      autorun(reaction => {
        const searchString = `${modelToSave.name} ${modelToSave.uniqueId} ${modelToSave.description}`;
        const matchesString =
          searchString.toLowerCase().indexOf(searchTextLowercase) !== -1;
        resultMap.set(model.uniqueId, matchesString);
        if (matchesString) {
          runInAction(() => {
            searchResults.results.push(
              new SearchResult({
                name: name,
                catalogItem: modelToSave
              })
            );
          });
        }
        reaction.dispose();
      });
    }

    if (ReferenceMixin.is(model) || GroupMixin.isMixedInto(model)) {
      return true;
    }
    // Could also check for loadMembers() here, but will be even slower
    // (relies on external non-magda services to be performant)

    return false;
  });
  if (referencesAndGroupsToLoad.length === 0) {
    return Promise.resolve(terria);
  }
  return new Promise(resolve => {
    autorun(reaction => {
      Promise.all(
        referencesAndGroupsToLoad.map(model => {
          if (ReferenceMixin.is(model)) {
            return model.loadReference();
          }
          // TODO: investigate performant route for calling loadMembers on additional groupmixins
          // else if (GroupMixin.isMixedInto(model)) {
          //   return model.loadMembers();
          // }
        })
      ).then(() => {
        // Then call this function again to see if new child references were loaded in
        resolve(
          loadAndSearchCatalogRecursively(
            terria,
            searchTextLowercase,
            searchResults,
            resultMap,
            iteration + 1
          )
        );
      });
      reaction.dispose();
    });
  });
}

export default class CatalogSearchProvider extends SearchProviderMixin(
  CreateModel(CatalogSearchProviderTraits)
) {
  static readonly type = "catalog-search-provider";
  @observable isSearching: boolean = false;
  @observable debounceDurationOnceLoaded: number = 300;

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

  protected doSearch(
    searchText: string,
    searchResults: SearchProviderResults
  ): Promise<void> {
    this.isSearching = true;
    searchResults.results.length = 0;
    searchResults.message = undefined;

    if (searchText === undefined || /^\s*$/.test(searchText)) {
      this.isSearching = false;
      return Promise.resolve();
    }

    const resultMap: ResultMap = new Map();

    const promise: Promise<any> = loadAndSearchCatalogRecursively(
      this.terria,
      searchText.toLowerCase(),
      searchResults,
      resultMap
    );

    return promise
      .then(terria => {
        runInAction(() => {
          this.isSearching = false;
        });

        if (searchResults.isCanceled) {
          // A new search has superseded this one, so ignore the result.
          return;
        }

        runInAction(() => {
          terria.catalogReferencesLoaded = true;
        });

        if (searchResults.results.length === 0) {
          searchResults.message =
            "Sorry, no locations match your search query.";
        }
      })
      .catch(() => {
        if (searchResults.isCanceled) {
          // A new search has superseded this one, so ignore the result.
          return;
        }

        searchResults.message =
          "An error occurred while searching.  Please check your internet connection or try again later.";
      });
  }
}
