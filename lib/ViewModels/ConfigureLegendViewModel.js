'use strict';

/*global require*/
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var getElement = require('terriajs-cesium/Source/Widgets/getElement');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');

var inherit = require('../Core/inherit');
var loadView = require('../Core/loadView');
var PopupViewModel = require('./PopupViewModel');
var closeWhenEscapeIsPressed = require('../Core/closeWhenEscapeIsPressed');

var ConfigureLegendViewModel = function(options) {
    PopupViewModel.call(this, options);

    this.catalogItem = options.catalogItem;
    this.title = defaultValue(options.title, 'Configure Styling');
    this.width = defaultValue(options.width, 400);
    this.height = defaultValue(options.height, 300);
    this.horizontalPadding = defaultValue(options.horizontalPadding, 30);
    this.verticalPadding = defaultValue(options.verticalPadding, 30);
    this.maxWidth = this.width;
    this.maxHeight = this.height;

    this.view = require('fs').readFileSync(__dirname + '/../Views/ConfigureLegend.html', 'utf8');

    knockout.track(this, ['message', 'width', 'height', 'maxWidth', 'maxHeight']);
};

inherit(PopupViewModel, ConfigureLegendViewModel);

ConfigureLegendViewModel.prototype.show = function(container) {
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

ConfigureLegendViewModel.prototype.save = function() {
    this.catalogItem.csvDataset.updateFunction(this.catalogItem.tableStyle.regionVariable);
};

ConfigureLegendViewModel.open = function(container, options) {
    var viewModel = new ConfigureLegendViewModel(options);
    viewModel.show(container);
    return viewModel;
};

module.exports = ConfigureLegendViewModel;
