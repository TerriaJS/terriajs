'use strict';

/*global require,describe,it,expect,beforeEach*/
var KmlCatalogItem = require('../../lib/Models/KmlCatalogItem');
var ModelError = require('../../lib/Models/ModelError');
var Terria = require('../../lib/Models/Terria');

var loadBlob = require('terriajs-cesium/Source/Core/loadBlob');
var loadText = require('terriajs-cesium/Source/Core/loadText');
var loadXML = require('terriajs-cesium/Source/Core/loadXML');

describe('KmlCatalogItem', function() {
    var terria;
    var kml;

    beforeEach(function() {
        terria = new Terria({
            baseUrl: './'
        });
        kml = new KmlCatalogItem(terria);
    });

    it('can load a KML file by URL', function(done) {
        kml.url = 'test/KML/vic_police.kml';
        kml.load().then(function() {
            expect(kml._kmlDataSource.entities.values.length).toBeGreaterThan(0);
            done();
        });
    });

    it('can load a KML file by provided XML data', function(done) {
        loadXML('test/KML/vic_police.kml').then(function(xml) {
            kml.data = xml;
            kml.dataSourceUrl = 'anything.kml';
            kml.load().then(function() {
                expect(kml._kmlDataSource.entities.values.length).toBeGreaterThan(0);
                done();
            });
        });
    });

    it('can load a KML file by provided Blob', function(done) {
        loadBlob('test/KML/vic_police.kml').then(function(blob) {
            kml.data = blob;
            kml.dataSourceUrl = 'anything.kml';
            kml.load().then(function() {
                expect(kml._kmlDataSource.entities.values.length).toBeGreaterThan(0);
                done();
            });
        });
    });

    it('can load a KML file by provided string', function(done) {
        loadText('test/KML/vic_police.kml').then(function(s) {
            kml.data = s;
            kml.dataSourceUrl = 'anything.kml';
            kml.load().then(function() {
                expect(kml._kmlDataSource.entities.values.length).toBeGreaterThan(0);
                done();
            });
        });
    });

    it('can load a KMZ file by URL', function(done) {
        kml.url = 'test/KML/vic_police.kmz';
        kml.load().then(function() {
            expect(kml._kmlDataSource.entities.values.length).toBeGreaterThan(0);
            done();
        });
    });

    it('can load a KMZ file by provided Blob', function(done) {
        loadBlob('test/KML/vic_police.kmz').then(function(blob) {
            kml.data = blob;
            kml.dataSourceUrl = 'anything.kmz';
            kml.load().then(function() {
                expect(kml._kmlDataSource.entities.values.length).toBeGreaterThan(0);
                done();
            });
        });
    });

    describe('error handling', function() {
        it('fails gracefully when the data at a URL is not XML', function(done) {
            kml.url = 'test/CZML/simple.czml';
            kml.load().then(function() {
                done.fail('Load should not succeed.');
            }).otherwise(function(e) {
                expect(e instanceof ModelError).toBe(true);
                done();
            });
        });

        it('fails gracefully when the provided string is not XML', function(done) {
            loadText('test/CZML/simple.czml').then(function(s) {
                kml.data = s;
                kml.dataSourceUrl = 'anything.czml';

                kml.load().then(function() {
                    done.fail('Load should not succeed.');
                }).otherwise(function(e) {
                    expect(e instanceof ModelError).toBe(true);
                    done();
                });
            });
        });

        it('fails gracefully when the provided blob is not XML', function(done) {
            loadBlob('test/CZML/simple.czml').then(function(blob) {
                kml.data = blob;
                kml.dataSourceUrl = 'anything.czml';

                kml.load().then(function() {
                    done.fail('Load should not succeed.');
                }).otherwise(function(e) {
                    expect(e instanceof ModelError).toBe(true);
                    done();
                });
            });
        });
    });
});
