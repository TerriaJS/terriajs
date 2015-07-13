'use strict';

/*global require*/
var naturalSort = require('javascript-natural-sort');
var defined = require('terriajs-cesium/Source/Core/defined');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');

var loadView = require('../Core/loadView');

var svgArrowDown = require('../SvgPaths/svgArrowDown');
var svgArrowRight = require('../SvgPaths/svgArrowRight');

var CatalogItemInfoViewModel = function(catalogItem) {
    this.catalogItem = catalogItem;
    this.svgArrowDown = svgArrowDown;
    this.svgArrowRight = svgArrowRight;

    this.showDataDetails = false;
    this.showServiceDetails = false;

    this._domNodes = undefined;

    knockout.track(this, ['showDataDetails', 'showServiceDetails']);

    knockout.defineProperty(this, 'sortedInfo', {
        get: function() {
            var items = this.catalogItem.info.slice();
            naturalSort.insensitive = true;
            items.sort(function(a, b) {
                var aIndex = CatalogItemInfoViewModel.infoSectionOrder.indexOf(a.name);
                var bIndex = CatalogItemInfoViewModel.infoSectionOrder.indexOf(b.name);
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
};

CatalogItemInfoViewModel.infoSectionOrder = [
    'Data Description',
    'Dataset Description',
    'Service Description',
    'Resource Description',
    'Licence',
    'Access Constraints'
];

CatalogItemInfoViewModel.prototype.show = function(container) {
    this._domNodes = loadView(require('fs').readFileSync(__dirname + '/../Views/CatalogItemInfo.html', 'utf8'), container, this);
};

CatalogItemInfoViewModel.prototype.close = function() {
    for (var i = 0; i < this._domNodes.length; ++i) {
        var node = this._domNodes[i];
        if (defined(node.parentElement)) {
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
