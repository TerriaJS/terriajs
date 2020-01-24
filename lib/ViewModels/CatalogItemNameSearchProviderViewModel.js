"use strict";

/*global require*/
var inherit = require("../Core/inherit");
var runLater = require("../Core/runLater");
var SearchProviderViewModel = require("./SearchProviderViewModel");
var SearchResultViewModel = require("./SearchResultViewModel");

var defaultValue = require("terriajs-cesium/Source/Core/defaultValue").default;
var defined = require("terriajs-cesium/Source/Core/defined").default;
var when = require("terriajs-cesium/Source/ThirdParty/when").default;
import i18next from "i18next";

var CatalogItemNameSearchProviderViewModel = function(options) {
  SearchProviderViewModel.call(this);

  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  this.terria = options.terria;
  this._searchInProgress = undefined;

  this.name = i18next.t("viewModels.searchCatalogueItem");
  this.maxResults = defaultValue(options.maxResults, 10000);
};

inherit(SearchProviderViewModel, CatalogItemNameSearchProviderViewModel);

CatalogItemNameSearchProviderViewModel.prototype.search = function(searchText) {
  function parseSearchFilters() {
    /* Filter search by type, eg 'is:wms fish' or '-is:wfs house'. Multiple 'is' clauses are or-ed. */
    var isRE = /(^|\s)(-?)is:([a-zA-Z0-9_-]+)\b/i;
    while (searchText.match(isRE)) {
      if (!searchText.match(isRE)[2]) {
        searchFilters.typeIs.push(searchText.match(isRE)[3].toLowerCase());
      } else {
        searchFilters.typeIsNot.push(searchText.match(isRE)[3].toLowerCase());
      }
      searchText = searchText.replace(isRE, "").trim();
    }
    /* Change number of search results: 'show:20' or 'show:all' */
    var showRE = /\bshow:(all|[0-9]+)\b/i;
    while (searchText.match(showRE)) {
      searchFilters.maxResults = searchText.match(showRE)[1].toLowerCase();
      if (searchFilters.maxResults === "all") {
        searchFilters.maxResults = 10000;
      } else {
        searchFilters.maxResults = parseInt(searchFilters.maxResults, 10);
      }
      searchText = searchText.replace(showRE, "").trim();
    }

    /* Filter by URL: 'url:landgate.wa' or '-url:geoserver.nicta.com.au' */
    var urlRE = /(^|\s)(-?)url:([^ ]+)(\b|$)/i;
    while (searchText.match(urlRE)) {
      if (!searchText.match(urlRE)[2]) {
        searchFilters.urlMatches.push(searchText.match(urlRE)[3].toLowerCase());
      } else {
        searchFilters.urlDoesNotMatch.push(
          searchText.match(urlRE)[3].toLowerCase()
        );
      }
      searchText = searchText.replace(urlRE, "").trim();
    }
  }

  if (this._searchInProgress) {
    this._searchInProgress.cancel = true;
    this._searchInProgress = undefined;
  }

  if (!defined(searchText) || /^\s*$/.test(searchText)) {
    this.isSearching = false;
    this.searchResults.removeAll();
    return;
  }

  var searchFilters = {
    typeIs: [],
    typeIsNot: [],
    urlMatches: [],
    urlDoesNotMatch: []
  };
  parseSearchFilters();

  this.isSearching = true;
  this.searchResults.removeAll();
  this.searchMessage = undefined;

  this.terria.analytics.logEvent("search", "catalogue", searchText);

  var searchInProgress = (this._searchInProgress = {
    cancel: false
  });

  var path = [];
  var topLevelGroup = this.terria.catalog.group;
  var promise = findMatchingItemsRecursively(
    this,
    searchInProgress,
    new RegExp(searchText, "i"),
    topLevelGroup,
    path,
    undefined,
    searchFilters
  );

  var that = this;
  return when(promise).then(function() {
    that.isSearching = false;

    if (searchInProgress.cancel) {
      return;
    }

    if (that.searchResults.length === 0) {
      that.searchMessage = i18next.t("viewModels.searchNoCatalogueItem");
    }
  });
};

function itemMatchesFilters(item, searchFilters) {
  if (
    searchFilters.typeIs.length > 0 &&
    searchFilters.typeIs.indexOf(item.type.toLowerCase()) < 0
  ) {
    return false;
  }
  if (
    searchFilters.typeIsNot.length > 0 &&
    searchFilters.typeIsNot.indexOf(item.type.toLowerCase()) >= 0
  ) {
    return false;
  }
  if (!item.url) {
    // if no URL, it can't match any positive filters, and can't fail by matching any negative ones.
    return searchFilters.urlMatches.length === 0;
  }

  var r = true;
  // multiple -url: filters are and-ed
  searchFilters.urlDoesNotMatch.forEach(function(e) {
    // we just do simple string matching, not regex
    if (item.url.toLowerCase().indexOf(e) >= 0) {
      r = false;
    }
  });
  if (!r) {
    return false;
  }
  if (searchFilters.urlMatches.length === 0) {
    return true;
  }

  r = false;
  // multiple url: filters are or-ed
  searchFilters.urlMatches.forEach(function(e) {
    // we just do simple string matching, not regex
    if (item.url.toLowerCase().indexOf(e) >= 0) {
      r = true;
    }
  });

  return r;
}

function findMatchingItemsRecursively(
  viewModel,
  searchInProgress,
  searchExpression,
  group,
  path,
  promise,
  searchFilters
) {
  path.push(group);
  if (!defined(searchFilters)) {
    searchFilters = {};
  }
  var items = group.items;
  var maxResults = defined(searchFilters.maxResults)
    ? searchFilters.maxResults
    : viewModel.maxResults;
  for (
    var i = 0;
    !searchInProgress.cancel &&
    viewModel.searchResults.length < maxResults &&
    i < items.length;
    ++i
  ) {
    var item = items[i];

    if (item.isHidden) {
      continue;
    }

    // Match non-top-level items whose name contain the search text.
    if (
      searchExpression.test(item.name) &&
      itemMatchesFilters(item, searchFilters)
    ) {
      addSearchResult(viewModel.searchResults, item, path);
    }

    if (defined(item.items)) {
      promise = loadAndSearchGroup(
        viewModel,
        item,
        searchInProgress,
        searchExpression,
        path,
        promise,
        searchFilters
      );
    }
  }

  path.pop();

  return promise;
}

function loadAndSearchGroup(
  viewModel,
  group,
  searchInProgress,
  searchExpression,
  path,
  promise,
  searchFilters
) {
  path = path.slice();

  // Let a previous load (represented by 'promise') finish first.
  return when(promise).then(function() {
    if (searchInProgress.cancel) {
      return;
    }
    return runLater(function() {
      if (searchInProgress.cancel) {
        return;
      }
      var loadPromise = group.load();
      if (defined(loadPromise) && group.isLoading) {
        return loadPromise
          .then(function() {
            return findMatchingItemsRecursively(
              viewModel,
              searchInProgress,
              searchExpression,
              group,
              path,
              undefined,
              searchFilters
            );
          })
          .otherwise(ignoreLoadErrors);
      } else {
        return findMatchingItemsRecursively(
          viewModel,
          searchInProgress,
          searchExpression,
          group,
          path,
          undefined,
          searchFilters
        );
      }
    });
  });
}

function ignoreLoadErrors() {}

function addSearchResult(searchResults, item, path) {
  // Get the index of an existing search result that refers to the same catalog item (or -1)
  var index = -1;
  for (var j = 0; j < searchResults.length; ++j) {
    if (item === searchResults[j].catalogItem) {
      index = j;
      break;
    }
  }

  // If a search result for item already exists, modify the tooltip of that search result
  var prefix = i18next.t("viewModels.inMultipleLocations");
  if (index >= 0) {
    if (searchResults[index].tooltip.indexOf(prefix) !== 0) {
      searchResults[index].tooltip = searchResults[index].tooltip.replace(
        /^In /,
        prefix
      );
    }
  } else {
    // Otherwise, create a new search result
    searchResults.push(
      new SearchResultViewModel({
        name: item.name,
        isImportant: true,
        catalogItem: item,
        tooltip: pathToTooltip(path)
      })
    );
  }
}

function pathToTooltip(path) {
  var result = i18next.t("viewModels.inDataCatalogue");

  // Start at 1 to skip "Root Group"
  for (var i = 1; i < path.length; ++i) {
    result += " -> " + path[i].name;
  }

  return result;
}

module.exports = CatalogItemNameSearchProviderViewModel;
