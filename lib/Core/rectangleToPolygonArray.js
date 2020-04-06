"use strict";

var CesiumMath = require("terriajs-cesium/Source/Core/Math").default;
var Rectangle = require("terriajs-cesium/Source/Core/Rectangle").default;

var rectangleToPolygonArray = function(rectangle) {
  var sw = Rectangle.southwest(rectangle),
    se = Rectangle.southeast(rectangle),
    nw = Rectangle.northwest(rectangle),
    ne = Rectangle.northeast(rectangle);
  return [
    [
      [CesiumMath.toDegrees(sw.longitude), CesiumMath.toDegrees(sw.latitude)],
      [CesiumMath.toDegrees(se.longitude), CesiumMath.toDegrees(se.latitude)],
      [CesiumMath.toDegrees(ne.longitude), CesiumMath.toDegrees(ne.latitude)],
      [CesiumMath.toDegrees(nw.longitude), CesiumMath.toDegrees(nw.latitude)],
      [CesiumMath.toDegrees(sw.longitude), CesiumMath.toDegrees(sw.latitude)]
    ]
  ];
};

module.exports = rectangleToPolygonArray;
