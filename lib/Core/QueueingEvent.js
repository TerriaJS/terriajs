"use strict";

var CesiumEvent = require('terriajs-cesium/Source/Core/Event');
var inherit = require('../Core/inherit');

/**
 * Extension of {@link Event} that remembers events that were raised when no listeners were connected, and replays
 * them in order when the first listener is subsequently added. After this first listener is added, the events are
 * forgotten and it acts as a normal {@link Event}.
 *
 * @constructor
 */
var QueueingEvent = function() {
    CesiumEvent.call(this);

    /** The queue of events that could not be delivered as there were no listeners when it was raised */
    this._queue = [];
};

inherit(CesiumEvent, QueueingEvent);

QueueingEvent.prototype.raiseEvent = function() {
    if (this.numberOfListeners > 0) {
        CesiumEvent.prototype.raiseEvent.apply(this, arguments);
    } else {
        this._queue.push(arguments);
    }
};

QueueingEvent.prototype.addEventListener = function(listener, scope) {
    CesiumEvent.prototype.addEventListener.call(this, listener, scope);

    if (this.numberOfListeners === 1) {
        this._queue.forEach(function(args) {
            this.raiseEvent.apply(this, args);
        }, this);
        this._queue = [];
    }
};

module.exports = QueueingEvent;
