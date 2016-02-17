'use strict';

/*global require*/
var defined = require('terriajs-cesium/Source/Core/defined');
var loadView = require('../Core/loadView');

var ShortReportSectionViewModel = function(nowViewingTab, catalogMember) {
    this.catalogMember = catalogMember;
};

ShortReportSectionViewModel.createForCatalogMember = function(nowViewingTab, catalogMember) {
    if (!defined(catalogMember.shortReport)) {
        return undefined;
    }

    return new ShortReportSectionViewModel(nowViewingTab, catalogMember);
};

ShortReportSectionViewModel.prototype.show = function(container) {
    loadView(require('fs').readFileSync(__dirname + '/../Views/ShortReportSection.html', 'utf8'), container, this);
};

module.exports = ShortReportSectionViewModel;
