'use strict';

/*global require*/
var loadView = require('../Core/loadView');
var svgCheckboxChecked = require('../SvgPaths/svgCheckboxChecked');
var svgCheckboxUnchecked = require('../SvgPaths/svgCheckboxUnchecked');

var AbsPercentageSectionViewModel = function(nowViewingTab, catalogMember) {
    this.catalogMember = catalogMember;
    this.svgCheckboxChecked = svgCheckboxChecked;
    this.svgCheckboxUnchecked = svgCheckboxUnchecked;
};

AbsPercentageSectionViewModel.createForCatalogMember = function(nowViewingTab, catalogMember) {
    if (catalogMember.type !== 'abs-itt') {
        return undefined;
    }

    return new AbsPercentageSectionViewModel(nowViewingTab, catalogMember);
};

AbsPercentageSectionViewModel.prototype.show = function(container) {
    loadView(require('../Views/AbsPercentageSection.html'), container, this);
};

module.exports = AbsPercentageSectionViewModel;
