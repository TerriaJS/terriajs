'use strict';

/*global require*/
var Terria = require('../../lib/Models/Terria');
var UrthecastCatalogGroup = require('../../lib/Models/UrthecastCatalogGroup');

describe('UrthecastCatalogGroup', function() {
    var terria;
    var group;
    var sensorPlatformResponse = {
        status: 200,
        messages: [],
        payload: [{
            name: "Landsat 8",
            platform: "landsat-8",
            key: "landsat-8",
        },
        {
            name: "Theia (MRC)",
            platform: "iss",
            key: "theia",
        }]
    };

    beforeEach(function() {
        terria = new Terria({
            baseUrl: './'
        });
    });

    it('creates hierarchy of catalog items', function(done) {
        jasmine.Ajax.install();

        jasmine.Ajax.stubRequest('https://api.urthecast.com/v1/satellite_tracker/sensor_platforms?api_key=111&api_secret=111').andReturn({
            contentType: 'application/json',
            responseText: JSON.stringify(sensorPlatformResponse)
        });

        terria.configParameters.urthecastApiKey = 111;
        terria.configParameters.urthecastApiSecret = 111;
        group = new UrthecastCatalogGroup(terria);

        group._load();

        // Sensor platforms group
        expect(group.items.length).toBe(1);

        // Sensor platforms
        expect(group.items[0].items.length).toBe(2);

        // Map tile service renderers
        var groupItems = group.items[0].items[0].items;
        expect(groupItems.length).toBe(5);
        expect(groupItems[0].name).toContain('True RGB');

        done();
    });

    it('raises an error when no API key or secret is provided', function(done) {
        terria.configParameters.urthecastApiKey = null;
        terria.configParameters.urthecastApiSecret = null;

        group = new UrthecastCatalogGroup(terria);
        group.load().otherwise(function(terriaError) {
            expect(terriaError.title).toBe('Please Provide an Urthecast API Key and Secret');

            done();
        });
    });
});
