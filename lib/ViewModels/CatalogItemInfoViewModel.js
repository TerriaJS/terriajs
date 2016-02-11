'use strict';

/*global require*/
var naturalSort = require('javascript-natural-sort');
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defined = require('terriajs-cesium/Source/Core/defined');
var definedNotNull = require('terriajs-cesium/Source/Core/definedNotNull');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');

var loadView = require('../Core/loadView');

var svgArrowDown = require('../SvgPaths/svgArrowDown');
var svgArrowRight = require('../SvgPaths/svgArrowRight');
var closeWhenEscapeIsPressed = require('../Core/closeWhenEscapeIsPressed');

var CatalogItemInfoViewModel = function(catalogItem) {
    this.svgArrowDown = svgArrowDown;
    this.svgArrowRight = svgArrowRight;

    this.showDataDetails = false;
    this.showServiceDetails = false;

    this._domNodes = undefined;

    knockout.track(this, ['showDataDetails', 'showServiceDetails']);

    knockout.defineProperty(this, 'sortedInfo', {
        get: function() {
            var items = this.catalogItem.info.slice();

            var infoSectionOrder = defaultValue(this.catalogItem.infoSectionOrder, CatalogItemInfoViewModel.infoSectionOrder);

            naturalSort.insensitive = true;
            items.sort(function(a, b) {
                var aIndex = infoSectionOrder.indexOf(a.name);
                var bIndex = infoSectionOrder.indexOf(b.name);
                if (aIndex >= 0 && bIndex < 0) {
                    return -1;
                } else if (aIndex < 0 && bIndex >= 0) {
                    return 1;
                } else if (aIndex < 0 && bIndex < 0) {
                    return naturalSort(a.name, b.name);
                } else {
                    return aIndex - bIndex;
                }
            });
            return items;
        }
    });

    knockout.defineProperty(this, 'catalogItem', {
        get: function() {
            return defined(catalogItem.nowViewingCatalogItem) ? catalogItem.nowViewingCatalogItem : catalogItem;
        }
    });

    catalogItem.load();
};

CatalogItemInfoViewModel.infoSectionOrder = [
    "Disclaimer",
    "Description",
    'Data Description',
    'Dataset Description',
    'Service Description',
    'Resource Description',
    'Licence',
    'Access Constraints'
];

CatalogItemInfoViewModel.prototype.show = function(container) {
    this._domNodes = loadView(require('fs').readFileSync(__dirname + '/../Views/CatalogItemInfo.html', 'utf8'), container, this);
    document.querySelector('.modal-background .catalog-item-info').focus();
    closeWhenEscapeIsPressed(this);
};

CatalogItemInfoViewModel.prototype.close = function() {
    for (var i = 0; i < this._domNodes.length; ++i) {
        var node = this._domNodes[i];
        if (definedNotNull(node.parentElement)) {
            node.parentElement.removeChild(node);
        }
    }
};

CatalogItemInfoViewModel.prototype.closeIfClickOnBackground = function(viewModel, e) {
    if (e.target.className === 'modal-background') {
        this.close();
    }
    return true;
};

CatalogItemInfoViewModel.prototype.toggleShowDataDetails = function() {
    this.showDataDetails = !this.showDataDetails;
};

CatalogItemInfoViewModel.prototype.toggleShowServiceDetails = function() {
    this.showServiceDetails = !this.showServiceDetails;
};

CatalogItemInfoViewModel.open = function(container, catalogItem) {
    var viewModel = new CatalogItemInfoViewModel(catalogItem);
    viewModel.show(container);
    return viewModel;
};

module.exports = CatalogItemInfoViewModel;
