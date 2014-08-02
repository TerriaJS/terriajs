'use strict';

/*global require,describe,it,expect*/

var GeoDataItemViewModel = require('../../src/DataCollections/GeoDataItemViewModel');
var GeoDataGroupViewModel = require('../../src/DataCollections/GeoDataGroupViewModel');

describe('GeoDataCatalogViewModel', function() {
    it('foo', function() {
        var foo = new GeoDataGroupViewModel();
        expect(foo.isGroup).toBe(true);

        var bar = new GeoDataItemViewModel();
        expect(bar.isGroup).toBe(false);
    });
});