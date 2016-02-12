'use strict';

/*global require*/
var CkanCatalogItem = require('../../lib/Models/CkanCatalogItem');
var loadText = require('terriajs-cesium/Source/Core/loadText');
var sinon = require('sinon');
var Terria = require('../../lib/Models/Terria');
var TerriaError = require('../../lib/Core/TerriaError');
var URI = require('urijs');
var WebMapServiceCatalogItem = require('../../lib/Models/WebMapServiceCatalogItem');
var when = require('terriajs-cesium/Source/ThirdParty/when');

describe('CkanCatalogItem', function() {
    var terria;
    var ckan;
    var taxationStatisticsPackage;
    var taxationStatisticsWmsResource;
    var fakeServer;

    beforeEach(function(done) {
        terria = new Terria({
            baseUrl: './'
        });
        ckan = new CkanCatalogItem(terria);

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

        var toLoad = [
            loadText('test/CKAN/taxation-statistics-package.json').then(function(text) {
                taxationStatisticsPackage = text;
            }),
            loadText('test/CKAN/taxation-statistics-wms-resource.json').then(function(text) {
                taxationStatisticsWmsResource = text;
            })
        ];

        when.all(toLoad).then(done).otherwise(done.fail);
    });

    afterEach(function() {
        fakeServer.xhr.filters.length = 0;
        fakeServer.restore();
    });

    it('creates a WMS catalog item when given a datasetId', function(done) {
        ckan.url = 'http://example.com';
        ckan.datasetId = 'taxation-statistics-2011-12';

        fakeServer.respondWith(
            'GET',
            'http://example.com/api/3/action/package_show?id=taxation-statistics-2011-12',
            taxationStatisticsPackage);

        ckan.load().then(function() {
            expect(ckan.nowViewingCatalogItem instanceof WebMapServiceCatalogItem).toBe(true);
            expect(ckan.nowViewingCatalogItem.url).toBe('http://data.gov.au/geoserver/taxation-statistics-2011-12/wms');
            expect(ckan.nowViewingCatalogItem.layers).toBe('95d9e550_8b36_4273_8df7_2b76c140e73a');
        }).then(done).otherwise(done.fail);
    });

    it('creates a WMS catalog item when given a resourceId', function(done) {
        ckan.url = 'http://example.com';
        ckan.resourceId = '205ef0d1-521b-4e3c-a26c-4e49e00f1a05';

        fakeServer.respondWith(
            'GET',
            'http://example.com/api/3/action/resource_show?id=205ef0d1-521b-4e3c-a26c-4e49e00f1a05',
            taxationStatisticsWmsResource);

        fakeServer.respondWith(
            'GET',
            'http://example.com/api/3/action/package_show?id=95d9e550-8b36-4273-8df7-2b76c140e73a',
            taxationStatisticsPackage);

        ckan.load().then(function() {
            expect(ckan.nowViewingCatalogItem instanceof WebMapServiceCatalogItem).toBe(true);
            expect(ckan.nowViewingCatalogItem.url).toBe('http://data.gov.au/geoserver/taxation-statistics-2011-12/wms');
            expect(ckan.nowViewingCatalogItem.layers).toBe('95d9e550_8b36_4273_8df7_2b76c140e73a');
        }).then(done).otherwise(done.fail);
    });

    it('creates a WMS catalog item when given both datasetId and resourceId', function(done) {
        ckan.url = 'http://example.com';
        ckan.datasetId = 'taxation-statistics-2011-12';
        ckan.resourceId = '205ef0d1-521b-4e3c-a26c-4e49e00f1a05';

        fakeServer.respondWith(
            'GET',
            'http://example.com/api/3/action/package_show?id=taxation-statistics-2011-12',
            taxationStatisticsPackage);

        ckan.load().then(function() {
            expect(ckan.nowViewingCatalogItem instanceof WebMapServiceCatalogItem).toBe(true);
            expect(ckan.nowViewingCatalogItem.url).toBe('http://data.gov.au/geoserver/taxation-statistics-2011-12/wms');
            expect(ckan.nowViewingCatalogItem.layers).toBe('95d9e550_8b36_4273_8df7_2b76c140e73a');
        }).then(done).otherwise(done.fail);
    });

    it('picks a compatible resource when given an invalid resourceId', function(done) {
        ckan.url = 'http://example.com';
        ckan.datasetId = 'taxation-statistics-2011-12';
        ckan.resourceId = 'invalid!!';

        fakeServer.respondWith(
            'GET',
            'http://example.com/api/3/action/package_show?id=taxation-statistics-2011-12',
            taxationStatisticsPackage);

        ckan.load().then(function() {
            expect(ckan.nowViewingCatalogItem instanceof WebMapServiceCatalogItem).toBe(true);
            expect(ckan.nowViewingCatalogItem.url).toBe('http://data.gov.au/geoserver/taxation-statistics-2011-12/wms');
            expect(ckan.nowViewingCatalogItem.layers).toBe('95d9e550_8b36_4273_8df7_2b76c140e73a');
        }).then(done).otherwise(done.fail);
    });

    it('raises an error when given an invalid resourceId and allowAnyResourceIfResourceIdNotFound is false', function(done) {
        ckan.url = 'http://example.com';
        ckan.datasetId = 'taxation-statistics-2011-12';
        ckan.resourceId = 'invalid!!';
        ckan.allowAnyResourceIfResourceIdNotFound = false;

        fakeServer.respondWith(
            'GET',
            'http://example.com/api/3/action/package_show?id=taxation-statistics-2011-12',
            taxationStatisticsPackage);

        ckan.load().then(done.fail).otherwise(function(e) {
            expect(e instanceof TerriaError).toBe(true);
            done();
        });
    });
});
