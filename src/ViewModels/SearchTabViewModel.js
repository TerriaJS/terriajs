'use strict';

/*global require,ga*/
var defined = require('../../third_party/cesium/Source/Core/defined');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');

var CatalogItemInfoViewModel = require('./CatalogItemInfoViewModel');
var ExplorerTabViewModel = require('./ExplorerTabViewModel');
var inherit = require('../Core/inherit');
var loadView = require('../Core/loadView');

var svgArrowDown = require('../SvgPaths/svgArrowDown');
var svgArrowRight = require('../SvgPaths/svgArrowRight');
var svgCheckboxChecked = require('../SvgPaths/svgCheckboxChecked');
var svgCheckboxUnchecked = require('../SvgPaths/svgCheckboxUnchecked');
var svgInfo = require('../SvgPaths/svgInfo');

var SearchTabViewModel = function(application) {
    ExplorerTabViewModel.call(this);

    this.application = application;

    this.name = 'Search';
    this.searchText = '';
    this.searchProviders = [];

    knockout.track(this, ['name', 'searchText', 'searchProviders']);

    // Knockout's hasFocus binding doesn't work with a knockout-es5 property (as of v3.2.0).
    // So, just use a regular observable.
    this.searchBoxHasFocus = knockout.observable(false);

    this.svgArrowDown = svgArrowDown;
    this.svgArrowRight = svgArrowRight;
    this.svgCheckboxChecked = svgCheckboxChecked;
    this.svgCheckboxUnchecked = svgCheckboxUnchecked;
    this.svgInfo = svgInfo;

    var searchTextObservable = knockout.getObservable(this, 'searchText');

    searchTextObservable.extend({ rateLimit: 250 });

    searchTextObservable.subscribe(function() {
        this.search();
    }, this);

    // Focus the search box when the tab is activated.
    knockout.getObservable(this, 'isActive').subscribe(function(newValue) {
        if (newValue) {
            this.searchBoxHasFocus(true);
        }
    }, this);
};

inherit(ExplorerTabViewModel, SearchTabViewModel);

SearchTabViewModel.prototype.show = function(container) {
    loadView(require('fs').readFileSync(__dirname + '/../Views/SearchTab.html', 'utf8'), container, this);
};

SearchTabViewModel.prototype.search = function() {
    for (var i = 0; i < this.searchProviders.length; ++i) {
        this.searchProviders[i].search(this.searchText);
    }
};

SearchTabViewModel.prototype.activateFirstResult = function() {
    for (var i = 0; i < this.searchProviders.length; ++i) {
        var searchProvider = this.searchProviders[i];
        for (var j = 0; j < searchProvider.searchResults.length; ++j) {
            var searchResult = searchProvider.searchResults[j];
            if (defined(searchResult.clickAction)) {
                searchResult.clickAction();
                return;
            }
        }
    }
};

SearchTabViewModel.prototype.showInfo = function(item) {
    ga('send', 'event', 'dataSource', 'info', item.name);
    CatalogItemInfoViewModel.open('ui', item);
};

SearchTabViewModel.prototype.clearSearchText = function() {
    this.searchText = '';
    this.searchBoxHasFocus(true);
};

module.exports = SearchTabViewModel;
