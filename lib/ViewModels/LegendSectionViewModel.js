'use strict';

/*global require*/
var defined = require('terriajs-cesium/Source/Core/defined');
var loadView = require('../Core/loadView');
var proxyCatalogItemUrl = require('../Models/proxyCatalogItemUrl');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');

var LegendSectionViewModel = function(nowViewingTab, catalogMember) {
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

LegendSectionViewModel.createForCatalogMember = function(nowViewingTab, catalogMember) {
    if (!defined(catalogMember.legendUrls) || catalogMember.legendUrls.length === 0) {
        return undefined;
    }

    return new LegendSectionViewModel(nowViewingTab, catalogMember);
};

LegendSectionViewModel.prototype.show = function(container) {
    loadView(require('fs').readFileSync(__dirname + '/../Views/LegendSection.html', 'utf8'), container, this);
};

var imageUrlRegex = /[.\/](png|jpg|jpeg|gif)/i;

LegendSectionViewModel.prototype.urlIsImage = function(url) {
    if (!defined(url) || url.length === 0) {
        return false;
    }

    return url.match(imageUrlRegex);
};


module.exports = LegendSectionViewModel;
