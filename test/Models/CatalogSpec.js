'use strict';

/*global require,describe,it,expect,beforeEach*/
var Terria = require('../../lib/Models/Terria');
var loadJson = require('terriajs-cesium/Source/Core/loadJson');

var Catalog = require('../../lib/Models/Catalog');
var CatalogItem = require('../../lib/Models/CatalogItem');
var createCatalogMemberFromType = require('../../lib/Models/createCatalogMemberFromType');
var CatalogGroup = require('../../lib/Models/CatalogGroup');
var GeoJsonCatalogItem = require('../../lib/Models/GeoJsonCatalogItem');


describe('Catalog', function() {
    var terria;

    beforeEach(function() {
        terria = new Terria({
            baseUrl: './'
        });
        createCatalogMemberFromType.register('group', CatalogGroup);
        createCatalogMemberFromType.register('item', CatalogItem);
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

    describe('enableByShareKeys', function () {
        var catalog;

        beforeEach(function() {
            catalog = terria.catalog;
        });

        it('works when resolving by id', function (done) {
            catalog.updateFromJson([
                {
                    name: 'A',
                    type: 'group',
                    items: [
                        {
                            id: 'C',
                            name: 'C',
                            type: 'item',
                            isEnabled: false
                        }
                    ]
                },
                {
                    name: 'B',
                    type: 'group'
                }
            ]).then(function() {
                expect(catalog.group.items[0].items[0].isEnabled).toBe(false);
                expect(catalog.group.items[0].isOpen).toBeFalsy();
                expect(catalog.group.isOpen).toBeFalsy();

                return catalog.enableByShareKeys(['C']);
            }).then(function () {
                expect(catalog.group.items[0].items[0].isEnabled).toBe(true);
                expect(catalog.group.items[0].isOpen).toBeTruthy();
                expect(catalog.group.isOpen).toBeTruthy();
                done();
            }).otherwise(fail);
        });

        it('works when resolving by shareKeys', function (done) {
            catalog.updateFromJson([
                {
                    name: 'A',
                    type: 'group',
                    items: [
                        {
                            id: 'blah',
                            shareKeys: ['C'],
                            name: 'C',
                            type: 'item',
                            isEnabled: false
                        }
                    ]
                },
                {
                    name: 'B',
                    type: 'group'
                }
            ]).then(function() {
                expect(catalog.group.items[0].items[0].isEnabled).toBe(false);
                expect(catalog.group.items[0].isOpen).toBeFalsy();
                expect(catalog.group.isOpen).toBeFalsy();

                return catalog.enableByShareKeys(['C']);
            }).then(function () {
                expect(catalog.group.items[0].items[0].isEnabled).toBe(true);
                expect(catalog.group.items[0].isOpen).toBeTruthy();
                expect(catalog.group.isOpen).toBeTruthy();
                done();
            }).otherwise(fail);
        });

        it('opens parent groups', function (done) {
            catalog.updateFromJson([
                {
                    name: 'A',
                    type: 'group',
                    items: [
                        {
                            id: 'C',
                            name: 'C',
                            type: 'item'
                        }
                    ]
                },
                {
                    name: 'B',
                    type: 'group'
                }
            ]).then(function() {
                return catalog.enableByShareKeys(['C']);
            }).then(function () {
                expect(catalog.group.items[0].isOpen).toBe(true);
                expect(catalog.group.isOpen).toBe(true);
                done();
            }).otherwise(fail);
        });

        it('works for multiple share keys', function (done) {
            catalog.updateFromJson([
                {
                    name: 'A',
                    type: 'group',
                    items: [
                        {
                            id: 'C',
                            name: 'C',
                            type: 'item',
                        }
                    ]
                },
                {
                    name: 'B',
                    type: 'group',
                    items: [
                        {
                            id: 'D',
                            name: 'D',
                            type: 'item'
                        }
                    ]
                }
            ]).then(function() {
                return catalog.enableByShareKeys(['C', 'D']);
            }).then(function () {
                expect(catalog.group.items[0].items[0].isEnabled).toBe(true);
                expect(catalog.group.items[1].items[0].isEnabled).toBe(true);
                done();
            }).otherwise(fail);
        });

        it('only enabled a catalog member after all those before it have finished loading', function (done) {
            catalog.updateFromJson([
                {
                    name: 'A',
                    type: 'group'
                }
            ]).then(function() {
                expect(catalog.group.items[0].items.length).toBe(0);

                spyOn(catalog.group.items[0], 'load').and.returnValue(catalog.group.items[0].updateFromJson({
                    items: [
                        {
                            id: 'C',
                            name: 'C',
                            type: 'item'
                        }
                    ]
                }));

                return catalog.enableByShareKeys(['Root Group/A', 'C']);
            }).then(function () {
                expect(catalog.group.items[0].items[0].isEnabled).toBe(true);
                done();
            }).otherwise(fail);
        });
    });
});
