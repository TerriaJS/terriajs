'use strict';

/*global require*/
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defined = require('terriajs-cesium/Source/Core/defined');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');

var inherit = require('../Core/inherit');
var loadView = require('../Core/loadView');
var PopupViewModel = require('./PopupViewModel');

var EmbeddedContentPopupViewModel = function(options) {
    if (!defined(options) || !defined(options.url)) {
        throw new DeveloperError('options.url is required.');
    }

    this.url = options.url;

    this.title = defaultValue(options.title, 'Embedded Content');

    knockout.track(this, ['url']);
};

inherit(PopupViewModel, EmbeddedContentPopupViewModel);

EmbeddedContentPopupViewModel.prototype.show = function(container) {
    if (!defined(this._domNodes)) {
        this._domNodes = loadView(require('fs').readFileSync(__dirname + '/../Views/EmbeddedContentPanel.html', 'utf8'), container, this);
    }
};


EmbeddedContentPopupViewModel.open = function(options) {
    var viewModel = new EmbeddedContentPopupViewModel(options);
    viewModel.show(options.container);
    return viewModel;
};


module.exports = EmbeddedContentPopupViewModel;