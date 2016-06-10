var when = require('terriajs-cesium/Source/ThirdParty/when');

var Terria = require('../../lib/Models/Terria');
var GNAFSearchProviderViewModel = require('../../lib/ViewModels/GNAFSearchProviderViewModel');
var GNAFApi = require('../../lib/Models/GNAFApi');

var QUERY = 'this is a search';

describe('GNAFSearchProvider', function() {
    var terria;
    var searchProvider;
    var gnafApi, geoCodeDeferred;

    beforeEach(function() {
        terria = new Terria({
            baseUrl: './',
        });
        terria.currentViewer = {
            getBoundingBoxCoords: jasmine.createSpy('getBoundingBoxCoords')
        };

        geoCodeDeferred = when.defer();

        gnafApi = {
            geoCode: jasmine.createSpy('geoCode').and.returnValue(geoCodeDeferred)
        };

        searchProvider = new GNAFSearchProviderViewModel({
            terria: terria,
            gnafApi: gnafApi
        });
    });

    describe('search', function() {
        it('should set isSearching to true when search is in progress', function() {
            searchProvider.search(QUERY);

            expect(searchProvider.isSearching).toBe(true);

            geoCodeDeferred.resolve([]);

            expect(searchProvider.isSearching).toBe(false);
        });

        it('should provide a search message if no hits', function() {
            searchProvider.search(QUERY);

            geoCodeDeferred.resolve([]);

            expect(searchProvider.searchMessage.length).toBeGreaterThan(0);
            expect(searchProvider.searchMessage.toLowerCase().indexOf('error')).toBe(-1);
        });

        it('should provide an error message if there\'s an error', function() {
            searchProvider.search(QUERY);

            geoCodeDeferred.reject();

            expect(searchProvider.searchMessage.length).toBeGreaterThan(0);
            expect(searchProvider.searchMessage.toLowerCase().indexOf('error')).toBeGreaterThan(-1);
        });

        it('should change ', function() {
            searchProvider.search(QUERY);

            geoCodeDeferred.reject();

            expect(searchProvider.searchMessage.length).toBeGreaterThan(0);
            expect(searchProvider.searchMessage.toLowerCase().indexOf('error')).toBeGreaterThan(-1);
        });
    });


});
