'use strict';

/*global require*/
var defined = require('../../third_party/cesium/Source/Core/defined');

var loadView = require('../Core/loadView');

var svgArrowDown = require('../SvgPaths/svgArrowDown');
var svgArrowRight = require('../SvgPaths/svgArrowRight');

var CatalogItemInfoViewModel = function(catalogItem) {
    this.catalogItem = catalogItem;
    this.svgArrowDown = svgArrowDown;
    this.svgArrowRight = svgArrowRight;

    this._domNodes = undefined;
};

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

CatalogItemInfoViewModel.open = function(container, catalogItem) {
    var viewModel = new CatalogItemInfoViewModel(catalogItem);
    viewModel.show(container);
    return viewModel;
};

module.exports = CatalogItemInfoViewModel;
