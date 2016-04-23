'use strict';

/*global require*/
var defined = require('terriajs-cesium/Source/Core/defined');
var loadView = require('../Core/loadView');
var svgArrowDown = require('../SvgPaths/svgArrowDown');
var svgArrowRight = require('../SvgPaths/svgArrowRight');

var ConceptsSectionViewModel = function(nowViewingTab, catalogMember) {
    this.catalogMember = catalogMember;
    this.svgArrowDown = svgArrowDown;
    this.svgArrowRight = svgArrowRight;
};

ConceptsSectionViewModel.createForCatalogMember = function(nowViewingTab, catalogMember) {
    if (!defined(catalogMember.concepts)) {
        return undefined;
    }

    return new ConceptsSectionViewModel(nowViewingTab, catalogMember);
};

ConceptsSectionViewModel.prototype.show = function(container) {
    loadView(require('../Views/ConceptsSection.html'), container, this);
};

module.exports = ConceptsSectionViewModel;
