var EventEmitter = function(){
    this._events = {};
  };

  EventEmitter.prototype.dispatch= function (event, data) {
      if (!this._events[event]) return; // no one is listening to this event
      for (var i = 0; i < this._events[event].length; i++)
          this._events[event][i](data);
  };

  EventEmitter.prototype.subscribe= function (event, callback) {
    if (!this._events[event]) this._events[event] = []; // new event
    this._events[event].push(callback);
  }

module.exports = EventEmitter;
