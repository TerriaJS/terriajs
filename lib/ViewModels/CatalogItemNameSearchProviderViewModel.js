'use strict';

/*global require,ga*/
var inherit = require('../Core/inherit');
var SearchProviderViewModel = require('./SearchProviderViewModel');
var SearchResultViewModel = require('./SearchResultViewModel');

var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defined = require('terriajs-cesium/Source/Core/defined');
var when = require('terriajs-cesium/Source/ThirdParty/when');

var CatalogItemNameSearchProviderViewModel = function(options) {
    SearchProviderViewModel.call(this);

    options = defaultValue(options, defaultValue.EMPTY_OBJECT);

    this.terria = options.terria;
    this._searchInProgress = undefined;

    this.name = 'Catalogue Items';
    this.maxResults = defaultValue(options.maxResults, 10);
};

inherit(SearchProviderViewModel, CatalogItemNameSearchProviderViewModel);

CatalogItemNameSearchProviderViewModel.prototype.search = function(searchText) {
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

    ga('send', 'event', 'search', 'catalogue', searchText);

    var searchInProgress = this._searchInProgress = {
        cancel: false
    };

    var path = [];
    var topLevelGroup =  this.terria.catalog.group;
    var promises = [];
    findMatchingItemsRecursively(this, searchInProgress, new RegExp(searchText, 'i'), topLevelGroup, path, promises);

    var that = this;
    return when.all(promises, function() {
        if (searchInProgress.cancel) {
            return;
        }

        if (that.searchResults.length === 0) {
            that.searchMessage = 'Sorry, no catalogue items match your search query.';
        }

        that.isSearching = false;
    });
};

function findMatchingItemsRecursively(viewModel, searchInProgress, searchExpression, group, path, promises) {
    path.push(group);

    var items = group.items;
    for (var i = 0; !searchInProgress.cancel && viewModel.searchResults.length < viewModel.maxResults && i < items.length; ++i) {
        var item = items[i];

        if (item.isHidden) {
            continue;
        }

        // Match non-top-level items whose name contain the search text.
        if (searchExpression.test(item.name)) {
            viewModel.searchResults.push(new SearchResultViewModel({
                name: item.name,
                isImportant: true,
                catalogItem: item,
                tooltip: pathToTooltip(path)
            }));
        }

        if (defined(item.items)) {
            var loadPromise = item.load();
            if (defined(loadPromise) && item.isLoading) {
                var searchPromise = loadPromise.then(findItemsInLoadedGroup.bind(undefined, viewModel, searchInProgress, searchExpression, item, path.slice()));
                searchPromise = searchPromise.otherwise(ignoreLoadErrors);
                promises.push(searchPromise);
            } else {
                findMatchingItemsRecursively(viewModel, searchInProgress, searchExpression, item, path, promises);
            }
        }
    }

    path.pop();
}

function findItemsInLoadedGroup(viewModel, searchInProgress, searchExpression, item, path) {
    var childPromises = [];
    findMatchingItemsRecursively(viewModel, searchInProgress, searchExpression, item, path, childPromises);
    return when.all(childPromises);
}

function ignoreLoadErrors() {
}

function pathToTooltip(path) {
    var result = 'In Data Catalogue';

    // Start at 1 to skip "Root Group"
    for (var i = 1; i < path.length; ++i) {
        result += ' -> ' + path[i].name;
    }

    return result;
}

module.exports = CatalogItemNameSearchProviderViewModel;
