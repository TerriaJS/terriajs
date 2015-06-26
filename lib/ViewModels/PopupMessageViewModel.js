'use strict';

/*global require*/
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');

var inherit = require('../Core/inherit');
var loadView = require('../Core/loadView');
var PopupViewModel = require('./PopupViewModel');

var PopupMessageViewModel = function(options) {

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

inherit(PopupViewModel, PopupMessageViewModel);

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


PopupMessageViewModel.open = function(container, options) {
    var viewModel = new PopupMessageViewModel(options);
    viewModel.show(container);
    return viewModel;
};

module.exports = PopupMessageViewModel;
