'use strict';

/*global require*/
var defined = require('terriajs-cesium/Source/Core/defined');
var loadView = require('../Core/loadView');
var proxyCatalogItemUrl = require('../Models/proxyCatalogItemUrl');

var LegendSectionViewModel = function(catalogMember) {
    this.catalogMember = catalogMember;
};

LegendSectionViewModel.createForCatalogMember = function(catalogMember) {
    if (!defined(catalogMember.legendUrls) || catalogMember.legendUrls.length === 0) {
        return undefined;
    }

    return new LegendSectionViewModel(catalogMember);
};

LegendSectionViewModel.prototype.show = function(container) {
	// Proxy legend Urls (should be in a function that is only called once - could be moved to constructor?)
	
	this.proxiedLegendUrls = this.catalogMember.legendUrls.map(function(legendUrl) { // Proxy each legend Url
		return proxyCatalogItemUrl(this, legendUrl);
	}, this);
	
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
