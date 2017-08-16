'use strict';

/*global require,describe,beforeEach,it,afterEach,expect*/
var Terria = require('../../lib/Models/Terria');
var OpenStreetMapCatalogItem = require('../../lib/Models/OpenStreetMapCatalogItem');

describe('OpenStreetMapCatalogItem', function() {
    var terria;
    var item;
    beforeEach(function() {
        terria = new Terria({
            baseUrl: './'
        });
        item = new OpenStreetMapCatalogItem(terria);
    });

    it('can create an imagery provider with subdomains', function() {
        item.name = 'Positron (Light)';
        item.url = '//global.ssl.fastly.net/light_all/';
        item.attribution = '© OpenStreetMap contributors ODbL, © CartoDB CC-BY 3.0';

        item.opacity = 1.0;
        item.subdomains = ['cartodb-basemaps-a','cartodb-basemaps-b','cartodb-basemaps-c','cartodb-basemaps-d'];

        var imageryProvider = item._createImageryProvider();
        expect(imageryProvider.url).toContain('{s}');
    });
});
