'use strict';

/*global require*/
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defined = require('terriajs-cesium/Source/Core/defined');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var getElement = require('terriajs-cesium/Source/Widgets/getElement');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');

var DataCatalogTabViewModel = require('./DataCatalogTabViewModel');
var inherit = require('../Core/inherit');
var loadView = require('../Core/loadView');
var PopupViewModel = require('./PopupViewModel');

var CatalogBrowserViewModel = function(options) {
    this.title = defaultValue(options.title, 'Popup');
    this._domNodes = undefined;
    this.view = undefined;

    this.width = defaultValue(options.width, 1280);
    this.height = defaultValue(options.height, 1024);
    this.horizontalPadding = defaultValue(options.horizontalPadding, 30);
    this.verticalPadding = defaultValue(options.verticalPadding, 30);
    this.maxWidth = this.width;
    this.maxHeight = this.height;

    this.view = require('fs').readFileSync(__dirname + '/../Views/CatalogBrowser.html', 'utf8');

    this.browserTree = new DataCatalogTabViewModel({
        catalog: options.catalog
    });

    knockout.track(this, ['title', 'message', 'width', 'height', 'maxWidth', 'maxHeight']);
};

inherit(PopupViewModel, CatalogBrowserViewModel);

CatalogBrowserViewModel.prototype.show = function(container) {
    container = getElement(container);
    this._domNodes = loadView(this.view, container, this);

    var that = this;

    function updateMaxDimensions() {
        that.maxWidth = container.clientWidth - that.horizontalPadding;
        that.maxHeight = container.clientHeight - that.verticalPadding;
    }

    updateMaxDimensions();

    window.addEventListener('resize', function() {
        updateMaxDimensions();
    }, false);
};


CatalogBrowserViewModel.open = function(container, options) {
    var viewModel = new CatalogBrowserViewModel(options);
    viewModel.show(container);
    return viewModel;
};

CatalogBrowserViewModel.prototype.show = function(container) {
    if (!defined(this.view)) {
        throw new DeveloperError('A view is required.');
    }
    this._domNodes = loadView(this.view, container, this);
};

CatalogBrowserViewModel.prototype.close = function() {
    for (var i = 0; i < this._domNodes.length; ++i) {
        var node = this._domNodes[i];
        if (defined(node.parentElement)) {
            node.parentElement.removeChild(node);
        }
    }
};

CatalogBrowserViewModel.prototype.closeIfClickOnBackground = function(viewModel, e) {
    if (e.target.className === 'modal-background') {
        this.close();
    }
    return true;
};

CatalogBrowserViewModel.prototype.closeWithDelay = function(delay) {
    var that = this;
    return setTimeout(function(){that.close();}, delay);
};

module.exports = CatalogBrowserViewModel;
