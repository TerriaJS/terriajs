import i18next from "i18next";
import { autorun, observable, runInAction } from "mobx";
import GroupMixin from "../ModelMixins/GroupMixin";
import ReferenceMixin from "../ModelMixins/ReferenceMixin";
import SearchProvider from "./SearchProvider";
import SearchProviderResults from "./SearchProviderResults";
import SearchResult from "./SearchResult";
import Terria from "./Terria";

interface CatalogSearchProviderOptions {
  terria: Terria;
}

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

      autorun(reaction => {
        let modelInformation: string = JSON.stringify(
          prepareCatalogMemberForSearch(modelToSave)
        );

        const matchesString =
          modelInformation.toLowerCase().indexOf(searchTextLowercase) !== -1;
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
          } else if (GroupMixin.isMixedInto(model)) {
            // TODO: investigate performant route for calling loadMembers on additional groupmixins
            return model.loadMembers();
          }
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

export default class CatalogSearchProvider extends SearchProvider {
  readonly terria: Terria;
  @observable isSearching: boolean = false;
  @observable debounceDurationOnceLoaded: number = 300;

  constructor(options: CatalogSearchProviderOptions) {
    super();

    this.terria = options.terria;
    this.name = i18next.t("search.catalog.name");
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

    this.terria.analytics.logEvent("search", "catalog", searchText);
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
          searchResults.message = i18next.t("search.catalog.noResults");
        }
      })
      .catch(() => {
        if (searchResults.isCanceled) {
          // A new search has superseded this one, so ignore the result.
          return;
        }

        searchResults.message = i18next.t("search.catalog.error");
      });
  }
}

function prepareCatalogMemberForSearch(model: any) {
  const result = [];
  const name = model.name;
  if (name) {
    result.push(name);
  }
  const uniqueId = model.uniqueId;
  if (uniqueId) result.push(uniqueId);
  const description = model.description;
  if (description) {
    result.push(description);
  }
  const info = model.info;
  if (info && Array.isArray(info)) {
    for (let i = 0; i < info.length; i++) {
      const content = info[i].content;
      if (content) result.push(content);
    }
  }
  return result;
}
