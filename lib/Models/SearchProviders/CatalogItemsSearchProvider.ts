import {
  action,
  computed,
  makeObservable,
  observable,
  runInAction
} from "mobx";
import {
  Category,
  SearchAction
} from "../../Core/AnalyticEvents/analyticEvents";
import { TerriaErrorSeverity } from "../../Core/TerriaError";
import CommonStrata from "../Definition/CommonStrata";
import CreateModel from "../Definition/CreateModel";
import Terria from "../Terria";
import SearchProviderResults from "./SearchProviderResults";
import CatalogItemsSearchProviderMixin from "../../ModelMixins/SearchProviders/CatalogItemsSearchProviderMixin";
import CatalogItemsSearchProviderTraits from "../../Traits/SearchProviders/CatalogItemsSearchProviderTraits";
import SearchableCatalogItemMixin from "../../ModelMixins/SearchableCatalogItemMixin";
import SearchResult from "./SearchResult";

async function searchInOpenedCatalogItems(
  terria: Terria,
  searchTextLowercase: string
): Promise<SearchResult[][]> {
  const searchableCatalogItems = terria.workbench.items.filter((item) =>
    SearchableCatalogItemMixin.isMixedInto(item)
  ) as SearchableCatalogItemMixin.Instance[];
  const searchPromiseList = searchableCatalogItems.map((item) => {
    return item.searchWithinItemData(searchTextLowercase);
  });
  return Promise.all(searchPromiseList).then((results) =>
    results.filter((result): result is SearchResult[] => result !== undefined)
  );
}

export default class CatalogItemsSearchProvider extends CatalogItemsSearchProviderMixin(
  CreateModel(CatalogItemsSearchProviderTraits)
) {
  static readonly type = "catalog-items-search-provider";
  @observable isSearching: boolean = false;
  @observable debounceDurationOnceLoaded: number = 300;

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
    return CatalogItemsSearchProvider.type;
  }

  protected logEvent(searchText: string) {
    this.terria.analytics?.logEvent(
      Category.search,
      SearchAction.catalog,
      searchText
    );
  }

  @computed get canUse() {
    return this.terria.workbench.items.some(
      (item) =>
        SearchableCatalogItemMixin.isMixedInto(item) &&
        (item.nameOfCatalogItemSearchField || item.catalogItemWebSearch)
    );
  }

  @action
  protected async doSearch(
    searchText: string,
    searchResults: SearchProviderResults
  ): Promise<void> {
    runInAction(() => (this.isSearching = true));

    searchResults.results.length = 0;
    searchResults.message = undefined;

    if (searchText === undefined || /^\s*$/.test(searchText)) {
      runInAction(() => (this.isSearching = false));
      return Promise.resolve();
    }

    try {
      const res = await searchInOpenedCatalogItems(
        this.terria,
        searchText.toLowerCase()
      );
      runInAction(() => (searchResults.results = res.flat()));

      runInAction(() => {
        this.isSearching = false;
      });

      if (searchResults.isCanceled) {
        // A new search has superseded this one, so ignore the result.
        return;
      }

      if (searchResults.results.length === 0) {
        searchResults.message = {
          content: "Sorry, no locations match your search query."
        };
      }
    } catch (e) {
      this.terria.raiseErrorToUser(e, {
        message: "An error occurred while searching",
        severity: TerriaErrorSeverity.Warning
      });
      if (searchResults.isCanceled) {
        // A new search has superseded this one, so ignore the result.
        return;
      }

      searchResults.message = {
        content:
          "An error occurred while searching.  Please check your internet connection or try again later."
      };
    }
  }
}
