'use strict';

/*global require*/
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defined = require('terriajs-cesium/Source/Core/defined');
var destroyObject = require('terriajs-cesium/Source/Core/destroyObject');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var getElement = require('terriajs-cesium/Source/Widgets/getElement');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');

var combineData = require('../Core/combineData');
var loadView = require('../Core/loadView');
var removeView = require('../Core/removeView');
var ChartViewModel = require('./ChartViewModel');
var VarType = require('../Map/VarType');

var chartPanelheight = 360;
var headerHeight= 30;
var padding = 15;

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
    this.isLoading = false;
    // this.charts = [];
    this.title = defaultValue(options.title, 'Charts');
    this.width = 0;
    this.height = chartPanelheight;
    this.headerHeight = headerHeight;
    this.padding = padding;

    knockout.track(this, ['isLoading', 'isVisible', 'charts', 'title', 'width']);

    this._domNodes = loadView(require('fs').readFileSync(__dirname + '/../Views/ChartPanel.html', 'utf8'), container, this);

    var that = this;
    function updateMaxDimensions() {
        that.width = that._domNodes[0].clientWidth;
    }

    updateMaxDimensions();

    knockout.getObservable(this, 'isVisible').subscribe(function(isVisible) {
        var container = this.terria.currentViewer.getContainer();
        container.style.bottom = (isVisible ? this.height : 0) + 'px';
        this.terria.currentViewer.notifyRepaintRequired();
    }, this);

    window.addEventListener('resize', function() {
        updateMaxDimensions();
    }, false);

    this.charts = knockout.computed(function() {
        // note this can get triggered in the middle of DataCatalogItem.load, after xColumn is set but before yColumns is set.
        var chartableItems = this.terria.catalog.chartableItems;
        var dataPairArrays = [];
        var colors = [];
        for (var i = chartableItems.length - 1; i >= 0; i--) {
            var item = chartableItems[i];
            if (item.isEnabled && defined(item.tableStructure)) {
                var xColumn = item.timeColumn;
                var yColumns = item.tableStructure.columnsByType[VarType.SCALAR].filter(function(column) { return column.isActive; });
                if (defined(xColumn)) {
                    for (var j = 0; j < yColumns.length; j++) {
                        dataPairArrays.push(zip(xColumn.dates, yColumns[j].values));
                        colors.push(yColumns[j].assignedColor);
                    }
                }
            }
        }
        this.isLoading = (chartableItems.length > 0) && (chartableItems[chartableItems.length - 1].isLoading);
        // console.log('found these variables to chart:', yVariables);
        this.isVisible = (dataPairArrays.length > 0) || this.isLoading;
        if (dataPairArrays.length > 0) {
            return [
                new ChartViewModel(this, this, combineData(dataPairArrays), {
                    showRangeSelector: true,
                    canDownload: true,
                    height: this.height - this.headerHeight - this.padding * 2,
                    colors: defined(colors[0]) ? colors : undefined
                })
            ];
        } else {
            return [];
        }
    }, this);

};


// zip([1, 2, 3], ['a', 'b', 'c']) = [[1, 'a'], [2, 'b'], [3, 'c']]
// This simple implementation assumes the arrays have the same length.
// Actually: silently ignores extra elements in arrays beyond the first, and fails if later arrays are shorter.
function zip() {
    var args = [].slice.call(arguments);
    return args[0].map(function(d, i) {
        return args.map(function(array) {
            return array[i];
        });
    });
}

// zipXYs([1, 2, 3], [['a', 'b', 'c'], [5, 6, 7]]) = [[1, 'a', 5], [2, 'b', 6], [3, 'c', 7]]
// function zipXYs(x, ys) {
//     return x.map(function(xValue, i) {
//         return [xValue].concat(ys.map(function(y) {
//             return y[i];
//         }));
//     });
// }


/**
 * Opens (shows) this panel by changing its isVisible property.
 */
ChartPanelViewModel.prototype.open = function() {
    this.isVisible = true;

};

/**
 * Closes (hides) this panel by changing its isVisible property.
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
// ChartPanelViewModel.prototype.resetCharts = function() {
//     this.charts = [];
// };

/**
 * Adds a chart to the chart panel.
 * @param {ChartViewModel} chartViewModel
 */
// ChartPanelViewModel.prototype.addChart = function(chartViewModel) {
//     // TODO: temp - only show one chart at a time
//     this.charts = [];
//     this.charts.push(chartViewModel);
// };

/**
 * Creates a new instance of this panel via the constructor.
 * @param {Object} options An object as per the constructor.
 */
ChartPanelViewModel.create = function(options) {
    return new ChartPanelViewModel(options);
};


module.exports = ChartPanelViewModel;
