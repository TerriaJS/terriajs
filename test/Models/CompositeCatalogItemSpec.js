'use strict';

/*global require,describe,it,expect,beforeEach,fail*/
var CatalogGroup = require('../../lib/Models/CatalogGroup');
var CompositeCatalogItem = require('../../lib/Models/CompositeCatalogItem');
var createCatalogMemberFromType = require('../../lib/Models/createCatalogMemberFromType');
var Terria = require('../../lib/Models/Terria');

describe('CompositeCatalogItem', function() {
    var terria;
    var composite;
    beforeEach(function() {
        terria = new Terria({
            baseUrl: './'
        });
        composite = new CompositeCatalogItem(terria);
        createCatalogMemberFromType.register('composite', CompositeCatalogItem);
        createCatalogMemberFromType.register('group', CatalogGroup);
    });

    it('updates from json, preserving order', function(done) {
        composite.updateFromJson({
            type: 'composite',
            items: [
                {
                    name: 'B',
                    type: 'group',
                    url: 'http://not.valid'
                },
                {
                    name: 'A',
                    type: 'group',
                    url: 'http://not.valid.either'
                }
            ]
        }).then(function() {
            expect(composite.items.length).toBe(2);
            expect(composite.items[0].name).toBe('B');
            expect(composite.items[1].name).toBe('A');
        }).then(done).otherwise(fail);
    });

});
