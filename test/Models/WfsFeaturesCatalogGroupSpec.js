'use strict';

/*global require,describe,it,expect,fail*/

var Terria = require('../../lib/Models/Terria');
var WfsFeaturesCatalogGroup = require('../../lib/Models/WfsFeaturesCatalogGroup');


var terria;
var wfsGroup;

var cedJson =  {
  "name": "Commonwealth Electoral Divisions (group from features)",
  "type": "wfs-features-group",
  "url": "http://regionmap-dev.nationalmap.nicta.com.au/admin_bnds_abs/ows",
  "typeNames": "admin_bnds:COM20111216_ELB_region",
  "nameProperty": "ELECT_DIV",
  "groupByProperty": "STATE",
  "itemProperties": {
    "description": "CED test",
    "info": [
      {
        "name": "Licence",
        "content": "[Australian Electoral Commission Data download licence](http://www.aec.gov.au/Electorates/gis/GIS_Data_Download_Data_Licence.htm)"
      }
    ],
    "dataCustodian": "[Australian Electoral Commission](http://www.aec.gov.au/)",
    "style": {
      "fill": "purple",
      "stroke": "orange"
    }
  }
};

describe('WfsFeaturesCatalogGroup', function() {
    terria = new Terria({
        baseUrl: './'
    });
    wfsGroup = new WfsFeaturesCatalogGroup(terria);
    
    it('groups Commonwealth Electoral Divisions from our test region mapping server into 8 states', function(done) {
        wfsGroup.updateFromJson(cedJson);
        wfsGroup.load().then(function() {
            expect(wfsGroup.items.length).toBe(8);
        }).otherwise(fail).then(done);
    });

    it('each of which is a group', function() {
        expect(wfsGroup.items[0].type).toBe('group');
    });
    var tas;
    it('of which TAS is one, containing 5 electorates', function() {
        tas = wfsGroup.items.filter(function(x) { return x.name === 'TAS'; })[0]; 
        expect(tas.items.length).toBe(5);
    });
    it('which are GeoJson types', function() {
        expect(tas.items[0].type).toBe('geojson');
    });
    it('which have an inherited style and description property', function() {
        expect(tas.items[0].style.fill).toBe('purple');
        expect(tas.items[0].description).toBe('CED test');
    });

});
