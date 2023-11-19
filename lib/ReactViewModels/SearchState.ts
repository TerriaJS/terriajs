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

  @observable locationSearchResults: SearchProviderResults[] = [];
  @observable catalogSearchResults: SearchProviderResults | undefined;
  @observable unifiedSearchResults: SearchProviderResults[] = [];

  private _catalogSearchDisposer: IReactionDisposer;
  private _locationSearchDisposer: IReactionDisposer;
  private _unifiedSearchDisposer: IReactionDisposer;

  private readonly terria: Terria;

  constructor(options: SearchStateOptions) {
    makeObservable(this);

    this.terria = options.terria;

    runInAction(() => {
      this.terria.searchBarModel.catalogSearchProvider =
        options.catalogSearchProvider ||
        new CatalogSearchProvider("catalog-search-provider", options.terria);
    });

    const self = this;

    this._catalogSearchDisposer = reaction(
      () => self.catalogSearchText,
      () => {
        self.isWaitingToStartCatalogSearch = true;
        if (self.catalogSearchProvider) {
          self.catalogSearchResults = self.catalogSearchProvider.search("");
        }
      }
    );

    this._locationSearchDisposer = reaction(
      () => self.locationSearchText,
      () => {
        self.isWaitingToStartLocationSearch = true;
        self.locationSearchResults = self.locationSearchProviders.map(
          (provider) => {
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
          (provider) => {
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
      this.locationSearchResults.forEach((results) => {
        results.isCanceled = true;
      });
      this.locationSearchResults = this.locationSearchProviders.map(
        (searchProvider) => searchProvider.search(this.locationSearchText)
      );
    }
  }

  @action
  searchUnified() {
    if (this.isWaitingToStartUnifiedSearch) {
      this.isWaitingToStartUnifiedSearch = false;
      this.unifiedSearchResults.forEach((results) => {
        results.isCanceled = true;
      });
      this.unifiedSearchResults = this.unifiedSearchProviders.map(
        (searchProvider) => searchProvider.search(this.unifiedSearchText)
      );
    }
  }
}
