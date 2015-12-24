'use strict';

/*global require,describe,it,expect,beforeEach,fail*/
var CatalogItem = require('../../lib/Models/CatalogItem');
var NominatimSearchProviderViewModel = require('../../lib/ViewModels/NominatimSearchProviderViewModel');
var Terria = require('../../lib/Models/Terria');
var sinon = require('sinon');
var URI = require('urijs');

describe('NominatimSearchProviderViewModel', function() {
    var terria;
    var searchProvider;
    var fakeServer;

    beforeEach(function() {
        sinon.xhr.supportsCORS = true; // force Sinon to use XMLHttpRequest even on IE9
        fakeServer = sinon.fakeServer.create();
        fakeServer.autoRespond = true;

        fakeServer.xhr.useFilters = true;
        fakeServer.xhr.addFilter(function(method, url, async, username, password) {
            // Allow requests for local files.
            var uri = new URI(url);
            var protocol = uri.protocol();
            return !protocol && url.indexOf('//') !== 0;
        });

        fakeServer.respond(function(request) {
            fail('Unhandled request to URL: ' + request.url);
        });

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
        fakeServer.restore();
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
