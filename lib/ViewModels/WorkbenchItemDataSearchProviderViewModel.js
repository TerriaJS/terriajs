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

    this.terria.analytics.logEvent('search', 'catalogue', searchText);

    var searchInProgress = this._searchInProgress = {
        cancel: false
    };

    this.searchResults = findMatchingFeaturesInWorkbenchData(this, searchInProgress, searchText);

    this.isSearching = false;
    if (searchInProgress.cancel) return;
    if (this.searchResults.length === 0) this.searchMessage = 'Sorry, no catalogue items match your search query.';
};

function findMatchingFeaturesInWorkbenchData(viewModel, searchInProgress, searchText) {
    const results = [];
    for (let i = 0; i < viewModel.terria.nowViewing.items.length; i++) {
        if (defined(viewModel.terria.nowViewing.items[i].search)) {
            const datasetMatches = viewModel.terria.nowViewing.items[i].search(searchText);
            if (datasetMatches) {
                results.push({
                    dataset: viewModel.terria.nowViewing.items[i],
                    results: datasetMatches
                });
            }
        }
    }
    return results;
}

module.exports = WorkbenchItemDataSearchProviderViewModel;
