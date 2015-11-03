'use strict';

/*global require*/
var defined = require('terriajs-cesium/Source/Core/defined');
var loadView = require('../Core/loadView');

var OpacitySectionViewModel = function(catalogMember) {
    this.catalogMember = catalogMember;
};

OpacitySectionViewModel.createForCatalogMember = function(catalogMember) {
    if (!defined(catalogMember.supportsOpacity) || !catalogMember.supportsOpacity) {
        return undefined;
    }

    return new OpacitySectionViewModel(catalogMember);
};

OpacitySectionViewModel.prototype.show = function(container) {
    loadView(require('fs').readFileSync(__dirname + '/../Views/OpacitySection.html', 'utf8'), container, this);
};

module.exports = OpacitySectionViewModel;
