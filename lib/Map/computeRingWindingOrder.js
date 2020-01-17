"use strict";

import i18next from "i18next";
const WindingOrder = require("terriajs-cesium/Source/Core/WindingOrder")
  .default;
const DeveloperError = require("terriajs-cesium/Source/Core/DeveloperError")
  .default;

/**
 * Determine the winding order of a polygon ring.
 * See https://github.com/mapbox/vector-tile-spec/tree/master/2.0#4344-polygon-geometry-type && https://en.wikipedia.org/wiki/Shoelace_formula
 * @param  {Point[]} ring The polygon ring as an array of '@mapbox/point-geometry' Points (or any points conforming to {x: number, y: number}).
 * @return {WindingOrder} The winding order of the polygon ring.
 */
function computeRingWindingOrder(ring) {
  const n = ring.length;
  let twiceArea =
    ring[n - 1].x * (ring[0].y - ring[n - 2].y) +
    ring[0].x * (ring[1].y - ring[n - 1].y);
  for (let i = 1; i <= n - 2; i++) {
    twiceArea += ring[i].x * (ring[i + 1].y - ring[i - 1].y);
  }
  if (isNaN(twiceArea)) {
    throw new DeveloperError(i18next.t("map.computeRingWindingOrder.devError"));
  }
  return twiceArea > 0.0
    ? WindingOrder.COUNTER_CLOCKWISE
    : WindingOrder.CLOCKWISE;
}

module.exports = computeRingWindingOrder;
