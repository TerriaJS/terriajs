'use strict';

/*global require*/
var defaultValue = require('../../third_party/cesium/Source/Core/defaultValue');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');

var loadView = require('../Core/loadView');

var PopupMessageViewModel = function(options) {
    this._domNodes = undefined;

    this.title = defaultValue(options.title, 'Information');
    this.message = options.message;

    knockout.track(this, ['title', 'message']);
};

PopupMessageViewModel.prototype.show = function(container) {
    this._domNodes = loadView(require('fs').readFileSync(__dirname + '/../Views/PopupMessage.html', 'utf8'), container, this);
};

PopupMessageViewModel.prototype.close = function() {
    for (var i = 0; i < this._domNodes.length; ++i) {
        var node = this._domNodes[i];
        node.parentElement.removeChild(node);
    }
};

PopupMessageViewModel.prototype.closeIfClickOnBackground = function(viewModel, e) {
    if (e.target.className === 'modal-background') {
        this.close();
    }
    return true;
};

PopupMessageViewModel.open = function(container, options) {
    var viewModel = new PopupMessageViewModel(options);
    viewModel.show(container);
    return viewModel;
};

module.exports = PopupMessageViewModel;
