'use strict';

/*global require*/
var ChartViewModel = require('./ChartViewModel');
var defined = require('terriajs-cesium/Source/Core/defined');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var loadView = require('../Core/loadView');
var svgArrowDown = require('../SvgPaths/svgArrowDown');
var svgArrowRight = require('../SvgPaths/svgArrowRight');

var ChartsSectionViewModel = function(catalogMember) {
    this.catalogMember = catalogMember;

    this.svgArrowDown = svgArrowDown;
    this.svgArrowRight = svgArrowRight;
    this.width = '300';

    knockout.defineProperty(this, 'charts', {
        get: function() {
            var that = this;
            return this.catalogMember.charts.map(function(chart, index) {
                var viewModel = {
                    name: chart.name,
                    description: chart.description,
                    isOpen: index === 0,
                    toggleOpen: function() { this.isOpen = !this.isOpen; },
                    chart: new ChartViewModel(that, chart.data, chart.options)
                };

                knockout.track(viewModel, ['isOpen']);

                return viewModel;
            });
        }
    });
};

ChartsSectionViewModel.createForCatalogMember = function(catalogMember) {
    if (!defined(catalogMember.charts)) {
        return undefined;
    }

    return new ChartsSectionViewModel(catalogMember);
};

ChartsSectionViewModel.prototype.show = function(container) {
    loadView(require('fs').readFileSync(__dirname + '/../Views/ChartsSection.html', 'utf8'), container, this);
};

module.exports = ChartsSectionViewModel;
