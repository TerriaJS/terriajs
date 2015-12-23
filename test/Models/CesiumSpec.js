'use strict';

/*global require,describe,it,expect,beforeEach*/
var Cesium = require('../../lib/Models/Cesium');
var Terria = require('../../lib/Models/Terria');
var CesiumWidget = require('terriajs-cesium/Source/Widgets/CesiumWidget/CesiumWidget');
var supportsWebGL = require('../../lib/Core/supportsWebGL');

if (supportsWebGL()) {
    describe('Cesium Model', function() {
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

            cesium = new Cesium(terria, new CesiumWidget(container, {}));
        });

        afterEach(function() {
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
    });
}
