
import knockout from 'terriajs-cesium/Source/ThirdParty/knockout';

export default class SearchState {
    constructor(locationSearchProviders = []) {
        this.locationSearchProviders = locationSearchProviders;
        this.locationSearchText = '';
        this.catalogSearchText = '';

        this.hideLocationSearch = false;

        knockout.track(this, ['locationSearchProviders', 'catalogSearchText', 'locationSearchText', 'hideLocationSearch']);

        knockout.defineProperty(this, 'locationSearchResults', {
            get: () => this.locationSearchProviders
                .filter(search => search.isSearching || (search.searchResults && search.searchResults.length))
        });

        this.searchPromises = [];
        this.goToFirstResultCount = 0;
    }

    searchLocations(searchText) {
        this.locationSearchText = searchText;
        this.searchPromises = this.locationSearchProviders.map((searchProvider) => searchProvider.search(searchText));
    }

    goToFirstResult() {
        this.goToFirstResultCount++;
        const goToFirstResultCountAtStart = this.goToFirstResultCount;

        const tryNext = (i) => {
            this.searchPromises[i].then(() => {
                if (goToFirstResultCountAtStart !== this.goToFirstResultCount) {
                    return;
                }

                if (this.locationSearchProviders[i].searchResults.length > 0) {
                    this.locationSearchProviders[i].searchResults[0].clickAction();
                } else if (i + 1 < this.locationSearchProviders.length) {
                    tryNext(i + 1);
                }
            });
        };

        if (this.searchPromises.length) {
            tryNext(0);
        }
    }
}
