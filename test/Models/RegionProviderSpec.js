'use strict';

/*global require,describe,it,expect,beforeEach*/

var Terria = require('../../lib/Models/Terria');
var CatalogItem = require('../../lib/Models/CatalogItem');
var RegionProviderList = require('../../lib/Models/RegionProviderList');
var RegionProvider = require('../../lib/Models/RegionProvider');
var loadText = require('terriajs-cesium/Source/Core/loadText');

var terria;
var rpl, ced;

var falsy = function() { return false; }

beforeEach(function() {
    terria = new Terria({
        baseUrl: './',
        regionMappingDefinitionsUrl: 'test/csv/regionMapping.json'
    });
    rpl = new RegionProviderList(terria);
    ced = new RegionProvider('CED', { 
      regionProp: 'CED_CODE', 
      layerName: 'region_map:FID_CED_2011_AUST',
      server: 'http://geoserver.nationalmap.nicta.com.au/region_map/ows'
    });

});

describe('RegionProvider', function() {
  it('parses WFS xml correctly', function(done) {
    loadText('test/csv/mini_ced.xml').then(function(xml) {
        ced.loadRegionsFromXML(xml);
        expect(ced.regions.length).toEqual(6);
        done();
    }, function(e) {
        expect(e.response).toEqual(null);
        done();
    }); 
  });
});
