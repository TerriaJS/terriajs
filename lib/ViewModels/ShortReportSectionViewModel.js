'use strict';

/*global require*/
var defined = require('terriajs-cesium/Source/Core/defined');
var loadView = require('../Core/loadView');
var svgArrowDown = require('../SvgPaths/svgArrowDown');
var svgArrowRight = require('../SvgPaths/svgArrowRight');

var ShortReportSectionViewModel = function(nowViewingTab, catalogMember) {
    this.catalogMember = catalogMember;

    this.svgArrowDown = svgArrowDown;
    this.svgArrowRight = svgArrowRight;
};

ShortReportSectionViewModel.createForCatalogMember = function(nowViewingTab, catalogMember) {
    if (!defined(catalogMember.shortReport) && !defined(catalogMember.shortReportSections)) {
        return undefined;
    }

    return new ShortReportSectionViewModel(nowViewingTab, catalogMember);
};

ShortReportSectionViewModel.prototype.show = function(container) {
    loadView(require('fs').readFileSync(__dirname + '/../Views/ShortReportSection.html', 'utf8'), container, this);
};

module.exports = ShortReportSectionViewModel;
