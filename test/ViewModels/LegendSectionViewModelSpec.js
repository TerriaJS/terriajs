'use strict';

/*global require,describe,it,expect,beforeEach*/
var LegendSectionViewModel = require('../../lib/ViewModels/LegendSectionViewModel');
var Terria = require('../../lib/Models/Terria');
var CatalogItem = require('../../lib/Models/CatalogItem');
var CompositeCatalogItem = require('../../lib/Models/CompositeCatalogItem');
var LegendUrl = require('../../lib/Map/LegendUrl');

describe('LegendSectionViewModel', function() {
    var terria, catalogItem;
    var legendSectionViewModel;

    beforeEach(function() {
        terria = new Terria({
            baseUrl: './'
        });
        delete terria.corsProxy;
        catalogItem = new CatalogItem(terria);
    });

    function initSingle(url, mimeType) {
        catalogItem.legendUrl = new LegendUrl(url, mimeType);
        legendSectionViewModel = new LegendSectionViewModel({}, catalogItem);
    }

    describe('createForCatalogMember', function() {
        it('returns undefined if CatalogGroup has no legendUrls', function() {
            expect(LegendSectionViewModel.createForCatalogMember(undefined, catalogItem)).toBeUndefined();
        });

        it('returns a LegendSectionViewModel if CatalogGroup has legendUrls', function() {
            catalogItem.legendUrl = new LegendUrl('http://example.com');

            expect(LegendSectionViewModel.createForCatalogMember(undefined, catalogItem)).not.toBeUndefined();
        });
    });

    describe('for a single legend', function() {
        beforeEach(function() {
            initSingle('http://example.com/legend', 'image/png');
        });

        it('correctly passes the url', function() {
            expect(legendSectionViewModel.proxiedLegendUrls[0].url).toBe('http://example.com/legend');
        });

        it('correctly passes that the url is an image', function() {
            expect(legendSectionViewModel.proxiedLegendUrls[0].isImage).toBe(true);
        });

        it('correctly passes that the url is not an image', function() {
            initSingle('http://example.com/legend', 'text/html');
            expect(legendSectionViewModel.proxiedLegendUrls[0].isImage).toBe(false);
        });

        it('correctly reflects an image error', function() {
            expect(legendSectionViewModel.proxiedLegendUrls[0].imageHasError).toBe(false);

            legendSectionViewModel.proxiedLegendUrls[0].onImageError();

            expect(legendSectionViewModel.proxiedLegendUrls[0].imageHasError).toBe(true);
        });
    });

    describe('for multiple legends', function() {
        var compCatalogItem;

        beforeEach(function() {
            var catalogItem1 = new CatalogItem(terria);
            catalogItem1.legendUrls = [
                new LegendUrl('http://example.com/legend1'),
                new LegendUrl('http://example.com/legend2')
            ];

            var catalogItem2 = new CatalogItem(terria);
            catalogItem2.legendUrls = [
                new LegendUrl('http://example.com/legend3')
            ];

            compCatalogItem = new CompositeCatalogItem(terria, [catalogItem1, catalogItem2]);

            legendSectionViewModel = new LegendSectionViewModel({}, compCatalogItem);
        });

        it('shows all urls correctly', function() {
            expect(legendSectionViewModel.proxiedLegendUrls[0].url).toBe('http://example.com/legend1');
            expect(legendSectionViewModel.proxiedLegendUrls[1].url).toBe('http://example.com/legend2');
            expect(legendSectionViewModel.proxiedLegendUrls[2].url).toBe('http://example.com/legend3');
        });

        it('correctly handles an error event on a single legend', function() {
            legendSectionViewModel.proxiedLegendUrls[1].onImageError();

            expect(legendSectionViewModel.proxiedLegendUrls[0].imageHasError).toBe(false);
            expect(legendSectionViewModel.proxiedLegendUrls[1].imageHasError).toBe(true);
            expect(legendSectionViewModel.proxiedLegendUrls[2].imageHasError).toBe(false);
        });
    });

    it('should generate urls with catalog item proxy', function() {
        terria.corsProxy = {
            shouldUseProxy: function() { return true; },
            getURL: function() { return 'http://proxy/example.com'; }
        };

        initSingle('http://notproxy/example.com');

        expect(legendSectionViewModel.proxiedLegendUrls[0].url).toBe('http://proxy/example.com');
    });

    it('should handle no legends as !proxiedLegendUrls', function() {
        legendSectionViewModel = new LegendSectionViewModel({}, catalogItem);

        expect(legendSectionViewModel.proxiedLegendUrls).toBeFalsy();
    });
});
