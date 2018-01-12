'use strict';

const WindingOrder = require('terriajs-cesium/Source/Core/WindingOrder');

function computeRingWindingOrder(ring) {
    // See https://github.com/mapbox/vector-tile-spec/tree/master/2.0#4344-polygon-geometry-type && https://en.wikipedia.org/wiki/Shoelace_formula
    const n = ring.length;
    let twiceArea = ring[n-1][0] * (ring[0][1] - ring[n-2][1]) + ring[0][0] * (ring[1][1] - ring[n-1][1]);
    for (let i = 1; i <= n-2; i++) {
        twiceArea += ring[i][0] * (ring[i+1][1] - ring[i-1][1]);
    }

    return twiceArea > 0.0 ? WindingOrder.COUNTER_CLOCKWISE : WindingOrder.CLOCKWISE;
}

module.exports = computeRingWindingOrder;
