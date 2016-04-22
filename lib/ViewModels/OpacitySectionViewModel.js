'use strict';

/*global require*/
var defined = require('terriajs-cesium/Source/Core/defined');
var loadView = require('../Core/loadView');

var OpacitySectionViewModel = function(nowViewingTab, catalogMember) {
    this.nowViewingTab = nowViewingTab;
    this.catalogMember = catalogMember;
};

OpacitySectionViewModel.createForCatalogMember = function(nowViewingTab, catalogMember) {
    if (!defined(catalogMember.supportsOpacity) || !catalogMember.supportsOpacity) {
        return undefined;
    }

    return new OpacitySectionViewModel(nowViewingTab, catalogMember);
};

OpacitySectionViewModel.prototype.show = function(container) {
    loadView(require('../Views/OpacitySection.html'), container, this);
};

module.exports = OpacitySectionViewModel;
