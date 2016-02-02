'use strict';

/*global require,describe,it,expect,beforeEach*/
var Leaflet = require('../../lib/Models/Leaflet');
var Terria = require('../../lib/Models/Terria');
var L = require('leaflet');

describe('Leaflet Model', function() {
    var terria;
    var leaflet;
    var container, map, layers;

    beforeEach(function() {
        terria = new Terria({
            baseUrl : './'
        });
        container = document.createElement('div');
        container.id = 'container';
        document.body.appendChild(container);
        map = L.map('container').setView([-28.5, 135], 5);

        spyOn(terria.tileLoadProgressEvent, 'raiseEvent');

        layers = [
            new L.TileLayer('http://example.com'),
            new L.TileLayer('http://example.com'),
            // Make sure there's a non-tile layer in there to make sure we're able to handle those.
            new L.ImageOverlay('http://example.com', L.latLngBounds([1, 1], [3, 3]))
        ];
    });

    afterEach(function() {
        document.body.removeChild(container);
    });

    function initLeaflet() {
        leaflet = new Leaflet(terria, map);
        layers.forEach(function(layer) {
            map.addLayer(layer);
        });
    }

    describe('should trigger a tileLoadProgressEvent', function() {
        ['tileloadstart', 'tileload', 'loaded'].forEach(function(event) {
            it('on ' + event, function() {
                initLeaflet();

                layers[0].fire(event);

                expect(terria.tileLoadProgressEvent.raiseEvent).toHaveBeenCalled();
            });
        });
    });

    it('should be able to reference its container', function() {
        initLeaflet();
        expect(leaflet.getContainer()).toBe(container);
    });

    it('should trigger a tileLoadProgressEvent with the total number of tiles to be loaded for all layers', function() {
        initLeaflet();

        layers[0]._tilesToLoad = 4;
        layers[1]._tilesToLoad = 3;

        layers[1].fire('tileload');

        // We're looking for 6 because Leaflet decrements _tilesToLoad AFTER the event fires.
        expect(terria.tileLoadProgressEvent.raiseEvent).toHaveBeenCalledWith(6, 6);
    });

    it('shouldn\'t trigger anything if the _tilesToLoad private API gets removed', function() {
        map.on('layeradd', function(evt) {
            delete evt.layer._tilesToLoad;
        });

        initLeaflet();

        layers[1].fire('tileload');

        expect(terria.tileLoadProgressEvent.raiseEvent).not.toHaveBeenCalled();
    });

    describe('should change the max', function() {
        it('to whatever the highest count of loading tiles so far was', function() {
            initLeaflet();

            changeTileLoadingCount(3);
            changeTileLoadingCount(6);
            changeTileLoadingCount(8);
            changeTileLoadingCount(2);

            expect(terria.tileLoadProgressEvent.raiseEvent.calls.mostRecent().args).toEqual([1, 7]);
        });

        it('to 0 when loading tile count reaches 1', function() {
            // Once again, 1 instead of 0 because the _tilesToLoad count doesn't reach 0 until after the event's fired.
            initLeaflet();

            changeTileLoadingCount(3);
            changeTileLoadingCount(6);
            changeTileLoadingCount(8);
            changeTileLoadingCount(1);

            expect(terria.tileLoadProgressEvent.raiseEvent.calls.mostRecent().args).toEqual([0, 0]);

            changeTileLoadingCount(3);

            expect(terria.tileLoadProgressEvent.raiseEvent.calls.mostRecent().args).toEqual([2, 2]);
        });

        function changeTileLoadingCount(count) {
            layers[0]._tilesToLoad = count;
            layers[1]._tilesToLoad = 0;
            layers[0].fire('tileload');
        }
    });
});
