import L from "leaflet";

// Function taken from Leaflet 1.0.1 (https://github.com/Leaflet/Leaflet/blob/v1.0.1/src/layer/vector/Canvas.js#L254-L267)
// Leaflet 1.0.2 and later don't trigger click events for every Path, so feature selection only gives 1 result.
// Updated to incorporate function changes up to v1.7.1
L.Canvas.prototype._onClick = function (e) {
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

export default L;
