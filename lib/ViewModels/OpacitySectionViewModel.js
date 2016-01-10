'use strict';

/*global require*/
var defined = require('terriajs-cesium/Source/Core/defined');
var loadView = require('../Core/loadView');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');

var OpacitySectionViewModel = function(nowViewingTab, catalogMember) {
    this.nowViewingTab = nowViewingTab;
    this.catalogMember = catalogMember;

    this.opacityChoices = knockout.observableArray([0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]);
};

OpacitySectionViewModel.createForCatalogMember = function(nowViewingTab, catalogMember) {
    if (!defined(catalogMember.supportsOpacity) || !catalogMember.supportsOpacity) {
        return undefined;
    }

    return new OpacitySectionViewModel(nowViewingTab, catalogMember);
};

OpacitySectionViewModel.prototype.show = function(container) {
    loadView(require('fs').readFileSync(__dirname + '/../Views/OpacitySection.html', 'utf8'), container, this);
};

module.exports = OpacitySectionViewModel;
