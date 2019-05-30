'use strict';

/*global require*/
var inherit = require('../Core/inherit');
var SearchProviderViewModel = require('./SearchProviderViewModel');
var SearchResultViewModel = require('./SearchResultViewModel');

var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defined = require('terriajs-cesium/Source/Core/defined');
var when = require('terriajs-cesium/Source/ThirdParty/when');

var WorkbenchItemDataSearchProviderViewModel = function(options) {
    SearchProviderViewModel.call(this);

    options = defaultValue(options, defaultValue.EMPTY_OBJECT);

    this.terria = options.terria;
    this._searchInProgress = undefined;

    this.name = 'Workbench Data';
    this.maxResults = defaultValue(options.maxResults, 10000);
};

inherit(SearchProviderViewModel, WorkbenchItemDataSearchProviderViewModel);

WorkbenchItemDataSearchProviderViewModel.prototype.search = function(searchText) {
    if (this._searchInProgress) {
        this._searchInProgress.cancel = true;
        this._searchInProgress = undefined;
    }

    if (!defined(searchText) || /^\s*$/.test(searchText)) {
        this.isSearching = false;
        this.searchResults.removeAll();
        return;
    }

    this.isSearching = true;
    this.searchResults.removeAll();
    this.searchMessage = undefined;

    this.terria.analytics.logEvent('search', 'workbench', searchText);

    this._searchInProgress = {
        cancel: false
    };

    findMatchingFeaturesInWorkbenchData(this, searchText)
    .then(results => {
        this.searchResults = results.reduce((acc, val) => acc.concat(val), []);
        this.isSearching = false;
        if (this.searchResults.length === 0) this.searchMessage = 'Sorry, no workbench data matches your search query.';        
    })
    .catch(error => { 
      console.log(error);
    });

};

function findMatchingFeaturesInWorkbenchData(viewModel, searchText) {
    const re = new RegExp(`${searchText}`, 'gmi');

    const workbenchPromises = [];

    for (let i = 0; i < viewModel.terria.nowViewing.items.length; i++) {
        const workbenchItem = viewModel.terria.nowViewing.items[i];
        // Dont search an item if it is the search result in the workbench
        // or if the CatalogItem type doesn't have a searchDataForMatchingFeatures method
        if (workbenchItem.id !== 'WorkbenchSearchResult' && defined(workbenchItem.searchDataForMatchingFeatures)) {
            workbenchPromises.push(workbenchItem.searchDataForMatchingFeatures(searchText, re));
        }
    }
    return Promise.all(workbenchPromises);
}

module.exports = WorkbenchItemDataSearchProviderViewModel;
