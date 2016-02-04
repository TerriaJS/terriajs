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
                this.catalogMember.legendUrls.map(function(legend) {
                    var viewModelLegend = {
                        url: proxyCatalogItemUrl(this.catalogMember, legend.url),
                        isImage: legend.isImage(),
                        imageHasError: false,
                        onImageError: onImageError,
                        insertDirectly: !!legend.svgContent,
                        svgContent: legend.svgContent
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
    loadView(require('fs').readFileSync(__dirname + '/../Views/LegendSection.html', 'utf8'), container, this);
};

module.exports = LegendSectionViewModel;
