'use strict';

/*global require,describe,it,expect,beforeEach,fail*/

var RegionProviderList = require('../../lib/Map/RegionProviderList');
var RegionProvider = require('../../lib/Map/RegionProvider');
var TableStructure = require('../../lib/Map/TableStructure.js');
var CorsProxy = require('../../lib/Core/CorsProxy');

describe('RegionProviderList', function() {
    var corsProxy;
    var regionProvideListPromise;

    beforeEach(function() {
        corsProxy = new CorsProxy();
        regionProvideListPromise = RegionProviderList.fromUrl('test/csv/regionMapping.json', corsProxy);
    });

    afterEach(function() {
    });

    it('loads some region providers', function(done) {
        regionProvideListPromise.then(function(rpl) {
            expect(rpl.regionProviders.length).toBeGreaterThan(2);
        }).otherwise(fail).then(done);
    });

    it('can find region SA4 by alias', function(done) {
        regionProvideListPromise.then(function(rpl) {
            expect(rpl.getRegionProvider('SA4')).toBeDefined();
        }).otherwise(fail).then(done);
    });

    it('can find region sA4 (case doesn\'t matter)', function(done) {
        regionProvideListPromise.then(function(rpl) {
            expect(rpl.getRegionProvider('sA4')).toBeDefined();
        }).otherwise(fail).then(done);
    });

    it('cannot find region NOTATHING by alias', function(done) {
        regionProvideListPromise.then(function(rpl) {
            expect(rpl.getRegionProvider('notathing')).not.toBeDefined();
        }).otherwise(fail).then(done);
    });

    var poaDescriptor = {
            "layerName":"region_map:FID_POA_2011_AUST",
            "server": "http://regionmap-dev.nationalmap.nicta.com.au/region_map/ows",
            "regionProp": "POA_CODE",
            "aliases": ["poa_2011", "postcode_2011", "poa", "poa_code", "poa_code_2011", "postcode"],
            "digits": 4,
            "textCodes": true
    };

    it('matches postcodes with bad and duplicated values', function(done) {
        jasmine.Ajax.install();
        jasmine.Ajax.stubRequest('http://regionmap-dev.nationalmap.nicta.com.au/region_map/ows?service=wfs&version=2.0&request=getPropertyValue&typenames=region_map%3AFID_POA_2011_AUST&valueReference=POA_CODE').andReturn({
            responseText: '<wfs:ValueCollection xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:region_map="http://region_map" xmlns:fes="http://www.opengis.net/fes/2.0" xmlns:wfs="http://www.opengis.net/wfs/2.0" xmlns:ows="http://www.opengis.net/ows/1.1" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.opengis.net/wfs/2.0 http://regionmap-dev.nationalmap.nicta.com.au:80/region_map/schemas/wfs/2.0/wfs.xsd">\n' +
            '   <wfs:member>\n' +
            '       <region_map:POA_CODE>3068</region_map:POA_CODE>\n' +
            '   </wfs:member>\n' +
            '   <wfs:member>\n' +
            '       <region_map:POA_CODE>2000</region_map:POA_CODE>\n' +
            '   </wfs:member>\n' +
            '</wfs:ValueCollection>'
        });
        var regionDetails, regionProvider;
        var regionProviderList = new RegionProviderList(corsProxy).initFromObject({
            regionWmsMap: {
                POA: poaDescriptor
            }
        });
        var tableStructure = new TableStructure();
        tableStructure.loadFromCsv('postcode,value\n3068,1\n2000,2\n5,-1\nfour thousand,-4\n2000,3');
        regionDetails = regionProviderList.getRegionDetails(tableStructure.getColumnNames());
        expect(regionDetails).toBeDefined();
        expect(regionDetails.length).toBeGreaterThan(0);
        var regionDetail = regionDetails[0];
        expect(regionDetail.variableName).toBe('postcode');
        expect(regionDetail.regionProvider.regionType).toBe('POA');
        regionProvider = regionDetail.regionProvider;
        regionProvider.loadRegionIDs().then(function() {
            expect(regionProvider.regions.length).toBeGreaterThan(0);
            var regionValues = tableStructure.getColumnWithName(regionDetail.variableName).values;
            var failedMatches = [];
            var ambiguousMatches = [];
            var indexOfPostcode3068 = regionProvider.regions.map(getId).indexOf('3068');
            var indexOfPostcode2000 = regionProvider.regions.map(getId).indexOf('2000');
            var regionIndices = regionProvider.mapRegionsToIndicesInto(regionValues, undefined, failedMatches, ambiguousMatches);
            expect(regionIndices[indexOfPostcode3068]).toEqual(0);
            expect(regionIndices[indexOfPostcode2000]).toEqual(1);
            // Check that only two succeeded. This test may fail if we change how this is implemented.
            expect(Object.keys(regionIndices).length).toEqual(2);
            expect(ambiguousMatches.length).toEqual(1);
            expect(ambiguousMatches[0]).toEqual(4); // the fifth row (ie. index 4) has the duplicate postcode, 2000.
            expect(failedMatches.length).toEqual(2);
            expect(failedMatches).toContain(2);  // indices 2 and 3 are '5' and 'four thousand', which are bad.
            expect(failedMatches).toContain(3);
        }).otherwise(fail).then(done);
    });

    it('handles postcodes with leading zeroes', function(done) {
        jasmine.Ajax.install();
        jasmine.Ajax.stubRequest('http://regionmap-dev.nationalmap.nicta.com.au/region_map/ows?service=wfs&version=2.0&request=getPropertyValue&typenames=region_map%3AFID_POA_2011_AUST&valueReference=POA_CODE').andReturn({
            responseText: '<wfs:ValueCollection xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:region_map="http://region_map" xmlns:fes="http://www.opengis.net/fes/2.0" xmlns:wfs="http://www.opengis.net/wfs/2.0" xmlns:ows="http://www.opengis.net/ows/1.1" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.opengis.net/wfs/2.0 http://regionmap-dev.nationalmap.nicta.com.au:80/region_map/schemas/wfs/2.0/wfs.xsd">\n' +
            '   <wfs:member>\n' +
            '       <region_map:POA_CODE>0800</region_map:POA_CODE>\n' +
            '   </wfs:member>\n' +
            '   <wfs:member>\n' +
            '       <region_map:POA_CODE>0885</region_map:POA_CODE>\n' +
            '   </wfs:member>\n' +
            '</wfs:ValueCollection>'
        });
        var regionProvider = new RegionProvider('POA2', poaDescriptor, corsProxy);
        var tableStructure = new TableStructure();
        tableStructure.loadFromCsv('postcode,value\n0800,1\n0885,2');
        regionProvider.loadRegionIDs().then(function() {
            var regionValues = tableStructure.getColumnWithName('postcode').values;
            var regionIndices = regionProvider.mapRegionsToIndicesInto(regionValues);
            var indexOfPostcode0800 = regionProvider.regions.map(getId).indexOf('0800');
            // Check that both succeeded. This test may fail if we change how this is implemented.
            expect(Object.keys(regionIndices).length).toEqual(2);
            expect(regionIndices[indexOfPostcode0800]).toEqual(0);
        }).otherwise(fail).then(done);
    });

    it('handles data-side replacements', function(done) {
        jasmine.Ajax.install();
        jasmine.Ajax.stubRequest('http://regionmap-dev.nationalmap.nicta.com.au/region_map/ows?service=wfs&version=2.0&request=getPropertyValue&typenames=region_map%3AFID_POA_2011_AUST&valueReference=POA_CODE').andReturn({
            responseText: '<wfs:ValueCollection xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:region_map="http://region_map" xmlns:fes="http://www.opengis.net/fes/2.0" xmlns:wfs="http://www.opengis.net/wfs/2.0" xmlns:ows="http://www.opengis.net/ows/1.1" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.opengis.net/wfs/2.0 http://regionmap-dev.nationalmap.nicta.com.au:80/region_map/schemas/wfs/2.0/wfs.xsd">\n' +
            '   <wfs:member>\n' +
            '       <region_map:POA_CODE>3068</region_map:POA_CODE>\n' +
            '   </wfs:member>\n' +
            '</wfs:ValueCollection>'
        });
        var poa2 = JSON.parse(JSON.stringify(poaDescriptor));
        //poa2.dataReplacements = [ [ '^()(?=\\d\\d\\d$)', '0' ] ];
        poa2.dataReplacements = [['^(Clifton Hill|Fitzroy North)$', '3068']];
        var regionProvider = new RegionProvider("POA2", poa2, corsProxy);
        var tableStructure = new TableStructure();
        tableStructure.loadFromCsv('postcode,value\nFitzroy North,1\nFitzroy,-1\n^(Clifton Hill|Fitzroy North)$,-1');
        regionProvider.loadRegionIDs().then(function() {
            var regionValues = tableStructure.getColumnWithName('postcode').values;
            var regionIndices = regionProvider.mapRegionsToIndicesInto(regionValues);
            // Check that only one succeeded. This test may fail if we change how this is implemented.
            expect(Object.keys(regionIndices).length).toEqual(1);
        }).otherwise(fail).then(done);
    });

});

// eg. use as regions.map(getId) to just get the ids of the regions.
function getId(obj) {
        return obj.id;
}
