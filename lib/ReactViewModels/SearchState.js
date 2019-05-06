import CatalogItemNameSearchProviderViewModel from "../ViewModels/CatalogItemNameSearchProviderViewModel";
import knockout from "terriajs-cesium/Source/ThirdParty/knockout";

export default class SearchState {
  constructor(options) {
    this.catalogSearchProvider =
      options.catalogSearchProvider ||
      new CatalogItemNameSearchProviderViewModel({ terria: options.terria });
    this.locationSearchProviders = options.locationSearchProviders || [];

    this.catalogSearchText = "";
    this.isWaitingToStartCatalogSearch = false;

    this.locationSearchText = "";
    this.isWaitingToStartLocationSearch = false;

    this.unifiedSearchText = "";
    this.isWaitingToStartUnifiedSearch = false;

    this.showLocationSearchResults = true;

    this.showMobileLocationSearch = false;
    this.showMobileCatalogSearch = false;

    knockout.track(this, [
      "catalogSearchProvider",
      "locationSearchProviders",
      "catalogSearchText",
      "isWaitingToStartCatalogSearch",
      "locationSearchText",
      "isWaitingToStartLocationSearch",
      "unifiedSearchText",
      "isWaitingToStartUnifiedSearch",
      "showLocationSearchResults",
      "showMobileLocationSearch",
      "showMobileCatalogSearch",
      "sourcePinDataSource"
    ]);

    knockout.getObservable(this, "catalogSearchText").subscribe(() => {
      this.isWaitingToStartCatalogSearch = true;
      this.catalogSearchProvider.search("");
    });

    knockout.getObservable(this, "locationSearchText").subscribe(() => {
      this.isWaitingToStartLocationSearch = true;
      this.locationSearchProviders.forEach(provider => {
        provider.search("");
      });
    });

    knockout.getObservable(this, "unifiedSearchText").subscribe(() => {
      this.isWaitingToStartUnifiedSearch = true;
      this.unifiedSearchProviders.forEach(provider => {
        provider.search("");
      });
    });

    knockout.defineProperty(this, "unifiedSearchProviders", {
      get: function() {
        return [this.catalogSearchProvider].concat(
          this.locationSearchProviders
        );
      }
    });
  }

  searchCatalog() {
    if (this.isWaitingToStartCatalogSearch) {
      this.isWaitingToStartCatalogSearch = false;
      return this.catalogSearchProvider.search(this.catalogSearchText);
    }
  }

  searchLocations() {
    if (this.isWaitingToStartLocationSearch) {
      this.isWaitingToStartLocationSearch = false;
      return this.locationSearchProviders.map(searchProvider =>
        searchProvider.search(this.locationSearchText)
      );
    }
  }

  searchUnified() {
    if (this.isWaitingToStartUnifiedSearch) {
      this.isWaitingToStartUnifiedSearch = false;
      return this.unifiedSearchProviders.map(searchProvider =>
        searchProvider.search(this.unifiedSearchText)
      );
    }
  }
}
