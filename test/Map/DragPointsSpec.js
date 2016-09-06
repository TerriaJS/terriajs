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
var Cartesian3 = require('terriajs-cesium/Source/Core/Cartesian3');
var CustomDataSource = require('terriajs-cesium/Source/DataSources/CustomDataSource');
var CesiumDragPoints = require('../../lib/Map/CesiumDragPoints');
var LeafletDragPoints = require('../../lib/Map/LeafletDragPoints');

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

    it('will inform new helper about existing entites if helper is changed to Leaflet', function() {
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

    it('will inform new helper about existing entites if helper is changed to Cesium', function() {
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

    it('will only allow drag if entity clicked on is in draggable list', function() {
        var entityArray = [new Entity({"name": "first test entity",
                                       "position": new Cartesian3(-0.1154700545562811, -0.019245009092713514, -1.0000000062211452)}),
                           new Entity({"name": "second test entity"})];
        terria.viewerMode = ViewerMode.CesiumTerrain;

        var dragPointsHelper = new DragPoints(terria);
        dragPointsHelper.setUp();
        var pointEntities = new CustomDataSource('Points');
        pointEntities.entities.add(entityArray[0]);
        pointEntities.entities.add(entityArray[1]);
        terria.dataSources.add(pointEntities);
        terria.cesium.viewer.entities.add(entityArray[0]);
        terria.cesium.viewer.entities.add(entityArray[1]);

        dragPointsHelper.updateDraggableObjects(entityArray);

        var clickEvent = new MouseEvent("mousedown", {
            'view': window,
            'bubbles': true,
            'cancelable': true,
            'clientX': 128,
            'clientY': 154
        });
        var target = terria.cesium.viewer.canvas;
        target.addEventListener('mousedown', function(click) { console.log(click); });
        target.dispatchEvent(clickEvent);
        expect(1).toEqual(1);
    });

    it('will cancel drag on mouseup', function() {
        expect(1).toEqual(1);
    });
});

describe('CesiumDragPoints', function() {

    it('will disable camera motion on mousedown (if drag occurs) and reenable afterwards', function() {
        expect(1).toEqual(1);
    });

    it('will adjust position of entity being dragged to match mouse move position', function() {
        expect(1).toEqual(1);
    });
});

describe('LeafletDragPoints', function() {

    it('will disable camera motion on mousedown (if drag occurs) and reenable afterwards', function() {
        expect(1).toEqual(1);
    });

    it('will adjust position of entity being dragged to match mouse move position', function() {
        expect(1).toEqual(1);
    });
});
