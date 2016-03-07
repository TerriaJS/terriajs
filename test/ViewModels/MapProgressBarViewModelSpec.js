'use strict';

/*global require,describe,it,expect,beforeEach*/
var MapProgressBarViewModel = require('../../lib/ViewModels/MapProgressBarViewModel');
var Terria = require('../../lib/Models/Terria');

describe('MapProgressBarViewModel', function() {
    var terria;
    var progressBarView;

    beforeEach(function() {
        terria = new Terria({
            baseUrl : './'
        });
        progressBarView = new MapProgressBarViewModel({
            terria: terria
        });
    });

    it('sets progress to the percentage of tiles not loaded', function() {
        terria.tileLoadProgressEvent.raiseEvent(1, 2);
        expect(progressBarView.percentage).toBe(50);
    });

    it('always uses the floor percentage', function() {
        terria.tileLoadProgressEvent.raiseEvent(1, 3);
        expect(progressBarView.percentage).toBe(66);
    });

    it('sets progress to 100 if remaining tiles === 0 for all values of max tiles', function() {
        terria.tileLoadProgressEvent.raiseEvent(0, 0);
        expect(progressBarView.percentage).toBe(100);

        terria.tileLoadProgressEvent.raiseEvent(0, 1);
        expect(progressBarView.percentage).toBe(100);

        terria.tileLoadProgressEvent.raiseEvent(0, Number.MAX_VALUE);
        expect(progressBarView.percentage).toBe(100);
    });

    it('resets progress to 100 on beforeViewerChanged', function() {
        // First make sure progress isn't 100 already.
        terria.tileLoadProgressEvent.raiseEvent(1, 2);
        expect(progressBarView.percentage).not.toBe(100);

        // Trigger the event.
        terria.beforeViewerChanged.raiseEvent();

        expect(progressBarView.percentage).toBe(100);
    });
});
