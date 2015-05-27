'use strict';

/*global require,describe,it,expect,beforeEach*/
var CatalogGroup = require('../../lib/Models/CatalogGroup');
var createCatalogMemberFromType = require('../../lib/Models/createCatalogMemberFromType');
var Terria = require('../../lib/Models/Terria');

describe('CatalogGroup', function() {
    var terria;
    var group;
    beforeEach(function() {
        terria = new Terria({
            baseUrl: './'
        });
        group = new CatalogGroup(terria);
        createCatalogMemberFromType.register('group', CatalogGroup);
    });

    it('sorts on load by default', function(done) {
        group.updateFromJson({
            type: 'group',
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
            expect(group.items.length).toBe(2);
            expect(group.items[0].name).toBe('A');
            expect(group.items[1].name).toBe('B');
            done();
        });
    });

    it('does not sort on load if preserveOrder is true', function(done) {
        group.updateFromJson({
            type: 'group',
            preserveOrder: true,
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
            expect(group.items.length).toBe(2);
            expect(group.items[0].name).toBe('B');
            expect(group.items[1].name).toBe('A');
            done();
        });
    });

    it('puts isPromoted items at the top when sorting', function(done) {
        group.updateFromJson({
            type: 'group',
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
                },
                {
                    name: 'C',
                    isPromoted: true,
                    type: 'group',
                    url: 'http://not.valid.either'
                }
            ]
        }).then(function() {
            expect(group.items.length).toBe(3);
            expect(group.items[0].name).toBe('C');
            expect(group.items[1].name).toBe('A');
            expect(group.items[2].name).toBe('B');
            done();
        });
    });

    it('puts isPromoted items at the top when preserving order', function(done) {
        group.updateFromJson({
            type: 'group',
            preserveOrder: true,
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
                },
                {
                    name: 'C',
                    isPromoted: true,
                    type: 'group',
                    url: 'http://not.valid.either'
                }
            ]
        }).then(function() {
            expect(group.items.length).toBe(3);
            expect(group.items[0].name).toBe('C');
            expect(group.items[1].name).toBe('B');
            expect(group.items[2].name).toBe('A');
            done();
        });
    });
});