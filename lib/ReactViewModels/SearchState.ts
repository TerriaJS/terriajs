import CatalogItemNameSearchProviderViewModel from "../ViewModels/CatalogItemNameSearchProviderViewModel";
import { observable, reaction, IReactionDisposer, computed, action } from "mobx";
import Terria from "../Models/Terria";

interface SearchStateOptions {
  terria: Terria;
  catalogSearchProvider?: any;
  locationSearchProviders?: any[];
}

export default class SearchState {
  @observable
  catalogSearchProvider: any; //CatalogItemNameSearchProviderViewModel;

  @observable locationSearchProviders: any[];

  @observable catalogSearchText: string = "";
  @observable isWaitingToStartCatalogSearch: boolean = false;

  @observable locationSearchText: string = "";
  @observable isWaitingToStartLocationSearch: boolean = false;

  @observable unifiedSearchText: string = "";
  @observable isWaitingToStartUnifiedSearch: boolean = false;

  @observable showLocationSearchResults: boolean = true;
  @observable showMobileLocationSearch: boolean = false;
  @observable showMobileCatalogSearch: boolean = false;

  private _catalogSearchDisposer: IReactionDisposer;
  private _locationSearchDisposer: IReactionDisposer;
  private _unifiedSearchDisposer: IReactionDisposer;

  constructor(options: SearchStateOptions) {
    this.catalogSearchProvider =
      options.catalogSearchProvider ||
      new CatalogItemNameSearchProviderViewModel({ terria: options.terria });
    this.locationSearchProviders = options.locationSearchProviders || [];

    this._catalogSearchDisposer = reaction(
      () => this.catalogSearchText,
      () => {
        this.isWaitingToStartCatalogSearch = true;
        this.catalogSearchProvider.search("");
      }
    );

    this._locationSearchDisposer = reaction(
      () => this.locationSearchText,
      () => {
        this.isWaitingToStartLocationSearch = true;
        this.locationSearchProviders.forEach(provider => {
          provider.search("");
        });
      }
    );

    this._unifiedSearchDisposer = reaction(
      () => this.unifiedSearchText,
      () => {
        this.isWaitingToStartUnifiedSearch = true;
        this.unifiedSearchProviders.forEach(provider => {
          provider.search("");
        });
      }
    );
  }

  @computed
  get unifiedSearchProviders() {
    return [this.catalogSearchProvider].concat(this.locationSearchProviders);
  }

  @action
  searchCatalog() {
    if (this.isWaitingToStartCatalogSearch) {
      this.isWaitingToStartCatalogSearch = false;
      return this.catalogSearchProvider.search(this.catalogSearchText);
    }
  }

  @action
  searchLocations() {
    if (this.isWaitingToStartLocationSearch) {
      this.isWaitingToStartLocationSearch = false;
      return this.locationSearchProviders.map(searchProvider =>
        searchProvider.search(this.locationSearchText)
      );
    }
  }

  @action
  searchUnified() {
    if (this.isWaitingToStartUnifiedSearch) {
      this.isWaitingToStartUnifiedSearch = false;
      return this.unifiedSearchProviders.map(searchProvider =>
        searchProvider.search(this.unifiedSearchText)
      );
    }
  }
}
