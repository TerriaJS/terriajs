// import CatalogItemNameSearchProviderViewModel from "../ViewModels/CatalogItemNameSearchProviderViewModel";
import {
  action,
  computed,
  IReactionDisposer,
  observable,
  reaction
} from "mobx";
import filterOutUndefined from "../Core/filterOutUndefined";
import CatalogSearchProvider from "../Models/SearchProviders/CatalogSearchProvider";
import SearchProvider from "../Models/SearchProviders/SearchProvider";
import SearchProviderResults from "../Models/SearchProviders/SearchProviderResults";
import Terria from "../Models/Terria";

interface SearchStateOptions {
  terria: Terria;
  catalogSearchProvider?: CatalogSearchProvider;
  locationSearchProviders?: SearchProvider[];
}

export default class SearchState {
  @observable
  catalogSearchProvider: SearchProvider | undefined;

  @observable locationSearchProviders: SearchProvider[];

  @observable catalogSearchText = "";
  @observable isWaitingToStartCatalogSearch = false;

  @observable locationSearchText = "";
  @observable isWaitingToStartLocationSearch = false;

  @observable unifiedSearchText = "";
  @observable isWaitingToStartUnifiedSearch = false;

  @observable showLocationSearchResults = false;
  @observable showMobileLocationSearch = false;
  @observable showMobileCatalogSearch = false;

  @observable locationSearchResults: SearchProviderResults[] = [];
  @observable catalogSearchResults: SearchProviderResults | undefined;
  @observable unifiedSearchResults: SearchProviderResults[] = [];

  private _catalogSearchDisposer: IReactionDisposer;
  private _locationSearchDisposer: IReactionDisposer;
  private _unifiedSearchDisposer: IReactionDisposer;

  constructor(options: SearchStateOptions) {
    this.catalogSearchProvider =
      options.catalogSearchProvider ||
      new CatalogSearchProvider({ terria: options.terria });
    this.locationSearchProviders = options.locationSearchProviders || [];

    this._catalogSearchDisposer = reaction(
      () => this.catalogSearchText,
      () => {
        this.isWaitingToStartCatalogSearch = true;
        if (this.catalogSearchProvider) {
          this.catalogSearchResults = this.catalogSearchProvider.search("");
        }
      }
    );

    this._locationSearchDisposer = reaction(
      () => this.locationSearchText,
      () => {
        this.isWaitingToStartLocationSearch = true;
        this.locationSearchResults = this.locationSearchProviders.map(
          provider => {
            return provider.search("");
          }
        );
      }
    );

    this._unifiedSearchDisposer = reaction(
      () => this.unifiedSearchText,
      () => {
        this.isWaitingToStartUnifiedSearch = true;
        this.unifiedSearchResults = this.unifiedSearchProviders.map(
          provider => {
            return provider.search("");
          }
        );
      }
    );
  }

  dispose() {
    this._catalogSearchDisposer();
    this._locationSearchDisposer();
    this._unifiedSearchDisposer();
  }

  @computed
  get unifiedSearchProviders(): SearchProvider[] {
    return filterOutUndefined([
      this.catalogSearchProvider,
      ...this.locationSearchProviders
    ]);
  }

  @action
  searchCatalog() {
    if (this.isWaitingToStartCatalogSearch) {
      this.isWaitingToStartCatalogSearch = false;
      if (this.catalogSearchResults) {
        this.catalogSearchResults.isCanceled = true;
      }
      if (this.catalogSearchProvider) {
        this.catalogSearchResults = this.catalogSearchProvider.search(
          this.catalogSearchText
        );
      }
    }
  }

  @action
  setCatalogSearchText(newText: string) {
    this.catalogSearchText = newText;
  }

  @action
  searchLocations() {
    if (this.isWaitingToStartLocationSearch) {
      this.isWaitingToStartLocationSearch = false;
      this.locationSearchResults.forEach(results => {
        results.isCanceled = true;
      });
      this.locationSearchResults = this.locationSearchProviders.map(
        searchProvider => searchProvider.search(this.locationSearchText)
      );
    }
  }

  @action
  searchUnified() {
    if (this.isWaitingToStartUnifiedSearch) {
      this.isWaitingToStartUnifiedSearch = false;
      this.unifiedSearchResults.forEach(results => {
        results.isCanceled = true;
      });
      this.unifiedSearchResults = this.unifiedSearchProviders.map(
        searchProvider => searchProvider.search(this.unifiedSearchText)
      );
    }
  }
}
