'use strict';

/*global require*/
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defined = require('terriajs-cesium/Source/Core/defined');
var destroyObject = require('terriajs-cesium/Source/Core/destroyObject');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var getElement = require('terriajs-cesium/Source/Widgets/getElement');
var Entity = require('terriajs-cesium/Source/DataSources/Entity');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var when = require('terriajs-cesium/Source/ThirdParty/when');

var loadView = require('../Core/loadView');
var removeView = require('../Core/removeView');
var ChartViewModel = require('./ChartPanelSectionViewModel');

var ChartPanelViewModel = function(options) {
    if (!defined(options) || !defined(options.terria)) {
        throw new DeveloperError('options.terria is required.');
    }

    var container = getElement(defaultValue(options.container, document.body));

    this.terria = options.terria;
    this.features = undefined;

    this.isVisible = false;
    this.title = defaultValue(options.title, 'Charts');
    this.horizontalPadding = defaultValue(options.horizontalPadding, 100);
    this.verticalPadding = defaultValue(options.verticalPadding, 100);
    this.maxWidth = 0;
    this.maxHeight = 0;

    knockout.track(this, ['isVisible', 'title', 'maxWidth', 'maxHeight']);

    this._domNodes = loadView(require('fs').readFileSync(__dirname + '/../Views/ChartPanel.html', 'utf8'), container, this);

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

ChartPanelViewModel.prototype.close = function() {
    this.isVisible = false;
};

ChartPanelViewModel.prototype.destroy = function() {
    removeView(this._domNodes);
    destroyObject(this);
};


module.exports = ChartPanelViewModel;
