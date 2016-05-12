'use strict';

/*global require*/
var CesiumTerrainCatalogItem = require('../../lib/Models/CesiumTerrainCatalogItem');
var CesiumTerrainProvider = require('terriajs-cesium/Source/Core/CesiumTerrainProvider');
var Terria = require('../../lib/Models/Terria');

describe('CesiumTerrainCatalogItem', function() {
    var terria;
    var item;

    beforeEach(function() {
        terria = new Terria({
            baseUrl: './'
        });
        item = new CesiumTerrainCatalogItem(terria);
    });

    it('has correct type', function() {
        expect(item.type).toBe('cesium-terrain');
        expect(item.typeName).toContain('Cesium');
    });

    it('creates imagery provider with correct URL', function() {
        item.url = 'http://example.com/foo/bar';
        var terrainProvider = item._createTerrainProvider();
        expect(terrainProvider instanceof CesiumTerrainProvider).toBe(true);
        expect(terrainProvider._url).toBe('http://example.com/foo/bar');
    });
});
