'use strict';

/*global require*/
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var getElement = require('terriajs-cesium/Source/Widgets/getElement');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');

var inherit = require('../Core/inherit');
var loadView = require('../Core/loadView');
var PopupViewModel = require('./PopupViewModel');
var closeWhenEscapeIsPressed = require('../Core/closeWhenEscapeIsPressed');

var PopupMessageViewModel = function(options) {
    PopupViewModel.call(this, options);

    this.title = defaultValue(options.title, 'Information');
    this.message = options.message;
    this.width = defaultValue(options.width, 400);
    this.height = defaultValue(options.height, 300);
    this.horizontalPadding = defaultValue(options.horizontalPadding, 30);
    this.verticalPadding = defaultValue(options.verticalPadding, 30);
    this.maxWidth = this.width;
    this.maxHeight = this.height;

    this.view = require('../Views/PopupMessage.html');

    knockout.track(this, ['message', 'width', 'height', 'maxWidth', 'maxHeight']);
};

inherit(PopupViewModel, PopupMessageViewModel);

PopupMessageViewModel.prototype.show = function(container) {
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

    closeWhenEscapeIsPressed(this);
};


PopupMessageViewModel.open = function(container, options) {
    var viewModel = new PopupMessageViewModel(options);
    viewModel.show(container);
    return viewModel;
};

module.exports = PopupMessageViewModel;
