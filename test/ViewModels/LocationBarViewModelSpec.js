'use strict';

/*global require*/
var L = require('leaflet');
var LocationBarViewModel = require('../../lib/ViewModels/LocationBarViewModel');
var Terria = require('../../lib/Models/Terria');

describe('LocationBarViewModel', function() {
    it('updates longitude and latitude on mouse movement in 2D', function() {
        var terria = new Terria({
            baseUrl: './'
        });

        var mouseMoveCallback;

        var mapElement = jasmine.createSpyObj('mapElement', ['addEventListener']);
        mapElement.addEventListener.and.callFake(function(type, listener, useCapture) {
            if (type === 'mousemove') {
                expect(mouseMoveCallback).toBeUndefined();
                mouseMoveCallback = listener;
            }
        });

        var locationBar = new LocationBarViewModel({
            terria: terria,
            mapElement: mapElement
        });

        expect(mouseMoveCallback).toBeDefined();

        var event = {
            clientX: 10,
            clientY: 10
        };

        terria.leaflet = {
            map: {
                mouseEventToLatLng: function(e) {
                    expect(e).toBe(event);
                    return L.latLng(-23.4, 45.6);
                }
            }
        };

        mouseMoveCallback(event);

        expect(locationBar.longitude).toBe('45.600°E');
        expect(locationBar.latitude).toBe('23.400°S');
        expect(locationBar.elevation).toBeUndefined();
    });
});
