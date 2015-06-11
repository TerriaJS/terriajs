'use strict';

/*global require*/
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defined = require('terriajs-cesium/Source/Core/defined');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');

var loadView = require('../Core/loadView');

var PopupMessageViewModel = function(options) {
    this._domNodes = undefined;

    this.title = defaultValue(options.title, 'Information');
    this.message = options.message;
    this.width = defaultValue(options.width, 400);
    this.height = defaultValue(options.height, 300);
    this.horizontalPadding = defaultValue(options.horizontalPadding, 200);
    this.verticalPadding = defaultValue(options.verticalPadding, 200);
    this.maxWidth = this.width;
    this.maxHeight = this.height;

    knockout.track(this, ['title', 'message', 'width', 'height', 'maxWidth', 'maxHeight']);
};

PopupMessageViewModel.prototype.show = function(container) {
    this._domNodes = loadView(require('fs').readFileSync(__dirname + '/../Views/PopupMessage.html', 'utf8'), container, this);

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
