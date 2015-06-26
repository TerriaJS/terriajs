'use strict';

/*global require*/

var defined = require('terriajs-cesium/Source/Core/defined');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');

var PopupViewModel = function(options) {
    this._domNodes = undefined;
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
