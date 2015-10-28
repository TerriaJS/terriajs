'use strict';

/*global require*/
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defined = require('terriajs-cesium/Source/Core/defined');
var destroyObject = require('terriajs-cesium/Source/Core/destroyObject');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var getElement = require('terriajs-cesium/Source/Widgets/getElement');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');

var loadView = require('../Core/loadView');
var removeView = require('../Core/removeView');
var ChartViewModel = require('./ChartViewModel');

/**
 * The ViewModel for the Chart display panel.
 *
 * @param {Object} options An object with the following members:
 * @param {Terria} options.terria The terria instance.
 * @param {Element|String} options.container The DOM element or ID that will contain the widget.
*/
var ChartPanelViewModel = function(options) {
    if (!defined(options) || !defined(options.terria)) {
        throw new DeveloperError('options.terria is required.');
    }

    var container = getElement(defaultValue(options.container, document.body));

    this.terria = options.terria;
    this.features = undefined;

    this.isVisible = false;
    this.charts = [];
    this.title = defaultValue(options.title, 'Charts');
    this.horizontalPadding = defaultValue(options.horizontalPadding, 100);
    this.verticalPadding = defaultValue(options.verticalPadding, 100);
    this.width = 0;
    this.maxHeight = 0;

    knockout.track(this, ['isVisible', 'charts', 'title', 'width', 'maxHeight']);

    this._domNodes = loadView(require('fs').readFileSync(__dirname + '/../Views/ChartPanel.html', 'utf8'), container, this);

    knockout.getObservable(this.terria, 'pickedFeatures').subscribe(function() {
        this.open();
        this.addChart(new ChartViewModel(this,
            'http://services.aremi.nicta.com.au/aemo/v4/duidcsv/LKBONNY3',
            {
                title: 'Latest 24hr generation',
                showRangeSelector: true
            }
        ));
    }, this);

    var that = this;

    // TODO: don't like repeating this from feature info panel
    // TODO: not sure if the chart tracking this viewmodel's width property is the best way to do it
    function updateMaxDimensions() {
        that.width = container.clientWidth - that.horizontalPadding;
        that.maxHeight = container.clientHeight - that.verticalPadding;

        if (that.width < 200 || that.maxHeight < 200) {
            // Small screen, allow the feature info panel to cover almost all of it.
            that.width = container.clientWidth - 30;
            that.maxHeight = container.clientHeight - 80;
        }
    }

    updateMaxDimensions();

    window.addEventListener('resize', function() {
        updateMaxDimensions();
    }, false);
};

ChartPanelViewModel.prototype.open = function() {
    this.isVisible = true;
};

ChartPanelViewModel.prototype.close = function() {
    this.isVisible = false;
};

ChartPanelViewModel.prototype.destroy = function() {
    removeView(this._domNodes);
    destroyObject(this);
};

ChartPanelViewModel.prototype.resetCharts = function() {
    this.charts = [];
};

ChartPanelViewModel.prototype.addChart = function(chartViewModel) {
    this.charts.push(chartViewModel);
};

ChartPanelViewModel.create = function(options) {
    return new ChartPanelViewModel(options);
};


module.exports = ChartPanelViewModel;
