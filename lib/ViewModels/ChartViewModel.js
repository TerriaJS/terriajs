'use strict';

/*global require*/
var defined = require('terriajs-cesium/Source/Core/defined');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var destroyObject = require('terriajs-cesium/Source/Core/destroyObject');
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
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
 * @param {Terria} terria Terria instance.
 * @param {Entity} feature The feature to display.
 * @param {Integer} [maxHeight] The maximum height of the section (optional).
*/
var ChartViewModel = function(terria, data, options) {
    this.terria = terria;
};

/**
 * Shows this panel by adding it to the DOM inside a given container element.
 * @param {DOMNode} container The DOM node to which to add this panel.
 */
ChartViewModel.prototype.show = function(container) {
    loadView(require('fs').readFileSync(__dirname + '/../Views/Chart.html', 'utf8'), container, this);
    var g = new Dygraph(
        document.getElementById('graphdiv'),
        'http://services.aremi.nicta.com.au/aemo/v4/duidcsv/LKBONNY3?offset=24h',
        {showRangeSelector: true}
      );

};

ChartViewModel.prototype.destroy = function() {
    // TODO: can we delete the data somehow?
    // to be consistent with other destroy methods (probably unnecessary)
    destroyObject(this);
};


module.exports = ChartViewModel;
