'use strict';

/*global require*/
var defined = require('terriajs-cesium/Source/Core/defined');
var loadView = require('../Core/loadView');
var proxyCatalogItemUrl = require('../Models/proxyCatalogItemUrl');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');

var LegendSectionViewModel = function(nowViewingTab, catalogMember) {
    this.nowViewingTab = nowViewingTab; // This is used by LegendSection.html
    this.catalogMember = catalogMember;

    var onImageError = function() {
        this.imageHasError = true;
    };

    knockout.defineProperty(this, 'proxiedLegendUrls', {
        get: function() {
            return this.catalogMember.legendUrls &&
                this.catalogMember.legendUrls.length &&
                this.catalogMember.legendUrls.map(function(legendUrl) {
                    var viewModelLegend = {
                        url: proxyCatalogItemUrl(this.catalogMember, legendUrl.url),
                        isImage: legendUrl.isImage(),
                        imageHasError: false,
                        onImageError: onImageError,
                        insertDirectly: !!legendUrl.safeSvgContent, // we only insert content we generated ourselves, not arbitrary SVG from init files.
                        safeSvgContent: legendUrl.safeSvgContent
                    };

                    knockout.track(viewModelLegend, ['imageHasError']);

                    return viewModelLegend;
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
    loadView(require('../Views/LegendSection.html'), container, this);
};

module.exports = LegendSectionViewModel;
