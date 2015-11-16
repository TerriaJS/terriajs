'use strict';

/*global require*/
var defined = require('terriajs-cesium/Source/Core/defined');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var destroyObject = require('terriajs-cesium/Source/Core/destroyObject');
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var clone = require('terriajs-cesium/Source/Core/clone');

var loadView = require('../Core/loadView');

var Dygraph = require('dygraphs');

var defaultOptions = {
    height: 300,
    paddingRight: 40,
    strokeWidth: 2.0
};

/**
 * A ViewModel of a Chart.
 * Contains a single feature for display within the feature info panel.
 * All references to any third-party charting libraries should be confined to this view model.
 * The width of the chart is set to equal (and track) the width property of the container view model.
 *
 * @param {FeatureInfoPanelViewModel|Object} containerViewModel An object (typically a view model) with a "width" property.
 * @param {String} data The URL of the data (this may change).
 * @param {Object} [options] An object with the following members having a special meaning (but you may pass others for your own reference):
 * @param {Integer} [options.height=300] The chart height in pixels.
 * @param {String} [options.title] The chart title.
 * @param {String} [options.xLabel] The label on the x-axis.
 * @param {String} [options.yLabel] The label on the y-axis.
 * @param {String} [options.y2Label] The label on the second y-axis.
 * @param {Float} [options.strokeWidth] The width of each line.
 * @param {Boolean} [options.showRangeSelector] If true, show the range selector beneath the chart.
*/
var ChartViewModel = function(chartPanelViewModel, containerViewModel, data, options) {
    this.chartPanelViewModel = chartPanelViewModel;
    this.containerViewModel = containerViewModel;
    this.data = data;
    this.options = options;
    this.container = undefined;
    knockout.track(this, ['containerId']);
    knockout.track(containerViewModel, ['width']);
    this.chart = undefined;

    this.height = defaultValue(options.height, defaultOptions.height);
    this.paddingRight = defaultValue(options.paddingRight, defaultOptions.paddingRight);
    this.width = containerViewModel.width;

    this.minWidth = 50;
    this.isLoading = undefined;
    this.canExpand = defaultValue(options.canExpand, false);
    this.canDownload = defaultValue(options.canDownload, false);

    var that = this;
    knockout.track(this, ['isLoading', 'canExpand', 'canDownload']);
    knockout.track(this.options, ['src']);

    knockout.getObservable(containerViewModel, 'width').subscribe(function() {
        if (defined(that.chart)) {
            that.chart.resize(Math.max(that.minWidth, that.containerViewModel.width), that.height);
        }
    }, this);

};

ChartViewModel.prototype.expand = function() {
    var chartPanel = this.chartPanelViewModel;
    if (chartPanel) {
        chartPanel.open();
        var fullOptions = clone(this.options);
        fullOptions.showRangeSelector = true;
        fullOptions.canExpand = false;
        var chartViewModel = new ChartViewModel(chartPanel, chartPanel, fullOptions.src, fullOptions);
        chartPanel.addChart(chartViewModel);
    }
};


//
// This section contains a hack to turn off the z-index behaviour of dygraphs
//
function walkDOM(element, method) {
    method(element);
    for (var node = element.firstChild; node; node = node.nextSibling) {
        if (node.nodeType === 1) {
            walkDOM(node, method);
        }
    }
}

function removeZIndex(element) {
    if (element && element.style.zIndex === '10') { element.style.zIndex = '' }
}

function removeZIndices(chartViewModel) {
    walkDOM(chartViewModel.container, removeZIndex);
}
//
// End of hack
//

function drawCallback(chartViewModel, dygraph, is_initial) {
    if (is_initial) {
        chartViewModel.isLoading = false;
        removeZIndices(chartViewModel);
    }
}

ChartViewModel.prototype.renderChart = function() {
    // this is not the ideal way to find the element with class .chart-inject
    // the first child is the <script> tag, etc
    var chartContainer = this.container.children[1].children[1].children[0];
    this.chart = new Dygraph(
        chartContainer,
        this.data,
        {
            showRangeSelector: this.options.showRangeSelector,
            width: Math.max(this.minWidth, this.containerViewModel.width - this.paddingRight),
            height: this.height,
            title: this.options.title,
            xlabel: this.options.xLabel,
            ylabel: this.options.yLabel,
            y2label: this.options.y2Label,
            strokeWidth: defaultValue(this.options.strokeWidth, defaultOptions.strokeWidth),
            drawCallback: drawCallback.bind(null, this)  // call with current this as first argument, other arguments after
        }
    );
};

/**
 * Shows this panel by adding it to the DOM inside a given container element.
 * @param {DOMNode} container The DOM node to which to add this panel.
 */
ChartViewModel.prototype.show = function(container) {
    this.isLoading = true;
    this.container = container;
    loadView(require('fs').readFileSync(__dirname + '/../Views/Chart.html', 'utf8'), container, this);
};

ChartViewModel.prototype.destroy = function() {
    // To be consistent with other destroy methods (probably unnecessary)
    destroyObject(this);
};


module.exports = ChartViewModel;
