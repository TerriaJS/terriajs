'use strict';

/*global require,ga*/
var inherit = require('../Core/inherit');
var SearchProviderViewModel = require('./SearchProviderViewModel');
var SearchResultViewModel = require('./SearchResultViewModel');

var defaultValue = require('../../third_party/cesium/Source/Core/defaultValue');
var defined = require('../../third_party/cesium/Source/Core/defined');

var CatalogItemNameSearchProviderViewModel = function(options) {
    SearchProviderViewModel.call(this);

    options = defaultValue(options, defaultValue.EMPTY_OBJECT);

    this.application = options.application;
    this._geocodeInProgress = undefined;

    this.name = 'Catalogue Items';
    this.maxResults = defaultValue(options.maxResults, 10);
};

inherit(SearchProviderViewModel, CatalogItemNameSearchProviderViewModel);

CatalogItemNameSearchProviderViewModel.prototype.search = function(searchText) {
    if (!defined(searchText) || /^\s*$/.test(searchText)) {
        this.isSearching = false;
        this.searchResults.removeAll();
        return;
    }

    this.isSearching = true;
    this.searchResults.removeAll();
    this.searchMessage = undefined;

    ga('send', 'event', 'search', 'catalogue', searchText);

    var path = [];
    var topLevelGroup = this.application.catalog.group;
    findMatchingItemsRecursively(this, new RegExp(searchText, 'i'), topLevelGroup, path);

    if (this.searchResults.length === 0) {
        this.searchMessage = 'Sorry, no catalogue items match your search query.';
    }

    this.isSearching = false;
};

function findMatchingItemsRecursively(viewModel, searchExpression, group, path) {
    path.push(group);

    var items = group.items;
    for (var i = 0; viewModel.searchResults.length < viewModel.maxResults && i < items.length; ++i) {
        var item = items[i];

        // Match non-top-level items whose name contain the search text.
        if (path.length > 1 && searchExpression.test(item.name)) {
            viewModel.searchResults.push(new SearchResultViewModel({
                name: item.name,
                isImportant: true,
                catalogItem: item,
                tooltip: pathToTooltip(path)
            }));
        }

        if (defined(item.items)) {
            findMatchingItemsRecursively(viewModel, searchExpression, item, path);
        }
    }

    path.pop();
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
