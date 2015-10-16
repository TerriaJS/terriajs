'use strict';

/*global require,describe,it,expect,beforeEach,fail*/

var Terria = require('../../lib/Models/Terria');
var RegionProviderList = require('../../lib/Map/RegionProviderList');
var RegionProvider = require('../../lib/Map/RegionProvider');
var loadText = require('terriajs-cesium/Source/Core/loadText');

var terria;
var rpl, ced;

beforeEach(function() {
    terria = new Terria({
        baseUrl: './',
        regionMappingDefinitionsUrl: 'test/csv/regionMapping.json'
    });
    rpl = new RegionProviderList(terria);
    ced = new RegionProvider('CED', { 
      regionProp: 'CED_CODE', 
      layerName: 'region_map:FID_CED_2011_AUST',
      server: 'http://regionmap-dev.nationalmap.nicta.com.au/region_map/ows'
    });

});

describe('RegionProvider', function() {
  it('parses WFS xml correctly', function(done) {
    loadText('test/csv/mini_ced.xml').then(function(xml) {
        ced.loadRegionsFromXML(xml);
        expect(ced.regions.length).toEqual(6);
    }).otherwise(fail).then(done);
  });
});
