'use strict';

/*global require,describe,it,expect*/
var Reproject = require('../../lib/Map/Reproject');

describe('Reproject', function() {

    it('function crsStringToCode translates CRS strings to Proj4 codes', function() {
        expect(Reproject.crsStringToCode("EPSG:4326")).toEqual("EPSG:4326");
        expect(Reproject.crsStringToCode("EPSG:1234")).toEqual("EPSG:1234");
        expect(Reproject.crsStringToCode("urn:ogc:def:crs:EPSG:6.6:4326")).toEqual("EPSG:4326");
        expect(Reproject.crsStringToCode("urn:ogc:def:crs:EPSG:6.6:1241")).toEqual("EPSG:1241");
        expect(Reproject.crsStringToCode("urn:ogc:def:crs:EPSG::4326")).toEqual("EPSG:4326");
        expect(Reproject.crsStringToCode("urn:ogc:def:crs:EPSG::1241")).toEqual("EPSG:1241");
        expect(Reproject.crsStringToCode("CRS84")).toEqual("EPSG:4326");
    });

    it('function willNeedReprojecting predicts correctly if something needs reprojecting', function() {
        expect(Reproject.willNeedReprojecting("EPSG:4326")).toBeFalsy();
        expect(Reproject.willNeedReprojecting("CRS84")).toBeTruthy();
        expect(Reproject.willNeedReprojecting("EPSG:1234")).toBeTruthy();
    });

    it('function reprojectPoint reprojects a point from one CRS to another', function() {
        expect(Reproject.reprojectPoint([319180,6399862], "EPSG:3006","EPSG:4326")).toEqual([11.965261843967307,57.70450563085531]);
    });
});
