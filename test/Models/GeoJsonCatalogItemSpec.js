'use strict';

/*global require,describe,it,expect,beforeEach*/
var GeoJsonCatalogItem = require('../../lib/Models/GeoJsonCatalogItem');
var ModelError = require('../../lib/Models/ModelError');
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

    describe('error handling', function() {
        it('fails gracefully when the data at a URL is not JSON', function(done) {
            geojson.url = 'test/KML/vic_police.kml';
            geojson.load().then(function() {
                done.fail('Load should not succeed.');
            }).otherwise(function(e) {
                expect(e instanceof ModelError).toBe(true);
                done();
            });
        });

        it('fails gracefully when the provided string is not JSON', function(done) {
            loadText('test/KML/vic_police.kml').then(function(s) {
                geojson.data = s;
                geojson.dataSourceUrl = 'anything.czml';

                geojson.load().then(function() {
                    done.fail('Load should not succeed.');
                }).otherwise(function(e) {
                    expect(e instanceof ModelError).toBe(true);
                    done();
                });
            });
        });

        it('fails gracefully when the provided blob is not JSON', function(done) {
            loadBlob('test/KML/vic_police.kml').then(function(blob) {
                geojson.data = blob;
                geojson.dataSourceUrl = 'anything.czml';

                geojson.load().then(function() {
                    done.fail('Load should not succeed.');
                }).otherwise(function(e) {
                    expect(e instanceof ModelError).toBe(true);
                    done();
                });
            });
        });

        it('fails gracefully when the data at a URL is JSON but not GeoJSON', function(done) {
            geojson.url = 'test/CZML/verysimple.czml';
            geojson.load().then(function() {
                done.fail('Load should not succeed.');
            }).otherwise(function(e) {
                expect(e instanceof ModelError).toBe(true);
                done();
            });
        });

        it('fails gracefully when the provided string is JSON but not GeoJSON', function(done) {
            loadText('test/CZML/verysimple.czml').then(function(s) {
                geojson.data = s;
                geojson.dataSourceUrl = 'anything.czml';

                geojson.load().then(function() {
                    done.fail('Load should not succeed.');
                }).otherwise(function(e) {
                    expect(e instanceof ModelError).toBe(true);
                    done();
                });
            });
        });

        it('fails gracefully when the provided blob is JSON but not GeoJSON', function(done) {
            loadBlob('test/CZML/verysimple.czml').then(function(blob) {
                geojson.data = blob;
                geojson.dataSourceUrl = 'anything.czml';

                geojson.load().then(function() {
                    done.fail('Load should not succeed.');
                }).otherwise(function(e) {
                    expect(e instanceof ModelError).toBe(true);
                    done();
                });
            });
        });
    });
});
