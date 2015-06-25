'use strict';

/*global require*/
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defined = require('terriajs-cesium/Source/Core/defined');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');

var loadView = require('../Core/loadView');

var EmbeddedContentPopupViewModel = function(options) {
    if (!defined(options) || !defined(options.url)) {
        throw new DeveloperError('options.url is required.');
    }

    this.url = options.url;

    this.title = defaultValue(options.title, 'Embedded Content');

    this._domNodes = undefined;

    knockout.track(this, ['url', 'title']);
};

EmbeddedContentPopupViewModel.prototype.show = function(container) {
    if (!defined(this._domNodes)) {
        this._domNodes = loadView(require('fs').readFileSync(__dirname + '/../Views/EmbeddedContentPanel.html', 'utf8'), container, this);
    }
};

EmbeddedContentPopupViewModel.prototype.close = function() {
    for (var i = 0; i < this._domNodes.length; ++i) {
        var node = this._domNodes[i];
        if (defined(node.parentElement)) {
            node.parentElement.removeChild(node);
        }
    }
};

EmbeddedContentPopupViewModel.prototype.closeIfClickOnBackground = function(viewModel, e) {
    if (e.target.className === 'embedded-content-panel-background') {
        this.close();
    }
    return true;
};

EmbeddedContentPopupViewModel.open = function(options) {
    var viewModel = new EmbeddedContentPopupViewModel(options);
    viewModel.show(options.container);
    return viewModel;
};


module.exports = EmbeddedContentPopupViewModel;