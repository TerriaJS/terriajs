'use strict';

/*global require*/

var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defined = require('terriajs-cesium/Source/Core/defined');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');

var PopupViewModel = function(options) {
    this.title = defaultValue(options.title, 'Popup');
    this._domNodes = undefined;
    knockout.track(this, ['title']);
};

PopupViewModel.prototype.show = function(container) {
    throw new DeveloperError('show must be implemented in the derived class.');
};

PopupViewModel.prototype.close = function() {
    for (var i = 0; i < this._domNodes.length; ++i) {
        var node = this._domNodes[i];
        if (defined(node.parentElement)) {
            node.parentElement.removeChild(node);
        }
    }
};

PopupViewModel.prototype.closeIfClickOnBackground = function(viewModel, e) {
    if (e.target.className === 'modal-background') {
        this.close();
    }
    return true;
};

PopupViewModel.prototype.closeWithDelay = function(delay) {
    var that = this;
    return setTimeout(function(){that.close();}, delay);
};

module.exports = PopupViewModel;
