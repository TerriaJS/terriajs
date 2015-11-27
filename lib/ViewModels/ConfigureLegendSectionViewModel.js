'use strict';

/*global require*/
var ConfigureLegendViewModel = require('./ConfigureLegendViewModel');
var defined = require('terriajs-cesium/Source/Core/defined');
var loadView = require('../Core/loadView');
var proxyCatalogItemUrl = require('../Models/proxyCatalogItemUrl');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');

var ConfigureLegendSectionViewModel = function(nowViewingTab, catalogMember) {
    this.nowViewingTab = nowViewingTab;
    this.catalogMember = catalogMember;

    knockout.defineProperty(this, 'proxiedLegendUrls', {
        get: function() {
            return this.catalogMember.legendUrls.map(function(legendUrl) { // Proxy each legend Url
                return proxyCatalogItemUrl(this, legendUrl);
            }, this);
        }
    });
};

ConfigureLegendSectionViewModel.createForCatalogMember = function(nowViewingTab, catalogMember) {
    if (!defined(catalogMember.tableStyle) || catalogMember.disableUserChanges) {
        return undefined;
    }

    return new ConfigureLegendSectionViewModel(nowViewingTab, catalogMember);
};

ConfigureLegendSectionViewModel.prototype.show = function(container) {
    loadView(require('fs').readFileSync(__dirname + '/../Views/ConfigureLegendSection.html', 'utf8'), container, this);
};

ConfigureLegendSectionViewModel.prototype.configureLegendSection = function() {
    ConfigureLegendViewModel.open('ui', {
        catalogItem: this.catalogMember
    });
};

module.exports = ConfigureLegendSectionViewModel;
