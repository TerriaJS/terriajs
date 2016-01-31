'use strict';

/*global require*/
var CatalogItem = require('../../lib/Models/CatalogItem');
var CatalogGroup = require('../../lib/Models/CatalogGroup');
var Catalog = require('../../lib/Models/Catalog');
var Terria = require('../../lib/Models/Terria');
var createCatalogMemberFromType = require('../../lib/Models/createCatalogMemberFromType');

describe('CatalogItem', function () {
    var terria;
    var item;
    beforeEach(function () {
        terria = new Terria({
            baseUrl: './'
        });
        item = new CatalogItem(terria);
        createCatalogMemberFromType.register('group', CatalogGroup);
        createCatalogMemberFromType.register('item', CatalogItem);
    });

    it('uses the url as the direct dataUrl', function () {
        item.url = 'http://foo.bar';

        expect(item.dataUrlType).toBe('direct');
        expect(item.dataUrl).toBe('http://foo.bar');

        item.url = 'http://something.else';
        expect(item.dataUrlType).toBe('direct');
        expect(item.dataUrl).toBe('http://something.else');
    });

    it('explicit dataUrl and dataUrlType overrides using url', function () {
        item.url = 'http://foo.bar';
        item.dataUrl = 'http://something.else';
        item.dataUrlType = 'wfs';

        expect(item.dataUrl).toBe('http://something.else');
        expect(item.dataUrlType).toBe('wfs');

        // Make sure setting the url again doesn't override the explicitly-set dataUrl.
        item.url = 'http://hello.there';
        expect(item.dataUrl).toBe('http://something.else');
        expect(item.dataUrlType).toBe('wfs');
    });

    describe('ids', function () {
        var catalog;

        beforeEach(function (done) {
            catalog = new Catalog(terria);

            catalog.updateFromJson([
                {
                    name: 'Group',
                    type: 'group',
                    items: [
                        {
                            name: 'A',
                            type: 'item'
                        },
                        {
                            name: 'B',
                            id: 'thisIsAnId',
                            type: 'item'
                        },
                        {
                            name: 'C',
                            type: 'item',
                            shareKeys: ['Another/Path']
                        },
                        {
                            name: 'D',
                            id: 'thisIsAnotherId',
                            shareKeys: ['This/Is/A/Path', 'aPreviousId'],
                            type: 'item'
                        }
                    ]
                }
            ]).then(done);
        });

        describe('uniqueId', function () {
            it('should return path if no id is specified', function () {
                expect(catalog.group.items[0].items[0].uniqueId).toBe('Root Group/Group/A');
            });

            it('should return id field if one is specified', function () {
                expect(catalog.group.items[0].items[1].uniqueId).toBe('thisIsAnId');
            });
        });

        describe('allShareKeys', function () {
            it('should return just the path if no id or shareKeys are specified', function() {
                expect(catalog.group.items[0].items[0].allShareKeys).toEqual(['Root Group/Group/A']);
            });

            it('should return just the id if id but no shareKeys are specified', function() {
                expect(catalog.group.items[0].items[1].allShareKeys).toEqual(['thisIsAnId']);
            });

            it('should return the path and shareKeys if no id specified', function() {
                expect(catalog.group.items[0].items[2].allShareKeys).toEqual(['Root Group/Group/C', 'Another/Path']);
            });

            it('should return the id and shareKeys if id specified', function() {
                expect(catalog.group.items[0].items[3].allShareKeys).toEqual(['thisIsAnotherId', 'This/Is/A/Path', 'aPreviousId']);
            });
        });
    });
});
