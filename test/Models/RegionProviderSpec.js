'use strict';

/*global require,describe,it,expect,beforeEach,fail*/

var RegionProvider = require('../../lib/Map/RegionProvider');
var CorsProxy = require('../../lib/Core/CorsProxy');

// This test would be nice, but regionProvider.processRegionIds is no longer exposed in the API.
// We could test it by loading in some json via loadRegionIDs instead.
//
// describe('RegionProvider indices', function() {

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

describe('RegionProvider', function() {
    var regionProvider;

    beforeEach(function() {
        jasmine.Ajax.install();

        jasmine.Ajax.stubRequest('http://regionmap-dev.nationalmap.nicta.com.au/region_map/ows?service=wfs&version=2.0&request=getPropertyValue&typenames=region_map%3AFID_CED_2011_AUST&valueReference=CED_CODE').andReturn({
            responseText: '<wfs:ValueCollection xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:region_map="http://region_map" xmlns:fes="http://www.opengis.net/fes/2.0" xmlns:wfs="http://www.opengis.net/wfs/2.0" xmlns:ows="http://www.opengis.net/ows/1.1" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.opengis.net/wfs/2.0 http://regionmap-dev.nationalmap.nicta.com.au:80/region_map/schemas/wfs/2.0/wfs.xsd">\n' +
            '   <wfs:member>\n' +
            '       <region_map:CED_CODE>101</region_map:CED_CODE>\n' +
            '   </wfs:member>\n' +
            '   <wfs:member>\n' +
            '       <region_map:CED_CODE>102</region_map:CED_CODE>\n' +
            '   </wfs:member>\n' +
            '   <wfs:member>\n' +
            '       <region_map:CED_CODE>103</region_map:CED_CODE>\n' +
            '   </wfs:member>\n' +
            '</wfs:ValueCollection>'
        });

        regionProvider = new RegionProvider('CED', {
            regionProp: 'CED_CODE',
            layerName: 'region_map:FID_CED_2011_AUST',
            server: 'http://regionmap-dev.nationalmap.nicta.com.au/region_map/ows'
        }, new CorsProxy());

    });

    it('parses WFS xml correctly', function(done) {
        regionProvider.loadRegionIDs().then(function(json) {
            expect(regionProvider.regions.length).toEqual(3);
        }).otherwise(fail).then(done);
    });
});
