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

    this.searchResults = findMatchingFeaturesInWorkbenchData(this, searchText);

    this.isSearching = false;
    if (this.searchResults.length === 0) this.searchMessage = 'Sorry, no workbench data matches your search query.';
};

function findMatchingFeaturesInWorkbenchData(viewModel, searchText) {
    const re = new RegExp(`${searchText}`, 'gmi');

    return viewModel.terria.nowViewing.items.map((workbenchItem) => {
        if (defined(workbenchItem.searchDataForMatchingFeatures)) {
            const datasetMatches = workbenchItem.searchDataForMatchingFeatures(searchText, re);
            if (datasetMatches.length > 0) {
                return {
                    workbenchItem: workbenchItem,
                    matches: datasetMatches
                };
            }
        }
    });
}

module.exports = WorkbenchItemDataSearchProviderViewModel;
