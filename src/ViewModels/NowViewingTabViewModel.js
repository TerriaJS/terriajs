'use strict';

/*global require,ga*/
var defaultValue = require('../../third_party/cesium/Source/Core/defaultValue');

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
};

inherit(ExplorerTabViewModel, NowViewingTabViewModel);

NowViewingTabViewModel.prototype.show = function(container) {
    loadView(require('fs').readFileSync(__dirname + '/../Views/NowViewingTab.html', 'utf8'), container, this);
};

NowViewingTabViewModel.prototype.showInfo = function(item) {
    ga('send', 'event', 'dataSource', 'info', item.name);
    var info = new CatalogItemInfoViewModel(item);
    info.show(document.getElementById('ui'));
};

module.exports = NowViewingTabViewModel;
