var Rectangle = require("terriajs-cesium/Source/Core/Rectangle").default;
var defaultValue = require("terriajs-cesium/Source/Core/defaultValue").default;

// Server does not return information of a bounding box, just a location.
// BOUNDING_BOX_SIZE is used to expand a point
var DEFAULT_BOUNDING_BOX_SIZE = 0.2;

module.exports = function createZoomToFunction(
  latitude,
  longitude,
  boundingBoxSize
) {
  boundingBoxSize = defaultValue(boundingBoxSize, DEFAULT_BOUNDING_BOX_SIZE);

  var south = parseFloat(latitude) - boundingBoxSize / 2;
  var west = parseFloat(longitude) - boundingBoxSize / 2;
  var north = parseFloat(latitude) + boundingBoxSize / 2;
  var east = parseFloat(longitude) + boundingBoxSize / 2;
  return Rectangle.fromDegrees(west, south, east, north);
};
