'use strict';

/*global require,describe,it,expect,beforeEach*/
var CzmlCatalogItem = require('../../lib/Models/CzmlCatalogItem');
var TerriaError = require('../../lib/Core/TerriaError');
var Terria = require('../../lib/Models/Terria');

var loadBlob = require('../../lib/Core/loadBlob');
var loadText = require('../../lib/Core/loadText');

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
                expect(czml.dataSource.entities.values.length).toBeGreaterThan(0);
            }).otherwise(done.fail).then(done);
        });

        it('have default dataUrl and dataUrlType', function() {
            czml.updateFromJson({
                url: 'test/CZML/verysimple.czml',
            });
            expect(czml.dataUrl).toBe('test/CZML/verysimple.czml');
            expect(czml.dataUrlType).toBe('direct');
        });

        it('use provided dataUrl and dataUrlType', function(done) {
            czml.url = 'test/CZML/verysimple.czml';
            czml.dataUrl ="test/test.html";
            czml.dataUrlType ="fake type";
            czml.load().then(function() {
                expect(czml.dataSource.entities.values.length).toBeGreaterThan(0);
                expect(czml.dataUrl).toBe("test/test.html");
                expect(czml.dataUrlType).toBe("fake type");
            }).otherwise(done.fail).then(done);
        });

        it('works by string', function(done) {
            loadText('test/CZML/verysimple.czml').then(function(s) {
                czml.data = s;
                czml.dataSourceUrl = 'anything.czml';
                czml.load().then(function() {
                    expect(czml.dataSource.entities.values.length).toBeGreaterThan(0);
                }).otherwise(done.fail).then(done);
            });
        });

        it('works by blob', function(done) {
            loadBlob('test/CZML/verysimple.czml').then(function(blob) {
                czml.data = blob;
                czml.dataSourceUrl = 'anything.geojson';
                czml.load().then(function() {
                    expect(czml.dataSource.entities.values.length).toBeGreaterThan(0);
                }).otherwise(done.fail).then(done);
            });
        });

    });

    describe('embedding CZML', function() {
        it('works with dataSourceUrl', function(done) {
            czml.data = JSON.parse('[{"id": "document", "version": "1.0"}, {"position": {"cartographicDegrees": [133.0, -25.0, 0.0]}}]');
            czml.dataSourceUrl = 'something.czml';
            czml.load().then(function() {
                expect(czml.dataSource.entities.values.length).toBeGreaterThan(0);
                done();
            });
        });

        it('works without dataSourceUrl', function(done) {
            czml.data = JSON.parse('[{"id": "document", "version": "1.0"}, {"position": {"cartographicDegrees": [133.0, -25.0, 0.0]}}]');
            expect(czml.dataSourceUrl).toBeUndefined();
            czml.load().then(function() {
                expect(czml.dataSource.entities.values.length).toBeGreaterThan(0);
            }).otherwise(done.fail).then(done);
        });

    });

    describe('loading a CZML file with a moving vehicle', function() {
        it('works by URL', function(done) {
            czml.url = 'test/CZML/Vehicle.czml';
            czml.load().then(function() {
                expect(czml.dataSource.entities.values.length).toBeGreaterThan(0);
            }).otherwise(done.fail).then(done);
        });

        it('works by string', function(done) {
            loadText('test/CZML/Vehicle.czml').then(function(s) {
                czml.data = s;
                czml.dataSourceUrl = 'anything.czml';
                czml.load().then(function() {
                    expect(czml.dataSource.entities.values.length).toBeGreaterThan(0);
                }).otherwise(done.fail).then(done);
            });
        });

        it('works by blob', function(done) {
            loadBlob('test/CZML/Vehicle.czml').then(function(blob) {
                czml.data = blob;
                czml.dataSourceUrl = 'anything.geojson';
                czml.load().then(function() {
                    expect(czml.dataSource.entities.values.length).toBeGreaterThan(0);
                }).otherwise(done.fail).then(done);
            });
        });
    });

    describe('loading a CZML file with multiple moving and static objects', function() {
        it('works by URL', function(done) {
            czml.url = 'test/CZML/simple.czml';
            czml.load().then(function() {
                expect(czml.dataSource.entities.values.length).toBeGreaterThan(0);
            }).otherwise(done.fail).then(done);
        });

        it('works by string', function(done) {
            loadText('test/CZML/simple.czml').then(function(s) {
                czml.data = s;
                czml.dataSourceUrl = 'anything.czml';
                czml.load().then(function() {
                    expect(czml.dataSource.entities.values.length).toBeGreaterThan(0);
                }).otherwise(done.fail).then(done);
            });
        });

        it('works by blob', function(done) {
            loadBlob('test/CZML/simple.czml').then(function(blob) {
                czml.data = blob;
                czml.dataSourceUrl = 'anything.geojson';
                czml.load().then(function() {
                    expect(czml.dataSource.entities.values.length).toBeGreaterThan(0);
                }).otherwise(done.fail).then(done);
            });
        });

    });

    describe('error handling', function() {
        it('fails gracefully when the data at a URL is not JSON', function(done) {
            czml.url = 'test/KML/vic_police.kml';
            czml.load().then(function() {
                done.fail('Load should not succeed.');
            }).otherwise(function(e) {
                expect(e instanceof TerriaError).toBe(true);
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
                    expect(e instanceof TerriaError).toBe(true);
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
                    expect(e instanceof TerriaError).toBe(true);
                    done();
                });
            });
        });

        it('fails gracefully when the data at a URL is JSON but not CZML', function(done) {
            czml.url = 'test/GeoJSON/bike_racks.geojson';
            czml.load().then(function() {
                done.fail('Load should not succeed.');
            }).otherwise(function(e) {
                expect(e instanceof TerriaError).toBe(true);
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
                    expect(e instanceof TerriaError).toBe(true);
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
                    expect(e instanceof TerriaError).toBe(true);
                    done();
                });
            });
        });
    });
});
