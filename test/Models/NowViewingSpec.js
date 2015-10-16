'use strict';

/*global require,describe,it,expect,beforeEach*/
var NowViewing = require('../../lib/Models/NowViewing');
var Terria = require('../../lib/Models/Terria');
var CatalogItem = require('../../lib/Models/CatalogItem');

describe('NowViewing', function() {
    var terria;
    var nowViewing;
    beforeEach(function() {
        terria = new Terria({
            baseUrl: './'
        });
        nowViewing = new NowViewing(terria);
    });

    it('can add an item', function() {
        var item = new CatalogItem(terria);
        expect(nowViewing.items.length).toEqual(0);
        nowViewing.add(item);
        expect(nowViewing.items.length).toEqual(1);
    });

});