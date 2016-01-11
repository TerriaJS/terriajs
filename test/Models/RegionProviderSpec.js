'use strict';

/*global require,describe,it,expect,beforeEach,fail*/

var Terria = require('../../lib/Models/Terria');
var RegionProviderList = require('../../lib/Map/RegionProviderList');
var RegionProvider = require('../../lib/Map/RegionProvider');

describe('RegionProvider', function() {

    var terria;
    var regionProviderList;
    var regionProvider;

    beforeEach(function() {
            terria = new Terria({
                baseUrl: './',
                regionMappingDefinitionsUrl: 'test/csv/regionMapping.json'
            });
            regionProviderList = new RegionProviderList(terria);
            regionProvider = new RegionProvider('CED');
    });

    it('gets the correct region indices', function() {
        regionProvider.regions = ['NSW', 'Vic', 'Qld', 'WA'];
        var regionValues = ['Vic', 'Qld', 'NSW'];
        var target = [1, 2, 0];
        expect(regionProvider.getRegionIndices(regionValues)).toEqual(target);
    });

});

describe('RegionProvider parsing', function() {

    var terria;
    var regionProviderList;
    var regionProvider;

    beforeEach(function() {
            terria = new Terria({
                baseUrl: './',
                regionMappingDefinitionsUrl: 'test/csv/regionMapping.json'
            });
            regionProviderList = new RegionProviderList(terria);
            regionProvider = new RegionProvider('CED', { 
                regionProp: 'CED_CODE', 
                layerName: 'region_map:FID_CED_2011_AUST',
                server: 'http://regionmap-dev.nationalmap.nicta.com.au/region_map/ows'
            });
            console.log('Note - this test requires an internet connection.');
    });

    it('parses WFS xml correctly', function(done) {
        regionProvider.loadRegionIDs().then(function(json) {
            expect(regionProvider.regions.length).toEqual(168);
        }).otherwise(fail).then(done);
    });

});
