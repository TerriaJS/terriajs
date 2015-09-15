'use strict';

/*global require,describe,it,expect,beforeEach*/

var Terria = require('../../lib/Models/Terria');
var RegionProviderList = require('../../lib/Models/RegionProviderList');
var RegionProvider = require('../../lib/Models/RegionProvider');
var DataTable = require('../../lib/Map/DataTable.js');
var when = require('terriajs-cesium/Source/ThirdParty/when');
var terria;
var rpl;

function except(e) { 
  return e.message || e.response || JSON.stringify(e); 
}

beforeEach(function() {
    terria = new Terria({
        baseUrl: './',
        regionMappingDefinitionsUrl: 'test/csv/regionMapping.json',
    });
    terria.corsProxy.baseProxyUrl = ""; // there is no localhost:3002/proxy, so ...
    rpl = new RegionProviderList(terria);
});

describe('RegionProviderList', function() {
  it('is instantiated from file successfully', function(done) {
    return rpl.init().yield(true).otherwise(except).then(function(x) {
      expect(x).toBe(true);
      done();
    });
  }); 
  it('loads some region providers', function(done) {
    return rpl.init().otherwise(except).then(function(x) {
      expect(rpl.regionProviders.length).toBeGreaterThan(2);
      done();
    });
  }); 
  it('does not allow duplicate identifiers', function(done) {
    terria.regionMappingDefinitionsUrl = 'test/csv/regionMappingDupeids.json';
    return rpl.init().yield(true).otherwise(except).then(function(x) {
      expect(x).toBe(true);
      done();
    });
  }); 
  it('throws if queried without initialisation', function() {
    expect (function() { rpl.getRegionProvider('SA4'); }).toThrow();
  }); 
  it('throws if initialised manually twice', function() {
    expect (function() { rpl.init(); rpl.initFromObject({}); }).toThrow();
  }); 

  it('can find region SA4 by alias', function(done) {
    return rpl.init().then(function() {
      expect(rpl.getRegionProvider('SA4')).not.toBe(null);
      done();
    });
  }); 
  it('can find region sA4 (case doesn\'t matter)', function(done) {
    return rpl.init().then(function() {
      expect(rpl.getRegionProvider('sA4')).not.toBe(null);
      done();
    });
  }); 
  it('cannot find region NOTATHING by alias', function(done) {
    return rpl.init().then(function() {
      expect(rpl.getRegionProvider('notathing')).toBe(null);
      done();
    });
  }); 
  var poaDescriptor = {
      "layerName":"region_map:FID_POA_2011_AUST",
      "server": "http://geoserver.nationalmap.nicta.com.au/region_map/ows",
      "regionProp": "POA_CODE",
      "aliases": ["poa_2011", "postcode_2011", "poa", "poa_code", "poa_code_2011", "postcode"],
      "digits": 4,
      "textCodes": true
  };

  it('matches postcodes as expected', function(done) {
    var rp, r;
    rpl.initFromObject({ regionWmsMap: { POA: poaDescriptor }});

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
      done();
    }).otherwise(function(e) { 
      console.log(e);
      expect('Received exception: ' + (e.message ? e.message : e.response)).toBe(false); 
      done() ;
      throw (e);
    }); 
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
    }).yield(true).otherwise(except).then(function(x) { 
      expect(x).toBe(true);
      done();
    }); 

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
    }).yield(true).otherwise(except).then(function(x) { 
      expect(x).toBe(true);
      done();
    }); 
  });


});
