'use strict';

/*global require,describe,it,expect,beforeEach*/
var Leaflet = require('../../lib/Models/Leaflet');
var Terria = require('../../lib/Models/Terria');
var L = require('leaflet');

describe('Leaflet', function() {
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

        leaflet = new Leaflet(terria, map);

        spyOn(terria.tileLoadProgressEvent, 'raiseEvent');

        layers = [
            new L.TileLayer(),
            new L.TileLayer(),
            {}
        ];

        layers.forEach(function(layer) {
            map.addLayer(layer);
        });
    });

    afterEach(function() {
        document.body.removeChild(container);
    });

    describe('should trigger a tileLoadProgressEvent', function() {
        ['tileloadstart', 'tileload', 'loaded'].forEach(function(event) {
            it('on ' + event, function() {
                layers[0].fire(event);

                expect(terria.tileLoadProgressEvent.raiseEvent).toHaveBeenCalled();
            });
        });
    });
});
