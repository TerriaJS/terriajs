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
  @observable catalogSearchText: string = "";
  @observable isWaitingToStartCatalogSearch: boolean = false;

  @observable private _locationSearchText: string = "";
  @observable isWaitingToStartLocationSearch: boolean = false;

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
    }
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
  setCatalogSearchText(newText: string): void {
    this.catalogSearchText = newText;

    this.catalogSearchProvider?.cancelSearch();
  }

  @action
  searchLocations(manuallyTriggered: boolean): void {
    for (const searchProvider of this.locationSearchProviders) {
      if (manuallyTriggered) {
        if (
          !searchProvider.autocompleteEnabled ||
          searchProvider.result.isWaitingToStartSearch
        )
          searchProvider.search(this.locationSearchText, manuallyTriggered);
      } else {
        searchProvider.search(this.locationSearchText, manuallyTriggered);
      }
    }
  }
}
