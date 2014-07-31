var GeoDataCollection = require('../src/GeoDataCollection');

describe('GeoDataCollection', function() {
    it('can be constructed', function() {
        var geoDataCollection = new GeoDataCollection();
        expect(geoDataCollection).toBeDefined();
    })
});
