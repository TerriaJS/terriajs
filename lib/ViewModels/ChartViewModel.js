'use strict';

/*global require*/
var defined = require('terriajs-cesium/Source/Core/defined');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var destroyObject = require('terriajs-cesium/Source/Core/destroyObject');
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var createGuid = require('terriajs-cesium/Source/Core/createGuid');
// var Entity = require('terriajs-cesium/Source/DataSources/Entity');
var Dygraph = require('dygraphs');

var readTemplate = require('../Core/readTemplate');
var loadView = require('../Core/loadView');
var svgArrowDown = require('../SvgPaths/svgArrowDown');
var svgArrowRight = require('../SvgPaths/svgArrowRight');

var htmlTagRegex = /(<html(.|\s)*>(.|\s)*<\/html>|<body(.|\s)*>(.|\s)*<\/body>|<meta(.|\s)*>)/im;

/**
 * A ViewModel of a Chart.
 * Contains a single feature for display within the feature info panel.
 *
 * @param {Entity} feature The feature to display.
 * @param {FeatureInfoPanelViewModel|Object} containerViewModel A View Model with a "width" property.
 * @param {Integer} [maxHeight] The maximum height of the section (optional).
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
            height: this.height
        }
      );
};

ChartViewModel.prototype.destroy = function() {
    // TODO: can we delete the data somehow?
    // to be consistent with other destroy methods (probably unnecessary)
    destroyObject(this);
};


module.exports = ChartViewModel;
