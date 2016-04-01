'use strict';

/*global require*/
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');

var CatalogMemberControl = require('./CatalogMemberControl');
var CatalogItemInfoViewModel = require('./CatalogItemInfoViewModel');
var defined = require('terriajs-cesium/Source/Core/defined');
var ExplorerTabViewModel = require('./ExplorerTabViewModel');
var inherit = require('../Core/inherit');
var loadView = require('../Core/loadView');

var svgCheckboxChecked = require('../SvgPaths/svgCheckboxChecked');
var svgCheckboxUnchecked = require('../SvgPaths/svgCheckboxUnchecked');
var svgArrowDown = require('../SvgPaths/svgArrowDown');
var svgArrowRight = require('../SvgPaths/svgArrowRight');
var svgInfo = require('../SvgPaths/svgInfo');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');


var DataCatalogTabViewModel = function(options) {
    ExplorerTabViewModel.call(this, defaultValue(options.name, 'Data Catalogue'),
        defaultValue(options.name, 'DataCatalogue'));

    this.catalog = options.catalog;
    this.popupParentDomElement = defaultValue(options.popupParentDomElement, 'ui');

    this.svgCheckboxChecked = defaultValue(options.svgCheckboxChecked, svgCheckboxChecked);
    this.svgCheckboxUnchecked = defaultValue(options.svgCheckboxUnchecked, svgCheckboxUnchecked);
    this.svgArrowDown = defaultValue(options.svgArrowDown, svgArrowDown);
    this.svgArrowRight = defaultValue(options.svgArrowRight, svgArrowRight);
    this.svgInfo = defaultValue(options.svgInfo, svgInfo);

    this.panelHasFocus = knockout.observable(false);

    var that = this;

    knockout.getObservable(this, 'isActive').subscribe(function(newValue) {
        if (newValue) {
            that.panelHasFocus(true);
        }
    }, this);
};

inherit(ExplorerTabViewModel, DataCatalogTabViewModel);

DataCatalogTabViewModel.prototype.show = function(container) {
    loadView(require('fs').readFileSync(__dirname + '/../Views/DataCatalogTab.html', 'utf8'), container, this);
};

DataCatalogTabViewModel.prototype.showInfo = function(item) {
    item.terria.analytics.logEvent('dataSource', 'info', item.name);
    CatalogItemInfoViewModel.open('ui', item);
};

DataCatalogTabViewModel.prototype.clickEnabled = function(item) {
    item.terria.analytics.logEvent('dataSource', 'clickItem', item.name);

    item.toggleEnabled();
};

DataCatalogTabViewModel.prototype.clickOpen = function(item) {
    item.terria.analytics.logEvent('dataSource', 'clickOpen', item.name);

    item.toggleOpen();
};

DataCatalogTabViewModel.prototype.getCheckboxClass = function(item) {
    if (defined(item.isLoading) && item.isLoading) {
        return 'data-catalog-item-checkbox loading';
    } else if (defined(item.isEnabled) && item.isEnabled) {
        return 'data-catalog-item-checkbox checked';
    }
    return 'data-catalog-item-checkbox unchecked';
};

DataCatalogTabViewModel.prototype.getRightSideMemberControls = function(catalogMember) {
    return CatalogMemberControl.rightSideMemberControls(catalogMember);
};

DataCatalogTabViewModel.prototype.getLeftSideMemberControls = function(catalogMember) {
    return CatalogMemberControl.leftSideMemberControls(catalogMember);
};



module.exports = DataCatalogTabViewModel;
