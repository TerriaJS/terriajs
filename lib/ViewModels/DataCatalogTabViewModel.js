'use strict';

/*global require*/
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');

var CatalogMemberControl = require('./CatalogMemberControl');
var CatalogItemInfoViewModel = require('./CatalogItemInfoViewModel');
var defined = require('terriajs-cesium/Source/Core/defined');
var ExplorerTabViewModel = require('./ExplorerTabViewModel');
var inherit = require('../Core/inherit');
var loadView = require('../Core/loadView');
var PopupMessageViewModel = require('./PopupMessageViewModel');
var PopupMessageConfirmationViewModel = require('./PopupMessageConfirmationViewModel');

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
    loadView(require('../Views/DataCatalogTab.html'), container, this);
};

DataCatalogTabViewModel.prototype.showInfo = function(item) {
    item.terria.analytics.logEvent('dataSource', 'info', item.name);
    CatalogItemInfoViewModel.open('ui', item);
};

DataCatalogTabViewModel.prototype.clickEnabled = function(item) {
    item.terria.analytics.logEvent('dataSource', 'clickItem', item.name);

    if (defined(item.initialMessage) && !item.isEnabled) {
        handleInitialMessage(this, item, item.toggleEnabled);
    } else {
        item.toggleEnabled();
    }
};

DataCatalogTabViewModel.prototype.clickOpen = function(item) {
    item.terria.analytics.logEvent('dataSource', 'clickOpen', item.name);

    if (defined(item.initialMessage) && !item.isOpen) {
        handleInitialMessage(this, item, item.toggleOpen);
    } else {
        item.toggleOpen();
    }
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

function handleInitialMessage(viewModel, item, successCallback) {
    var keySpecified = defined(item.initialMessage.key);
    if (keySpecified && item.terria.getLocalProperty(item.initialMessage.key)) {
        successCallback.call(item);
        return;
    }

    var options = {
        title: item.initialMessage.title,
        message: '<div>' + item.initialMessage.content + '</div>'
    };

    if (defined(item.initialMessage.width)) options.width = item.initialMessage.width;
    if (defined(item.initialMessage.height)) options.height = item.initialMessage.height;

    if (defined(item.initialMessage.confirmation) && item.initialMessage.confirmation) {
        if (defined(item.initialMessage.confirmText) && item.initialMessage.confirmText) {
            options.confirmText = item.initialMessage.confirmText;
        }

        options.confirmAction = successCallback.bind(item);
        PopupMessageConfirmationViewModel.open(viewModel.popupParentDomElement, options);
    } else {
        PopupMessageViewModel.open(viewModel.popupParentDomElement, options);
        successCallback.call(item);
    }

    if (keySpecified) {
        item.terria.setLocalProperty(item.initialMessage.key, true);
    }
}


module.exports = DataCatalogTabViewModel;
