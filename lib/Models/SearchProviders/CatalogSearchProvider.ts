import { autorun, computed, observable, runInAction } from "mobx";
import {
  Category,
  SearchAction
} from "../../Core/AnalyticEvents/analyticEvents";
import isDefined from "../../Core/isDefined";
import GroupMixin from "../../ModelMixins/GroupMixin";
import ReferenceMixin from "../../ModelMixins/ReferenceMixin";
import CatalogIndexReferenceTraits from "../../Traits/TraitsClasses/CatalogIndexReferenceTraits";
import { BaseModel } from "../Definition/Model";
import Terria from "../Terria";
import SearchProvider from "./SearchProvider";
import SearchProviderResults from "./SearchProviderResults";
import SearchResult from "./SearchResult";

export interface CatalogIndex {
  [id: string]: CatalogIndexReferenceTraits;
}

export interface ModelIndex {
  name: string;
  knownContainerUniqueIds: string[];
}
interface CatalogSearchProviderOptions {
  terria: Terria;
}

type UniqueIdString = string;
type ResultMap = Map<UniqueIdString, boolean>;
export function loadAndSearchCatalogRecursively(
  models: BaseModel[],
  searchTextLowercase: string,
  searchResults: SearchProviderResults,
  resultMap: ResultMap,
  iteration: number = 0
): Promise<void> {
  // checkTerriaAgainstResults(terria, searchResults)
  // don't go further than 10 deep, but also if we have references that never
  // resolve to a target, might overflow
  if (iteration > 10) {
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
  return new Promise(resolve => {
    autorun(reaction => {
      Promise.all(
        referencesAndGroupsToLoad.map(async model => {
          if (ReferenceMixin.isMixedInto(model)) {
            // TODO: could handle errors better here
            (await model.loadReference()).throwIfError();
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
            models,
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

export default class CatalogSearchProvider extends SearchProvider {
  readonly terria: Terria;
  @observable isSearching: boolean = false;
  @observable debounceDurationOnceLoaded: number = 300;

  @computed get usingCatalogIndex() {
    return isDefined(this.terria.catalogIndex);
  }

  constructor(options: CatalogSearchProviderOptions) {
    super();

    this.terria = options.terria;
    this.name = "Catalog Items";
  }

  @computed
  get models() {
    return Array.from(this.terria.modelValues);
  }

  protected async doSearch(
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

    this.terria.analytics?.logEvent(
      Category.search,
      SearchAction.catalog,
      searchText
    );
    const resultMap: ResultMap = new Map();

    try {
      if (this.usingCatalogIndex) {
        /** Example results object
         * [
            {
              "field": "name",
              "result": [
                "some-id-1"
              ]
            },
            {
              "field": "description",
              "result": [
                "some-id-2"
              ]
            }
          ]
         */
        const results = this.terria.catalogSearchIndex.search(searchText);
        results.forEach((fieldResult: any) => {
          fieldResult.result.forEach((id: string) => {
            const indexReference = this.terria.catalogIndex?.get(id);
            if (indexReference)
              searchResults.results.push(
                new SearchResult({
                  name: indexReference.name ?? indexReference.uniqueId,
                  catalogItem: indexReference
                })
              );
          });
        });
      } else {
        await loadAndSearchCatalogRecursively(
          this.models,
          searchText.toLowerCase(),
          searchResults,
          resultMap
        );
      }

      runInAction(() => {
        this.isSearching = false;
      });

      if (searchResults.isCanceled) {
        // A new search has superseded this one, so ignore the result.
        return;
      }

      runInAction(() => {
        this.terria.catalogReferencesLoaded = true;
      });

      if (searchResults.results.length === 0) {
        searchResults.message = "Sorry, no locations match your search query.";
      }
    } catch (e) {
      if (searchResults.isCanceled) {
        // A new search has superseded this one, so ignore the result.
        return;
      }

      searchResults.message =
        "An error occurred while searching.  Please check your internet connection or try again later.";
    }
  }
}
