import {
  action,
  computed,
  IReactionDisposer,
  observable,
  reaction,
  makeObservable,
  runInAction
} from "mobx";
import filterOutUndefined from "../Core/filterOutUndefined";
import LocationSearchProviderMixin from "../ModelMixins/SearchProviders/LocationSearchProviderMixin";
import SearchProviderMixin from "../ModelMixins/SearchProviders/SearchProviderMixin";
import CatalogSearchProvider from "../Models/SearchProviders/CatalogSearchProvider";
import SearchProviderResults from "../Models/SearchProviders/SearchProviderResults";
import Terria from "../Models/Terria";
import CatalogSearchProviderMixin from "../ModelMixins/SearchProviders/CatalogSearchProviderMixin";

interface SearchStateOptions {
  terria: Terria;
  catalogSearchProvider?: CatalogSearchProviderMixin.Instance;
}

export default class SearchState {
  @observable catalogSearchText: string = "";
  @observable isWaitingToStartCatalogSearch: boolean = false;

  @observable locationSearchText: string = "";
  @observable isWaitingToStartLocationSearch: boolean = false;

  @observable unifiedSearchText: string = "";
  @observable isWaitingToStartUnifiedSearch: boolean = false;

  @observable showLocationSearchResults: boolean = false;
  @observable showMobileLocationSearch: boolean = false;
  @observable showMobileCatalogSearch: boolean = false;

  @observable locationSearchResults: Record<string, SearchProviderResults> = {};
  @observable catalogSearchResults: SearchProviderResults | undefined;

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
  get supportsAutocomplete(): boolean {
    return this.locationSearchProviders.every(
      (provider) => provider.autocompleteEnabled
    );
  }

  @computed
  private get locationSearchProviders(): LocationSearchProviderMixin.Instance[] {
    return this.terria.searchBarModel.locationSearchProvidersArray;
  }

  @computed
  get catalogSearchProvider(): CatalogSearchProviderMixin.Instance | undefined {
    return this.terria.searchBarModel.catalogSearchProvider;
  }

  @computed
  get unifiedSearchProviders(): SearchProviderMixin.Instance[] {
    return filterOutUndefined([
      this.catalogSearchProvider,
      ...this.locationSearchProviders
    ]);
  }

  @action
  searchCatalog(): void {
    if (this.catalogSearchResults) {
      this.catalogSearchResults.isCanceled = true;
    }
    if (this.catalogSearchProvider) {
      this.catalogSearchResults = this.catalogSearchProvider.search(
        this.catalogSearchText,
        true
      );
    }
  }

  @action
  setCatalogSearchText(newText: string): void {
    this.catalogSearchText = newText;
  }

  @action
  searchLocations(manuallyTriggered: boolean): void {
    Object.values(this.locationSearchResults).forEach((results) => {
      results.isCanceled = true;
    });

    for (const searchProvider of this.locationSearchProviders) {
      if (manuallyTriggered) {
        if (!searchProvider.autocompleteEnabled)
          this.locationSearchResults[searchProvider.uniqueId!] =
            searchProvider.search(this.locationSearchText, manuallyTriggered);
      } else {
        this.locationSearchResults[searchProvider.uniqueId!] =
          searchProvider.search(this.locationSearchText, manuallyTriggered);
      }
    }
  }
}
