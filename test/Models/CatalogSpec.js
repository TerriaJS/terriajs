'use strict';

/*global require,describe,it,expect,beforeEach*/
var Terria = require('../../lib/Models/Terria');
var loadJson = require('terriajs-cesium/Source/Core/loadJson');

var Catalog = require('../../lib/Models/Catalog');
var createCatalogMemberFromType = require('../../lib/Models/createCatalogMemberFromType');
var CatalogGroup = require('../../lib/Models/CatalogGroup');
var GeoJsonCatalogItem = require('../../lib/Models/GeoJsonCatalogItem');


describe('Catalog', function() {
    var terria;

    beforeEach(function() {
        terria = new Terria({
            baseUrl: './'
        });
    });

    it('can register group and geojson, and update from json', function(done) {
        createCatalogMemberFromType.register('group', CatalogGroup);
        createCatalogMemberFromType.register('geojson', GeoJsonCatalogItem);
        loadJson('test/init/geojson-with-template.json').then(function(json) {
            var catalog = new Catalog(terria);
            catalog.updateFromJson(json.catalog).then(function() {
                expect(catalog.group.constructor).toEqual(CatalogGroup);
                expect(catalog.group.items[0].constructor).toEqual(CatalogGroup);
                expect(catalog.group.items[0].items[0].constructor).toEqual(GeoJsonCatalogItem);
                done();
            }).otherwise(done.fail);
        }).otherwise(done.fail);
    });

});