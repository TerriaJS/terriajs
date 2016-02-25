"use strict";

var CesiumEvent = require('terriajs-cesium/Source/Core/Event');
var inherit = require('../Core/inherit');

var QueueingEvent = function(terria) {
    CesiumEvent.call(this, terria);

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
