'use strict';

/*global require*/
var defined = require('terriajs-cesium/Source/Core/defined');
var loadView = require('../Core/loadView');

var ReportSectionViewModel = function(catalogMember) {
    this.catalogMember = catalogMember;
};

ReportSectionViewModel.createForCatalogMember = function(catalogMember) {
    if (!defined(catalogMember.shortReport) && !defined(catalogMember.shortReportUrl)) {
        return undefined;
    }

    return new ReportSectionViewModel(catalogMember);
};

ReportSectionViewModel.prototype.show = function(container) {
    loadView(require('fs').readFileSync(__dirname + '/../Views/ReportSection.html', 'utf8'), container, this);
};

module.exports = ReportSectionViewModel;
