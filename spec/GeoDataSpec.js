var GeoData = require('../src/GeoData');

describe('GeoData', function() {
    it('can be constructed', function() {
        var geoData = new GeoData({});
        expect(geoData).toBeDefined();
    });
});
