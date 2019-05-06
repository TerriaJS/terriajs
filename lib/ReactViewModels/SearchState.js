import CatalogItemNameSearchProviderViewModel from '../ViewModels/CatalogItemNameSearchProviderViewModel';
import WorkbenchItemDataSearchProviderViewModel from '../ViewModels/WorkbenchItemDataSearchProviderViewModel';
import knockout from 'terriajs-cesium/Source/ThirdParty/knockout';

export default class SearchState {
    constructor(options) {
        this.catalogSearchProvider = options.catalogSearchProvider || new CatalogItemNameSearchProviderViewModel({ terria: options.terria });
        this.workbenchDataSearchProvider = options.workbenchDataSearchProvider || new WorkbenchItemDataSearchProviderViewModel({ terria: options.terria });
        this.locationSearchProviders = options.locationSearchProviders || [];

        this.catalogSearchText = '';
        this.isWaitingToStartCatalogSearch = false;

        this.workbenchDataSearchText = '';
        this.showWorkbenchDataSearchResults = true;
        this.isWaitingToStartWorkbenchDataSearch = false;

        this.locationSearchText = '';
        this.isWaitingToStartLocationSearch = false;

        this.unifiedSearchText = '';
        this.isWaitingToStartUnifiedSearch = false;

        this.showLocationSearchResults = true;

        this.showMobileLocationSearch = false;
        this.showMobileCatalogSearch = false;

        knockout.track(this, [
            'catalogSearchProvider', 'workbenchDataSearchProvider', 'locationSearchProviders',
            'catalogSearchText', 'isWaitingToStartCatalogSearch',
            'workbenchDataSearchText', 'isWaitingToStartWorkbenchDataSearch',
            'locationSearchText', 'isWaitingToStartLocationSearch',
            'unifiedSearchText', 'isWaitingToStartUnifiedSearch',
            'showLocationSearchResults',
            'showMobileLocationSearch', 'showMobileCatalogSearch',
            'sourcePinDataSource'
        ]);

        knockout.getObservable(this, 'catalogSearchText').subscribe(() => {
            this.isWaitingToStartCatalogSearch = true;
            this.catalogSearchProvider.search('');
        });

        knockout.getObservable(this, 'workbenchDataSearchText').subscribe(() => {
            this.isWaitingToStartWorkbenchDataSearch = true;
            this.workbenchDataSearchProvider.search('');
        });

        knockout.getObservable(this, 'locationSearchText').subscribe(() => {
            this.isWaitingToStartLocationSearch = true;
            this.locationSearchProviders.forEach(provider => {
                provider.search('');
            });
        });

        knockout.getObservable(this, 'unifiedSearchText').subscribe(() => {
            this.isWaitingToStartUnifiedSearch = true;
            this.unifiedSearchProviders.forEach(provider => {
                provider.search('');
            });
        });

        knockout.defineProperty(this, 'unifiedSearchProviders', {
            get: function() {
                return [this.catalogSearchProvider, this.workbenchDataSearchProvider].concat(this.locationSearchProviders);
            }
        });
    }

    searchCatalog() {
        if (this.isWaitingToStartCatalogSearch) {
            this.isWaitingToStartCatalogSearch = false;
            return this.catalogSearchProvider.search(this.catalogSearchText);
        }
    }

    searchWorkbenchData() {
        if (this.isWaitingToStartWorkbenchDataSearch) {
            this.isWaitingToStartWorkbenchDataSearch = false;
            return this.workbenchDataSearchProvider.search(this.workbenchDataSearchText);
        }
    }

    searchLocations() {
        if (this.isWaitingToStartLocationSearch) {
            this.isWaitingToStartLocationSearch = false;
            return this.locationSearchProviders.map((searchProvider) => searchProvider.search(this.locationSearchText));
        }
    }

    searchUnified() {
        if (this.isWaitingToStartUnifiedSearch) {
            this.isWaitingToStartUnifiedSearch = false;
            return this.unifiedSearchProviders.map((searchProvider) => searchProvider.search(this.unifiedSearchText));
        }
    }
}
