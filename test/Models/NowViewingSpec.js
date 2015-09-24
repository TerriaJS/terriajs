'use strict';

/*global require,describe,it,expect,beforeEach*/
var GeoJsonCatalogItem = require('../../lib/Models/GeoJsonCatalogItem');
var forEachCombination = require('foreach-combination');
var NowViewing = require('../../lib/Models/NowViewing');
var Terria = require('../../lib/Models/Terria');
var WebMapServiceCatalogItem = require('../../lib/Models/WebMapServiceCatalogItem');

describe('NowViewing', function() {
    var terria;
    var nowViewing;

    beforeEach(function() {
        terria = new Terria({
            baseUrl: './'
        });
        nowViewing = new NowViewing(terria);
    });

    describe('add', function() {
        it('keeps non-reorderable items above reorderable items', function() {
            var reorderable = new WebMapServiceCatalogItem(terria);
            var nonReorderable = new GeoJsonCatalogItem(terria);

            nowViewing.add(nonReorderable);
            nowViewing.add(reorderable);
            expect(nowViewing.items.indexOf(nonReorderable)).toBe(0);
            expect(nowViewing.items.indexOf(reorderable)).toBe(1);

            nowViewing.removeAll();
            expect(nowViewing.items.length).toBe(0);

            nowViewing.add(reorderable);
            nowViewing.add(nonReorderable);
            expect(nowViewing.items.indexOf(nonReorderable)).toBe(0);
            expect(nowViewing.items.indexOf(reorderable)).toBe(1);
        });

        it('keeps keepOnTop items above other items', function() {
            var items = [
                new WebMapServiceCatalogItem(terria),
                new WebMapServiceCatalogItem(terria)
            ];
            items[0].keepOnTop = true;

            forEachCombination(items, 2, function() {
                nowViewing.removeAll();
                for (var i = 0; i < arguments.length; ++i) {
                    nowViewing.add(arguments[i]);
                }
                expect(nowViewing.items.slice()).toEqual(items);
            });
        });

        it('adds at the specified index', function() {
            nowViewing.add(new WebMapServiceCatalogItem(terria));
            nowViewing.add(new WebMapServiceCatalogItem(terria));

            var atPosition = new WebMapServiceCatalogItem(terria);
            nowViewing.add(atPosition, 1);

            expect(nowViewing.items.length).toBe(3);
            expect(nowViewing.items[0]).not.toBe(atPosition);
            expect(nowViewing.items[1]).toBe(atPosition);
            expect(nowViewing.items[2]).not.toBe(atPosition);
        });

        it('will not add a non-reorderable out of place even when given an index', function() {
            nowViewing.add(new WebMapServiceCatalogItem(terria));
            nowViewing.add(new WebMapServiceCatalogItem(terria));

            var atPosition = new GeoJsonCatalogItem(terria);
            nowViewing.add(atPosition, 1);

            expect(nowViewing.items.length).toBe(3);
            expect(nowViewing.items[0]).toBe(atPosition);
            expect(nowViewing.items[1]).not.toBe(atPosition);
            expect(nowViewing.items[2]).not.toBe(atPosition);
        });

        it('will not add a reorderable out of place even when given an index', function() {
            nowViewing.add(new GeoJsonCatalogItem(terria));
            nowViewing.add(new GeoJsonCatalogItem(terria));

            var atPosition = new WebMapServiceCatalogItem(terria);
            nowViewing.add(atPosition, 1);

            expect(nowViewing.items.length).toBe(3);
            expect(nowViewing.items[0]).not.toBe(atPosition);
            expect(nowViewing.items[1]).not.toBe(atPosition);
            expect(nowViewing.items[2]).toBe(atPosition);
        });
    });
});
