'use strict';

/*global require,describe,it,expect,beforeEach,fail*/

var RegionProviderList = require('../../lib/Map/RegionProviderList');
var RegionProvider = require('../../lib/Map/RegionProvider');
var TableStructure = require('../../lib/Core/TableStructure.js');
var regionProvideListPromise;

beforeEach(function() {
    regionProvideListPromise = RegionProviderList.fromUrl('test/csv/regionMapping.json');
});

describe('RegionProviderList', function() {
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

    it('matches postcodes as expected', function(done) {
        var regionDetails, regionProvider;
        var regionProviderList = new RegionProviderList().initFromObject({ regionWmsMap: { POA: poaDescriptor }});
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
            var regionIndices = regionProvider.getRegionIndices(regionValues);
            var indexOfPostcode3068 = regionProvider.regions.map(getId).indexOf('3068');
            var indexOfPostcode2000 = regionProvider.regions.map(getId).indexOf('2000');
            expect(regionIndices[indexOfPostcode3068]).toEqual(0);
            expect(regionIndices[indexOfPostcode2000]).toEqual(1);
            // Check that only two succeeded. This test may fail if we change how this is implemented.
            expect(Object.keys(regionIndices).length).toEqual(2);
            expect('ambiguousMatches').toEqual('2000');  // A reminder to re-implement the ambiguous matches calculations in some form
            // expect(res.successes).toBeGreaterThan(0);
            // expect(res.failedMatches).toEqual({"5": true, "four thousand": true});
            // expect(res.ambiguousMatches).toEqual({"2000": true});
        }).otherwise(fail).then(done);
    });

    it('handles postcodes with leading zeroes', function(done) {
        var regionProvider = new RegionProvider('POA2', poaDescriptor);
        var tableStructure = new TableStructure();
        tableStructure.loadFromCsv('postcode,value\n0800,1\n0885,2');
        regionProvider.loadRegionIDs().then(function() {
            var regionValues = tableStructure.getColumnWithName('postcode').values;
            var regionIndices = regionProvider.getRegionIndices(regionValues);
            var indexOfPostcode0800 = regionProvider.regions.map(getId).indexOf('0800');
            // Check that both succeeded. This test may fail if we change how this is implemented.
            expect(Object.keys(regionIndices).length).toEqual(2);
            expect(regionIndices[indexOfPostcode0800]).toEqual(0);
        }).otherwise(fail).then(done);
    });

    it('handles data-side replacements', function(done) {
        var poa2 = JSON.parse(JSON.stringify(poaDescriptor));
        //poa2.dataReplacements = [ [ '^()(?=\\d\\d\\d$)', '0' ] ];
        poa2.dataReplacements = [['^(Clifton Hill|Fitzroy North)$', '3068']];
        var regionProvider = new RegionProvider("POA2", poa2);
        var tableStructure = new TableStructure();
        tableStructure.loadFromCsv('postcode,value\nFitzroy North,1\nFitzroy,-1\n^(Clifton Hill|Fitzroy North)$,-1');
        regionProvider.loadRegionIDs().then(function() {
            var regionValues = tableStructure.getColumnWithName('postcode').values;
            var regionIndices = regionProvider.getRegionIndices(regionValues);
            // Check that only one succeeded. This test may fail if we change how this is implemented.
            expect(Object.keys(regionIndices).length).toEqual(1);
        }).otherwise(fail).then(done);
    });

});

// eg. use as regions.map(getId) to just get the ids of the regions.
function getId(obj) {
        return obj.id;
}
