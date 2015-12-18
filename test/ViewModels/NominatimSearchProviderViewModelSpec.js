'use strict';

/*global require,describe,it,expect,beforeEach*/
var CatalogItem = require('../../lib/Models/CatalogItem');
var NominatimSearchProviderViewModel = require('../../lib/ViewModels/NominatimSearchProviderViewModel');
var Terria = require('../../lib/Models/Terria');

describe('NominatimSearchProviderViewModel', function() {
    var terria;
    var searchProvider;

    beforeEach(function() {
        terria = new Terria({
            baseUrl: './'
        });

        searchProvider = new NominatimSearchProviderViewModel({
            terria: terria,
        countryCodes: "fr"
        });
    });

    afterEach(function() {
        searchProvider = undefined;
    });

    it('find a simple location', function(done) {
        var catalogGroup = terria.catalog.group;

        var item = new CatalogItem(terria);
        item.name = 'Thing to find';
        catalogGroup.add(item);

        searchProvider.search('la tour du pin').then(function() {
            expect(searchProvider.searchResults.length > 0).toBe(true);
            done();
        });
    });

    it('finds catalog items only located in France', function(done) {
        var catalogGroup = terria.catalog.group;

        var item = new CatalogItem(terria);
        item.name = 'Thing to find';
        catalogGroup.add(item);

        searchProvider.search('place').then(function() {
            expect(searchProvider.searchResults.length > 0).toBe(true);
            for(var i = 0 ; i < searchProvider.searchResults.length; ++i) {
                expect(searchProvider.searchResults[i].name).toContain('France');
            }
            done();
        });
    });

});
