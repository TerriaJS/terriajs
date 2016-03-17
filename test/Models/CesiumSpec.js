'use strict';

/*global require,describe,xdescribe,it,expect,beforeEach*/
var Cesium = require('../../lib/Models/Cesium');
var Color = require('terriajs-cesium/Source/Core/Color');
var Entity = require('terriajs-cesium/Source/DataSources/Entity');
var GeoJsonDataSource = require('terriajs-cesium/Source/DataSources/GeoJsonDataSource');
var loadJson = require('terriajs-cesium/Source/Core/loadJson');
var Terria = require('../../lib/Models/Terria');
var CesiumWidget = require('terriajs-cesium/Source/Widgets/CesiumWidget/CesiumWidget');
var Terria = require('../../lib/Models/Terria');
var supportsWebGL = require('../../lib/Core/supportsWebGL');
var TileCoordinatesImageryProvider = require('terriajs-cesium/Source/Scene/TileCoordinatesImageryProvider');

var describeIfSupported = supportsWebGL() ? describe : xdescribe;

describeIfSupported('Cesium Model', function() {
    var terria;
    var cesium;
    var container;

    beforeEach(function() {
        terria = new Terria({
            baseUrl : './'
        });
        container = document.createElement('div');
        container.id = 'container';
        document.body.appendChild(container);

        spyOn(terria.tileLoadProgressEvent, 'raiseEvent');

        cesium = new Cesium(terria, new CesiumWidget(container, {
            imageryProvider: new TileCoordinatesImageryProvider()
        }));

        terria.cesium = cesium;
    });

    afterEach(function() {
        cesium.viewer.destroy();
        document.body.removeChild(container);
    });

    it('should be able to reference its container', function() {
        expect(cesium.getContainer()).toBe(container);
    });

    it('should trigger terria.tileLoadProgressEvent on globe tileLoadProgressEvent', function() {
        cesium.scene.globe.tileLoadProgressEvent.raiseEvent(3);

        expect(terria.tileLoadProgressEvent.raiseEvent).toHaveBeenCalledWith(3, 3);
    });

    it('should retain the maximum length of tiles to be loaded', function() {
        cesium.scene.globe.tileLoadProgressEvent.raiseEvent(3);
        cesium.scene.globe.tileLoadProgressEvent.raiseEvent(7);
        cesium.scene.globe.tileLoadProgressEvent.raiseEvent(4);
        cesium.scene.globe.tileLoadProgressEvent.raiseEvent(2);

        expect(terria.tileLoadProgressEvent.raiseEvent).toHaveBeenCalledWith(2, 7);
    });

    it('should reset maximum length when the number of tiles to be loaded reaches 0', function() {
        cesium.scene.globe.tileLoadProgressEvent.raiseEvent(3);
        cesium.scene.globe.tileLoadProgressEvent.raiseEvent(7);
        cesium.scene.globe.tileLoadProgressEvent.raiseEvent(4);
        cesium.scene.globe.tileLoadProgressEvent.raiseEvent(0);

        expect(terria.tileLoadProgressEvent.raiseEvent.calls.mostRecent().args).toEqual([0, 0]);

        cesium.scene.globe.tileLoadProgressEvent.raiseEvent(2);

        expect(terria.tileLoadProgressEvent.raiseEvent.calls.mostRecent().args).toEqual([2, 2]);
    });

    describe('feature picking', function() {
        it('should create GeoJSON for polygon when a rasterized polygon feature is selected', function(done) {
            loadJson('test/GeoJSON/polygon.geojson').then(function(polygonGeoJson) {
                var entity = new Entity();
                entity.data = polygonGeoJson;

                terria.selectedFeature = entity;

                expect(terria.cesium._highlightPromise).toBeDefined();
                expect(terria.cesium._removeHighlightCallback).toBeDefined();

                return terria.cesium._highlightPromise.then(function() {
                    expect(terria.dataSources.length).toBe(1);
                    expect(terria.dataSources.get(0) instanceof GeoJsonDataSource).toBe(true);
                });
            }).then(done).otherwise(done.fail);
        });

        it('should create GeoJSON for polyline when a rasterized polyline feature is selected', function(done) {
            loadJson('test/GeoJSON/polyline.geojson').then(function(polylineGeoJson) {
                var entity = new Entity();
                entity.data = polylineGeoJson;

                terria.selectedFeature = entity;

                expect(terria.cesium._highlightPromise).toBeDefined();
                expect(terria.cesium._removeHighlightCallback).toBeDefined();

                return terria.cesium._highlightPromise.then(function() {
                    expect(terria.dataSources.length).toBe(1);
                    expect(terria.dataSources.get(0) instanceof GeoJsonDataSource).toBe(true);
                });
            }).then(done).otherwise(done.fail);
        });

        it('should update the style of a vector polygon when selected', function(done) {
            GeoJsonDataSource.load('test/GeoJSON/polygon.geojson').then(function(dataSource) {
                terria.dataSources.add(dataSource);

                var entity = dataSource.entities.values[0];

                terria.selectedFeature = entity;
                expect(entity.polygon.outlineColor.getValue()).toEqual(Color.WHITE);

                terria.selectedFeature = undefined;
                expect(entity.polygon.outlineColor.getValue()).not.toEqual(Color.WHITE);
            }).then(done).otherwise(done.fail);
        });

        it('should update the style of a vector polyline when selected', function(done) {
            GeoJsonDataSource.load('test/GeoJSON/polyline.geojson').then(function(dataSource) {
                terria.dataSources.add(dataSource);

                var entity = dataSource.entities.values[0];

                terria.selectedFeature = entity;
                expect(entity.polyline.width.getValue()).toEqual(2);

                terria.selectedFeature = undefined;
                expect(entity.polyline.width.getValue()).not.toEqual(2);
            }).then(done).otherwise(done.fail);
        });
    });
});
