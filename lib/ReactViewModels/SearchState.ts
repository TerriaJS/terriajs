// import CatalogItemNameSearchProviderViewModel from "../ViewModels/CatalogItemNameSearchProviderViewModel";
import {
  observable,
  reaction,
  IReactionDisposer,
  computed,
  action
} from "mobx";
import Terria from "../Models/Terria";
import SearchProviderResults from "../Models/SearchProviderResults";
import SearchProvider from "../Models/SearchProvider";
import filterOutUndefined from "../Core/filterOutUndefined";

interface SearchStateOptions {
  terria: Terria;
  catalogSearchProvider?: any;
  locationSearchProviders?: any[];
}

export default class SearchState {
  @observable
  catalogSearchProvider: SearchProvider | undefined;

  @observable locationSearchProviders: SearchProvider[];

  @observable catalogSearchText: string = "";
  @observable isWaitingToStartCatalogSearch: boolean = false;

  @observable locationSearchText: string = "";
  @observable isWaitingToStartLocationSearch: boolean = false;

  @observable unifiedSearchText: string = "";
  @observable isWaitingToStartUnifiedSearch: boolean = false;

  @observable showLocationSearchResults: boolean = true;
  @observable showMobileLocationSearch: boolean = false;
  @observable showMobileCatalogSearch: boolean = false;

  @observable locationSearchResults: SearchProviderResults[] = [];
  @observable catalogSearchResults: SearchProviderResults | undefined;
  @observable unifiedSearchResults: SearchProviderResults[] = [];

  private _catalogSearchDisposer: IReactionDisposer;
  private _locationSearchDisposer: IReactionDisposer;
  private _unifiedSearchDisposer: IReactionDisposer;

  constructor(options: SearchStateOptions) {
    // this.catalogSearchProvider =
    //   options.catalogSearchProvider ||
    //   new CatalogItemNameSearchProviderViewModel({ terria: options.terria });
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
  get unifiedSearchProviders() {
    return filterOutUndefined(
      [this.catalogSearchProvider].concat(this.locationSearchProviders)
    );
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
