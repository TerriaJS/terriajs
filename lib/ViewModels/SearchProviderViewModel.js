"use strict";

/*global require*/
var DeveloperError = require("terriajs-cesium/Source/Core/DeveloperError")
  .default;
var knockout = require("terriajs-cesium/Source/ThirdParty/knockout").default;

var SearchProviderViewModel = function() {
  this.name = "Unknown";
  this.isOpen = true;
  this.searchResults = [];
  this.searchMessage = undefined;
  this.isSearching = false;

  knockout.track(this, [
    "name",
    "isOpen",
    "searchResults",
    "searchMessage",
    "isSearching"
  ]);
};

SearchProviderViewModel.prototype.toggleOpen = function() {
  this.isOpen = !this.isOpen;
};

SearchProviderViewModel.prototype.search = function(searchText) {
  throw new DeveloperError("search must be implemented in the derived class.");
};

module.exports = SearchProviderViewModel;
