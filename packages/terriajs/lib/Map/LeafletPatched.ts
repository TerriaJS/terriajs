import L from "leaflet";

// Function taken from Leaflet 1.0.1 (https://github.com/Leaflet/Leaflet/blob/v1.0.1/src/layer/vector/Canvas.js#L254-L267)
// Leaflet 1.0.2 and later don't trigger click events for every Path, so feature selection only gives 1 result.
// Updated to incorporate function changes up to v1.7.1
const Canvas = L.Canvas as any;
Canvas.prototype._onClick = function (e: any) {
  const point = this._map.mouseEventToLayerPoint(e);
  const layers = [];
  for (let order = this._drawFirst; order; order = order.next) {
    const layer = order.layer;
    if (layer.options.interactive && layer._containsPoint(point)) {
      if (
        !(e.type === "click" || e.type !== "preclick") ||
        !this._map._draggableMoved(layer)
      ) {
        layers.push(layer);
      }
    }
  }
  this._fireEvent(layers.length ? layers : false, e);
};

// Leaflet 1.9 forgets a queued redraw frame without cancelling it when a redraw runs
// synchronously, so that frame can run after the map is removed and throw on the
// deleted canvas context. Backport of Leaflet/Leaflet#10522 (Leaflet 2-beta).
const redraw = Canvas.prototype._redraw;
Canvas.prototype._redraw = function () {
  L.Util.cancelAnimFrame(this._redrawRequest);
  redraw.call(this);
};

export default L;
