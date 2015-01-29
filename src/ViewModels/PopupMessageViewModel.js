'use strict';

/*global require*/
var defaultValue = require('../../third_party/cesium/Source/Core/defaultValue');
var defined = require('../../third_party/cesium/Source/Core/defined');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');

var loadView = require('../Core/loadView');

var PopupMessageViewModel = function(options) {
    this._domNodes = undefined;

    this.title = defaultValue(options.title, 'Information');
    this.message = options.message;

    // On really old browsers (IE8 for example), knockout.track will throw because
    // the browser doesn't support ES5 properties.  If that happens, we just continue
    // as if nothing happened so that we can still show the message.
    try {
        knockout.track(this, ['title', 'message']);
    } catch (e) {
    }
};

PopupMessageViewModel.prototype.show = function(container) {
    this._domNodes = loadView(require('fs').readFileSync(__dirname + '/../Views/PopupMessage.html', 'utf8'), container, this);
};

PopupMessageViewModel.prototype.close = function() {
    for (var i = 0; i < this._domNodes.length; ++i) {
        var node = this._domNodes[i];
        if (defined(node.parentElement)) {
            node.parentElement.removeChild(node);
        }
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
