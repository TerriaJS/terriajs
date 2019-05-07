"use strict";

/*
 * L.Handler.DragBox is used internally by L.Map to add a drag rectangle (shift-mousebutton1).
 * Taken with modifications from Leaflet: leaflet/src/map/handler/Map.BoxZoom.js
 */

function installDragBox(L) {
  L.Map.mergeOptions({
    dragBox: false // enabled/disabled as needed
  });

  L.Map.DragBox = L.Handler.extend({
    initialize: function(map) {
      this._map = map;
      this._container = map._container;
      this._pane = map._panes.overlayPane;
      this._moved = false;
      this._dragging = map.dragging.enabled();
    },

    addHooks: function() {
      // disable dragging as it blocks all events on mousedown, create our own mousedown handler and add it
      // before re-enabling dragging - is there an issue with ordering here? We rely on our mousedown handler
      // getting executed before the dragging mousedown handler
      if (this._dragging) {
        this._map.dragging.disable();
      }
      this._map.boxZoom.disable();
      L.DomEvent.on(this._container, "mousedown", this._onMouseDown, this);
      if (this._dragging) {
        this._map.dragging.enable();
      }
      this._map.boxZoom.enable();
    },

    removeHooks: function() {
      if (this._dragging) {
        this._map.dragging.enable();
      }
      L.DomEvent.off(this._container, "mousedown", this._onMouseDown, this);
      this._moved = false;
    },

    _onMouseDown: function(e) {
      this._moved = false;

      // enable using shift-mousedown
      if (!e.shiftKey || (e.which !== 1 && e.button !== 1)) {
        return false;
      }

      if (this._dragging) {
        this._map.dragging.disable();
      }
      this._map.boxZoom.disable();
      L.DomUtil.disableTextSelection();
      L.DomUtil.disableImageDrag();

      this._startLayerPoint = this._map.mouseEventToLayerPoint(e);

      L.DomEvent.on(document, "mousemove", this._onMouseMove, this)
        .on(document, "mouseup", this._onMouseUp, this)
        .on(document, "keydown", this._onKeyDown, this);
    },

    _onMouseMove: function(e) {
      if (!this._moved) {
        this._box = L.DomUtil.create("div", "leaflet-zoom-box", this._pane);
        L.DomUtil.setPosition(this._box, this._startLayerPoint);

        //TODO refactor: move cursor to styles
        this._container.style.cursor = "crosshair";
        this._map.fire("dragboxstart");
      }

      var startPoint = this._startLayerPoint,
        box = this._box,
        layerPoint = this._map.mouseEventToLayerPoint(e),
        offset = layerPoint.subtract(startPoint),
        newPos = new L.Point(
          Math.min(layerPoint.x, startPoint.x),
          Math.min(layerPoint.y, startPoint.y)
        );

      L.DomUtil.setPosition(box, newPos);

      this._moved = true;

      // TODO refactor: remove hardcoded 4 pixels
      box.style.width = Math.abs(offset.x) - 4 + "px";
      box.style.height = Math.abs(offset.y) - 4 + "px";
    },

    _finish: function() {
      if (this._moved) {
        this._pane.removeChild(this._box);
        this._container.style.cursor = "";
      }

      if (this._dragging) {
        this._map.dragging.enable();
      }
      this._map.boxZoom.enable();
      L.DomUtil.enableTextSelection();
      L.DomUtil.enableImageDrag();

      L.DomEvent.off(document, "mousemove", this._onMouseMove, this)
        .off(document, "mouseup", this._onMouseUp, this)
        .off(document, "keydown", this._onKeyDown, this);
    },

    _onMouseUp: function(e) {
      this._finish();

      var map = this._map,
        layerPoint = map.mouseEventToLayerPoint(e);

      if (this._startLayerPoint.equals(layerPoint)) {
        return;
      }

      var bounds = new L.LatLngBounds(
        map.layerPointToLatLng(this._startLayerPoint),
        map.layerPointToLatLng(layerPoint)
      );

      map.fire("dragboxend", {
        dragBoxBounds: bounds
      });
    },

    _onKeyDown: function(e) {
      if (e.keyCode === 27) {
        this._finish();
      }
    }
  });

  L.Map.addInitHook("addHandler", "dragBox", L.Map.DragBox);
}

var isDragBoxInstalled = false;

var LeafletDragBox = {
  initialize: function(leaflet) {
    if (isDragBoxInstalled) {
      return;
    }
    isDragBoxInstalled = true;
    installDragBox(leaflet);
  }
};

module.exports = LeafletDragBox;
