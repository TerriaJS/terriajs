'use strict';

/*global require*/
var defined = require('terriajs-cesium/Source/Core/defined');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var destroyObject = require('terriajs-cesium/Source/Core/destroyObject');
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var createGuid = require('terriajs-cesium/Source/Core/createGuid');

var loadView = require('../Core/loadView');

var Dygraph = require('dygraphs');

/**
 * A ViewModel of a Chart.
 * Contains a single feature for display within the feature info panel.
 * All references to any third-party charting libraries should be confined to this view model.
 *
 * @param {FeatureInfoPanelViewModel|Object} containerViewModel An object (typically a view model) with a "width" property.
 * @param {String} data The URL of the data (this may change).
 * @param {Object} [options] An object with the following members:
 * @param {Integer} [options.height=300] The chart height in pixels.
 * @param {String} [options.title] The chart title.
*/
var ChartViewModel = function(containerViewModel, data, options) {
    this.containerViewModel = containerViewModel;
    this.data = data;
    this.options = options;
    this.containerId = createGuid();
    knockout.track(this, ['containerId']);
    knockout.track(containerViewModel, ['width']);
    this.chart = undefined;
    this.height = defaultValue(options.height, 300);
    this.width = containerViewModel.width;
    this.minWidth = 350;

    var that = this;
    knockout.getObservable(containerViewModel, 'width').subscribe(function() {
        if (defined(that.chart)) {
            that.chart.resize(Math.max(that.minWidth, that.containerViewModel.width), that.height);
        }
    }, this);

};

/**
 * Shows this panel by adding it to the DOM inside a given container element.
 * @param {DOMNode} container The DOM node to which to add this panel.
 */
ChartViewModel.prototype.show = function(container) {
    loadView(require('fs').readFileSync(__dirname + '/../Views/Chart.html', 'utf8'), container, this);
    this.chart = new Dygraph(
        document.getElementById(this.containerId),
        this.data,
        {
            showRangeSelector: true,
            width: Math.max(this.minWidth, this.containerViewModel.width),
            height: this.height,
            title: this.options.title
        }
      );
};

ChartViewModel.prototype.destroy = function() {
    // TODO: can we delete the data somehow?
    // to be consistent with other destroy methods (probably unnecessary)
    destroyObject(this);
};


module.exports = ChartViewModel;
