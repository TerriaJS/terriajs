'use strict';

/*global require,describe,it,expect,beforeEach,fail*/

var Terria = require('../../lib/Models/Terria');
var RegionProviderList = require('../../lib/Map/RegionProviderList');
var RegionProvider = require('../../lib/Map/RegionProvider');

// This test would be nice, but regionProvider.processRegionIds is no longer exposed in the API.
// We could test it by loading in some json via loadRegionIDs instead.
// 
// describe('RegionProvider', function() {

//     var terria;
//     var regionProviderList;
//     var regionProvider;

//     beforeEach(function() {
//             terria = new Terria({
//                 baseUrl: './',
//                 regionMappingDefinitionsUrl: 'test/csv/regionMapping.json'
//             });
//             regionProviderList = new RegionProviderList(terria);
//             regionProvider = new RegionProvider('CED');
//     });

//     it('gets the correct region indices', function() {
//         var regions = ['NSW', 'Vic', 'Qld', 'WA'];
//         regionProvider.processRegionIds(regions, undefined, '');
//         var regionValues = ['Vic', 'Qld', 'NSW'];
//         var result = regionProvider.mapRegionsToIndicesInto(regionValues);
//         var target = [2, 0, 1, undefined];
//         target.forEach(function(value, i) {
//             expect(result[i]).toEqual(target[i]);
//         });
//     });

// });

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
