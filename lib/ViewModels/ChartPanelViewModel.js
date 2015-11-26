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

/**
 * The ViewModel for the Chart display panel.
 * @alias ChartPanelViewModel
 * @constructor
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
    this.width = 0;

    knockout.track(this, ['isVisible', 'charts', 'title', 'width']);

    this._domNodes = loadView(require('fs').readFileSync(__dirname + '/../Views/ChartPanel.html', 'utf8'), container, this);

    var that = this;
    function updateMaxDimensions() {
        that.width = container.clientWidth;
    }

    updateMaxDimensions();

    window.addEventListener('resize', function() {
        updateMaxDimensions();
    }, false);

    var chartDataGroup = this.terria.catalog.chartDataGroup;
    var isAnyEnabled = knockout.computed(function() {
        var isAnyEnabled = false;
        for (var i = chartDataGroup.items.length - 1; i >= 0; i--) {
            isAnyEnabled = chartDataGroup.items[i].isEnabled || isAnyEnabled;  // order is important so knockout watches every item
        }
        this.isVisible = isAnyEnabled;
        return isAnyEnabled;
    }, this);

    // knockout.getObservable(this.terria.catalog.chartDataGroup, 'isAnyEnabled').subscribe(function() {
    //     console.log('chartDataGroup isAnyEnabled changed, ChartPanelViewModel noticed.');
    // }, this);

    // knockout.getObservable(this.terria.catalog.chartDataGroup, 'items').subscribe(function() {
    //     console.log('chartDataGroup items changed, ChartPanelViewModel noticed.');
    // }, this);

    // knockout.getObservable(this.terria.catalog.chartDataGroup.items, 'concepts').subscribe(function() {
    //     console.log('chartDataGroup items concepts changed, ChartPanelViewModel noticed.');
    // }, this);

};

/**
 * Shows this panel by changing its isVisible property.
 */
ChartPanelViewModel.prototype.open = function() {
    this.isVisible = true;
};

/**
 * Closes this panel by changing its isVisible property.
 */
ChartPanelViewModel.prototype.close = function() {
    this.isVisible = false;
};

/**
 * Destroys this panel.
 */
ChartPanelViewModel.prototype.destroy = function() {
    removeView(this._domNodes);
    destroyObject(this);
};

/**
 * Removes all charts from the panel.
 */
ChartPanelViewModel.prototype.resetCharts = function() {
    this.charts = [];
};

/**
 * Shows this panel by changing its isVisible property.
 * @param {ChartViewModel} chartViewModel Adds a chart to the chart panel.
 */
ChartPanelViewModel.prototype.addChart = function(chartViewModel) {
    // TODO: temp - only show one chart at a time
    this.charts = [];
    this.charts.push(chartViewModel);
};

/**
 * Closes this panel by changing its isVisible property.
 * @param {Object} options An object as per the constructor.
 */
ChartPanelViewModel.create = function(options) {
    return new ChartPanelViewModel(options);
};


module.exports = ChartPanelViewModel;
