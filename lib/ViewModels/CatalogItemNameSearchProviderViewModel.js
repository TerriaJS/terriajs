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

    /* Filter search by type, eg 'is:wms fish'. Multiple 'is' clauses are or-ed. */
    var searchFilters = { typeIs: [] };
    var isRE = /\bis:([a-zA-Z0-9_-]+)\b/i;
    while (searchText.match(isRE)) {
        searchFilters.typeIs.push(searchText.match(isRE)[1].toLowerCase());
        searchText = searchText.replace(isRE, '');
    }
    var showRE = /\bshow:(all|[0-9]+)\b/i;
    while (searchText.match(showRE)) {
        searchFilters.maxResults = searchText.match(showRE)[1].toLowerCase();
        if (searchFilters.maxResults === 'all') {
            searchFilters.maxResults = 1000;
        } else {
            searchFilters.maxResults = Number.parseInt(searchFilters.maxResults);
        }
        searchText = searchText.replace(showRE, '');
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
    findMatchingItemsRecursively(this, searchInProgress, new RegExp(searchText, 'i'), topLevelGroup, path, promises, searchFilters);

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

function findMatchingItemsRecursively(viewModel, searchInProgress, searchExpression, group, path, promises, searchFilters) {
    path.push(group);
    if (!defined (searchFilters)) {
        searchFilters = {};
    }
    var items = group.items;
    var maxResults = (defined(searchFilters.maxResults) ? searchFilters.maxResults : viewModel.maxResults);
    for (var i = 0; !searchInProgress.cancel && viewModel.searchResults.length < maxResults && i < items.length; ++i) {
        var item = items[i];

        if (item.isHidden) {
            continue;
        }

        // Match non-top-level items whose name contain the search text.
        if (searchExpression.test(item.name)) {
            if (searchFilters.typeIs.length === 0 || searchFilters.typeIs.indexOf(item.type.toLowerCase()) >= 0) {
                viewModel.searchResults.push(new SearchResultViewModel({
                    name: item.name,
                    isImportant: true,
                    catalogItem: item,
                    tooltip: pathToTooltip(path)
                }));
            }
        }

        if (defined(item.items)) {
            var loadPromise = item.load();
            if (defined(loadPromise) && item.isLoading) {
                var searchPromise = loadPromise.then(
                    findItemsInLoadedGroup.bind(undefined, viewModel, searchInProgress, searchExpression, item, path.slice(), searchFilters)
                    );
                searchPromise = searchPromise.otherwise(ignoreLoadErrors);
                promises.push(searchPromise);
            } else {
                findMatchingItemsRecursively(viewModel, searchInProgress, searchExpression, item, path, promises, searchFilters);
            }
        }
    }

    path.pop();
}

function findItemsInLoadedGroup(viewModel, searchInProgress, searchExpression, item, path, searchFilters) {
    var childPromises = [];
    findMatchingItemsRecursively(viewModel, searchInProgress, searchExpression, item, path, childPromises, searchFilters);
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
