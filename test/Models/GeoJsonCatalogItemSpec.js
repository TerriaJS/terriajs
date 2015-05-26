'use strict';

/*global require,describe,it,expect,beforeEach*/
var GeoJsonCatalogItem = require('../../lib/Models/GeoJsonCatalogItem');
var Terria = require('../../lib/Models/Terria');

var loadBlob = require('terriajs-cesium/Source/Core/loadBlob');
var loadText = require('terriajs-cesium/Source/Core/loadText');

describe('GeoJsonCatalogItem', function() {
    var terria;
    var geojson;

    beforeEach(function() {
        terria = new Terria({
            baseUrl: './'
        });
        geojson = new GeoJsonCatalogItem(terria);
    });

    describe('loading in EPSG:28356', function() {
        it('works by URL', function(done) {
            geojson.url = 'test/GeoJSON/bike_racks.geojson';
            geojson.load().then(function() {
                expect(geojson._geoJsonDataSource.entities.values.length).toBeGreaterThan(0);
                done();
            });
        });

        it('works by string', function(done) {
            loadText('test/GeoJSON/bike_racks.geojson').then(function(s) {
                geojson.data = s;
                geojson.dataSourceUrl = 'anything.geojson';
                geojson.load().then(function() {
                    expect(geojson._geoJsonDataSource.entities.values.length).toBeGreaterThan(0);
                    done();
                });
            });
        });

        it('works by blob', function(done) {
            loadBlob('test/GeoJSON/bike_racks.geojson').then(function(blob) {
                geojson.data = blob;
                geojson.dataSourceUrl = 'anything.geojson';
                geojson.load().then(function() {
                    expect(geojson._geoJsonDataSource.entities.values.length).toBeGreaterThan(0);
                    done();
                });
            });
        });
    });

    describe('loading in CRS:84', function() {
        it('works by URL', function(done) {
            geojson.url = 'test/GeoJSON/cemeteries.geojson';
            geojson.load().then(function() {
                expect(geojson._geoJsonDataSource.entities.values.length).toBeGreaterThan(0);
                done();
            });
        });

        it('works by string', function(done) {
            loadText('test/GeoJSON/cemeteries.geojson').then(function(s) {
                geojson.data = s;
                geojson.dataSourceUrl = 'anything.geojson';
                geojson.load().then(function() {
                    expect(geojson._geoJsonDataSource.entities.values.length).toBeGreaterThan(0);
                    done();
                });
            });
        });

        it('works by blob', function(done) {
            loadBlob('test/GeoJSON/cemeteries.geojson').then(function(blob) {
                geojson.data = blob;
                geojson.dataSourceUrl = 'anything.geojson';
                geojson.load().then(function() {
                    expect(geojson._geoJsonDataSource.entities.values.length).toBeGreaterThan(0);
                    done();
                });
            });
        });
    });

    describe('loading without specified CRS (assumes EPSG:4326)', function() {
        it('works by URL', function(done) {
            geojson.url = 'test/GeoJSON/gme.geojson';
            geojson.load().then(function() {
                expect(geojson._geoJsonDataSource.entities.values.length).toBeGreaterThan(0);
                done();
            });
        });

        it('works by string', function(done) {
            loadText('test/GeoJSON/gme.geojson').then(function(s) {
                geojson.data = s;
                geojson.dataSourceUrl = 'anything.geojson';
                geojson.load().then(function() {
                    expect(geojson._geoJsonDataSource.entities.values.length).toBeGreaterThan(0);
                    done();
                });
            });
        });

        it('works by blob', function(done) {
            loadBlob('test/GeoJSON/gme.geojson').then(function(blob) {
                geojson.data = blob;
                geojson.dataSourceUrl = 'anything.geojson';
                geojson.load().then(function() {
                    expect(geojson._geoJsonDataSource.entities.values.length).toBeGreaterThan(0);
                    done();
                });
            });
        });
    });

    describe('loading Esri-style GeoJSON with an "envelope"', function() {
        it('works by URL', function(done) {
            geojson.url = 'test/GeoJSON/EsriEnvelope.geojson';
            geojson.load().then(function() {
                expect(geojson._geoJsonDataSource.entities.values.length).toBeGreaterThan(0);
                done();
            });
        });

        it('works by string', function(done) {
            loadText('test/GeoJSON/EsriEnvelope.geojson').then(function(s) {
                geojson.data = s;
                geojson.dataSourceUrl = 'anything.geojson';
                geojson.load().then(function() {
                    expect(geojson._geoJsonDataSource.entities.values.length).toBeGreaterThan(0);
                    done();
                });
            });
        });

        it('works by blob', function(done) {
            loadBlob('test/GeoJSON/EsriEnvelope.geojson').then(function(blob) {
                geojson.data = blob;
                geojson.dataSourceUrl = 'anything.geojson';
                geojson.load().then(function() {
                    expect(geojson._geoJsonDataSource.entities.values.length).toBeGreaterThan(0);
                    done();
                });
            });
        });
    });
});
