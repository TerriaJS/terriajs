'use strict';

/*global require,ga*/
var defaultValue = require('../../third_party/cesium/Source/Core/defaultValue');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');

var CatalogItemInfoViewModel = require('./CatalogItemInfoViewModel');
var ExplorerTabViewModel = require('./ExplorerTabViewModel');
var inherit = require('../Core/inherit');
var loadView = require('../Core/loadView');

var svgCheckboxChecked = require('../SvgPaths/svgCheckboxChecked');
var svgCheckboxUnchecked = require('../SvgPaths/svgCheckboxUnchecked');
var svgArrowDown = require('../SvgPaths/svgArrowDown');
var svgArrowRight = require('../SvgPaths/svgArrowRight');
var svgInfo = require('../SvgPaths/svgInfo');

var NowViewingTabViewModel = function(options) {
    ExplorerTabViewModel.call(this);

    this.name = 'Now Viewing';
    this.nowViewing = options.nowViewing;

    this.svgCheckboxChecked = defaultValue(options.svgCheckboxChecked, svgCheckboxChecked);
    this.svgCheckboxUnchecked = defaultValue(options.svgCheckboxUnchecked, svgCheckboxUnchecked);
    this.svgArrowDown = defaultValue(options.svgArrowDown, svgArrowDown);
    this.svgArrowRight = defaultValue(options.svgArrowRight, svgArrowRight);
    this.svgInfo = defaultValue(options.svgInfo, svgInfo);

    var that = this;
    knockout.getObservable(this, 'isActive').subscribe(function(newValue) {
        // Make sure that at least one item is showing its legend when this tab is activated.
        if (newValue) {
            var nowViewingItems = that.nowViewing.items;

            var oneIsOpen = false;
            for (var i = 0; !oneIsOpen && i < nowViewingItems.length; ++i) {
                oneIsOpen = nowViewingItems[i].isLegendVisible;
            }

            if (!oneIsOpen && nowViewingItems.length > 0) {
                nowViewingItems[0].isLegendVisible = true;
            }
        }
    });
};

inherit(ExplorerTabViewModel, NowViewingTabViewModel);

NowViewingTabViewModel.prototype.show = function(container) {
    loadView(require('fs').readFileSync(__dirname + '/../Views/NowViewingTab.html', 'utf8'), container, this);
};

NowViewingTabViewModel.prototype.showInfo = function(item) {
    ga('send', 'event', 'dataSource', 'info', item.name);
    CatalogItemInfoViewModel.open('ui', item);
};

module.exports = NowViewingTabViewModel;
