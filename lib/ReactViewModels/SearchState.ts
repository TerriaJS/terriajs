import {
  action,
  computed,
  IReactionDisposer,
  makeObservable,
  observable,
  reaction,
  runInAction
} from "mobx";
import CatalogSearchProviderMixin from "../ModelMixins/SearchProviders/CatalogSearchProviderMixin";
import LocationSearchProviderMixin from "../ModelMixins/SearchProviders/LocationSearchProviderMixin";
import CatalogSearchProvider from "../Models/SearchProviders/CatalogSearchProvider";
import Terria from "../Models/Terria";

interface SearchStateOptions {
  terria: Terria;
  catalogSearchProvider?: CatalogSearchProviderMixin.Instance;
}

export default class SearchState {
  @observable private _catalogSearchText: string = "";

  @observable private _locationSearchText: string = "";

  @observable unifiedSearchText: string = "";
  @observable isWaitingToStartUnifiedSearch: boolean = false;

  @observable showLocationSearchResults: boolean = false;
  @observable showMobileLocationSearch: boolean = false;
  @observable showMobileCatalogSearch: boolean = false;

  private _workbenchItemsSubscription: IReactionDisposer;

  private readonly terria: Terria;

  constructor(options: SearchStateOptions) {
    makeObservable(this);

    this.terria = options.terria;

    runInAction(() => {
      this.terria.searchBarModel.catalogSearchProvider =
        options.catalogSearchProvider ||
        new CatalogSearchProvider("catalog-search-provider", options.terria);
    });

    this._workbenchItemsSubscription = reaction(
      () => this.terria.workbench.items,
      () => {
        this.showLocationSearchResults = false;
      }
    );
  }

  dispose(): void {
    this._workbenchItemsSubscription();
  }

  @computed
  get locationSearchText() {
    return this._locationSearchText;
  }

  set locationSearchText(newText: string) {
    this._locationSearchText = newText;

    for (const searchProvider of this.locationSearchProviders) {
      searchProvider.cancelSearch();

      if (newText.length > 0) searchProvider.search(newText, false);
    }
  }

  @computed get catalogSearchText() {
    return this._catalogSearchText;
  }

  set catalogSearchText(newText: string) {
    this._catalogSearchText = newText;

    this.catalogSearchProvider?.cancelSearch();
    if (newText.length > 0) this.catalogSearchProvider?.search(newText, false);
  }

  @computed
  get locationSearchProviders(): LocationSearchProviderMixin.Instance[] {
    return this.terria.searchBarModel.locationSearchProvidersArray;
  }

  @computed
  get catalogSearchProvider(): CatalogSearchProviderMixin.Instance | undefined {
    return this.terria.searchBarModel.catalogSearchProvider;
  }

  @action
  searchCatalog(): void {
    this.catalogSearchProvider?.search(this.catalogSearchText, true);
  }

  @action
  searchLocations(): void {
    for (const searchProvider of this.locationSearchProviders) {
      if (
        !searchProvider.autocompleteEnabled ||
        searchProvider.searchResult.isWaitingToStartSearch ||
        searchProvider.searchResult.isSearching
      )
        searchProvider.search(this.locationSearchText, true);
    }
  }
}
