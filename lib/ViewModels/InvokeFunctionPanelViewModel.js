'use strict';

/*global require*/
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var destroyObject = require('terriajs-cesium/Source/Core/destroyObject');
var getElement = require('terriajs-cesium/Source/Widgets/getElement');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var loadView = require('../Core/loadView');
var removeView = require('../Core/removeView');

var InvokeFunctionPanelViewModel = function(options) {
    var container = getElement(defaultValue(options.container, document.body));

    this.catalogFunction = options.catalogFunction;
    this.maxWidth = 0;
    this.maxHeight = 0;

    knockout.track(this, ['maxWidth', 'maxHeight']);

    this._domNodes = loadView(require('fs').readFileSync(__dirname + '/../Views/InvokeFunctionPanel.html', 'utf8'), container, this);

    var that = this;

    function updateMaxDimensions() {
        that.maxWidth = container.clientWidth - that.horizontalPadding;
        that.maxHeight = container.clientHeight - that.verticalPadding;

        if (that.maxWidth < 200 || that.maxHeight < 200) {
            // Small screen, allow the feature info panel to cover almost all of it.
            that.maxWidth = container.clientWidth - 30;
            that.maxHeight = container.clientHeight - 80;
        }
    }

    updateMaxDimensions();

    window.addEventListener('resize', function() {
        updateMaxDimensions();
    }, false);
};

InvokeFunctionPanelViewModel.prototype.closeIfClickOnBackground = function(viewModel, e) {
    if (e.target.className === 'modal-background' || e.target.className === 'invoke-function-panel-holder-inner') {
        this.destroy();
    }
    return true;
};

InvokeFunctionPanelViewModel.open = function(options) {
    return new InvokeFunctionPanelViewModel(options);
};

InvokeFunctionPanelViewModel.prototype.destroy = function() {
    removeView(this._domNodes);
    destroyObject(this);
};

module.exports = InvokeFunctionPanelViewModel;
