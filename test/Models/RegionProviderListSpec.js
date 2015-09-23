'use strict';

/*global require,describe,it,expect,beforeEach,fail*/

var RegionProviderList = require('../../lib/Map/RegionProviderList');
var RegionProvider = require('../../lib/Map/RegionProvider');
var DataTable = require('../../lib/Map/DataTable.js');
var rplp;

beforeEach(function() {
    rplp = RegionProviderList.fromUrl('test/csv/regionMapping.json');
});

describe('RegionProviderList', function() {
  it('loads some region providers', function(done) {
    rplp.then(function(rpl) {
      expect(rpl.regionProviders.length).toBeGreaterThan(2);
    }).otherwise(fail).then(done);
  }); 

  it('can find region SA4 by alias', function(done) {
    rplp.then(function(rpl) {
      expect(rpl.getRegionProvider('SA4')).toBeDefined();
    }).otherwise(fail).then(done);
  }); 
  it('can find region sA4 (case doesn\'t matter)', function(done) {
    rplp.then(function(rpl) {
      expect(rpl.getRegionProvider('sA4')).toBeDefined();
    }).otherwise(fail).then(done);
  }); 
  it('cannot find region NOTATHING by alias', function(done) {
    rplp.then(function(rpl) {
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
    var rp, r;
    var rpl = new RegionProviderList().initFromObject({ regionWmsMap: { POA: poaDescriptor }});

    var dataset = new DataTable();
    dataset.loadText('postcode,value\n3068,1\n2000,2\n5,-1\nfour thousand,-4\n2000,3');
    dataset.setDataVariable('value');

    r = rpl.chooseRegionProvider(dataset.getVariableNames());
    expect(r).not.toBe(null);
    console.log(r);
    expect(r.regionVariable).toBe('postcode');
    expect(r.regionProvider.regionType).toBe('POA');
    rp = r.regionProvider;
    rp.loadRegionIDs().then (function() {
      expect(rp.regions.length).toBeGreaterThan(0);
      var res = rp.getRegionValues(dataset, r.regionVariable);
      expect(res.successes).toBeGreaterThan(0);
      expect(res.failedMatches).toEqual({"5": true, "four thousand": true});
      expect(res.ambiguousMatches).toEqual({"2000": true});
    }).otherwise(fail).then(done);
  });
  it('handles postcodes with leading zeroes', function(done) {
    var rp = new RegionProvider("POA2", poaDescriptor);
    var dataset = new DataTable();
    dataset.loadText('postcode,value\n0800,1\n0885,2');
    dataset.setDataVariable('value');
    rp.loadRegionIDs().then (function() {
      var res = rp.getRegionValues(dataset, "postcode");
      expect(res.successes).toEqual(2);      
      expect(Object.keys(res.failedMatches).length).toEqual(0);      
    }).otherwise(fail).then(done);
  });
  it('handles data-side replacements', function(done) {
    var poa2 = JSON.parse(JSON.stringify(poaDescriptor));
    //poa2.dataReplacements = [ [ '^()(?=\\d\\d\\d$)', '0' ] ];
    poa2.dataReplacements = [ [ '^(Clifton Hill|Fitzroy North)$', '3068' ]];

    var rp = new RegionProvider("POA2", poa2);

    var dataset = new DataTable();
    dataset.loadText('postcode,value\nFitzroy North,1\nFitzroy,-1\n^(Clifton Hill|Fitzroy North)$,-1');
    dataset.setDataVariable('value');

    rp.loadRegionIDs().then (function() {
      var res = rp.getRegionValues(dataset, "postcode");
      expect(res.successes).toEqual(1);      
      expect(Object.keys(res.failedMatches).length).toEqual(2);      
    }).otherwise(fail).then(done); 
  });
});
