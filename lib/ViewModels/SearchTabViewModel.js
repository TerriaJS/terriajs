'use strict';

/*global require*/
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');

var CatalogItemInfoViewModel = require('./CatalogItemInfoViewModel');
var ExplorerTabViewModel = require('./ExplorerTabViewModel');
var inherit = require('../Core/inherit');
var loadView = require('../Core/loadView');
var defined = require('terriajs-cesium/Source/Core/defined');

var svgArrowDown = require('../SvgPaths/svgArrowDown');
var svgArrowRight = require('../SvgPaths/svgArrowRight');
var svgCheckboxChecked = require('../SvgPaths/svgCheckboxChecked');
var svgCheckboxUnchecked = require('../SvgPaths/svgCheckboxUnchecked');
var svgInfo = require('../SvgPaths/svgInfo');
var svgSearch = require('../SvgPaths/svgSearch');

var SearchTabViewModel = function(options) {
    ExplorerTabViewModel.call(this, defaultValue(options.name, 'Search'),
        defaultValue(options.name, 'Search'));

    this.svgPath = svgSearch;
    this.svgPathWidth = 32;
    this.svgPathHeight = 32;
    this.searchText = '';
    this.searchProviders = defaultValue(options.searchProviders, []).slice();

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
        var that = this;
          if (newValue) {
            window.setTimeout(function(){
                that.searchBoxHasFocus(true);
            }, 300);
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
    // When we have keyboard navigation for search results, this will move focus to the first result.
};

SearchTabViewModel.prototype.getCheckboxClass = function(item) {
	if (defined(item.isLoading) && item.isLoading) {
		return 'data-catalog-item-checkbox loading';
	} else if (defined(item.isEnabled) && item.isEnabled) {
		return 'data-catalog-item-checkbox checked';
	}
	return 'data-catalog-item-checkbox unchecked';
};


SearchTabViewModel.prototype.showInfo = function(item) {
    item.terria.analytics.logEvent('dataSource', 'info', item.name);
    CatalogItemInfoViewModel.open('ui', item);
};

SearchTabViewModel.prototype.clearSearchText = function() {
    this.searchText = '';
    this.searchBoxHasFocus(true);
};

module.exports = SearchTabViewModel;
