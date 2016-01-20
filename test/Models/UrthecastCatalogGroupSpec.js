'use strict';

/*global require,describe,beforeEach,it,afterEach,expect*/
var Terria = require('../../lib/Models/Terria');
var UrthecastCatalogGroup = require('../../lib/Models/UrthecastCatalogGroup');
var sinon = require('sinon');

describe('UrthecastCatalogGroup', function() {
    var terria;
    var group;
    var requests = [];
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

        this.xhr = sinon.useFakeXMLHttpRequest();
        this.xhr.onCreate = function (xhr) {
            requests.push(xhr);
        };
    });

    afterEach(function() {
        this.xhr.restore();
    });

    it('creates hierarchy of catalog items', function(done) {
        terria.configParameters.urthecastApiKey = 111;
        terria.configParameters.urthecastApiSecret = 111;
        group = new UrthecastCatalogGroup(terria);

        group._load();
        requests[0].respond(200, { "Content-Type": "application/json" }, JSON.stringify(sensorPlatformResponse));

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
