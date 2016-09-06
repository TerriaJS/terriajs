'use strict';

/*global require,describe,it,expect*/
var DragPoints = require('../../lib/Map/DragPoints');
var Terria = require('../../lib/Models/Terria');
var ViewerMode = require('../../lib/Models/ViewerMode');
var Cesium = require('../../lib/Models/Cesium');
var Entity = require('terriajs-cesium/Source/DataSources/Entity.js');
var EntityCollection = require('terriajs-cesium/Source/DataSources/EntityCollection.js');
var CesiumWidget = require('terriajs-cesium/Source/Widgets/CesiumWidget/CesiumWidget');
var L = require('leaflet');
var Leaflet = require('../../lib/Models/Leaflet');

describe('DragPoints', function() {
    var terria;
    var container;

    beforeEach(function() {
        terria = new Terria({
            baseUrl: './'
        });
        container = document.createElement('div');
        container.id = 'container';
        document.body.appendChild(container);

        // Setting up both Cesium and Leaflet context as we're going to switch between them.
        var cesiumWidget = new CesiumWidget(container);
        cesiumWidget.entities = new EntityCollection();
        var cesium = new Cesium(terria, cesiumWidget);
        terria.cesium = cesium;

        var map = L.map('container').setView([-28.5, 135], 5);
        var leaflet = new Leaflet(terria, map);
        terria.leaflet = leaflet;
    });

    afterEach(function() {
        document.body.removeChild(container);
    });

    it('will change helper to right type if viewerMode changes to Leaflet', function() {
        terria.viewerMode = ViewerMode.CesiumTerrain;
        var dragPointsHelper = new DragPoints(terria);
        expect(dragPointsHelper._dragPointsHelper.type).toEqual("Cesium");
        terria.viewerMode = ViewerMode.Leaflet;
        expect(dragPointsHelper._dragPointsHelper.type).toEqual("Leaflet");
    });

    it('will change helper to right type if viewerMode changes to Cesium', function() {
        terria.viewerMode = ViewerMode.Leaflet;
        var dragPointsHelper = new DragPoints(terria);
        expect(dragPointsHelper._dragPointsHelper.type).toEqual("Leaflet");
        terria.viewerMode = ViewerMode.CesiumTerrain;
        expect(dragPointsHelper._dragPointsHelper.type).toEqual("Cesium");
    });

    it('will inform new helper about existing entities if helper is changed to Leaflet', function() {
        var entityArray = [new Entity({"name": "first test entity"}),
                           new Entity({"name": "second test entity"})];
        terria.viewerMode = ViewerMode.CesiumTerrain;

        var dragPointsHelper = new DragPoints(terria);
        dragPointsHelper.updateDraggableObjects(entityArray);
        expect(dragPointsHelper._dragPointsHelper._draggableObjects).toBe(entityArray);

        terria.viewerMode = ViewerMode.Leaflet;
        // Same as before, but dragPointsHelper is now new.
        expect(dragPointsHelper._dragPointsHelper._draggableObjects).toBe(entityArray);
    });

    it('will inform new helper about existing entities if helper is changed to Cesium', function() {
        var entityArray = [new Entity({"name": "first test entity"}),
                           new Entity({"name": "second test entity"})];
        terria.viewerMode = ViewerMode.Leaflet;

        var dragPointsHelper = new DragPoints(terria);
        dragPointsHelper.updateDraggableObjects(entityArray);
        expect(dragPointsHelper._dragPointsHelper._draggableObjects).toBe(entityArray);

        terria.viewerMode = ViewerMode.CesiumTerrain;
        // Same as before, but dragPointsHelper is now new.
        expect(dragPointsHelper._dragPointsHelper._draggableObjects).toBe(entityArray);
    });
});
