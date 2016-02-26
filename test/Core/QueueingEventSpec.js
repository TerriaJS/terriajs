"use strict";

var QueueingEvent = require('../../lib/Core/QueueingEvent');

describe('QueueingEvent', function() {
    var event, listener1, listener2, listener3;

    beforeEach(function() {
        event = new QueueingEvent();
        listener1 = jasmine.createSpy('listener');
        listener2 = jasmine.createSpy('listener2');
        listener3 = jasmine.createSpy('listener3');
    });

    describe('when a call is made with no listeners', function() {
        beforeEach(function() {
            event.raiseEvent('1', 2, [3]);
            event.raiseEvent({'4': 5}, "6");

            event.addEventListener(listener1);
        });

        it('replays the events for the first listener', function() {
            expect(listener1.calls.argsFor(0)).toEqual(['1', 2, [3]]);
            expect(listener1.calls.argsFor(1)).toEqual([{'4': 5}, "6"]);
        });

        it('doesn\'t continue to replay events for subsequent listeners', function() {
            event.addEventListener(listener2);

            expect(listener2).not.toHaveBeenCalled();
        });

        it('continues to broadcast events as usual subsequently', function() {
            event.addEventListener(listener2);

            event.raiseEvent('blah');

            expect(listener1).toHaveBeenCalledWith('blah');
            expect(listener2).toHaveBeenCalledWith('blah');
        });
    });

    it('replays event for the first listener added after all listeners are removed', function() {
        event.addEventListener(listener1);
        event.addEventListener(listener2);

        event.removeEventListener(listener1);
        event.removeEventListener(listener2);

        event.raiseEvent('1', 2, [3]);

        event.addEventListener(listener3);

        expect(listener1).not.toHaveBeenCalled();
        expect(listener2).not.toHaveBeenCalled();
        expect(listener3).toHaveBeenCalledWith('1', 2, [3]);
    });

    describe('when there has been no queueing', function() {
        it('broadcasts events to listeners as usual', function() {
            event.addEventListener(listener1);
            event.addEventListener(listener2);

            event.raiseEvent('1', 2, [3]);

            expect(listener1).toHaveBeenCalledWith('1', 2, [3]);
            expect(listener2).toHaveBeenCalledWith('1', 2, [3]);
        });

        it('removes listeners as usual', function() {
            event.addEventListener(listener1);
            event.raiseEvent('1', 2, [3]);
            event.removeEventListener(listener1);
            event.raiseEvent('burp');

            expect(listener1).toHaveBeenCalledWith('1', 2, [3]);
            expect(listener1).not.toHaveBeenCalledWith('burp');
        });
    });
});
