'use strict';

/*global require,describe,it,expect,beforeEach*/
var CzmlCatalogItem = require('../../lib/Models/CzmlCatalogItem');
var ModelError = require('../../lib/Models/ModelError');
var Terria = require('../../lib/Models/Terria');

var loadBlob = require('terriajs-cesium/Source/Core/loadBlob');
var loadText = require('terriajs-cesium/Source/Core/loadText');

describe('CzmlCatalogItem', function() {
    var terria;
    var czml;

    beforeEach(function() {
        terria = new Terria({
            baseUrl: './'
        });
        czml = new CzmlCatalogItem(terria);
    });

    describe('loading a very simple CZML file', function() {
        it('works by URL', function(done) {
            czml.url = 'test/CZML/verysimple.czml';
            czml.load().then(function() {
                expect(czml._czmlDataSource.entities.values.length).toBeGreaterThan(0);
                done();
            });
        });

        it('works by string', function(done) {
            loadText('test/CZML/verysimple.czml').then(function(s) {
                czml.data = s;
                czml.dataSourceUrl = 'anything.czml';
                czml.load().then(function() {
                    expect(czml._czmlDataSource.entities.values.length).toBeGreaterThan(0);
                    done();
                });
            });
        });

        it('works by blob', function(done) {
            loadBlob('test/CZML/verysimple.czml').then(function(blob) {
                czml.data = blob;
                czml.dataSourceUrl = 'anything.geojson';
                czml.load().then(function() {
                    expect(czml._czmlDataSource.entities.values.length).toBeGreaterThan(0);
                    done();
                });
            });
        });
    });

    describe('loading a CZML file with a moving vehicle', function() {
        it('works by URL', function(done) {
            czml.url = 'test/CZML/Vehicle.czml';
            czml.load().then(function() {
                expect(czml._czmlDataSource.entities.values.length).toBeGreaterThan(0);
                done();
            });
        });

        it('works by string', function(done) {
            loadText('test/CZML/Vehicle.czml').then(function(s) {
                czml.data = s;
                czml.dataSourceUrl = 'anything.czml';
                czml.load().then(function() {
                    expect(czml._czmlDataSource.entities.values.length).toBeGreaterThan(0);
                    done();
                });
            });
        });

        it('works by blob', function(done) {
            loadBlob('test/CZML/Vehicle.czml').then(function(blob) {
                czml.data = blob;
                czml.dataSourceUrl = 'anything.geojson';
                czml.load().then(function() {
                    expect(czml._czmlDataSource.entities.values.length).toBeGreaterThan(0);
                    done();
                });
            });
        });
    });

    describe('loading a CZML file with multiple moving and static objects', function() {
        it('works by URL', function(done) {
            czml.url = 'test/CZML/simple.czml';
            czml.load().then(function() {
                expect(czml._czmlDataSource.entities.values.length).toBeGreaterThan(0);
                done();
            });
        });

        it('works by string', function(done) {
            loadText('test/CZML/simple.czml').then(function(s) {
                czml.data = s;
                czml.dataSourceUrl = 'anything.czml';
                czml.load().then(function() {
                    expect(czml._czmlDataSource.entities.values.length).toBeGreaterThan(0);
                    done();
                });
            });
        });

        it('works by blob', function(done) {
            loadBlob('test/CZML/simple.czml').then(function(blob) {
                czml.data = blob;
                czml.dataSourceUrl = 'anything.geojson';
                czml.load().then(function() {
                    expect(czml._czmlDataSource.entities.values.length).toBeGreaterThan(0);
                    done();
                });
            });
        });
    });

    describe('error handling', function(done) {
        it('fails gracefully when the data at a URL is not JSON', function(done) {
            czml.url = 'test/KML/vic_police.kml';
            czml.load().then(function() {
                done.fail('Load should not succeed.');
            }).otherwise(function(e) {
                expect(e instanceof ModelError).toBe(true);
                done();
            });
        });

        it('fails gracefully when the provided string is not JSON', function(done) {
            loadText('test/KML/vic_police.kml').then(function(s) {
                czml.data = s;
                czml.dataSourceUrl = 'anything.czml';

                czml.load().then(function() {
                    done.fail('Load should not succeed.');
                }).otherwise(function(e) {
                    expect(e instanceof ModelError).toBe(true);
                    done();
                });
            });
        });

        it('fails gracefully when the provided blob is not JSON', function(done) {
            loadBlob('test/KML/vic_police.kml').then(function(blob) {
                czml.data = blob;
                czml.dataSourceUrl = 'anything.czml';

                czml.load().then(function() {
                    done.fail('Load should not succeed.');
                }).otherwise(function(e) {
                    expect(e instanceof ModelError).toBe(true);
                    done();
                });
            });
        });

        it('fails gracefully when the data at a URL is JSON but not CZML', function(done) {
            czml.url = 'test/GeoJSON/bike_racks.geojson';
            czml.load().then(function() {
                done.fail('Load should not succeed.');
            }).otherwise(function(e) {
                expect(e instanceof ModelError).toBe(true);
                done();
            });
        });

        it('fails gracefully when the provided string is JSON but not CZML', function(done) {
            loadText('test/GeoJSON/bike_racks.geojson').then(function(s) {
                czml.data = s;
                czml.dataSourceUrl = 'anything.czml';

                czml.load().then(function() {
                    done.fail('Load should not succeed.');
                }).otherwise(function(e) {
                    expect(e instanceof ModelError).toBe(true);
                    done();
                });
            });
        });

        it('fails gracefully when the provided blob is JSON but not CZML', function(done) {
            loadBlob('test/GeoJSON/bike_racks.geojson').then(function(blob) {
                czml.data = blob;
                czml.dataSourceUrl = 'anything.czml';

                czml.load().then(function() {
                    done.fail('Load should not succeed.');
                }).otherwise(function(e) {
                    expect(e instanceof ModelError).toBe(true);
                    done();
                });
            });
        });
    });
});
