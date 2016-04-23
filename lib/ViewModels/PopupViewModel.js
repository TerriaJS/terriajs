'use strict';

/*global require*/

var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defined = require('terriajs-cesium/Source/Core/defined');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var when = require('terriajs-cesium/Source/ThirdParty/when');

var closeWhenEscapeIsPressed = require('../Core/closeWhenEscapeIsPressed');
var loadView = require('../Core/loadView');

var PopupViewModel = function(options) {
    this.title = defaultValue(options.title, 'Popup');
    this._domNodes = undefined;
    this.view = undefined;
    knockout.track(this, ['title']);
};

PopupViewModel.prototype.show = function(container) {
    if (!defined(this.view)) {
        throw new DeveloperError('A view is required.');
    }
    this._domNodes = loadView(this.view, container, this);
    closeWhenEscapeIsPressed(this);
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
    var deferred = when.defer();

    setTimeout(function() {
        try {
            deferred.resolve(that.close());
        } catch (e) {
            deferred.reject(e);
        }
    }, delay);

    return deferred.promise;
};

module.exports = PopupViewModel;
